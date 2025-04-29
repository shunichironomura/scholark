from collections.abc import Generator
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError
from sqlmodel import Session

from scholark.auth.base import AuthProvider
from scholark.auth.db_provider import DbAuthProvider
from scholark.auth.ldap_provider import LdapAuthProvider
from scholark.auth.router import AuthRouter
from scholark.core import security
from scholark.core.config import settings
from scholark.core.db import engine
from scholark.models import TokenPayload, User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/login/access-token")


def get_db() -> Generator[Session]:
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_db)]
TokenDep = Annotated[str, Depends(oauth2_scheme)]


def get_current_user(session: SessionDep, token: TokenDep) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Could not validate credentials",
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
        token_data = TokenPayload.model_validate(payload)
        if token_data.sub is None:
            raise credentials_exception
    except (InvalidTokenError, ValidationError):
        raise credentials_exception from None

    user = session.get(User, token_data.sub)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_current_active_superuser(current_user: CurrentUser) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )
    return current_user


def get_auth_provider(session: SessionDep) -> AuthProvider:
    match settings.AUTH_PROVIDER:
        case "db":
            return DbAuthProvider(session)
        case "ldap":
            assert settings.LDAP_SERVER is not None
            assert settings.LDAP_DN_PATTERN is not None
            return AuthRouter(
                db_provider=DbAuthProvider(session),
                ldap_provider=LdapAuthProvider(session, settings.LDAP_SERVER, settings.LDAP_DN_PATTERN),
                preserved_db_usernames=settings.PRESERVED_DB_USERNAMES,
            )


AuthProviderDep = Annotated[AuthProvider, Depends(get_auth_provider)]
