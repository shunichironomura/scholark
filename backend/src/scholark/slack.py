import logging
from datetime import UTC, datetime, timedelta

from slack_sdk import WebClient
from sqlmodel import Session, select

from scholark.core.config import settings
from scholark.models import Conference, ConferenceMilestone, ConferenceSubscription, User

logger = logging.getLogger(__name__)


def _get_slack_client() -> WebClient | None:
    """Return a Slack WebClient if configured, else None."""
    if not settings.SLACK_BOT_TOKEN:
        return None
    return WebClient(token=settings.SLACK_BOT_TOKEN)


def notify_new_conference(conference: Conference) -> None:
    """Post a notification about a new conference to the configured Slack channel.

    No-op if Slack is not configured. Errors are logged but never raised.
    """
    client = _get_slack_client()
    if client is None or not settings.SLACK_CHANNEL_ID:
        return

    try:
        scholark_url = settings.FRONTEND_HOST.rstrip("/")
        lines = [
            f":mega: New conference added: *{conference.name}*",
        ]

        meta_parts: list[str] = []
        if conference.start_date and conference.end_date:
            meta_parts.append(f":date: {conference.start_date} \u2013 {conference.end_date}")
        elif conference.start_date:
            meta_parts.append(f":date: {conference.start_date}")
        if conference.location:
            meta_parts.append(f":round_pushpin: {conference.location}")
        if meta_parts:
            lines.append(" | ".join(meta_parts))

        link_parts: list[str] = []
        if conference.website_url:
            link_parts.append(f"<{conference.website_url}|Website>")
        link_parts.append(f"<{scholark_url}/conferences|View in Scholark>")
        lines.append(" \u00b7 ".join(link_parts))

        if conference.milestones:
            milestone_strs = [f"{m.name} ({m.date})" for m in sorted(conference.milestones, key=lambda m: m.date)]
            lines.append(f"Milestones: {', '.join(milestone_strs)}")

        text = "\n".join(lines)
        client.chat_postMessage(channel=settings.SLACK_CHANNEL_ID, text=text)
        logger.info(f"Slack notification sent for conference {conference.name}")
    except Exception:
        logger.exception(f"Failed to send Slack notification for conference {conference.name}")


def send_milestone_reminders(session: Session) -> None:
    """Send DM reminders for milestones that are 30 or 7 days away.

    Queries all milestones matching the target dates, finds subscribed users
    with a slack_user_id, and sends each a DM.
    """
    client = _get_slack_client()
    if client is None:
        logger.info("Slack not configured, skipping milestone reminders")
        return

    today = datetime.now(tz=UTC).date()
    target_dates = {
        today + timedelta(days=30): 30,
        today + timedelta(days=7): 7,
    }

    statement = select(ConferenceMilestone).where(ConferenceMilestone.date.in_(target_dates.keys()))  # type: ignore[attr-defined]
    milestones = session.exec(statement).all()

    if not milestones:
        logger.info("No milestones matching reminder dates")
        return

    scholark_url = settings.FRONTEND_HOST.rstrip("/")

    for milestone in milestones:
        days = target_dates[milestone.date]
        conference = milestone.conference

        # Find subscribed users with slack_user_id
        sub_statement = (
            select(User)
            .join(ConferenceSubscription, ConferenceSubscription.user_id == User.id)
            .where(
                ConferenceSubscription.conference_id == conference.id,
                User.slack_user_id.is_not(None),  # type: ignore[union-attr]
            )
        )
        users = session.exec(sub_statement).all()

        for user in users:
            try:
                text = (
                    f":alarm_clock: Reminder: *{milestone.name}* for *{conference.name}* "
                    f"is in {days} days ({milestone.date})\n"
                    f":link: <{scholark_url}/conferences|View in Scholark>"
                )
                client.chat_postMessage(channel=user.slack_user_id, text=text)
                logger.info(f"Sent reminder to {user.username} for {milestone.name} ({conference.name})")
            except Exception:
                logger.exception(f"Failed to send reminder to {user.username} for {milestone.name}")
