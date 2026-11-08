from __future__ import annotations

from backend.db import Database


class StudentRepository:
    """Student-scoped read/write access. Every query is bound to student_id."""

    def __init__(self, db: Database) -> None:
        self.db = db

    def profile(self, student_id: int) -> dict | None:
        return self.db.fetch_one(
            """
            SELECT u.`UserID`, u.`Email`, u.`FullName`, u.`AvatarURL`,
                   u.`AccountStatus`, u.`LastAccessAt`, s.`StudentCode`,
                   s.`FacultyID`, f.`FacultyName`, f.`FacultyNameEN`
            FROM `Student` s
            JOIN `UserAccount` u ON u.`UserID` = s.`UserID`
            LEFT JOIN `Faculty` f ON f.`FacultyID` = s.`FacultyID`
            WHERE s.`UserID` = %s
            """,
            (student_id,),
        )

    def sections(self, student_id: int) -> list[dict]:
        return self.db.fetch_all(
            """
            SELECT e.`EnrollmentID`, e.`StudentID`, s.`StudentCode`,
                   u.`FullName` AS StudentName, e.`SectionID`, cs.`SectionCode`,
                   sem.`SemesterID`, sem.`AcademicYear`, sem.`TermNo`,
                   sem.`StartDate`, sem.`EndDate`, c.`CourseID`, c.`CourseCode`,
                   c.`CourseName`, c.`Credits`, cc.`ComponentID`, cc.`ComponentType`,
                   cc.`ComponentName`, cs.`PrimaryInstructorID`,
                   inst.`FullName` AS InstructorName, inst.`Email` AS InstructorEmail,
                   f.`FacultyID`, f.`FacultyName`, f.`FacultyNameEN`, cs.`Capacity`,
                   cs.`SectionStatus`, cs.`DayOfWeek`, cs.`StartTime`, cs.`EndTime`,
                   cs.`RoomCode`, e.`EnrollmentDate`, e.`EnrollmentStatus`,
                   fn_CalculateStudentAverageScore(e.`EnrollmentID`) AS AverageScore
            FROM `Enrollment` e
            JOIN `Student` s ON s.`UserID` = e.`StudentID`
            JOIN `UserAccount` u ON u.`UserID` = s.`UserID`
            JOIN `CourseSection` cs ON cs.`SectionID` = e.`SectionID`
            JOIN `CourseComponent` cc ON cc.`ComponentID` = cs.`ComponentID`
            JOIN `Course` c ON c.`CourseID` = cc.`CourseID`
            JOIN `Semester` sem ON sem.`SemesterID` = cs.`SemesterID`
            LEFT JOIN `Faculty` f ON f.`FacultyID` = c.`FacultyID`
            LEFT JOIN `UserAccount` inst ON inst.`UserID` = cs.`PrimaryInstructorID`
            WHERE e.`StudentID` = %s
            ORDER BY sem.`AcademicYear` DESC, sem.`TermNo` DESC, c.`CourseCode`
            """,
            (student_id,),
        )

    def catalog_sections(self, student_id: int) -> list[dict]:
        return self.db.fetch_all(
            """
            SELECT cs.`SectionID`, cs.`SectionCode`, cs.`Capacity`, cs.`SectionStatus`,
                   cs.`DayOfWeek`, cs.`StartTime`, cs.`EndTime`, cs.`RoomCode`,
                   cs.`ComponentID`, cs.`SemesterID`, cs.`PrimaryInstructorID`,
                   cc.`ComponentType`, cc.`ComponentName`,
                   c.`CourseID`, c.`CourseCode`, c.`CourseName`, c.`Credits`,
                   sem.`AcademicYear`, sem.`TermNo`, sem.`StartDate`, sem.`EndDate`,
                   f.`FacultyID`, f.`FacultyName`, f.`FacultyNameEN`,
                   inst.`FullName` AS InstructorName, inst.`Email` AS InstructorEmail,
                   (SELECT COUNT(*) FROM `Enrollment` WHERE `SectionID` = cs.`SectionID`
                    AND `EnrollmentStatus` = 'ACTIVE') AS ActiveEnrollmentCount,
                   e.`EnrollmentID`, e.`EnrollmentStatus`
            FROM `CourseSection` cs
            JOIN `CourseComponent` cc ON cc.`ComponentID` = cs.`ComponentID`
            JOIN `Course` c ON c.`CourseID` = cc.`CourseID`
            JOIN `Semester` sem ON sem.`SemesterID` = cs.`SemesterID`
            LEFT JOIN `Faculty` f ON f.`FacultyID` = c.`FacultyID`
            LEFT JOIN `UserAccount` inst ON inst.`UserID` = cs.`PrimaryInstructorID`
            LEFT JOIN `Enrollment` e ON e.`SectionID` = cs.`SectionID`
                 AND e.`StudentID` = %s
            ORDER BY sem.`AcademicYear` DESC, sem.`TermNo` DESC, c.`CourseCode`, cs.`SectionCode`
            """,
            (student_id,),
        )

    def enroll(self, student_id: int, section_id: int) -> dict:
        return self.db.call_procedure_one(
            "sp_InsertEnrollment", (student_id, section_id, "ACTIVE")
        ) or {}

    def drop_enrollment(self, enrollment_id: int, section_id: int | None = None) -> dict:
        return self.db.call_procedure_one(
            "sp_UpdateEnrollment", (enrollment_id, section_id, "DROPPED")
        ) or {}

    def section_accessible(self, student_id: int, section_id: int) -> dict | None:
        return self.db.fetch_one(
            """
            SELECT e.`EnrollmentID`, e.`EnrollmentStatus`, e.`SectionID`,
                   cs.`SectionCode`, c.`CourseCode`, c.`CourseName`, c.`Credits`,
                   cc.`ComponentType`, cc.`ComponentName`, sem.`AcademicYear`, sem.`TermNo`,
                   sem.`StartDate`, sem.`EndDate`, cs.`Capacity`, cs.`SectionStatus`,
                   cs.`DayOfWeek`, cs.`StartTime`, cs.`EndTime`, cs.`RoomCode`,
                   u.`FullName` AS InstructorName, u.`Email` AS InstructorEmail,
                   f.`FacultyName`, f.`FacultyNameEN`, e.`EnrollmentDate`,
                   fn_CalculateStudentAverageScore(e.`EnrollmentID`) AS AverageScore
            FROM `Enrollment` e
            JOIN `CourseSection` cs ON cs.`SectionID` = e.`SectionID`
            JOIN `CourseComponent` cc ON cc.`ComponentID` = cs.`ComponentID`
            JOIN `Course` c ON c.`CourseID` = cc.`CourseID`
            JOIN `Semester` sem ON sem.`SemesterID` = cs.`SemesterID`
            LEFT JOIN `Faculty` f ON f.`FacultyID` = c.`FacultyID`
            LEFT JOIN `UserAccount` u ON u.`UserID` = cs.`PrimaryInstructorID`
            WHERE e.`StudentID` = %s AND e.`SectionID` = %s
            """,
            (student_id, section_id),
        )

    def announcements(self, section_id: int) -> list[dict]:
        return self.db.fetch_all(
            """
            SELECT `AnnouncementID`, `Title`, `Content`, `PostedAt`, `ExpiredAt`,
                   `PostedByStaffID`
            FROM `Announcement`
            WHERE `SectionID` = %s
              AND (`ExpiredAt` IS NULL OR `ExpiredAt` >= NOW())
            ORDER BY `PostedAt` DESC
            """,
            (section_id,),
        )

    def resources(self, section_id: int) -> list[dict]:
        return self.db.fetch_all(
            """
            SELECT r.`ResourceID`, r.`Title`, r.`Description`, r.`ResourceType`,
                   r.`ResourceURL`, r.`UploadedAt`, sr.`DisplayOrder`, sr.`IsVisible`
            FROM `Section_Resource` sr
            JOIN `LearningResource` r ON r.`ResourceID` = sr.`ResourceID`
            WHERE sr.`SectionID` = %s AND sr.`IsVisible` = TRUE
            ORDER BY sr.`DisplayOrder`, r.`UploadedAt`
            """,
            (section_id,),
        )

    def assessments(self, section_id: int, student_id: int) -> list[dict]:
        return self.db.fetch_all(
            """
            SELECT a.`AssessmentID`, a.`Title`, a.`Description`, a.`CreatedAt`,
                   a.`MaxScore`, a.`MaxAttempts`, a.`CreatedByStaffID`,
                   asg.`OpenDate`, asg.`DueDate`, asg.`AllowLateSubmission`,
                   asg.`SubmissionCount`, q.`OpenTime`, q.`CloseTime`,
                   q.`DurationMinutes`,
                   CASE WHEN asg.`AssessmentID` IS NOT NULL THEN 'ASSIGNMENT'
                        ELSE 'QUIZ' END AS AssessmentType,
                   g.`Score`, g.`GradedAt`, g.`IsPublished`
            FROM `Assessment` a
            JOIN `CourseSection` cs ON cs.`SectionID` = a.`SectionID`
            LEFT JOIN `Assignment` asg ON asg.`AssessmentID` = a.`AssessmentID`
            LEFT JOIN `Quiz` q ON q.`AssessmentID` = a.`AssessmentID`
            LEFT JOIN `Grade` g ON g.`AssessmentID` = a.`AssessmentID`
                 AND g.`EnrollmentID` = (
                     SELECT e.`EnrollmentID` FROM `Enrollment` e
                     WHERE e.`StudentID` = %s AND e.`SectionID` = a.`SectionID`
                     LIMIT 1
                 )
            WHERE a.`SectionID` = %s
            ORDER BY a.`CreatedAt` DESC
            """,
            (student_id, section_id),
        )

    def assignment_detail(self, assessment_id: int, student_id: int) -> dict | None:
        return self.db.fetch_one(
            """
            SELECT a.`AssessmentID`, a.`Title`, a.`Description`, a.`CreatedAt`,
                   a.`MaxScore`, a.`MaxAttempts`, a.`SectionID`,
                   asg.`OpenDate`, asg.`DueDate`, asg.`AllowLateSubmission`,
                   asg.`SubmissionCount`
            FROM `Assessment` a
            JOIN `Assignment` asg ON asg.`AssessmentID` = a.`AssessmentID`
            WHERE a.`AssessmentID` = %s
            """,
            (assessment_id,),
        )

    def attachments(self, assessment_id: int) -> list[dict]:
        return self.db.fetch_all(
            "SELECT `AssessmentID`, `AttachmentURL` FROM `AssignmentAttachment` WHERE `AssessmentID` = %s",
            (assessment_id,),
        )

    def submissions(self, assignment_id: int, student_id: int) -> list[dict]:
        return self.db.fetch_all(
            """
            SELECT s.`SubmissionID`, s.`AttemptNo`, s.`SubmittedAt`,
                   s.`SubmissionStatus`, s.`Score`, s.`GradedAt`,
                   s.`GradedByStaffID`, grader.`FullName` AS GraderName,
                   CASE WHEN s.`SubmittedAt` > asg.`DueDate` THEN 1 ELSE 0 END AS IsLate
            FROM `Submission` s
            JOIN `Assignment` asg ON asg.`AssessmentID` = s.`AssignmentID`
            LEFT JOIN `UserAccount` grader ON grader.`UserID` = s.`GradedByStaffID`
            WHERE s.`AssignmentID` = %s AND s.`StudentID` = %s
            ORDER BY s.`AttemptNo` DESC
            """,
            (assignment_id, student_id),
        )

    def submission_files(self, submission_id: int) -> list[dict]:
        return self.db.fetch_all(
            """
            SELECT `SubmissionID`, `FileNo`, `FileName`, `FileURL`, `FileSize`, `UploadedAt`
            FROM `SubmissionFile`
            WHERE `SubmissionID` = %s
            ORDER BY `FileNo`
            """,
            (submission_id,),
        )

    def quiz_detail(self, assessment_id: int) -> dict | None:
        return self.db.fetch_one(
            """
            SELECT a.`AssessmentID`, a.`Title`, a.`Description`, a.`MaxScore`,
                   a.`MaxAttempts`, a.`SectionID`,
                   q.`OpenTime`, q.`CloseTime`, q.`DurationMinutes`
            FROM `Assessment` a
            JOIN `Quiz` q ON q.`AssessmentID` = a.`AssessmentID`
            WHERE a.`AssessmentID` = %s
            """,
            (assessment_id,),
        )

    def quiz_attempts(self, quiz_id: int, student_id: int) -> list[dict]:
        return self.db.fetch_all(
            """
            SELECT `AttemptID`, `AttemptNo`, `StartedAt`, `FinishedAt`, `Score`
            FROM `QuizAttempt`
            WHERE `QuizID` = %s AND `StudentID` = %s
            ORDER BY `AttemptNo` DESC
            """,
            (quiz_id, student_id),
        )

    def finish_quiz_attempt(self, attempt_id: int, student_id: int, score: float) -> int:
        return self.db.execute(
            """
            UPDATE `QuizAttempt`
            SET `FinishedAt` = NOW(), `Score` = %s
            WHERE `AttemptID` = %s AND `StudentID` = %s
            """,
            (score, attempt_id, student_id),
        )

    def published_grades(self, student_id: int) -> list[dict]:
        return self.db.fetch_all(
            """
            SELECT g.`GradeID`, g.`EnrollmentID`, g.`Score`, g.`GradedAt`, g.`IsPublished`,
                   a.`AssessmentID`, a.`Title`, a.`MaxScore`,
                   ROUND(g.`Score` * 100.0 / a.`MaxScore`, 2) AS ScorePercent,
                   cs.`SectionCode`, c.`CourseCode`, c.`CourseName`,
                   sem.`AcademicYear`, sem.`TermNo`
            FROM `Grade` g
            JOIN `Enrollment` e ON e.`EnrollmentID` = g.`EnrollmentID`
            JOIN `Assessment` a ON a.`AssessmentID` = g.`AssessmentID`
            JOIN `CourseSection` cs ON cs.`SectionID` = e.`SectionID`
            JOIN `CourseComponent` cc ON cc.`ComponentID` = cs.`ComponentID`
            JOIN `Course` c ON c.`CourseID` = cc.`CourseID`
            JOIN `Semester` sem ON sem.`SemesterID` = cs.`SemesterID`
            WHERE e.`StudentID` = %s AND g.`IsPublished` = TRUE
            ORDER BY g.`GradedAt` DESC
            """,
            (student_id,),
        )

    def next_attempt_no(self, assignment_id: int, student_id: int) -> int:
        row = self.db.fetch_one(
            """
            SELECT COALESCE(MAX(`AttemptNo`), 0) + 1 AS next_no
            FROM `Submission`
            WHERE `AssignmentID` = %s AND `StudentID` = %s
            """,
            (assignment_id, student_id),
        )
        return int(row["next_no"]) if row else 1

    def create_submission(self, assignment_id: int, student_id: int, attempt_no: int, status: str) -> int:
        return self.db.insert(
            """
            INSERT INTO `Submission`
              (`AssignmentID`, `StudentID`, `AttemptNo`, `SubmittedAt`, `SubmissionStatus`)
            VALUES (%s, %s, %s, NOW(), %s)
            """,
            (assignment_id, student_id, attempt_no, status),
        )

    def add_submission_file(
        self, submission_id: int, file_no: int, file_name: str, file_url: str, file_size: int
    ) -> None:
        self.db.execute(
            """
            INSERT INTO `SubmissionFile`
              (`SubmissionID`, `FileNo`, `FileName`, `FileURL`, `FileSize`, `UploadedAt`)
            VALUES (%s, %s, %s, %s, %s, NOW())
            """,
            (submission_id, file_no, file_name, file_url, file_size),
        )

    def next_quiz_attempt_no(self, quiz_id: int, student_id: int) -> int:
        row = self.db.fetch_one(
            """
            SELECT COALESCE(MAX(`AttemptNo`), 0) + 1 AS next_no
            FROM `QuizAttempt`
            WHERE `QuizID` = %s AND `StudentID` = %s
            """,
            (quiz_id, student_id),
        )
        return int(row["next_no"]) if row else 1

    def create_quiz_attempt(self, quiz_id: int, student_id: int, attempt_no: int) -> int:
        return self.db.insert(
            """
            INSERT INTO `QuizAttempt`
              (`QuizID`, `StudentID`, `AttemptNo`, `StartedAt`)
            VALUES (%s, %s, %s, NOW())
            """,
            (quiz_id, student_id, attempt_no),
        )

    def add_feedback(self, submission_id: int, author_id: int, content: str, parent_id: int | None) -> int:
        return self.db.insert(
            """
            INSERT INTO `Feedback`
              (`SubmissionID`, `AuthorID`, `ParentFeedbackID`, `Content`, `CreatedAt`)
            VALUES (%s, %s, %s, %s, NOW())
            """,
            (submission_id, author_id, parent_id, content),
        )

    def enrollment_detail(self, enrollment_id: int, student_id: int) -> dict | None:
        return self.db.fetch_one(
            """
            SELECT `EnrollmentID`, `StudentID`, `SectionID`, `EnrollmentStatus`
            FROM `Enrollment`
            WHERE `EnrollmentID` = %s AND `StudentID` = %s
            """,
            (enrollment_id, student_id),
        )

    def submission_owner(self, submission_id: int, student_id: int) -> bool:
        row = self.db.fetch_one(
            "SELECT `SubmissionID` FROM `Submission` WHERE `SubmissionID` = %s AND `StudentID` = %s",
            (submission_id, student_id),
        )
        return row is not None

    def feedback_thread(self, submission_id: int) -> list[dict]:
        return self.db.fetch_all(
            """
            SELECT f.`FeedbackID`, f.`Content`, f.`CreatedAt`, f.`ParentFeedbackID`,
                   f.`AuthorID`, u.`FullName` AS AuthorName
            FROM `Feedback` f
            JOIN `UserAccount` u ON u.`UserID` = f.`AuthorID`
            WHERE f.`SubmissionID` = %s
            ORDER BY f.`CreatedAt` ASC
            """,
            (submission_id,),
        )
