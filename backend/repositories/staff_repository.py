from __future__ import annotations

from backend.db import Database


class StaffRepository:
    """Staff-scoped access. Ownership is always bound to the primary instructor."""

    def __init__(self, db: Database) -> None:
        self.db = db

    def sections(self, staff_id: int) -> list[dict]:
        return self.db.fetch_all(
            """
            SELECT cs.`SectionID`, cs.`SectionCode`, cs.`Capacity`, cs.`SectionStatus`,
                   cs.`DayOfWeek`, cs.`StartTime`, cs.`EndTime`, cs.`RoomCode`,
                   cs.`ComponentID`, cs.`SemesterID`, cs.`PrimaryInstructorID`,
                   cc.`ComponentType`, cc.`ComponentName`,
                   c.`CourseID`, c.`CourseCode`, c.`CourseName`,
                   sem.`AcademicYear`, sem.`TermNo`
            FROM `CourseSection` cs
            JOIN `CourseComponent` cc ON cc.`ComponentID` = cs.`ComponentID`
            JOIN `Course` c ON c.`CourseID` = cc.`CourseID`
            JOIN `Semester` sem ON sem.`SemesterID` = cs.`SemesterID`
            WHERE cs.`PrimaryInstructorID` = %s
            ORDER BY sem.`AcademicYear` DESC, cs.`SectionCode`
            """,
            (staff_id,),
        )

    def owns_section(self, staff_id: int, section_id: int) -> bool:
        row = self.db.fetch_one(
            "SELECT `SectionID` FROM `CourseSection` WHERE `SectionID` = %s AND `PrimaryInstructorID` = %s",
            (section_id, staff_id),
        )
        return row is not None

    def students(self, section_id: int) -> list[dict]:
        return self.db.fetch_all(
            """
            SELECT e.`EnrollmentID`, e.`EnrollmentStatus`, e.`EnrollmentDate`,
                   u.`UserID` AS StudentID, u.`FullName` AS StudentName,
                   u.`Email` AS StudentEmail, s.`StudentCode`
            FROM `Enrollment` e
            JOIN `Student` s ON s.`UserID` = e.`StudentID`
            JOIN `UserAccount` u ON u.`UserID` = s.`UserID`
            WHERE e.`SectionID` = %s
            ORDER BY u.`FullName`
            """,
            (section_id,),
        )

    def announcements(self, section_id: int) -> list[dict]:
        return self.db.fetch_all(
            """
            SELECT `AnnouncementID`, `Title`, `Content`, `PostedAt`, `ExpiredAt`,
                   `PostedByStaffID`
            FROM `Announcement`
            WHERE `SectionID` = %s
            ORDER BY `PostedAt` DESC
            """,
            (section_id,),
        )

    def create_announcement(self, section_id: int, staff_id: int, title: str, content: str, expired_at: str | None) -> int:
        return self.db.insert(
            """
            INSERT INTO `Announcement`
              (`SectionID`, `PostedByStaffID`, `Title`, `Content`, `PostedAt`, `ExpiredAt`)
            VALUES (%s, %s, %s, %s, NOW(), %s)
            """,
            (section_id, staff_id, title, content, expired_at),
        )

    def delete_announcement(self, announcement_id: int) -> None:
        self.db.execute("DELETE FROM `Announcement` WHERE `AnnouncementID` = %s", (announcement_id,))

    def resources(self, section_id: int) -> list[dict]:
        return self.db.fetch_all(
            """
            SELECT r.`ResourceID`, r.`Title`, r.`Description`, r.`ResourceType`,
                   r.`ResourceURL`, r.`UploadedAt`, sr.`DisplayOrder`, sr.`IsVisible`
            FROM `Section_Resource` sr
            JOIN `LearningResource` r ON r.`ResourceID` = sr.`ResourceID`
            WHERE sr.`SectionID` = %s
            ORDER BY sr.`DisplayOrder`
            """,
            (section_id,),
        )

    def create_resource(self, staff_id: int, title: str, description: str, rtype: str, url: str) -> int:
        return self.db.insert(
            """
            INSERT INTO `LearningResource`
              (`UploadedByStaffID`, `Title`, `Description`, `ResourceType`, `ResourceURL`, `UploadedAt`)
            VALUES (%s, %s, %s, %s, %s, NOW())
            """,
            (staff_id, title, description, rtype, url),
        )

    def post_resource(self, section_id: int, resource_id: int, display_order: int) -> None:
        self.db.execute(
            """
            INSERT INTO `Section_Resource`
              (`SectionID`, `ResourceID`, `PostedAt`, `DisplayOrder`, `IsVisible`)
            VALUES (%s, %s, NOW(), %s, TRUE)
            ON DUPLICATE KEY UPDATE `DisplayOrder` = VALUES(`DisplayOrder`), `IsVisible` = TRUE
            """,
            (section_id, resource_id, display_order),
        )

    def unpost_resource(self, section_id: int, resource_id: int) -> None:
        self.db.execute(
            "DELETE FROM `Section_Resource` WHERE `SectionID` = %s AND `ResourceID` = %s",
            (section_id, resource_id),
        )

    def assessments(self, section_id: int) -> list[dict]:
        return self.db.fetch_all(
            """
            SELECT a.`AssessmentID`, a.`Title`, a.`Description`, a.`CreatedAt`,
                   a.`MaxScore`, a.`MaxAttempts`, a.`CreatedByStaffID`,
                   asg.`OpenDate`, asg.`DueDate`, asg.`AllowLateSubmission`, asg.`SubmissionCount`,
                   q.`OpenTime`, q.`CloseTime`, q.`DurationMinutes`,
                   CASE WHEN asg.`AssessmentID` IS NOT NULL THEN 'ASSIGNMENT' ELSE 'QUIZ' END AS AssessmentType
            FROM `Assessment` a
            LEFT JOIN `Assignment` asg ON asg.`AssessmentID` = a.`AssessmentID`
            LEFT JOIN `Quiz` q ON q.`AssessmentID` = a.`AssessmentID`
            WHERE a.`SectionID` = %s
            ORDER BY a.`CreatedAt` DESC
            """,
            (section_id,),
        )

    def create_assignment(
        self, section_id: int, staff_id: int, title: str, description: str, max_score: float,
        max_attempts: int | None, open_date: str, due_date: str, allow_late: bool,
        attachments: list[str],
    ) -> int:
        assessment_id = self.db.insert(
            """
            INSERT INTO `Assessment`
              (`SectionID`, `CreatedByStaffID`, `Title`, `Description`, `CreatedAt`, `MaxScore`, `MaxAttempts`)
            VALUES (%s, %s, %s, %s, NOW(), %s, %s)
            """,
            (section_id, staff_id, title, description, max_score, max_attempts),
        )
        self.db.execute(
            """
            INSERT INTO `Assignment`
              (`AssessmentID`, `OpenDate`, `DueDate`, `AllowLateSubmission`, `SubmissionCount`)
            VALUES (%s, %s, %s, %s, 0)
            """,
            (assessment_id, open_date, due_date, allow_late),
        )
        for url in attachments:
            self.db.execute(
                "INSERT INTO `AssignmentAttachment` (`AssessmentID`, `AttachmentURL`) VALUES (%s, %s)",
                (assessment_id, url),
            )
        return assessment_id

    def create_quiz(
        self, section_id: int, staff_id: int, title: str, description: str, max_score: float,
        max_attempts: int | None, open_time: str, close_time: str, duration: int,
    ) -> int:
        assessment_id = self.db.insert(
            """
            INSERT INTO `Assessment`
              (`SectionID`, `CreatedByStaffID`, `Title`, `Description`, `CreatedAt`, `MaxScore`, `MaxAttempts`)
            VALUES (%s, %s, %s, %s, NOW(), %s, %s)
            """,
            (section_id, staff_id, title, description, max_score, max_attempts),
        )
        self.db.execute(
            "INSERT INTO `Quiz` (`AssessmentID`, `OpenTime`, `CloseTime`, `DurationMinutes`) VALUES (%s, %s, %s, %s)",
            (assessment_id, open_time, close_time, duration),
        )
        return assessment_id

    def delete_assessment(self, assessment_id: int) -> None:
        self.db.execute("DELETE FROM `Assessment` WHERE `AssessmentID` = %s", (assessment_id,))

    def submissions(self, section_id: int) -> list[dict]:
        return self.db.fetch_all(
            """
            SELECT s.`SubmissionID`, s.`AssignmentID`, s.`StudentID`, s.`GradedByStaffID`,
                   s.`AttemptNo`, s.`SubmittedAt`, s.`SubmissionStatus`, s.`Score`, s.`GradedAt`,
                   u.`FullName` AS StudentName, a.`Title` AS AssignmentTitle
            FROM `Submission` s
            JOIN `Assignment` asg ON asg.`AssessmentID` = s.`AssignmentID`
            JOIN `Assessment` a ON a.`AssessmentID` = asg.`AssessmentID`
            JOIN `UserAccount` u ON u.`UserID` = s.`StudentID`
            WHERE a.`SectionID` = %s
            ORDER BY s.`SubmittedAt` DESC
            """,
            (section_id,),
        )

    def grade_submission(self, submission_id: int, staff_id: int, score: float) -> None:
        self.db.execute(
            """
            UPDATE `Submission`
            SET `Score` = %s, `GradedAt` = NOW(), `GradedByStaffID` = %s
            WHERE `SubmissionID` = %s
            """,
            (score, staff_id, submission_id),
        )

    def grades(self, section_id: int) -> list[dict]:
        return self.db.fetch_all(
            """
            SELECT g.`GradeID`, g.`EnrollmentID`, g.`AssessmentID`, g.`GradedByStaffID`,
                   g.`Score`, g.`GradedAt`, g.`IsPublished`,
                   a.`Title` AS AssessmentTitle, a.`MaxScore`,
                   u.`FullName` AS StudentName, st.`StudentCode`
            FROM `Grade` g
            JOIN `Assessment` a ON a.`AssessmentID` = g.`AssessmentID`
            JOIN `Enrollment` e ON e.`EnrollmentID` = g.`EnrollmentID`
            JOIN `Student` st ON st.`UserID` = e.`StudentID`
            JOIN `UserAccount` u ON u.`UserID` = st.`UserID`
            JOIN `CourseSection` cs ON cs.`SectionID` = e.`SectionID`
            WHERE cs.`SectionID` = %s
            ORDER BY g.`GradedAt` DESC
            """,
            (section_id,),
        )

    def upsert_grade(
        self, enrollment_id: int, assessment_id: int, staff_id: int, score: float, published: bool
    ) -> None:
        self.db.execute(
            """
            INSERT INTO `Grade`
              (`EnrollmentID`, `AssessmentID`, `GradedByStaffID`, `Score`, `GradedAt`, `IsPublished`)
            VALUES (%s, %s, %s, %s, NOW(), %s)
            ON DUPLICATE KEY UPDATE
              `GradedByStaffID` = VALUES(`GradedByStaffID`),
              `Score` = VALUES(`Score`),
              `GradedAt` = VALUES(`GradedAt`),
              `IsPublished` = VALUES(`IsPublished`)
            """,
            (enrollment_id, assessment_id, staff_id, score, published),
        )

    def enrollment_for(self, section_id: int, student_id: int) -> dict | None:
        return self.db.fetch_one(
            """
            SELECT `EnrollmentID`, `EnrollmentStatus`
            FROM `Enrollment`
            WHERE `SectionID` = %s AND `StudentID` = %s
            """,
            (section_id, student_id),
        )

    def quiz_attempts(self, section_id: int) -> list[dict]:
        return self.db.fetch_all(
            """
            SELECT qa.`AttemptID`, qa.`QuizID`, qa.`StudentID`, qa.`AttemptNo`,
                   qa.`StartedAt`, qa.`FinishedAt`, qa.`Score`,
                   u.`FullName` AS StudentName, a.`Title` AS QuizTitle
            FROM `QuizAttempt` qa
            JOIN `Quiz` q ON q.`AssessmentID` = qa.`QuizID`
            JOIN `Assessment` a ON a.`AssessmentID` = q.`AssessmentID`
            JOIN `UserAccount` u ON u.`UserID` = qa.`StudentID`
            WHERE a.`SectionID` = %s
            ORDER BY qa.`StartedAt` DESC
            """,
            (section_id,),
        )

    def set_quiz_attempt_score(self, attempt_id: int, staff_id: int, score: float) -> None:
        self.db.execute(
            """
            UPDATE `QuizAttempt`
            SET `Score` = %s, `FinishedAt` = COALESCE(`FinishedAt`, NOW())
            WHERE `AttemptID` = %s
            """,
            (score, attempt_id),
        )

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

    def add_feedback(self, submission_id: int, author_id: int, content: str, parent_id: int | None) -> int:
        return self.db.insert(
            """
            INSERT INTO `Feedback`
              (`SubmissionID`, `AuthorID`, `ParentFeedbackID`, `Content`, `CreatedAt`)
            VALUES (%s, %s, %s, %s, NOW())
            """,
            (submission_id, author_id, parent_id, content),
        )

    def submission_section(self, submission_id: int) -> int | None:
        row = self.db.fetch_one(
            """
            SELECT a.`SectionID`
            FROM `Submission` s
            JOIN `Assignment` asg ON asg.`AssessmentID` = s.`AssignmentID`
            JOIN `Assessment` a ON a.`AssessmentID` = asg.`AssessmentID`
            WHERE s.`SubmissionID` = %s
            """,
            (submission_id,),
        )
        return row["SectionID"] if row else None
