from abc import ABC, abstractmethod

from fastapi import HTTPException

from scholark.models import User, UserCreate


class AuthProviderError(HTTPException):
    pass


class AuthProvider(ABC):
    @abstractmethod
    def authenticate(self, username: str, password: str) -> User | None:
        """Authenticate a user with username and password."""
        msg = "Subclasses must implement this method."
        raise NotImplementedError(msg)

    @abstractmethod
    def get_user_by_username(self, *, username: str) -> User | None:
        """Get a user by username."""
        msg = "Subclasses must implement this method."
        raise NotImplementedError(msg)

    @abstractmethod
    def create_user(self, *, user_create: UserCreate) -> User:
        """Create a new user."""
        msg = "Subclasses must implement this method."
        raise NotImplementedError(msg)
