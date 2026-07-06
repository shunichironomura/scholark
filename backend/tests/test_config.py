import pytest
from pydantic import ValidationError

from scholark.core.config import Settings


def test_secret_key_is_required(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("SCHOLARK_SECRET_KEY", raising=False)
    with pytest.raises(ValidationError) as exc_info:
        Settings()  # type: ignore[call-arg] # ty: ignore[missing-argument]
    assert any(error["loc"] == ("SECRET_KEY",) for error in exc_info.value.errors())
