from datetime import date

import pytest

from scholark.core.config import settings
from scholark.models import Conference, ConferenceMilestone
from scholark.slack import build_new_conference_message


def make_conference() -> Conference:
    conference = Conference(
        name="ISTS 2027",
        start_date=date(2027, 6, 1),
        end_date=date(2027, 6, 5),
        location="Kobe",
        website_url="https://ists.example.com",
        created_by_user_id=None,
    )
    conference.milestones = [
        ConferenceMilestone(name="Paper deadline", date=date(2027, 2, 1), conference_id=conference.id),
        ConferenceMilestone(name="Abstract deadline", date=date(2027, 1, 15), conference_id=conference.id),
    ]
    return conference


def test_message_is_none_when_slack_is_not_configured() -> None:
    assert settings.SLACK_BOT_TOKEN is None
    assert build_new_conference_message(make_conference()) is None


def test_message_content(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "SLACK_BOT_TOKEN", "xoxb-test")
    monkeypatch.setattr(settings, "SLACK_CHANNEL_ID", "C123")

    message = build_new_conference_message(make_conference())
    assert message is not None
    assert "ISTS 2027" in message
    assert "Kobe" in message
    assert "<https://ists.example.com|Website>" in message
    # Milestones are listed in date order.
    assert message.index("Abstract deadline") < message.index("Paper deadline")
