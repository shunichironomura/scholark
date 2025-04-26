from fastapi import APIRouter

from scholark.api.routes import conferences, health, login, tags, users

api_router = APIRouter()
api_router.include_router(conferences.router)
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(tags.router)
api_router.include_router(health.router)
