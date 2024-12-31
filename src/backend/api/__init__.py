# src/backend/api/__init__.py
from .proposals import router as proposals_router
from .solutions import router as solutions_router

__all__ = ["proposals_router", "solutions_router"]
