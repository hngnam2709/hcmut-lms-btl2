from __future__ import annotations

from backend.repositories.catalog_repository import CatalogRepository


class CatalogService:
    STATUSES = ("ACTIVE", "DROPPED", "COMPLETED")

    def __init__(self, repository: CatalogRepository) -> None:
        self.repository = repository

    def semesters(self) -> list[dict]:
        return self.repository.semesters()

    def students(self, active_only: bool = True) -> list[dict]:
        return self.repository.students(active_only)

    def sections(self, semester_id: int | None = None, status: str | None = None) -> list[dict]:
        return self.repository.sections(semester_id, status)

    def courses(self) -> list[dict]:
        return self.repository.courses()
