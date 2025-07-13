import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import func, select

from scholark.api.deps import AuthProviderDep, CurrentUser, SessionDep, get_current_active_superuser
from scholark.models import (
    Message,
    User,
    UserCreate,
    UserPublic,
    UserRegister,
    UsersPublic,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UsersPublic,
)
def read_users(session: SessionDep, skip: int = 0, limit: int = 100) -> Any:
    """Retrieve users."""
    count_statement = select(func.count()).select_from(User)
    count = session.exec(count_statement).one()

    statement = select(User).offset(skip).limit(limit)
    users = session.exec(statement).all()

    users_public = [UserPublic.model_validate(user) for user in users]

    return UsersPublic(data=users_public, count=count)


@router.post(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UserPublic,
)
def create_user(*, user_in: UserCreate, auth_provider: AuthProviderDep) -> Any:
    """Create new user."""
    user = auth_provider.get_user_by_username(username=user_in.username)
    if user is not None:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )

    return auth_provider.create_user(user_create=user_in)


@router.get("/me", response_model=UserPublic)
def read_user_me(current_user: CurrentUser) -> Any:
    """Get current user."""
    return current_user


@router.post("/signup", response_model=UserPublic)
def register_user(auth_provider: AuthProviderDep, user_in: UserRegister) -> Any:
    """Create new user without the need to be logged in."""
    user = auth_provider.get_user_by_username(username=user_in.username)
    if user is not None:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    user_create = UserCreate.model_validate(user_in)
    return auth_provider.create_user(user_create=user_create)


@router.get("/{user_id}", response_model=UserPublic)
def read_user_by_id(
    user_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """Get a specific user by id."""
    user = session.get(User, user_id)
    if user == current_user:
        return user
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="The user doesn't have enough privileges",
        )
    return user


@router.delete("/{user_id}", dependencies=[Depends(get_current_active_superuser)])
def delete_user(
    session: SessionDep,
    current_user: CurrentUser,
    user_id: uuid.UUID,
) -> Message:
    """Delete a user."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user == current_user:
        raise HTTPException(
            status_code=403,
            detail="Super users are not allowed to delete themselves",
        )
    # statement = delete(Item).where(col(Item.owner_id) == user_id)
    # session.exec(statement)
    session.delete(user)
    session.commit()
    return Message(message="User deleted successfully")
