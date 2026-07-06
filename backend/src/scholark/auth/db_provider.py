from functools import lru_cache

from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from scholark.core.security import get_password_hash, verify_password
from scholark.models import DbAuthCredential, User, UserCreate, default_tags

from .base import AuthProvider, AuthProviderError


@lru_cache(maxsize=1)
def _dummy_password_hash() -> str:
    """Hash to verify against when a username has no credential.

    Verifying a dummy hash keeps the response time of unknown-username logins
    close to that of known usernames, preventing username enumeration.
    """
    return get_password_hash("scholark-dummy-password")


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

        new_cred = DbAuthCredential(
            user_id=new_user.id,
            hashed_password=get_password_hash(user_create.password),
        )

        # One transaction: committing the user without its credential would
        # strand a username that exists but can never authenticate.
        self.db.add(new_user)
        try:
            # Flush the user row first so the credential's FK target exists;
            # there is no ORM relationship between the two, so SQLAlchemy
            # cannot order the inserts on its own. flush() does not commit.
            self.db.flush()
            self.db.add(new_cred)
            self.db.commit()
        except IntegrityError as e:
            self.db.rollback()
            raise AuthProviderError(status_code=400, detail="User already exists") from e
        except Exception as e:
            self.db.rollback()
            raise AuthProviderError(status_code=500, detail="Database error") from e

        self.db.refresh(new_user)

        return new_user

    def authenticate(self, username: str, password: str) -> User | None:
        db_user = self.db.exec(select(User).where(User.username == username)).one_or_none()
        db_cred = None
        if db_user:
            db_cred = self.db.exec(
                select(DbAuthCredential).where(DbAuthCredential.user_id == db_user.id),
            ).one_or_none()

        if db_cred is None:
            verify_password(password, _dummy_password_hash())
            return None
        if not verify_password(password, db_cred.hashed_password):
            return None

        return db_user
