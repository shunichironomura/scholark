from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm

from scholark.api.deps import AuthProviderDep, CurrentUser
from scholark.core import security
from scholark.models import Token, UserPublic

router = APIRouter(prefix="/login", tags=["login"])


@router.post("/access-token")
def login_access_token(
    auth_provider: AuthProviderDep,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Token:
    """OAuth2 compatible token login, get an access token for future requests."""
    user = auth_provider.authenticate(
        username=form_data.username,
        password=form_data.password,
    )
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    return Token(access_token=security.create_access_token(user.id))


@router.post("/test-token", response_model=UserPublic)
def test_token(current_user: CurrentUser) -> Any:
    """Test access token."""
    return current_user


# @router.post("/")
# def login(
#     auth_provider: AuthProviderDep,
#     form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
#     response: Response,
# ) -> LoginResponse:
#     """OAuth2 compatible token login, get an access token for future requests."""
#     user = auth_provider.authenticate(
#         username=form_data.username,
#         password=form_data.password,
#     )
#     if not user:
#         raise HTTPException(status_code=400, detail="Incorrect username or password")
#     jwt = Token(access_token=security.create_access_token(user.id))
#     response.set_cookie(
#         key="access_token",
#         value=jwt.access_token,
#         max_age=int(timedelta(minutes=10).total_seconds()),
#         httponly=True,
#         secure=True,
#         samesite="lax",
#     )

#     return LoginResponse(user_id=user.id)
