import pytest
from sqlmodel import Session, select

import scholark.auth.ldap_provider as ldap_provider_module
from scholark.auth.base import AuthProviderError
from scholark.auth.ldap_provider import LdapAuthProvider
from scholark.models import User, UserCreate

DN_PATTERN = "uid={username},ou=users,dc=example,dc=com"


class FakeConnection:
    """Stands in for ldap3.Connection; records the bind DN."""

    last_user_dn: str | None = None
    bind_result = False

    def __init__(self, _server: str, user: str, password: str) -> None:
        type(self).last_user_dn = user
        self.password = password

    def bind(self) -> bool:
        return type(self).bind_result


@pytest.fixture
def fake_connection(monkeypatch: pytest.MonkeyPatch) -> type[FakeConnection]:
    FakeConnection.last_user_dn = None
    FakeConnection.bind_result = False
    monkeypatch.setattr(ldap_provider_module, "Connection", FakeConnection)
    return FakeConnection


def make_provider(session: Session) -> LdapAuthProvider:
    return LdapAuthProvider(session, "ldap://ldap.example.com", DN_PATTERN)


def test_empty_password_is_rejected_without_binding(
    session: Session,
    fake_connection: type[FakeConnection],
) -> None:
    # An empty password must never reach the LDAP server: servers permitting
    # unauthenticated binds would report success for any username.
    assert make_provider(session).authenticate("alice", "") is None
    assert fake_connection.last_user_dn is None


def test_dn_metacharacters_in_username_are_escaped(
    session: Session,
    fake_connection: type[FakeConnection],
) -> None:
    assert make_provider(session).authenticate("evil,ou=admins", "password") is None
    assert fake_connection.last_user_dn == "uid=evil\\,ou\\=admins,ou=users,dc=example,dc=com"


def test_successful_bind_provisions_user(
    session: Session,
    fake_connection: type[FakeConnection],
) -> None:
    fake_connection.bind_result = True
    user = make_provider(session).authenticate("alice", "password")
    assert user is not None
    assert user.tags  # default tags provisioned on first login

    stored = session.exec(select(User).where(User.username == "alice")).first()
    assert stored is not None


def test_create_user_is_not_supported(session: Session) -> None:
    with pytest.raises(AuthProviderError):
        make_provider(session).create_user(user_create=UserCreate(username="x", password="passwordx"))
