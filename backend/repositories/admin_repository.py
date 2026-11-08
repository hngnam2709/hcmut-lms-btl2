from __future__ import annotations

from backend.db import Database

# Read-only whitelist for the admin data explorer. Only these tables may be read.
EXPLORER_TABLES = {
    "UserAccount", "Faculty", "Student", "Staff", "Admin", "Semester",
    "Course", "CourseComponent", "CourseSection", "Enrollment",
    "Announcement", "LearningResource", "Section_Resource", "Assessment",
    "Assignment", "AssignmentAttachment", "Submission", "SubmissionFile",
    "Quiz", "QuizAttempt", "Grade", "Feedback",
}


class AdminRepository:
    def __init__(self, db: Database) -> None:
        self.db = db

    # ---- Users ----
    def users(self) -> list[dict]:
        return self.db.fetch_all(
            """
            SELECT u.`UserID`, u.`Email`, u.`FullName`, u.`AvatarURL`,
                   u.`AccountStatus`, u.`LastAccessAt`,
                   CASE
                     WHEN st.`UserID` IS NOT NULL THEN 'STUDENT'
                     WHEN sf.`UserID` IS NOT NULL THEN 'STAFF'
                     WHEN ad.`UserID` IS NOT NULL THEN 'ADMIN'
                   END AS Role,
                   st.`StudentCode`, st.`FacultyID` AS StudentFacultyID,
                   sf.`FacultyID` AS StaffFacultyID
            FROM `UserAccount` u
            LEFT JOIN `Student` st ON st.`UserID` = u.`UserID`
            LEFT JOIN `Staff` sf ON sf.`UserID` = u.`UserID`
            LEFT JOIN `Admin` ad ON ad.`UserID` = u.`UserID`
            ORDER BY u.`UserID`
            """
        )

    def create_user(self, email: str, full_name: str, role: str, extra: dict) -> int:
        user_id = self.db.insert(
            """
            INSERT INTO `UserAccount` (`Email`, `FullName`, `AvatarURL`, `AccountStatus`, `LastAccessAt`)
            VALUES (%s, %s, %s, 'ACTIVE', NOW())
            """,
            (email, full_name, extra.get("avatar_url") or ""),
        )
        if role == "STUDENT":
            self.db.execute(
                "INSERT INTO `Student` (`UserID`, `StudentCode`, `FacultyID`) VALUES (%s, %s, %s)",
                (user_id, extra["student_code"], extra["faculty_id"]),
            )
        elif role == "STAFF":
            self.db.execute(
                "INSERT INTO `Staff` (`UserID`, `FacultyID`) VALUES (%s, %s)",
                (user_id, extra["faculty_id"]),
            )
        elif role == "ADMIN":
            self.db.execute("INSERT INTO `Admin` (`UserID`) VALUES (%s)", (user_id,))
        return user_id

    def set_status(self, user_id: int, status: str) -> None:
        self.db.execute("UPDATE `UserAccount` SET `AccountStatus` = %s WHERE `UserID` = %s", (status, user_id))

    # ---- Faculty ----
    def faculties(self) -> list[dict]:
        return self.db.fetch_all("SELECT * FROM `Faculty` ORDER BY `FacultyID`")

    def create_faculty(self, name: str, name_en: str | None) -> int:
        return self.db.insert("INSERT INTO `Faculty` (`FacultyName`, `FacultyNameEN`) VALUES (%s, %s)", (name, name_en))

    def update_faculty(self, faculty_id: int, name: str, name_en: str | None) -> None:
        self.db.execute("UPDATE `Faculty` SET `FacultyName` = %s, `FacultyNameEN` = %s WHERE `FacultyID` = %s", (name, name_en, faculty_id))

    def delete_faculty(self, faculty_id: int) -> None:
        self.db.execute("DELETE FROM `Faculty` WHERE `FacultyID` = %s", (faculty_id,))

    # ---- Semester ----
    def semesters(self) -> list[dict]:
        return self.db.fetch_all("SELECT * FROM `Semester` ORDER BY `AcademicYear` DESC, `TermNo` DESC")

    def create_semester(self, year: str, term: int, start: str, end: str) -> int:
        return self.db.insert("INSERT INTO `Semester` (`AcademicYear`, `TermNo`, `StartDate`, `EndDate`) VALUES (%s, %s, %s, %s)", (year, term, start, end))

    def update_semester(self, semester_id: int, year: str, term: int, start: str, end: str) -> None:
        self.db.execute("UPDATE `Semester` SET `AcademicYear` = %s, `TermNo` = %s, `StartDate` = %s, `EndDate` = %s WHERE `SemesterID` = %s", (year, term, start, end, semester_id))

    def delete_semester(self, semester_id: int) -> None:
        self.db.execute("DELETE FROM `Semester` WHERE `SemesterID` = %s", (semester_id,))

    # ---- Course ----
    def courses(self) -> list[dict]:
        return self.db.fetch_all(
            """
            SELECT c.*, f.`FacultyName`
            FROM `Course` c LEFT JOIN `Faculty` f ON f.`FacultyID` = c.`FacultyID`
            ORDER BY c.`CourseID`
            """
        )

    def create_course(self, code: str, name: str, credits: int, faculty_id: int, admin_id: int) -> int:
        return self.db.insert(
            "INSERT INTO `Course` (`CourseCode`, `CourseName`, `Credits`, `FacultyID`, `CreatedByAdminID`) VALUES (%s, %s, %s, %s, %s)",
            (code, name, credits, faculty_id, admin_id),
        )

    def update_course(self, course_id: int, code: str, name: str, credits: int, faculty_id: int) -> None:
        self.db.execute("UPDATE `Course` SET `CourseCode` = %s, `CourseName` = %s, `Credits` = %s, `FacultyID` = %s WHERE `CourseID` = %s", (code, name, credits, faculty_id, course_id))

    def delete_course(self, course_id: int) -> None:
        self.db.execute("DELETE FROM `Course` WHERE `CourseID` = %s", (course_id,))

    # ---- CourseComponent ----
    def components(self) -> list[dict]:
        return self.db.fetch_all(
            """
            SELECT cc.*, c.`CourseCode`, c.`CourseName`
            FROM `CourseComponent` cc JOIN `Course` c ON c.`CourseID` = cc.`CourseID`
            ORDER BY cc.`ComponentID`
            """
        )

    def create_component(self, course_id: int, ctype: str, name: str) -> int:
        return self.db.insert("INSERT INTO `CourseComponent` (`CourseID`, `ComponentType`, `ComponentName`) VALUES (%s, %s, %s)", (course_id, ctype, name))

    def update_component(self, component_id: int, ctype: str, name: str) -> None:
        self.db.execute("UPDATE `CourseComponent` SET `ComponentType` = %s, `ComponentName` = %s WHERE `ComponentID` = %s", (ctype, name, component_id))

    def delete_component(self, component_id: int) -> None:
        self.db.execute("DELETE FROM `CourseComponent` WHERE `ComponentID` = %s", (component_id,))

    # ---- CourseSection ----
    def sections(self) -> list[dict]:
        return self.db.fetch_all(
            """
            SELECT cs.*, c.`CourseCode`, c.`CourseName`, cc.`ComponentType`,
                   sem.`AcademicYear`, sem.`TermNo`, u.`FullName` AS InstructorName
            FROM `CourseSection` cs
            JOIN `CourseComponent` cc ON cc.`ComponentID` = cs.`ComponentID`
            JOIN `Course` c ON c.`CourseID` = cc.`CourseID`
            JOIN `Semester` sem ON sem.`SemesterID` = cs.`SemesterID`
            LEFT JOIN `UserAccount` u ON u.`UserID` = cs.`PrimaryInstructorID`
            ORDER BY cs.`SectionID`
            """
        )

    def create_section(self, payload: dict) -> int:
        return self.db.insert(
            """
            INSERT INTO `CourseSection`
              (`ComponentID`, `SemesterID`, `PrimaryInstructorID`, `SectionCode`,
               `Capacity`, `SectionStatus`, `DayOfWeek`, `StartTime`, `EndTime`, `RoomCode`)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                payload["component_id"], payload["semester_id"], payload.get("instructor_id"),
                payload["section_code"], payload["capacity"], payload.get("status", "OPEN"),
                payload["day_of_week"], payload["start_time"], payload["end_time"], payload["room_code"],
            ),
        )

    def update_section(self, section_id: int, payload: dict) -> None:
        self.db.execute(
            """
            UPDATE `CourseSection`
            SET `ComponentID` = %s, `SemesterID` = %s, `PrimaryInstructorID` = %s,
                `SectionCode` = %s, `Capacity` = %s, `SectionStatus` = %s,
                `DayOfWeek` = %s, `StartTime` = %s, `EndTime` = %s, `RoomCode` = %s
            WHERE `SectionID` = %s
            """,
            (
                payload["component_id"], payload["semester_id"], payload.get("instructor_id"),
                payload["section_code"], payload["capacity"], payload.get("status", "OPEN"),
                payload["day_of_week"], payload["start_time"], payload["end_time"], payload["room_code"],
                section_id,
            ),
        )

    def delete_section(self, section_id: int) -> None:
        self.db.execute("DELETE FROM `CourseSection` WHERE `SectionID` = %s", (section_id,))

    # ---- Data explorer ----
    def explore(self, table: str, limit: int) -> list[dict]:
        return self.db.fetch_all(f"SELECT * FROM `{table}` ORDER BY 1 LIMIT %s", (limit,))
