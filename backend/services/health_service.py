from __future__ import annotations

import logging

from backend.db import Database
from backend.errors import AppError

logger = logging.getLogger(__name__)


class HealthService:
    def __init__(self, db: Database) -> None:
        self.db = db

    def check(self) -> dict:
        try:
            info = self.db.ping()
        except Exception as exc:  # noqa: BLE001 - converted to a 503 response
            logger.exception("Database health check failed")
            raise AppError(
                "Database khong san sang.",
                503,
                "database_unavailable",
                {"reason": type(exc).__name__},
            ) from exc
        return {"status": "ok", "database": info}
