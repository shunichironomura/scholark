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
