from abc import ABC

from fastapi import HTTPException


class AuthProviderError(HTTPException):
    pass


class AuthProvider(ABC):
    pass
