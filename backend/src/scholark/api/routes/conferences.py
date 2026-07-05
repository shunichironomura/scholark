import logging
from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import col, func, select

from scholark.api.deps import CurrentUser, SessionDep, get_current_active_superuser
from scholark.models import (
    Conference,
    ConferenceCreate,
    ConferenceMilestone,
    ConferencePublic,
    ConferencesPublic,
    ConferenceSubscription,
    ConferenceUpdate,
    Message,
    Tag,
    TagPublic,
)
from scholark.slack import notify_new_conference

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/conferences", tags=["conferences"])


def _conference_to_public(conference: Conference, user_id: UUID) -> ConferencePublic:
    """Convert a Conference to ConferencePublic for the given user.

    Only the user's own tags are included, and is_subscribed is computed for
    the user. Filtering happens while building the response model; the ORM
    relationship must not be mutated for presentation, since SQLAlchemy would
    flush the removal as DELETEs on the tag-conference link table.
    """
    return ConferencePublic.model_validate(
        conference,
        update={
            "tags": [TagPublic.model_validate(tag) for tag in conference.tags if tag.user_id == user_id],
            "is_subscribed": any(s.id == user_id for s in conference.subscribers),
        },
    )


@router.get("/")
def read_conferences(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> ConferencesPublic:
    """Retrieve a list of conferences."""
    count_statement = select(func.count()).select_from(Conference)
    count = session.exec(count_statement).one()
    statement = select(Conference).order_by(col(Conference.start_date)).offset(skip).limit(limit)

    conferences = session.exec(statement).all()

    conferences_public = [_conference_to_public(conference, current_user.id) for conference in conferences]

    return ConferencesPublic(data=conferences_public, count=count)


@router.post("/")
def create_conference(
    *,
    current_user: CurrentUser,
    session: SessionDep,
    conference_in: ConferenceCreate,
) -> ConferencePublic:
    """Create a new conference."""
    milestones = conference_in.milestones or []
    conference = Conference.model_validate(
        conference_in,
        update={"created_by_user_id": current_user.id, "milestones": []},
    )
    conference.milestones = [
        ConferenceMilestone.model_validate(milestone, update={"conference_id": conference.id})
        for milestone in milestones
    ]

    session.add(conference)
    session.flush()

    # Auto-subscribe the creating user
    subscription = ConferenceSubscription(user_id=current_user.id, conference_id=conference.id)
    session.add(subscription)

    session.commit()
    session.refresh(conference)

    notify_new_conference(conference)

    return _conference_to_public(conference, current_user.id)


@router.get("/{conference_id}")
def read_conference(
    *,
    current_user: CurrentUser,
    session: SessionDep,
    conference_id: UUID,
) -> ConferencePublic:
    """Retrieve a conference by ID."""
    conference = session.get(Conference, conference_id)
    if not conference:
        raise HTTPException(status_code=404, detail="Conference not found")

    return _conference_to_public(conference, current_user.id)


@router.delete(
    "/{conference_id}",
    dependencies=[Depends(get_current_active_superuser)],
)
def delete_conference(
    *,
    current_user: CurrentUser,
    session: SessionDep,
    conference_id: UUID,
) -> ConferencePublic:
    """Delete a conference by ID."""
    # TODO: Implement soft delete
    conference = session.get(Conference, conference_id)
    if not conference:
        raise HTTPException(status_code=404, detail="Conference not found")
    # Serialize before deleting; the ORM instance is unusable after the flush.
    conference_public = _conference_to_public(conference, current_user.id)
    session.delete(conference)
    session.commit()
    return conference_public


@router.put("/{conference_id}")
def update_conference(
    *,
    current_user: CurrentUser,
    session: SessionDep,
    conference_id: UUID,
    conference_in: ConferenceUpdate,
) -> ConferencePublic:
    """Update a conference by ID."""
    conference = session.get(Conference, conference_id)
    if not conference:
        raise HTTPException(status_code=404, detail="Conference not found")

    new_milestones = conference_in.milestones or []
    conference_in.milestones = None
    update_dict = conference_in.model_dump(exclude_unset=True)
    update_dict["updated_at"] = datetime.now(UTC)
    conference.sqlmodel_update(update_dict)
    for milestone in conference.milestones:
        session.delete(milestone)

    conference.milestones = [
        ConferenceMilestone.model_validate(milestone, update={"conference_id": conference.id})
        for milestone in new_milestones
    ]
    session.add(conference)
    session.commit()
    session.refresh(conference)
    return _conference_to_public(conference, current_user.id)


@router.post("/{conference_id}/tags")
def add_tag_to_conference(
    *,
    current_user: CurrentUser,
    session: SessionDep,
    conference_id: UUID,
    tag_id: UUID,
) -> ConferencePublic:
    """Add a tag to a conference."""
    conference = session.get(Conference, conference_id)
    if not conference:
        raise HTTPException(status_code=404, detail="Conference not found")
    tag_statement = select(Tag).where(Tag.id == tag_id, Tag.user_id == current_user.id)
    tag = session.exec(tag_statement).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    conference.tags.append(tag)
    session.add(conference)
    session.commit()
    session.refresh(conference)
    return _conference_to_public(conference, current_user.id)


@router.delete("/{conference_id}/tags/{tag_id}")
def remove_tag_from_conference(
    *,
    current_user: CurrentUser,
    session: SessionDep,
    conference_id: UUID,
    tag_id: UUID,
) -> ConferencePublic:
    """Remove a tag from a conference."""
    conference = session.get(Conference, conference_id)
    if not conference:
        raise HTTPException(status_code=404, detail="Conference not found")
    tag_statement = select(Tag).where(Tag.id == tag_id, Tag.user_id == current_user.id)
    tag = session.exec(tag_statement).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    conference.tags.remove(tag)
    session.add(conference)
    session.commit()
    session.refresh(conference)
    return _conference_to_public(conference, current_user.id)


@router.put("/{conference_id}/tags")
def update_tags_for_conference(
    *,
    current_user: CurrentUser,
    session: SessionDep,
    conference_id: UUID,
    tags: list[UUID],
) -> ConferencePublic:
    """Update tags for a conference."""
    logger.info(f"Updating tags for conference {conference_id} with tags {tags}")
    conference = session.get(Conference, conference_id)
    if not conference:
        raise HTTPException(status_code=404, detail="Conference not found")

    existing_tag_ids = {tag.id for tag in conference.tags if tag.user_id == current_user.id}

    tag_ids_to_remove = existing_tag_ids - set(tags)
    tag_ids_to_add = set(tags) - existing_tag_ids

    # Add new tags
    for tag_id in tag_ids_to_add:
        tag_statement = select(Tag).where(Tag.id == tag_id, Tag.user_id == current_user.id)
        tag = session.exec(tag_statement).first()
        if not tag:
            raise HTTPException(status_code=404, detail="Tag not found")
        conference.tags.append(tag)

    # Remove old tags
    for tag_id in tag_ids_to_remove:
        tag_statement = select(Tag).where(Tag.id == tag_id, Tag.user_id == current_user.id)
        tag = session.exec(tag_statement).first()
        if not tag:
            raise HTTPException(status_code=404, detail="Tag not found")
        conference.tags.remove(tag)

    session.add(conference)
    session.commit()
    session.refresh(conference)
    return _conference_to_public(conference, current_user.id)


@router.post("/{conference_id}/subscribe")
def subscribe_to_conference(
    *,
    current_user: CurrentUser,
    session: SessionDep,
    conference_id: UUID,
) -> Message:
    """Subscribe the current user to a conference."""
    conference = session.get(Conference, conference_id)
    if not conference:
        raise HTTPException(status_code=404, detail="Conference not found")

    existing = session.get(ConferenceSubscription, (current_user.id, conference_id))
    if existing:
        return Message(message="Already subscribed")

    subscription = ConferenceSubscription(user_id=current_user.id, conference_id=conference_id)
    session.add(subscription)
    session.commit()
    return Message(message="Subscribed successfully")


@router.delete("/{conference_id}/subscribe")
def unsubscribe_from_conference(
    *,
    current_user: CurrentUser,
    session: SessionDep,
    conference_id: UUID,
) -> Message:
    """Unsubscribe the current user from a conference."""
    subscription = session.get(ConferenceSubscription, (current_user.id, conference_id))
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")

    session.delete(subscription)
    session.commit()
    return Message(message="Unsubscribed successfully")
