import os

# Settings are instantiated at import time, so the environment must be
# populated before any scholark module is imported.
os.environ.setdefault("SCHOLARK_SECRET_KEY", "test-secret-key-0123456789abcdef0123456789abcdef")
os.environ.setdefault("SCHOLARK_FRONTEND_HOST", "http://localhost:5173")
os.environ.setdefault("SCHOLARK_POSTGRES_SERVER", "localhost")
os.environ.setdefault("SCHOLARK_POSTGRES_PORT", "5432")
os.environ.setdefault("SCHOLARK_POSTGRES_USER", "postgres")
os.environ.setdefault("SCHOLARK_POSTGRES_PASSWORD", "postgres")
os.environ.setdefault("SCHOLARK_POSTGRES_DB", "scholark-test")
os.environ.setdefault("SCHOLARK_FIRST_SUPERUSER", "admin")
os.environ.setdefault("SCHOLARK_FIRST_SUPERUSER_PASSWORD", "adminpassword")

from collections.abc import Callable, Generator
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine, event
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from scholark.api.deps import get_db
from scholark.auth.db_provider import DbAuthProvider
from scholark.core.security import create_access_token
from scholark.main import app
from scholark.models import User, UserCreate

HeadersFor = Callable[[User], dict[str, str]]


@pytest.fixture
def engine() -> Generator[Engine]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # SQLite ignores foreign-key actions (ON DELETE CASCADE / SET NULL)
    # unless the pragma is enabled per connection.
    @event.listens_for(engine, "connect")
    def _enable_sqlite_fks(dbapi_connection: Any, _connection_record: Any) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    SQLModel.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def session(engine: Engine) -> Generator[Session]:
    with Session(engine) as session:
        yield session


@pytest.fixture
def client(session: Session) -> Generator[TestClient]:
    def _get_db_override() -> Generator[Session]:
        yield session

    app.dependency_overrides[get_db] = _get_db_override
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def user(session: Session) -> User:
    return DbAuthProvider(session).create_user(
        user_create=UserCreate(username="alice", password="alicepassword"),
    )


@pytest.fixture
def other_user(session: Session) -> User:
    return DbAuthProvider(session).create_user(
        user_create=UserCreate(username="bob", password="bobpassword"),
    )


@pytest.fixture
def superuser(session: Session) -> User:
    return DbAuthProvider(session).create_user(
        user_create=UserCreate(username="admin", password="adminpassword", is_superuser=True),
    )


@pytest.fixture
def headers_for() -> HeadersFor:
    def _headers(user: User) -> dict[str, str]:
        return {"Authorization": f"Bearer {create_access_token(user.id)}"}

    return _headers
