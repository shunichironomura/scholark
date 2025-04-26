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
    ConferenceUpdate,
    Tag,
)

router = APIRouter(prefix="/conferences", tags=["conferences"])


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

    # Filter tags by user
    for conference in conferences:
        conference.tags = [tag for tag in conference.tags if tag.user_id == current_user.id]

    return ConferencesPublic(data=conferences, count=count)


@router.post("/", response_model=ConferencePublic)
def create_conference(
    *,
    current_user: CurrentUser,
    session: SessionDep,
    conference_in: ConferenceCreate,
) -> Conference:
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
    session.commit()
    session.refresh(conference)
    return conference


@router.get("/{conference_id}", response_model=ConferencePublic)
def read_conference(
    *,
    current_user: CurrentUser,
    session: SessionDep,
    conference_id: UUID,
) -> Conference:
    """Retrieve a conference by ID."""
    statement = select(Conference).where(Conference.id == conference_id)
    conference = session.exec(statement).one()
    if not conference:
        raise HTTPException(status_code=404, detail="Conference not found")

    # Filter tags by user
    conference.tags = [tag for tag in conference.tags if tag.user_id == current_user.id]
    return conference


@router.delete(
    "/{conference_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=ConferencePublic,
)
def delete_conference(
    *,
    session: SessionDep,
    conference_id: UUID,
) -> Conference:
    """Delete a conference by ID."""
    # TODO: Implement soft delete
    statement = select(Conference).where(Conference.id == conference_id)
    conference = session.exec(statement).one()
    if not conference:
        raise HTTPException(status_code=404, detail="Conference not found")
    session.delete(conference)
    session.commit()
    return conference


@router.put("/{conference_id}", response_model=ConferencePublic)
def update_conference(
    *,
    session: SessionDep,
    conference_id: UUID,
    conference_in: ConferenceUpdate,
) -> Conference:
    """Update a conference by ID."""
    statement = select(Conference).where(Conference.id == conference_id)
    conference = session.exec(statement).one()
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
    return conference


@router.post("/{conference_id}/tags", response_model=ConferencePublic)
def add_tag_to_conference(
    *,
    current_user: CurrentUser,
    session: SessionDep,
    conference_id: UUID,
    tag_id: UUID,
) -> Conference:
    """Add a tag to a conference."""
    statement = select(Conference).where(Conference.id == conference_id)
    conference = session.exec(statement).one()
    if not conference:
        raise HTTPException(status_code=404, detail="Conference not found")
    tag_statement = select(Tag).where(Tag.id == tag_id, Tag.user_id == current_user.id)
    tag = session.exec(tag_statement).one()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    conference.tags.append(tag)
    session.add(conference)
    session.commit()
    session.refresh(conference)
    return conference


@router.delete("/{conference_id}/tags/{tag_id}", response_model=ConferencePublic)
def remove_tag_from_conference(
    *,
    current_user: CurrentUser,
    session: SessionDep,
    conference_id: UUID,
    tag_id: UUID,
) -> Conference:
    """Remove a tag from a conference."""
    statement = select(Conference).where(Conference.id == conference_id)
    conference = session.exec(statement).one()
    if not conference:
        raise HTTPException(status_code=404, detail="Conference not found")
    tag_statement = select(Tag).where(Tag.id == tag_id, Tag.user_id == current_user.id)
    tag = session.exec(tag_statement).one()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    conference.tags.remove(tag)
    session.add(conference)
    session.commit()
    session.refresh(conference)
    return conference
