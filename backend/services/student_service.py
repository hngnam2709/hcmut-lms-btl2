from __future__ import annotations

from backend.errors import AppError, NotFoundError
from backend.repositories.student_repository import StudentRepository


class StudentService:
    def __init__(self, repository: StudentRepository) -> None:
        self.repository = repository

    def profile(self, student_id: int) -> dict:
        row = self.repository.profile(student_id)
        if row is None:
            raise NotFoundError("Khong tim thay ho so sinh vien.")
        return row

    def sections(self, student_id: int) -> list[dict]:
        return self.repository.sections(student_id)

    def catalog(self, student_id: int) -> list[dict]:
        return self.repository.catalog_sections(student_id)

    def enroll(self, student_id: int, section_id: int) -> dict:
        return self.repository.enroll(student_id, section_id)

    def drop_enrollment(self, student_id: int, enrollment_id: int) -> dict:
        row = self.repository.enrollment_detail(enrollment_id, student_id)
        if row is None:
            raise AppError("Khong tim thay ghi danh cua ban.", 404, "not_found")
        return self.repository.drop_enrollment(enrollment_id, row["SectionID"])

    def section(self, student_id: int, section_id: int) -> dict:
        row = self.repository.section_accessible(student_id, section_id)
        if row is None:
            raise NotFoundError("Khong tim thay lop hoc hoac ban chua ghi danh.")
        return row

    def announcements(self, student_id: int, section_id: int) -> list[dict]:
        self.section(student_id, section_id)
        return self.repository.announcements(section_id)

    def resources(self, student_id: int, section_id: int) -> list[dict]:
        self.section(student_id, section_id)
        return self.repository.resources(section_id)

    def assessments(self, student_id: int, section_id: int) -> list[dict]:
        self.section(student_id, section_id)
        return self.repository.assessments(section_id, student_id)

    def assignment(self, student_id: int, assessment_id: int) -> dict:
        row = self.repository.assignment_detail(assessment_id, student_id)
        if row is None:
            raise NotFoundError("Khong tim thay bai tap.")
        self.section(student_id, row["SectionID"])
        row["attachments"] = self.repository.attachments(assessment_id)
        row["submissions"] = self.repository.submissions(assessment_id, student_id)
        for submission in row["submissions"]:
            submission["files"] = self.repository.submission_files(submission["SubmissionID"])
        return row

    def quiz(self, student_id: int, assessment_id: int) -> dict:
        row = self.repository.quiz_detail(assessment_id)
        if row is None:
            raise NotFoundError("Khong tim thay quiz.")
        self.section(student_id, row["SectionID"])
        row["attempts"] = self.repository.quiz_attempts(assessment_id, student_id)
        return row

    def grades(self, student_id: int) -> list[dict]:
        return self.repository.published_grades(student_id)

    def submit(self, student_id: int, assessment_id: int, file_name: str, file_url: str, file_size: int) -> dict:
        detail = self.repository.assignment_detail(assessment_id, student_id)
        if detail is None:
            raise NotFoundError("Khong tim thay bai tap.")
        self.section(student_id, detail["SectionID"])

        attempt_no = self.repository.next_attempt_no(assessment_id, student_id)
        if attempt_no > int(detail.get("MaxAttempts") or 1):
            raise AppError("Da dat so lan nop toi da.", 409, "conflict")
        submission_id = self.repository.create_submission(
            assessment_id, student_id, attempt_no, "SUBMITTED"
        )
        if file_name:
            self.repository.add_submission_file(submission_id, 1, file_name, file_url, file_size)
        return {"submission_id": submission_id, "attempt_no": attempt_no}

    def start_quiz(self, student_id: int, assessment_id: int) -> dict:
        detail = self.repository.quiz_detail(assessment_id)
        if detail is None:
            raise NotFoundError("Khong tim thay quiz.")
        self.section(student_id, detail["SectionID"])
        attempt_no = self.repository.next_quiz_attempt_no(assessment_id, student_id)
        if attempt_no > int(detail.get("MaxAttempts") or 1):
            raise AppError("Da dat so luot lam bai toi da.", 409, "conflict")
        attempt_id = self.repository.create_quiz_attempt(assessment_id, student_id, attempt_no)
        return {"attempt_id": attempt_id, "attempt_no": attempt_no}

    def files(self, student_id: int, submission_id: int) -> list[dict]:
        if not self.repository.submission_owner(submission_id, student_id):
            raise AppError("Khong co quyen xem tep dinh kem.", 403, "forbidden")
        return self.repository.submission_files(submission_id)

    def finish_quiz(self, student_id: int, attempt_id: int, score: float) -> dict:
        affected = self.repository.finish_quiz_attempt(attempt_id, student_id, score)
        if not affected:
            raise NotFoundError("Khong tim thay luot lam bai cua ban.")
        return {"attempt_id": attempt_id, "score": score}

    def feedback(self, student_id: int, submission_id: int, content: str, parent_id: int | None) -> dict:
        if not self.repository.submission_owner(submission_id, student_id):
            raise AppError("Chi sinh vien nop bai moi duoc viet phan hoi.", 403, "forbidden")
        feedback_id = self.repository.add_feedback(submission_id, student_id, content, parent_id)
        return {"feedback_id": feedback_id}

    def feedback_thread(self, student_id: int, submission_id: int) -> list[dict]:
        if not self.repository.submission_owner(submission_id, student_id):
            raise AppError("Khong co quyen xem phan hoi.", 403, "forbidden")
        return self.repository.feedback_thread(submission_id)
