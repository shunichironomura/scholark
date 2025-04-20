from collections.abc import Generator
from typing import Annotated

from fastapi import Depends
from sqlmodel import Session

from scholark.core.db import engine


def get_db() -> Generator[Session]:
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_db)]
