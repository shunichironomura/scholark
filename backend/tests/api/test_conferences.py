import uuid
from typing import Any

from fastapi.testclient import TestClient
from sqlmodel import Session, select

from scholark.models import TagConferenceLink, User
from tests.conftest import HeadersFor

API = "/api/v1"


def create_conference(
    client: TestClient,
    headers: dict[str, str],
    *,
    name: str = "Test Conference",
    milestones: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    response = client.post(
        f"{API}/conferences/",
        headers=headers,
        json={
            "name": name,
            "start_date": "2027-06-01",
            "end_date": "2027-06-05",
            "location": "Tokyo",
            "website_url": "https://example.com",
            "milestones": milestones or [],
        },
    )
    assert response.status_code == 200, response.text
    return response.json()  # type: ignore[no-any-return]


def create_tag(client: TestClient, headers: dict[str, str], *, name: str = "My Tag") -> dict[str, Any]:
    response = client.post(f"{API}/tags/", headers=headers, json={"name": name, "color": "#00ff00"})
    assert response.status_code == 200, response.text
    return response.json()  # type: ignore[no-any-return]


def test_read_missing_conference_returns_404(client: TestClient, user: User, headers_for: HeadersFor) -> None:
    response = client.get(f"{API}/conferences/{uuid.uuid4()}", headers=headers_for(user))
    assert response.status_code == 404


def test_update_missing_conference_returns_404(client: TestClient, user: User, headers_for: HeadersFor) -> None:
    response = client.put(
        f"{API}/conferences/{uuid.uuid4()}",
        headers=headers_for(user),
        json={"name": "Nope"},
    )
    assert response.status_code == 404


def test_delete_missing_conference_returns_404(client: TestClient, superuser: User, headers_for: HeadersFor) -> None:
    response = client.delete(f"{API}/conferences/{uuid.uuid4()}", headers=headers_for(superuser))
    assert response.status_code == 404


def test_add_missing_tag_returns_404(client: TestClient, user: User, headers_for: HeadersFor) -> None:
    conference = create_conference(client, headers_for(user))
    response = client.post(
        f"{API}/conferences/{conference['id']}/tags",
        headers=headers_for(user),
        params={"tag_id": str(uuid.uuid4())},
    )
    assert response.status_code == 404


def test_add_other_users_tag_returns_404(
    client: TestClient,
    user: User,
    other_user: User,
    headers_for: HeadersFor,
) -> None:
    conference = create_conference(client, headers_for(user))
    other_tag = create_tag(client, headers_for(other_user), name="Bob's tag")
    response = client.post(
        f"{API}/conferences/{conference['id']}/tags",
        headers=headers_for(user),
        params={"tag_id": other_tag["id"]},
    )
    assert response.status_code == 404


def test_conference_list_survives_creator_deletion(
    client: TestClient,
    user: User,
    superuser: User,
    headers_for: HeadersFor,
) -> None:
    create_conference(client, headers_for(user))

    response = client.delete(f"{API}/users/{user.id}", headers=headers_for(superuser))
    assert response.status_code == 200, response.text

    response = client.get(f"{API}/conferences/", headers=headers_for(superuser))
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["count"] == 1
    assert body["data"][0]["created_by_user_id"] is None


def test_tags_are_filtered_per_user(
    client: TestClient,
    session: Session,
    user: User,
    other_user: User,
    headers_for: HeadersFor,
) -> None:
    conference = create_conference(client, headers_for(user))
    my_tag = create_tag(client, headers_for(user), name="Alice's tag")
    other_tag = create_tag(client, headers_for(other_user), name="Bob's tag")

    for owner, tag in ((user, my_tag), (other_user, other_tag)):
        response = client.post(
            f"{API}/conferences/{conference['id']}/tags",
            headers=headers_for(owner),
            params={"tag_id": tag["id"]},
        )
        assert response.status_code == 200, response.text

    for reader, own_tag in ((user, my_tag), (other_user, other_tag)):
        for url in (f"{API}/conferences/", f"{API}/conferences/{conference['id']}"):
            response = client.get(url, headers=headers_for(reader))
            assert response.status_code == 200, response.text
            body = response.json()
            data = body["data"][0] if "data" in body else body
            assert [tag["id"] for tag in data["tags"]] == [own_tag["id"]]

    # Reading must not have destroyed the other user's tag assignment.
    links = session.exec(select(TagConferenceLink)).all()
    assert len(links) == 2


def test_write_endpoints_do_not_leak_other_users_tags(
    client: TestClient,
    user: User,
    other_user: User,
    headers_for: HeadersFor,
) -> None:
    conference = create_conference(client, headers_for(user))
    other_tag = create_tag(client, headers_for(other_user), name="Bob's tag")
    response = client.post(
        f"{API}/conferences/{conference['id']}/tags",
        headers=headers_for(other_user),
        params={"tag_id": other_tag["id"]},
    )
    assert response.status_code == 200, response.text

    response = client.put(
        f"{API}/conferences/{conference['id']}",
        headers=headers_for(user),
        json={"name": "Renamed Conference"},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["tags"] == []
    # The creating user was auto-subscribed; write responses must reflect it.
    assert body["is_subscribed"] is True

    my_tag = create_tag(client, headers_for(user), name="Alice's tag")
    response = client.post(
        f"{API}/conferences/{conference['id']}/tags",
        headers=headers_for(user),
        params={"tag_id": my_tag["id"]},
    )
    assert response.status_code == 200, response.text
    assert [tag["id"] for tag in response.json()["tags"]] == [my_tag["id"]]


def test_update_without_milestones_key_preserves_milestones(
    client: TestClient,
    user: User,
    headers_for: HeadersFor,
) -> None:
    conference = create_conference(
        client,
        headers_for(user),
        milestones=[{"name": "Abstract deadline", "date": "2027-01-15"}],
    )
    assert len(conference["milestones"]) == 1

    response = client.put(
        f"{API}/conferences/{conference['id']}",
        headers=headers_for(user),
        json={"name": "Renamed Conference"},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["name"] == "Renamed Conference"
    assert len(body["milestones"]) == 1


def test_update_preserves_milestone_ids_and_times(
    client: TestClient,
    user: User,
    headers_for: HeadersFor,
) -> None:
    conference = create_conference(
        client,
        headers_for(user),
        milestones=[{"name": "Abstract deadline", "date": "2027-01-15", "time": "12:00:00"}],
    )
    milestone = conference["milestones"][0]

    response = client.put(
        f"{API}/conferences/{conference['id']}",
        headers=headers_for(user),
        json={
            "name": conference["name"],
            "milestones": [
                # No time field: the stored time must survive the edit.
                {"id": milestone["id"], "name": "Paper deadline", "date": "2027-01-20"},
                {"name": "Camera-ready", "date": "2027-03-01"},
            ],
        },
    )
    assert response.status_code == 200, response.text
    milestones = {m["name"]: m for m in response.json()["milestones"]}
    assert set(milestones) == {"Paper deadline", "Camera-ready"}
    assert milestones["Paper deadline"]["id"] == milestone["id"]
    assert milestones["Paper deadline"]["time"] is not None


def test_update_with_empty_milestones_clears_them(
    client: TestClient,
    user: User,
    headers_for: HeadersFor,
) -> None:
    conference = create_conference(
        client,
        headers_for(user),
        milestones=[{"name": "Abstract deadline", "date": "2027-01-15"}],
    )
    response = client.put(
        f"{API}/conferences/{conference['id']}",
        headers=headers_for(user),
        json={"name": conference["name"], "milestones": []},
    )
    assert response.status_code == 200, response.text
    assert response.json()["milestones"] == []


def test_unchanged_update_does_not_bump_updated_at(
    client: TestClient,
    user: User,
    headers_for: HeadersFor,
) -> None:
    conference = create_conference(client, headers_for(user))
    response = client.put(
        f"{API}/conferences/{conference['id']}",
        headers=headers_for(user),
        json={
            "name": conference["name"],
            "start_date": conference["start_date"],
            "end_date": conference["end_date"],
            "location": conference["location"],
            "website_url": conference["website_url"],
        },
    )
    assert response.status_code == 200, response.text
    assert response.json()["updated_at"] == conference["updated_at"]


def test_create_conference_with_empty_name_is_rejected(
    client: TestClient,
    user: User,
    headers_for: HeadersFor,
) -> None:
    response = client.post(f"{API}/conferences/", headers=headers_for(user), json={"name": ""})
    assert response.status_code == 422


def test_list_limit_is_clamped(client: TestClient, user: User, headers_for: HeadersFor) -> None:
    response = client.get(
        f"{API}/conferences/",
        headers=headers_for(user),
        params={"limit": 10**9},
    )
    assert response.status_code == 422


def test_delete_conference_returns_serialized_conference(
    client: TestClient,
    user: User,
    superuser: User,
    headers_for: HeadersFor,
) -> None:
    conference = create_conference(client, headers_for(user))
    response = client.delete(f"{API}/conferences/{conference['id']}", headers=headers_for(superuser))
    assert response.status_code == 200, response.text
    assert response.json()["id"] == conference["id"]

    response = client.get(f"{API}/conferences/{conference['id']}", headers=headers_for(user))
    assert response.status_code == 404
