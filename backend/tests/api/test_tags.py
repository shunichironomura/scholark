import uuid

from fastapi.testclient import TestClient

from scholark.models import User
from tests.conftest import HeadersFor

API = "/api/v1"


def test_create_tag_with_invalid_color_returns_422(
    client: TestClient,
    user: User,
    headers_for: HeadersFor,
) -> None:
    response = client.post(f"{API}/tags/", headers=headers_for(user), json={"name": "Bad", "color": "red"})
    assert response.status_code == 422


def test_create_tag_with_short_hex_color(client: TestClient, user: User, headers_for: HeadersFor) -> None:
    response = client.post(f"{API}/tags/", headers=headers_for(user), json={"name": "Good", "color": "#0f0"})
    assert response.status_code == 200, response.text


def test_update_tag_with_invalid_color_returns_422(
    client: TestClient,
    user: User,
    headers_for: HeadersFor,
) -> None:
    created = client.post(f"{API}/tags/", headers=headers_for(user), json={"name": "T", "color": "#00ff00"})
    tag_id = created.json()["id"]
    response = client.put(f"{API}/tags/{tag_id}", headers=headers_for(user), json={"color": "not-a-color"})
    assert response.status_code == 422


def test_read_missing_tag_returns_404(client: TestClient, user: User, headers_for: HeadersFor) -> None:
    response = client.get(f"{API}/tags/{uuid.uuid4()}", headers=headers_for(user))
    assert response.status_code == 404


def test_read_other_users_tag_returns_403(
    client: TestClient,
    user: User,
    other_user: User,
    headers_for: HeadersFor,
) -> None:
    created = client.post(f"{API}/tags/", headers=headers_for(other_user), json={"name": "B", "color": "#0000ff"})
    response = client.get(f"{API}/tags/{created.json()['id']}", headers=headers_for(user))
    assert response.status_code == 403


def test_delete_tag_returns_serialized_tag(client: TestClient, user: User, headers_for: HeadersFor) -> None:
    created = client.post(f"{API}/tags/", headers=headers_for(user), json={"name": "Gone", "color": "#123abc"})
    tag_id = created.json()["id"]
    response = client.delete(f"{API}/tags/{tag_id}", headers=headers_for(user))
    assert response.status_code == 200, response.text
    assert response.json()["id"] == tag_id
    assert client.get(f"{API}/tags/{tag_id}", headers=headers_for(user)).status_code == 404
