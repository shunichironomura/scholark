from uuid import UUID

from fastapi import APIRouter
from sqlmodel import func, select

from scholark.api.deps import SessionDep
from scholark.models import Conference, ConferenceCreate, ConferencePublic, ConferencesPublic

router = APIRouter(prefix="/conferences", tags=["conferences"])


@router.get("/")
def read_conferences(
    session: SessionDep,
    # current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> ConferencesPublic:
    """Retrieve a list of conferences."""
    count_statement = select(func.count()).select_from(Conference)
    count = session.exec(count_statement).one()
    statement = select(Conference).offset(skip).limit(limit)
    conferences = session.exec(statement).all()

    return ConferencesPublic(data=conferences, count=count)


@router.post("/", response_model=ConferencePublic)
def create_conference(
    *,
    session: SessionDep,
    conference_in: ConferenceCreate,
) -> Conference:
    """Create a new conference."""
    conference = Conference.model_validate(conference_in)
    session.add(conference)
    session.commit()
    session.refresh(conference)
    return conference


@router.get("/{conference_id}", response_model=ConferencePublic)
def read_conference(
    *,
    session: SessionDep,
    conference_id: UUID,
) -> Conference:
    """Retrieve a conference by ID."""
    statement = select(Conference).where(Conference.id == conference_id)
    return session.exec(statement).one()


@router.delete("/{conference_id}", response_model=ConferencePublic)
def delete_conference(
    *,
    session: SessionDep,
    conference_id: UUID,
) -> Conference:
    """Delete a conference by ID."""
    # TODO: Implement soft delete
    statement = select(Conference).where(Conference.id == conference_id)
    conference = session.exec(statement).one()
    session.delete(conference)
    session.commit()
    return conference
