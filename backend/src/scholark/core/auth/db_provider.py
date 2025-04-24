import jwt
from fastapi import HTTPException
from passlib.context import CryptContext
from sqlmodel import Session, select

from scholark.core.config import settings
from scholark.models import Credential, User

from .base import AuthProvider

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class DbAuthProvider(AuthProvider):
    def __init__(self, db: Session) -> None:
        self.db = db

    def authenticate(self, username: str, password: str) -> str:
        statement = select(Credential).where(Credential.identifier == username).where(Credential.provider == "db")
        user = self.db.exec(statement).one_or_none()
        if user is None or user.hashed_password is None or not self._verify_password(password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        return self._encode_jwt(username)

    def sign_up(self, username: str, password: str) -> str:
        user = self.db.exec(select(User).where(User.username == username)).one_or_none()
        if user is not None:
            raise HTTPException(status_code=400, detail="User already exists")

        new_user = User(username=username)
        self.db.add(new_user)

        hashed_password = self._get_password_hash(password)
        new_cred = Credential(user_id=new_user.id, provider="db", identifier=username, hashed_password=hashed_password)
        self.db.add(new_cred)

        try:
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail="Database error") from e

        self.db.refresh(new_user)

        return self._encode_jwt(username)

    @staticmethod
    def _encode_jwt(username: str) -> str:
        return jwt.encode({"sub": username}, settings.SECRET_KEY, algorithm="HS256")

    @staticmethod
    def _verify_password(plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def _get_password_hash(password: str) -> str:
        return pwd_context.hash(password)
