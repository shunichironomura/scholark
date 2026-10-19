import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine
from sqlmodel import Session, select

from scholark import main
from scholark.core.config import settings
from scholark.models import User


def test_lifespan_checks_connection_and_initializes_database(engine: Engine, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(main, "engine", engine)

    with TestClient(main.app) as client:
        response = client.get("/api/v1/health/")
        assert response.status_code == 200

        with Session(engine) as session:
            user = session.exec(select(User).where(User.username == settings.FIRST_SUPERUSER)).one()
            assert user.is_superuser


def test_cors_headers_are_present_for_configured_origin(client: TestClient) -> None:
    origin = "http://localhost:5173"
    response = client.get("/api/v1/health/", headers={"Origin": origin})
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin
