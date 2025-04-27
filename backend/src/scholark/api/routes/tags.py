import uuid

from fastapi import APIRouter, HTTPException
from sqlmodel import col, func, select

from scholark.api.deps import CurrentUser, SessionDep
from scholark.models import Tag, TagCreate, TagPublic, TagsPublic, TagUpdate

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("/")
def read_tags(
    session: SessionDep,
    current_user: CurrentUser,
    *,
    skip: int = 0,
    limit: int = 100,
    all_users: bool = False,
) -> TagsPublic:
    """Retrieve a list of tags."""
    if current_user.is_superuser and all_users:
        count_statement = select(func.count()).select_from(Tag)
        statement = select(Tag).order_by(col(Tag.name)).offset(skip).limit(limit)
    else:
        # For non-superuser, filter by user_id
        count_statement = select(func.count()).select_from(Tag).where(Tag.user_id == current_user.id)
        statement = select(Tag).where(Tag.user_id == current_user.id).order_by(col(Tag.name)).offset(skip).limit(limit)

    count = session.exec(count_statement).one()
    tags = session.exec(statement).all()

    return TagsPublic(data=tags, count=count)


@router.post("/", response_model=TagPublic)
def create_tag(
    *,
    current_user: CurrentUser,
    session: SessionDep,
    tag_in: TagCreate,
) -> Tag:
    """Create a new tag."""
    tag = Tag.model_validate(
        tag_in,
        update={"user_id": current_user.id},
    )

    session.add(tag)
    session.commit()
    session.refresh(tag)
    return tag


@router.get("/{tag_id}", response_model=TagPublic)
def read_tag(
    *,
    current_user: CurrentUser,
    session: SessionDep,
    tag_id: uuid.UUID,
) -> Tag:
    """Retrieve a tag by ID."""
    tag = session.get(Tag, tag_id)

    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    if not current_user.is_superuser and tag.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this tag")

    return tag


@router.put("/{tag_id}", response_model=TagPublic)
def update_tag(
    *,
    current_user: CurrentUser,
    session: SessionDep,
    tag_id: uuid.UUID,
    tag_in: TagUpdate,
) -> Tag:
    """Update a tag."""
    tag = session.get(Tag, tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    if not current_user.is_superuser and tag.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this tag")

    update_dict = tag_in.model_dump(exclude_unset=True)
    tag.sqlmodel_update(update_dict)

    session.add(tag)
    session.commit()
    session.refresh(tag)
    return tag


@router.delete("/{tag_id}", response_model=TagPublic)
def delete_tag(
    *,
    current_user: CurrentUser,
    session: SessionDep,
    tag_id: uuid.UUID,
) -> Tag:
    """Delete a tag."""
    tag = session.get(Tag, tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    if not current_user.is_superuser and tag.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this tag")

    session.delete(tag)
    session.commit()
    return tag
