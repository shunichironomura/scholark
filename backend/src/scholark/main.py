from fastapi import FastAPI
from fastapi.routing import APIRoute

from scholark.api.main import api_router
from scholark.core.config import settings


def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"


app = FastAPI(generate_unique_id_function=custom_generate_unique_id)


app.include_router(api_router, prefix=settings.API_V1_STR)
