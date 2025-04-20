import uuid
from datetime import date, datetime

from pydantic_core import Url
from sqlmodel import Field, SQLModel


class ConferenceBase(SQLModel):
    name: str
    start_date: date | None = Field(default=None)
    end_date: date | None = Field(default=None)
    location: str | None = Field(default=None)
    website_url: Url | None = Field(default=None)
    abstract_deadline: datetime | None = Field(default=None)
    paper_deadline: datetime | None = Field(default=None)


class ConferenceCreate(ConferenceBase):
    pass


class ConferenceUpdate(ConferenceBase):
    pass


class Conference(ConferenceBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)


class ConferencePublic(ConferenceBase):
    id: uuid.UUID


class ConferencesPublic(SQLModel):
    data: list[ConferencePublic]
    count: int
