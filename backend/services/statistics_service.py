from __future__ import annotations

from backend.repositories.statistics_repository import StatisticsRepository


class StatisticsService:
    def __init__(self, repository: StatisticsRepository) -> None:
        self.repository = repository

    def assignment_statistics(
        self,
        section_id: int | None = None,
        semester_id: int | None = None,
        min_submissions: int | None = None,
    ) -> list[dict]:
        return self.repository.assignment_statistics(
            section_id, semester_id, min_submissions
        )

    def assignment_completion(self, assignment_id: int) -> dict:
        row = self.repository.assignment_completion_rate(assignment_id)
        return {
            "assignment_id": assignment_id,
            "completion_rate": (row or {}).get("completion_rate", 0.0),
        }

    def student_average(self, enrollment_id: int) -> dict:
        row = self.repository.student_average_score(enrollment_id)
        return {
            "enrollment_id": enrollment_id,
            "average_score": (row or {}).get("average_score", 0.0),
        }

    def overview(self) -> dict:
        return self.repository.overview()
