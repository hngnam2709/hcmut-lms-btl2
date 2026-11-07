from __future__ import annotations

from backend.errors import NotFoundError
from backend.repositories.enrollment_repository import EnrollmentRepository


class EnrollmentService:
    def __init__(self, repository: EnrollmentRepository) -> None:
        self.repository = repository

    def list(
        self,
        student_id: int | None = None,
        semester_id: int | None = None,
        status: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict]:
        return self.repository.list(student_id, semester_id, status, limit, offset)

    def get(self, enrollment_id: int) -> dict:
        row = self.repository.get_by_id(enrollment_id)
        if row is None:
            raise NotFoundError("Khong tim thay ghi danh.")
        return row

    def create(self, student_id: int, section_id: int, status: str) -> dict:
        return self.repository.create(student_id, section_id, status)

    def update(self, enrollment_id: int, section_id: int | None, status: str | None) -> dict:
        return self.repository.update(enrollment_id, section_id, status)

    def delete(self, enrollment_id: int) -> dict:
        return self.repository.delete(enrollment_id)
