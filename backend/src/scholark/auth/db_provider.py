from sqlmodel import Session, select

from scholark.core.security import get_password_hash, verify_password
from scholark.models import DbAuthCredential, User, UserCreate, default_tags

from .base import AuthProvider, AuthProviderError


class DbAuthProvider(AuthProvider):
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_user_by_username(self, *, username: str) -> User | None:
        return self.db.exec(select(User).where(User.username == username)).first()

    def create_user(self, *, user_create: UserCreate) -> User:
        if user_create.password is None:
            raise AuthProviderError(status_code=400, detail="Password is required")

        existing_user = self.db.exec(select(User).where(User.username == user_create.username)).one_or_none()
        if existing_user:
            raise AuthProviderError(status_code=400, detail="User already exists")

        new_user = User.model_validate(user_create)

        # Set default tags for the user
        new_user.tags.extend(default_tags(user_id=new_user.id))

        self.db.add(new_user)

        try:
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            raise AuthProviderError(status_code=500, detail="Database error") from e

        hashed_password = get_password_hash(user_create.password)
        new_cred = DbAuthCredential(
            user_id=new_user.id,
            hashed_password=hashed_password,
        )
        self.db.add(new_cred)

        try:
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            raise AuthProviderError(status_code=500, detail="Database error") from e

        self.db.refresh(new_user)

        return new_user

    def authenticate(self, username: str, password: str) -> User | None:
        db_user = self.db.exec(select(User).where(User.username == username)).one_or_none()
        if not db_user:
            return None

        db_cred = self.db.exec(
            select(DbAuthCredential).where(DbAuthCredential.user_id == db_user.id),
        ).one_or_none()
        if db_cred is None or not verify_password(password, db_cred.hashed_password):
            return None

        return db_user
