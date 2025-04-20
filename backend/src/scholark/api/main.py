from fastapi import APIRouter

from scholark.api.routes import conferences

api_router = APIRouter()
api_router.include_router(conferences.router)
