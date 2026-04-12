"""Send milestone reminders to subscribed users via Slack DM.

Usage:
    uv run python -m scholark.cli.send_reminders
"""

import logging
import sys

from sqlmodel import Session

from scholark.core.db import engine
from scholark.slack import send_milestone_reminders

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)


def main() -> None:
    logger.info("Starting milestone reminder job")
    try:
        with Session(engine) as session:
            send_milestone_reminders(session)
    except Exception:
        logger.exception("Fatal error in milestone reminder job")
        sys.exit(1)
    logger.info("Milestone reminder job completed")


if __name__ == "__main__":
    main()
