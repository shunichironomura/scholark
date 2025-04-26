import uuid
from datetime import UTC, date, datetime

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


class TagPublic(TagBase):
    id: uuid.UUID
    user_id: uuid.UUID


class TagsPublic(SQLModel):
    data: list[TagPublic]
    count: int


class ConferenceBase(SQLModel):
    name: str
    start_date: date | None = Field(default=None)
    end_date: date | None = Field(default=None)
    location: str | None = Field(default=None)
    website_url: str | None = Field(default=None)
    abstract_deadline: datetime | None = Field(default=None)
    paper_deadline: datetime | None = Field(default=None)


class ConferenceCreate(ConferenceBase):
    pass


class ConferenceUpdate(ConferenceBase):
    pass


class Conference(ConferenceBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    created_by_user_id: uuid.UUID = Field(foreign_key="user.id")

    tags: list[Tag] = Relationship(back_populates="conferences", link_model=TagConferenceLink)


class ConferencePublic(ConferenceBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    tags: list[TagPublic] | None = Field(default=None)


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
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
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
