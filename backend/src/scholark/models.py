import uuid
from datetime import UTC, date, datetime

from sqlmodel import Field, SQLModel


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


class ConferencePublic(ConferenceBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class ConferencesPublic(SQLModel):
    data: list[ConferencePublic]
    count: int


class UserBase(SQLModel):
    username: str


class UserCreate(UserBase):
    password: str | None = Field(default=None)


class UserUpdate(UserBase):
    # TODO: add password update
    pass


class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    role: str = Field(default="member")


class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


class Credential(SQLModel, table=True):
    user_id: uuid.UUID = Field(foreign_key="user.id", primary_key=True)
    provider: str = Field(primary_key=True)  # "db", "auth0", "ldap"
    identifier: str  # unique identifier for the user in the provider
    hashed_password: str | None = Field(default=None)
