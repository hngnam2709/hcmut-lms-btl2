from __future__ import annotations

from backend.db import Database


class StatisticsRepository:
    def __init__(self, db: Database) -> None:
        self.db = db

    def assignment_statistics(
        self,
        section_id: int | None,
        semester_id: int | None,
        min_submissions: int | None,
    ) -> list[dict]:
        return self.db.call_procedure(
            "sp_GetAssignmentStatistics",
            (section_id, semester_id, min_submissions),
        )

    def assignment_completion_rate(self, assignment_id: int) -> dict | None:
        return self.db.fetch_one(
            "SELECT fn_CalculateAssignmentCompletionRate(%s) AS completion_rate",
            (assignment_id,),
        )

    def student_average_score(self, enrollment_id: int) -> dict | None:
        return self.db.fetch_one(
            "SELECT fn_CalculateStudentAverageScore(%s) AS average_score",
            (enrollment_id,),
        )

    def overview(self) -> dict:
        row = self.db.fetch_one(
            """
            SELECT
              (SELECT COUNT(*) FROM `Student`) AS student_count,
              (SELECT COUNT(*) FROM `CourseSection`) AS section_count,
              (SELECT COUNT(*) FROM `Enrollment`) AS enrollment_count,
              (SELECT COUNT(*) FROM `Enrollment`
                WHERE `EnrollmentStatus` = 'ACTIVE') AS active_enrollment_count,
              (SELECT COUNT(*) FROM `Assignment`) AS assignment_count,
              (SELECT COUNT(*) FROM `Submission`) AS submission_count,
              (SELECT COUNT(*) FROM `Grade`
                WHERE `IsPublished` = TRUE) AS published_grade_count
            """
        )
        return row or {}
