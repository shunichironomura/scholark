from collections.abc import Collection

from scholark.models import User, UserCreate

from .base import AuthProvider, AuthProviderError
from .db_provider import DbAuthProvider
from .ldap_provider import LdapAuthProvider


class AuthRouter(AuthProvider):
    def __init__(
        self,
        db_provider: DbAuthProvider,
        ldap_provider: LdapAuthProvider,
        preserved_db_usernames: Collection[str],
    ) -> None:
        self.db_provider = db_provider
        self.ldap_provider = ldap_provider
        self.preserved_db_usernames = set(preserved_db_usernames)

    def authenticate(self, username: str, password: str) -> User | None:
        if username in self.preserved_db_usernames:
            return self.db_provider.authenticate(username, password)
        return self.ldap_provider.authenticate(username, password)

    def create_user(self, *, user_create: UserCreate) -> User:
        if user_create.username in self.preserved_db_usernames:
            return self.db_provider.create_user(user_create=user_create)
        raise AuthProviderError(status_code=400, detail="User creation not supported for this username")

    def get_user_by_username(self, *, username: str) -> User | None:
        # Look up user from wherever needed
        if username in self.preserved_db_usernames:
            return self.db_provider.get_user_by_username(username=username)
        return self.ldap_provider.get_user_by_username(username=username)
