from __future__ import annotations

from backend.db import Database


class EnrollmentRepository:
    def __init__(self, db: Database) -> None:
        self.db = db

    def list(
        self,
        student_id: int | None = None,
        semester_id: int | None = None,
        status: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict]:
        return self.db.call_procedure(
            "sp_GetStudentEnrollments",
            (student_id, semester_id, status, limit, offset),
        )

    def get_by_id(self, enrollment_id: int) -> dict | None:
        return self.db.fetch_one(
            """
            SELECT
              e.`EnrollmentID`, e.`StudentID`, s.`StudentCode`,
              u.`FullName` AS StudentName, u.`Email` AS StudentEmail,
              e.`SectionID`, cs.`SectionCode`, cs.`SemesterID`,
              sem.`AcademicYear`, sem.`TermNo`,
              c.`CourseCode`, c.`CourseName`, cc.`ComponentType`,
              cs.`DayOfWeek`, cs.`StartTime`, cs.`EndTime`, cs.`RoomCode`,
              e.`EnrollmentDate`, e.`EnrollmentStatus`
            FROM `Enrollment` e
            JOIN `Student` s ON s.`UserID` = e.`StudentID`
            JOIN `UserAccount` u ON u.`UserID` = s.`UserID`
            JOIN `CourseSection` cs ON cs.`SectionID` = e.`SectionID`
            JOIN `CourseComponent` cc ON cc.`ComponentID` = cs.`ComponentID`
            JOIN `Course` c ON c.`CourseID` = cc.`CourseID`
            JOIN `Semester` sem ON sem.`SemesterID` = cs.`SemesterID`
            WHERE e.`EnrollmentID` = %s
            """,
            (enrollment_id,),
        )

    def create(self, student_id: int, section_id: int, status: str) -> dict:
        return self.db.call_procedure_one(
            "sp_InsertEnrollment", (student_id, section_id, status)
        ) or {}

    def update(self, enrollment_id: int, section_id: int | None, status: str | None) -> dict:
        return self.db.call_procedure_one(
            "sp_UpdateEnrollment", (enrollment_id, section_id, status)
        ) or {}

    def delete(self, enrollment_id: int) -> dict:
        return self.db.call_procedure_one("sp_DeleteEnrollment", (enrollment_id,)) or {}
