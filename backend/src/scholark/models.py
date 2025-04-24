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
