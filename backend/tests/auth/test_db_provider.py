import pytest
from sqlmodel import Session, select

from scholark.auth.base import AuthProviderError
from scholark.auth.db_provider import DbAuthProvider
from scholark.models import User, UserCreate


def test_authenticate_success(session: Session, user: User) -> None:
    provider = DbAuthProvider(session)
    authenticated = provider.authenticate("alice", "alicepassword")
    assert authenticated is not None
    assert authenticated.id == user.id


def test_authenticate_unknown_username_returns_none(session: Session) -> None:
    assert DbAuthProvider(session).authenticate("nobody", "whatever") is None


def test_authenticate_user_without_credential_returns_none(session: Session) -> None:
    # E.g. a user provisioned through LDAP has no DbAuthCredential row.
    session.add(User(username="ldap-user"))
    session.commit()
    assert DbAuthProvider(session).authenticate("ldap-user", "whatever") is None


def test_create_user_is_atomic(session: Session, monkeypatch: pytest.MonkeyPatch) -> None:
    provider = DbAuthProvider(session)

    real_commit = session.commit

    def failing_commit() -> None:
        message = "simulated commit failure"
        raise RuntimeError(message)

    monkeypatch.setattr(session, "commit", failing_commit)
    with pytest.raises(AuthProviderError) as exc_info:
        provider.create_user(user_create=UserCreate(username="carol", password="carolpassword"))
    assert exc_info.value.status_code == 500
    monkeypatch.setattr(session, "commit", real_commit)

    # The failed attempt must not have stranded a credential-less user row:
    # the username is still absent and can be registered normally.
    assert session.exec(select(User).where(User.username == "carol")).first() is None
    created = provider.create_user(user_create=UserCreate(username="carol", password="carolpassword"))
    assert provider.authenticate("carol", "carolpassword") is not None
    assert created.tags  # default tags were provisioned in the same transaction
