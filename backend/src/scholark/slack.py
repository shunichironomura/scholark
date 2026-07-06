import logging
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from slack_sdk import WebClient
from sqlmodel import Session, col, select

from scholark.core.config import settings
from scholark.models import Conference, ConferenceMilestone, ConferenceSubscription, User

logger = logging.getLogger(__name__)


def _get_slack_client() -> WebClient | None:
    """Return a Slack WebClient if configured, else None."""
    if not settings.SLACK_BOT_TOKEN:
        return None
    return WebClient(token=settings.SLACK_BOT_TOKEN)


def build_new_conference_message(conference: Conference) -> str | None:
    """Build the Slack notification text for a new conference.

    Pure message construction; returns None if Slack is not configured.
    """
    if not settings.SLACK_BOT_TOKEN or not settings.SLACK_CHANNEL_ID:
        return None

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

    return "\n".join(lines)


def send_channel_message(text: str) -> None:
    """Post a message to the configured Slack channel.

    No-op if Slack is not configured. Errors are logged but never raised, so
    this is safe to run as a background task.
    """
    client = _get_slack_client()
    if client is None or not settings.SLACK_CHANNEL_ID:
        return

    try:
        client.chat_postMessage(channel=settings.SLACK_CHANNEL_ID, text=text)
        logger.info("Slack channel notification sent")
    except Exception:
        logger.exception("Failed to send Slack channel notification")


def send_milestone_reminders(session: Session) -> None:
    """Send DM reminders for milestones that are 30 or 7 days away.

    Queries all milestones matching the target dates, finds subscribed users
    with a slack_user_id, and sends each a DM.
    """
    client = _get_slack_client()
    if client is None:
        logger.info("Slack not configured, skipping milestone reminders")
        return

    # "Today" in the configured reminder timezone; computing it in UTC would
    # deliver the 7/30-day reminders a day early for users west of UTC.
    today = datetime.now(tz=ZoneInfo(settings.REMINDER_TIMEZONE)).date()
    target_dates = {
        today + timedelta(days=30): 30,
        today + timedelta(days=7): 7,
    }

    statement = select(ConferenceMilestone).where(col(ConferenceMilestone.date).in_(target_dates.keys()))
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
            .join(ConferenceSubscription, ConferenceSubscription.user_id == User.id)  # type: ignore[arg-type] # ty: ignore[invalid-argument-type]
            .where(
                ConferenceSubscription.conference_id == conference.id,
                User.slack_user_id.is_not(None),  # type: ignore[union-attr] # ty: ignore[unresolved-attribute]
            )
        )
        users = session.exec(sub_statement).all()

        for user in users:
            if not user.slack_user_id:
                continue
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
