from ldap3 import Connection
from sqlmodel import Session, select

from scholark.models import User, UserCreate, default_tags

from .base import AuthProvider, AuthProviderError


class LdapAuthProvider(AuthProvider):
    def __init__(
        self,
        db: Session,
        ldap_server: str,
        dn_pattern: str,
    ) -> None:
        self.db = db
        self.ldap_server = ldap_server
        self.dn_pattern = dn_pattern

    def get_user_by_username(self, *, username: str) -> User | None:
        return self.db.exec(select(User).where(User.username == username)).first()

    def create_user(self, *, user_create: UserCreate) -> User:  # noqa: ARG002
        raise AuthProviderError(status_code=400, detail="LDAP user creation not supported")

    def authenticate(self, username: str, password: str) -> User | None:
        user_dn = self.dn_pattern.format(username=username)
        # user_dn = f"uid={username},ou=users,dc=example,dc=com"
        # server = Server("ldap://your-ldap-server-address")
        conn = Connection(self.ldap_server, user=user_dn, password=password)

        if not conn.bind():
            return None  # Authentication failed

        # Add user to the database if they don't exist
        db_user = self.db.exec(select(User).where(User.username == username)).one_or_none()
        if not db_user:
            db_user = User(username=username)
            db_user.tags.extend(default_tags(user_id=db_user.id))
            self.db.add(db_user)
            try:
                self.db.commit()
            except Exception as e:
                self.db.rollback()
                raise AuthProviderError(status_code=500, detail="Database error") from e
            self.db.refresh(db_user)

        return db_user
