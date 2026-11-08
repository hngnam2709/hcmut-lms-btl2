from __future__ import annotations

from backend.errors import AppError, NotFoundError
from backend.repositories.staff_repository import StaffRepository


class StaffService:
    def __init__(self, repository: StaffRepository) -> None:
        self.repository = repository

    def _require_owned(self, staff_id: int, section_id: int) -> None:
        if not self.repository.owns_section(staff_id, section_id):
            raise AppError("Ban khong phu trach lop hoc phan nay.", 403, "forbidden")

    def sections(self, staff_id: int) -> list[dict]:
        return self.repository.sections(staff_id)

    def students(self, staff_id: int, section_id: int) -> list[dict]:
        self._require_owned(staff_id, section_id)
        return self.repository.students(section_id)

    def announcements(self, staff_id: int, section_id: int) -> list[dict]:
        self._require_owned(staff_id, section_id)
        return self.repository.announcements(section_id)

    def create_announcement(self, staff_id: int, section_id: int, title: str, content: str, expired_at: str | None) -> dict:
        self._require_owned(staff_id, section_id)
        announcement_id = self.repository.create_announcement(section_id, staff_id, title, content, expired_at)
        return {"announcement_id": announcement_id}

    def delete_announcement(self, staff_id: int, announcement_id: int) -> None:
        row = self.repository.db.fetch_one(
            "SELECT `SectionID` FROM `Announcement` WHERE `AnnouncementID` = %s", (announcement_id,)
        )
        if row is None:
            raise NotFoundError("Khong tim thay thong bao.")
        self._require_owned(staff_id, row["SectionID"])
        self.repository.delete_announcement(announcement_id)

    def resources(self, staff_id: int, section_id: int) -> list[dict]:
        self._require_owned(staff_id, section_id)
        return self.repository.resources(section_id)

    def create_resource(self, staff_id: int, section_id: int, title: str, description: str, rtype: str, url: str, display_order: int) -> dict:
        self._require_owned(staff_id, section_id)
        resource_id = self.repository.create_resource(staff_id, title, description, rtype, url)
        self.repository.post_resource(section_id, resource_id, display_order)
        return {"resource_id": resource_id}

    def unpost_resource(self, staff_id: int, section_id: int, resource_id: int) -> None:
        self._require_owned(staff_id, section_id)
        self.repository.unpost_resource(section_id, resource_id)

    def assessments(self, staff_id: int, section_id: int) -> list[dict]:
        self._require_owned(staff_id, section_id)
        return self.repository.assessments(section_id)

    def create_assignment(self, staff_id: int, section_id: int, payload: dict) -> dict:
        self._require_owned(staff_id, section_id)
        assessment_id = self.repository.create_assignment(
            section_id, staff_id,
            payload["title"], payload["description"], payload["max_score"], payload.get("max_attempts"),
            payload["open_date"], payload["due_date"], payload.get("allow_late", False),
            payload.get("attachments", []),
        )
        return {"assessment_id": assessment_id}

    def create_quiz(self, staff_id: int, section_id: int, payload: dict) -> dict:
        self._require_owned(staff_id, section_id)
        assessment_id = self.repository.create_quiz(
            section_id, staff_id,
            payload["title"], payload["description"], payload["max_score"], payload.get("max_attempts"),
            payload["open_time"], payload["close_time"], payload["duration"],
        )
        return {"assessment_id": assessment_id}

    def delete_assessment(self, staff_id: int, assessment_id: int) -> None:
        row = self.repository.db.fetch_one(
            "SELECT `SectionID` FROM `Assessment` WHERE `AssessmentID` = %s", (assessment_id,)
        )
        if row is None:
            raise NotFoundError("Khong tim thay assessment.")
        self._require_owned(staff_id, row["SectionID"])
        self.repository.delete_assessment(assessment_id)

    def submissions(self, staff_id: int, section_id: int) -> list[dict]:
        self._require_owned(staff_id, section_id)
        return self.repository.submissions(section_id)

    def grade_submission(self, staff_id: int, submission_id: int, score: float) -> dict:
        section_id = self.repository.submission_section(submission_id)
        if section_id is None:
            raise NotFoundError("Khong tim thay bai nop.")
        self._require_owned(staff_id, section_id)
        self.repository.grade_submission(submission_id, staff_id, score)
        return {"submission_id": submission_id, "score": score}

    def grades(self, staff_id: int, section_id: int) -> list[dict]:
        self._require_owned(staff_id, section_id)
        return self.repository.grades(section_id)

    def upsert_grade(self, staff_id: int, section_id: int, enrollment_id: int, assessment_id: int, score: float, published: bool) -> dict:
        self._require_owned(staff_id, section_id)
        self.repository.upsert_grade(enrollment_id, assessment_id, staff_id, score, published)
        return {"enrollment_id": enrollment_id, "assessment_id": assessment_id}

    def quiz_attempts(self, staff_id: int, section_id: int) -> list[dict]:
        self._require_owned(staff_id, section_id)
        return self.repository.quiz_attempts(section_id)

    def set_quiz_attempt_score(self, staff_id: int, section_id: int, attempt_id: int, score: float) -> dict:
        self._require_owned(staff_id, section_id)
        self.repository.set_quiz_attempt_score(attempt_id, staff_id, score)
        return {"attempt_id": attempt_id, "score": score}

    def feedback(self, staff_id: int, submission_id: int, content: str, parent_id: int | None) -> dict:
        section_id = self.repository.submission_section(submission_id)
        if section_id is None:
            raise NotFoundError("Khong tim thay bai nop.")
        self._require_owned(staff_id, section_id)
        feedback_id = self.repository.add_feedback(submission_id, staff_id, content, parent_id)
        return {"feedback_id": feedback_id}

    def feedback_thread(self, staff_id: int, submission_id: int) -> list[dict]:
        section_id = self.repository.submission_section(submission_id)
        if section_id is None:
            raise NotFoundError("Khong tim thay bai nop.")
        self._require_owned(staff_id, section_id)
        return self.repository.feedback_thread(submission_id)
