from fastapi import APIRouter

from scholark.models import Message

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/")
def health_check() -> Message:
    """Health check endpoint."""
    return Message(message="OK")
