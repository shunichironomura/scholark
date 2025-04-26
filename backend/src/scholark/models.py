import uuid
from datetime import UTC, datetime
from datetime import date as date_
from datetime import time as time_

import sqlalchemy as sa
from pydantic import computed_field
from sqlmodel import Field, Relationship, SQLModel


class TagConferenceLink(SQLModel, table=True):
    tag_id: uuid.UUID = Field(foreign_key="tag.id", primary_key=True)
    conference_id: uuid.UUID = Field(foreign_key="conference.id", primary_key=True)


class TagBase(SQLModel):
    name: str
    color: str


class TagCreate(TagBase):
    pass


class TagUpdate(SQLModel):
    name: str | None = Field(default=None)
    color: str | None = Field(default=None)


class Tag(TagBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id")

    user: "User" = Relationship(back_populates="tags")
    conferences: list["Conference"] = Relationship(back_populates="tags", link_model=TagConferenceLink)


def default_tags(user_id: uuid.UUID) -> list[Tag]:
    return [
        Tag(name="Interested", color="#FF5733", user_id=user_id),
        Tag(name="Abstract submitted", color="#33FF57", user_id=user_id),
        Tag(name="Accepted", color="#3357FF", user_id=user_id),
        Tag(name="Registered", color="#FF33A1", user_id=user_id),
        Tag(name="Attended", color="#FF33FF", user_id=user_id),
    ]


class TagPublic(TagBase):
    id: uuid.UUID
    user_id: uuid.UUID


class TagsPublic(SQLModel):
    data: list[TagPublic]
    count: int


class ConferenceMilestoneBase(SQLModel):
    name: str
    date: date_
    time: time_ | None = Field(default=None, sa_type=sa.Time(timezone=True))  # type: ignore[call-overload]

    @computed_field
    def as_datetime(self) -> datetime:
        """Convert date and time to datetime.

        If time is not provided, it defaults to midnight (00:00).
        """
        if self.time:
            return datetime.combine(self.date, self.time)
        return datetime.combine(self.date, time_(0, 0))


class ConferenceMilestoneCreate(ConferenceMilestoneBase):
    pass


class ConferenceMilestone(ConferenceMilestoneBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    conference_id: uuid.UUID = Field(foreign_key="conference.id")

    conference: "Conference" = Relationship(back_populates="milestones")


class ConferenceMilestonePublic(ConferenceMilestoneBase):
    id: uuid.UUID
    conference_id: uuid.UUID


class ConferenceBase(SQLModel):
    name: str
    start_date: date_ | None = Field(default=None)
    end_date: date_ | None = Field(default=None)
    location: str | None = Field(default=None)
    website_url: str | None = Field(default=None)


class ConferenceCreate(ConferenceBase):
    milestones: list[ConferenceMilestoneCreate] | None = Field(default=None)


class ConferenceUpdate(ConferenceBase):
    milestones: list[ConferenceMilestoneCreate] | None = Field(default=None)


class Conference(ConferenceBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC), sa_type=sa.DateTime(timezone=True))  # type: ignore[call-overload]
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC), sa_type=sa.DateTime(timezone=True))  # type: ignore[call-overload]
    created_by_user_id: uuid.UUID = Field(foreign_key="user.id")

    tags: list[Tag] = Relationship(back_populates="conferences", link_model=TagConferenceLink)
    milestones: list[ConferenceMilestone] = Relationship(back_populates="conference")


class ConferencePublic(ConferenceBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    created_by_user_id: uuid.UUID

    tags: list[TagPublic] = Field(default=None)
    milestones: list[ConferenceMilestonePublic]


class ConferencesPublic(SQLModel):
    data: list[ConferencePublic]
    count: int


class UserBase(SQLModel):
    username: str = Field(unique=True, index=True, max_length=255)
    is_superuser: bool = Field(default=False)


class UserCreate(UserBase):
    password: str | None = Field(default=None)


class UserUpdate(UserBase):
    # TODO: add password update
    pass


class UserRegister(SQLModel):
    username: str
    password: str = Field(min_length=8, max_length=40)


class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC), sa_type=sa.DateTime(timezone=True))  # type: ignore[call-overload]
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC), sa_type=sa.DateTime(timezone=True))  # type: ignore[call-overload]
    disabled: bool = Field(default=False)
    role: str = Field(default="member")

    tags: list[Tag] = Relationship(back_populates="user")


class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


class DbAuthCredential(SQLModel, table=True):
    user_id: uuid.UUID = Field(foreign_key="user.id", primary_key=True)
    hashed_password: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"  # noqa: S105


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


# Generic message
class Message(SQLModel):
    message: str


class LoginResponse(SQLModel):
    user_id: uuid.UUID
