from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient
from sqlmodel import Session, select

from scholark.core.security import create_access_token
from scholark.models import RefreshSession, User
from tests.conftest import HeadersFor

API = "/api/v1"


def login(client: TestClient, username: str, password: str) -> tuple[int, dict[str, str]]:
    response = client.post(
        f"{API}/login/access-token",
        data={"username": username, "password": password},
    )
    return response.status_code, response.json()


def refresh(client: TestClient, refresh_token: str) -> tuple[int, dict[str, str]]:
    response = client.post(f"{API}/login/refresh", json={"refresh_token": refresh_token})
    return response.status_code, response.json()


def test_login_success(client: TestClient, user: User) -> None:
    status_code, body = login(client, "alice", "alicepassword")
    assert status_code == 200
    assert body["refresh_token"]
    response = client.get(f"{API}/users/me", headers={"Authorization": f"Bearer {body['access_token']}"})
    assert response.status_code == 200
    assert response.json()["username"] == "alice"


def test_refresh_success_rotates_tokens(client: TestClient, user: User) -> None:
    _, login_body = login(client, "alice", "alicepassword")

    status_code, refresh_body = refresh(client, login_body["refresh_token"])

    assert status_code == 200
    assert refresh_body["access_token"]
    assert refresh_body["refresh_token"] != login_body["refresh_token"]
    assert refresh(client, login_body["refresh_token"])[0] == 401


def test_expired_access_token_can_be_refreshed(client: TestClient, user: User) -> None:
    _, login_body = login(client, "alice", "alicepassword")
    expired_access_token = create_access_token(user.id, expires_delta=timedelta(seconds=-1))
    expired_response = client.get(
        f"{API}/users/me",
        headers={"Authorization": f"Bearer {expired_access_token}"},
    )
    assert expired_response.status_code == 401

    status_code, refresh_body = refresh(client, login_body["refresh_token"])
    assert status_code == 200
    response = client.get(
        f"{API}/users/me",
        headers={"Authorization": f"Bearer {refresh_body['access_token']}"},
    )
    assert response.status_code == 200


def test_revoked_refresh_token_returns_401(client: TestClient, session: Session, user: User) -> None:
    _, body = login(client, "alice", "alicepassword")
    refresh_session = session.exec(select(RefreshSession).where(RefreshSession.user_id == user.id)).one()
    session.delete(refresh_session)
    session.commit()

    assert refresh(client, body["refresh_token"])[0] == 401


def test_expired_refresh_token_returns_401(client: TestClient, session: Session, user: User) -> None:
    _, body = login(client, "alice", "alicepassword")
    refresh_session = session.exec(select(RefreshSession).where(RefreshSession.user_id == user.id)).one()
    refresh_session.expires_at = datetime.now(UTC) - timedelta(seconds=1)
    session.add(refresh_session)
    session.commit()

    assert refresh(client, body["refresh_token"])[0] == 401


def test_logout_revokes_refresh_token(client: TestClient, user: User) -> None:
    _, body = login(client, "alice", "alicepassword")

    response = client.post(f"{API}/login/logout", json={"refresh_token": body["refresh_token"]})

    assert response.status_code == 204
    assert refresh(client, body["refresh_token"])[0] == 401


def test_disabled_user_refresh_returns_401(client: TestClient, session: Session, user: User) -> None:
    _, body = login(client, "alice", "alicepassword")
    user.disabled = True
    session.add(user)
    session.commit()

    assert refresh(client, body["refresh_token"])[0] == 401
    assert session.exec(select(RefreshSession).where(RefreshSession.user_id == user.id)).all() == []


def test_deleted_user_refresh_returns_401(client: TestClient, session: Session, user: User) -> None:
    _, body = login(client, "alice", "alicepassword")
    session.delete(user)
    session.commit()

    assert refresh(client, body["refresh_token"])[0] == 401


def test_login_wrong_password_returns_400(client: TestClient, user: User) -> None:
    status_code, _ = login(client, "alice", "wrongpassword")
    assert status_code == 400


def test_login_unknown_username_returns_400(client: TestClient) -> None:
    status_code, _ = login(client, "nobody", "whatever")
    assert status_code == 400


def test_login_empty_password_is_rejected_without_500(client: TestClient, user: User) -> None:
    status_code, _ = login(client, "alice", "")
    # FastAPI's form validation rejects the empty password before the auth
    # provider runs; either client error is fine, a 500 is not.
    assert status_code in (400, 422)


def test_login_disabled_user_returns_400(client: TestClient, session: Session, user: User) -> None:
    user.disabled = True
    session.add(user)
    session.commit()

    status_code, body = login(client, "alice", "alicepassword")
    assert status_code == 400
    assert body["detail"] == "Inactive user"


def test_disabled_user_token_is_rejected_with_401(
    client: TestClient,
    session: Session,
    user: User,
    headers_for: HeadersFor,
) -> None:
    headers = headers_for(user)
    user.disabled = True
    session.add(user)
    session.commit()

    response = client.get(f"{API}/users/me", headers=headers)
    assert response.status_code == 401


def test_deleted_user_token_is_rejected_with_401(
    client: TestClient,
    session: Session,
    user: User,
    headers_for: HeadersFor,
) -> None:
    headers = headers_for(user)
    session.delete(user)
    session.commit()

    response = client.get(f"{API}/users/me", headers=headers)
    assert response.status_code == 401


def test_invalid_token_returns_401_with_www_authenticate(client: TestClient) -> None:
    response = client.get(f"{API}/users/me", headers={"Authorization": "Bearer garbage"})
    assert response.status_code == 401
    assert response.headers["WWW-Authenticate"] == "Bearer"
