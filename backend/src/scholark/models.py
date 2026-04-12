import uuid
from datetime import UTC, datetime
from datetime import date as date_
from datetime import time as time_

import sqlalchemy as sa
from pydantic import computed_field
from sqlmodel import Field, Relationship, SQLModel


class TagConferenceLink(SQLModel, table=True):
    tag_id: uuid.UUID = Field(foreign_key="tag.id", primary_key=True, ondelete="CASCADE")
    conference_id: uuid.UUID = Field(foreign_key="conference.id", primary_key=True, ondelete="CASCADE")


class ConferenceSubscription(SQLModel, table=True):
    user_id: uuid.UUID = Field(foreign_key="user.id", primary_key=True, ondelete="CASCADE")
    conference_id: uuid.UUID = Field(foreign_key="conference.id", primary_key=True, ondelete="CASCADE")
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC), sa_type=sa.DateTime(timezone=True))  # type: ignore[call-overload] # ty: ignore[invalid-argument-type]


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
    user_id: uuid.UUID = Field(foreign_key="user.id", ondelete="CASCADE")

    user: "User" = Relationship(back_populates="tags")
    conferences: list["Conference"] = Relationship(back_populates="tags", link_model=TagConferenceLink)


def default_tags(user_id: uuid.UUID) -> list[Tag]:
    return [
        Tag(name="📅 In My Schedule", color="#FFC04D", user_id=user_id),
        Tag(name="👀 Interested", color="#F4D06F", user_id=user_id),
        Tag(name="📄 Abstract Submitted", color="#A7D8E8", user_id=user_id),
        Tag(name="✅ Accepted", color="#8FD19E", user_id=user_id),
        Tag(name="❌ Rejected", color="#E67C73", user_id=user_id),
        Tag(name="🎟️ Registered", color="#7BAAF7", user_id=user_id),
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
    time: time_ | None = Field(default=None, sa_type=sa.Time(timezone=True))  # type: ignore[call-overload] # ty: ignore[invalid-argument-type]

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
    conference_id: uuid.UUID = Field(foreign_key="conference.id", ondelete="CASCADE")

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
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC), sa_type=sa.DateTime(timezone=True))  # type: ignore[call-overload] # ty: ignore[invalid-argument-type]
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC), sa_type=sa.DateTime(timezone=True))  # type: ignore[call-overload] # ty: ignore[invalid-argument-type]
    created_by_user_id: uuid.UUID | None = Field(foreign_key="user.id", ondelete="SET NULL")

    tags: list[Tag] = Relationship(back_populates="conferences", link_model=TagConferenceLink)
    milestones: list[ConferenceMilestone] = Relationship(back_populates="conference", cascade_delete=True)
    subscribers: list["User"] = Relationship(back_populates="subscribed_conferences", link_model=ConferenceSubscription)


class ConferencePublic(ConferenceBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    created_by_user_id: uuid.UUID

    tags: list[TagPublic] = Field(default=None)
    milestones: list[ConferenceMilestonePublic]
    is_subscribed: bool = Field(default=False)


class ConferencesPublic(SQLModel):
    data: list[ConferencePublic]
    count: int


class UserBase(SQLModel):
    username: str = Field(unique=True, index=True, max_length=255)
    is_superuser: bool = Field(default=False)


class UserCreate(UserBase):
    password: str | None = Field(default=None)


class UserUpdateMe(SQLModel):
    slack_user_id: str | None = Field(default=None)


class UserRegister(SQLModel):
    username: str
    password: str = Field(min_length=8, max_length=40)


class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC), sa_type=sa.DateTime(timezone=True))  # type: ignore[call-overload] # ty: ignore[invalid-argument-type]
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC), sa_type=sa.DateTime(timezone=True))  # type: ignore[call-overload] # ty: ignore[invalid-argument-type]
    disabled: bool = Field(default=False)
    role: str = Field(default="member")
    slack_user_id: str | None = Field(default=None)

    tags: list[Tag] = Relationship(back_populates="user", cascade_delete=True)
    subscribed_conferences: list["Conference"] = Relationship(
        back_populates="subscribers",
        link_model=ConferenceSubscription,
    )


class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    slack_user_id: str | None = None


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


class DbAuthCredential(SQLModel, table=True):
    user_id: uuid.UUID = Field(foreign_key="user.id", primary_key=True, ondelete="CASCADE")
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
