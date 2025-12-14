from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
import jwt

from scholark.core.config import settings

ALGORITHM = "HS256"


def create_access_token(subject: str | Any, expires_delta: timedelta = settings.ACCESS_TOKEN_EXPIRE) -> str:
    expire = datetime.now(UTC) + expires_delta
    to_encode = {"exp": expire, "sub": str(subject)}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")
