import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.routing import APIRoute
from sqlmodel import Session, select

from scholark.api.main import api_router
from scholark.core.config import settings
from scholark.core.db import engine, init_db

logger = logging.getLogger(__name__)


def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:  # noqa: ARG001
    with Session(engine) as session:
        # Test database connection
        try:
            session.exec(select(1))
            logger.info("Database connection established successfully.")
        except Exception:
            logger.exception("Failed to connect to database.")
            raise

        # Initialize database with default data
        try:
            init_db(session)
            logger.info("Database initialization completed successfully.")
        except Exception:
            logger.exception("Database initialization failed")
            logger.exception("This might happen if migrations haven't been run yet.")
            logger.exception("In production, ensure migrations are run before starting the application.")
            logger.exception("For development, auto-migration can be enabled with SCHOLARK_DB_AUTO_MIGRATE=true")
            raise
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    generate_unique_id_function=custom_generate_unique_id,
    lifespan=lifespan,
)


app.include_router(api_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, port=8000)
