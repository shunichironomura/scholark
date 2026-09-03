from datetime import UTC, datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import select

from scholark.api.deps import AuthProviderDep, CurrentUser, SessionDep
from scholark.core import security
from scholark.core.config import settings
from scholark.models import RefreshSession, RefreshTokenRequest, Token, User, UserPublic

router = APIRouter(prefix="/login", tags=["login"])


@router.post("/access-token")
def login_access_token(
    auth_provider: AuthProviderDep,
    session: SessionDep,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Token:
    """OAuth2 compatible token login, get an access token for future requests."""
    user = auth_provider.authenticate(
        username=form_data.username,
        password=form_data.password,
    )
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    if user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")

    refresh_token = security.create_refresh_token()
    session.add(
        RefreshSession(
            user_id=user.id,
            token_hash=security.hash_refresh_token(refresh_token),
            expires_at=datetime.now(UTC) + settings.REFRESH_TOKEN_EXPIRE,
        ),
    )
    session.commit()
    return Token(access_token=security.create_access_token(user.id), refresh_token=refresh_token)


def _unauthorized_refresh() -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate refresh token")


@router.post("/refresh")
def refresh_access_token(token_in: RefreshTokenRequest, session: SessionDep) -> Token:
    """Exchange a valid refresh session for a new, rotated token pair."""
    refresh_session = session.exec(
        select(RefreshSession)
        .where(RefreshSession.token_hash == security.hash_refresh_token(token_in.refresh_token))
        .with_for_update(),
    ).one_or_none()
    if refresh_session is None:
        raise _unauthorized_refresh()

    expires_at = refresh_session.expires_at
    if expires_at.tzinfo is None:
        # SQLite drops timezone information in tests; persisted PostgreSQL
        # timestamps remain timezone-aware.
        expires_at = expires_at.replace(tzinfo=UTC)
    if expires_at <= datetime.now(UTC):
        session.delete(refresh_session)
        session.commit()
        raise _unauthorized_refresh()

    user = session.get(User, refresh_session.user_id)
    if user is None:
        session.delete(refresh_session)
        session.commit()
        raise _unauthorized_refresh()
    if user.disabled:
        for user_session in session.exec(
            select(RefreshSession).where(RefreshSession.user_id == user.id),
        ).all():
            session.delete(user_session)
        session.commit()
        raise _unauthorized_refresh()

    refresh_token = security.create_refresh_token()
    refresh_session.token_hash = security.hash_refresh_token(refresh_token)
    session.add(refresh_session)
    session.commit()
    return Token(access_token=security.create_access_token(user.id), refresh_token=refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(token_in: RefreshTokenRequest, session: SessionDep) -> Response:
    """Revoke the current refresh session."""
    refresh_session = session.exec(
        select(RefreshSession).where(
            RefreshSession.token_hash == security.hash_refresh_token(token_in.refresh_token),
        ),
    ).one_or_none()
    if refresh_session is not None:
        session.delete(refresh_session)
        session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/test-token", response_model=UserPublic)
def test_token(current_user: CurrentUser) -> Any:
    """Test access token."""
    return current_user
