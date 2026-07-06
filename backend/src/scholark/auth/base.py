from abc import ABC, abstractmethod

from scholark.models import User, UserCreate


class AuthProviderError(Exception):
    """Error raised by authentication providers.

    Deliberately not an HTTPException so the auth layer stays independent of
    the web framework; the FastAPI app maps it to a JSON error response.
    """

    def __init__(self, status_code: int, detail: str) -> None:
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


class AuthProvider(ABC):
    @abstractmethod
    def authenticate(self, username: str, password: str) -> User | None:
        """Authenticate a user with username and password."""

    @abstractmethod
    def get_user_by_username(self, *, username: str) -> User | None:
        """Get a user by username."""

    @abstractmethod
    def create_user(self, *, user_create: UserCreate) -> User:
        """Create a new user."""
