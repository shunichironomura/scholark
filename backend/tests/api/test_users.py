import uuid

from fastapi.testclient import TestClient

from scholark.models import User
from tests.conftest import HeadersFor

API = "/api/v1"


def test_read_missing_user_as_superuser_returns_404(
    client: TestClient,
    superuser: User,
    headers_for: HeadersFor,
) -> None:
    response = client.get(f"{API}/users/{uuid.uuid4()}", headers=headers_for(superuser))
    assert response.status_code == 404


def test_read_missing_user_as_normal_user_returns_403(
    client: TestClient,
    user: User,
    headers_for: HeadersFor,
) -> None:
    response = client.get(f"{API}/users/{uuid.uuid4()}", headers=headers_for(user))
    assert response.status_code == 403


def test_read_own_user_by_id(client: TestClient, user: User, headers_for: HeadersFor) -> None:
    response = client.get(f"{API}/users/{user.id}", headers=headers_for(user))
    assert response.status_code == 200
    assert response.json()["username"] == "alice"


def test_register_duplicate_username_returns_400(client: TestClient) -> None:
    payload = {"username": "carol", "password": "carolpassword"}
    assert client.post(f"{API}/users/signup", json=payload).status_code == 200
    response = client.post(f"{API}/users/signup", json=payload)
    assert response.status_code == 400
    assert "username" in response.json()["detail"]


def test_create_user_without_password_returns_400(
    client: TestClient,
    superuser: User,
    headers_for: HeadersFor,
) -> None:
    # Exercises the AuthProviderError -> JSON response mapping: the error is
    # raised by the provider, not as an HTTPException.
    response = client.post(f"{API}/users/", headers=headers_for(superuser), json={"username": "dave"})
    assert response.status_code == 400
    assert response.json()["detail"] == "Password is required"


def test_superuser_cannot_delete_self(client: TestClient, superuser: User, headers_for: HeadersFor) -> None:
    response = client.delete(f"{API}/users/{superuser.id}", headers=headers_for(superuser))
    assert response.status_code == 403
