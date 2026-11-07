from __future__ import annotations

from backend.db import Database


class CatalogRepository:
    def __init__(self, db: Database) -> None:
        self.db = db

    def semesters(self) -> list[dict]:
        return self.db.fetch_all(
            """
            SELECT `SemesterID`, `AcademicYear`, `TermNo`, `StartDate`, `EndDate`
            FROM `Semester`
            ORDER BY `AcademicYear` DESC, `TermNo` DESC
            """
        )

    def students(self, active_only: bool = True) -> list[dict]:
        where = "WHERE u.`AccountStatus` = 'ACTIVE'" if active_only else ""
        return self.db.fetch_all(
            f"""
            SELECT s.`UserID` AS StudentID, s.`StudentCode`,
                   u.`FullName`, u.`Email`, u.`AccountStatus`,
                   f.`FacultyID`, f.`FacultyName`
            FROM `Student` s
            JOIN `UserAccount` u ON u.`UserID` = s.`UserID`
            JOIN `Faculty` f ON f.`FacultyID` = s.`FacultyID`
            {where}
            ORDER BY s.`StudentCode`
            """
        )

    def sections(
        self,
        semester_id: int | None = None,
        status: str | None = None,
    ) -> list[dict]:
        clauses: list[str] = []
        params: list[object] = []
        if semester_id is not None:
            clauses.append("cs.`SemesterID` = %s")
            params.append(semester_id)
        if status is not None:
            clauses.append("cs.`SectionStatus` = %s")
            params.append(status)
        where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
        return self.db.fetch_all(
            f"""
            SELECT cs.`SectionID`, cs.`SectionCode`, cs.`SemesterID`,
                   sem.`AcademicYear`, sem.`TermNo`, c.`CourseID`,
                   c.`CourseCode`, c.`CourseName`, cc.`ComponentType`,
                   cs.`PrimaryInstructorID`, u.`FullName` AS InstructorName,
                   cs.`Capacity`, cs.`SectionStatus`, cs.`DayOfWeek`,
                   cs.`StartTime`, cs.`EndTime`, cs.`RoomCode`,
                   (SELECT COUNT(*) FROM `Enrollment` e
                     WHERE e.`SectionID` = cs.`SectionID`
                       AND e.`EnrollmentStatus` = 'ACTIVE') AS ActiveEnrollmentCount
            FROM `CourseSection` cs
            JOIN `CourseComponent` cc ON cc.`ComponentID` = cs.`ComponentID`
            JOIN `Course` c ON c.`CourseID` = cc.`CourseID`
            JOIN `Semester` sem ON sem.`SemesterID` = cs.`SemesterID`
            LEFT JOIN `Staff` st ON st.`UserID` = cs.`PrimaryInstructorID`
            LEFT JOIN `UserAccount` u ON u.`UserID` = st.`UserID`
            {where}
            ORDER BY sem.`AcademicYear` DESC, sem.`TermNo` DESC,
                     c.`CourseCode`, cs.`SectionCode`
            """,
            params,
        )

    def courses(self) -> list[dict]:
        return self.db.fetch_all(
            """
            SELECT c.`CourseID`, c.`CourseCode`, c.`CourseName`, c.`Credits`,
                   c.`FacultyID`, f.`FacultyName`
            FROM `Course` c
            JOIN `Faculty` f ON f.`FacultyID` = c.`FacultyID`
            ORDER BY c.`CourseCode`
            """
        )
