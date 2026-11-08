# Schema inventory

- Database: `hcmut_lms`
- Generated: 2026-11-08 16:11:03

| Table | Columns | PK | FK | UNIQUE | CHECK |
|---|---:|---:|---:|---:|---:|
| `Admin` | 1 | UserID | 1 | 0 | 0 |
| `Announcement` | 7 | AnnouncementID | 2 | 0 | 1 |
| `Assessment` | 8 | AssessmentID | 2 | 0 | 2 |
| `Assignment` | 5 | AssessmentID | 1 | 0 | 2 |
| `AssignmentAttachment` | 2 | AssessmentID, AttachmentURL | 1 | 0 | 1 |
| `Course` | 6 | CourseID | 2 | 1 | 2 |
| `CourseComponent` | 4 | ComponentID | 1 | 1 | 1 |
| `CourseSection` | 11 | SectionID | 3 | 1 | 5 |
| `Enrollment` | 5 | EnrollmentID | 2 | 1 | 1 |
| `Faculty` | 3 | FacultyID | 0 | 0 | 1 |
| `Feedback` | 6 | FeedbackID | 3 | 0 | 1 |
| `Grade` | 7 | GradeID | 3 | 1 | 1 |
| `LearningResource` | 7 | ResourceID | 1 | 0 | 2 |
| `Quiz` | 4 | AssessmentID | 1 | 0 | 2 |
| `QuizAttempt` | 7 | AttemptID | 2 | 1 | 3 |
| `Section_Resource` | 5 | SectionID, ResourceID | 2 | 0 | 1 |
| `Semester` | 5 | SemesterID | 0 | 1 | 3 |
| `Staff` | 2 | UserID | 2 | 0 | 0 |
| `Student` | 3 | UserID | 2 | 1 | 1 |
| `Submission` | 9 | SubmissionID | 3 | 1 | 4 |
| `SubmissionFile` | 6 | SubmissionID, FileNo | 1 | 0 | 2 |
| `UserAccount` | 6 | UserID | 0 | 1 | 3 |

Totals: 22 tables, 119 columns, 35 foreign keys, 10 unique keys, 39 checks.

## Details

### `Admin`

**Foreign keys**
- `UserID` → `UserAccount.UserID`

### `Announcement`

**Foreign keys**
- `PostedByStaffID` → `Staff.UserID`
- `SectionID` → `CourseSection.SectionID`

**Checks**
- `ck_announcement_expiry`: `((`ExpiredAt` is null) or (`ExpiredAt` > `PostedAt`))`

### `Assessment`

**Foreign keys**
- `CreatedByStaffID` → `Staff.UserID`
- `SectionID` → `CourseSection.SectionID`

**Checks**
- `ck_assessment_attempts`: `((`MaxAttempts` is null) or (`MaxAttempts` > 0))`
- `ck_assessment_score`: `(`MaxScore` > 0)`

### `Assignment`

**Foreign keys**
- `AssessmentID` → `Assessment.AssessmentID`

**Checks**
- `ck_assignment_count`: `(`SubmissionCount` >= 0)`
- `ck_assignment_period`: `(`OpenDate` < `DueDate`)`

### `AssignmentAttachment`

**Foreign keys**
- `AssessmentID` → `Assignment.AssessmentID`

**Checks**
- `ck_attachment_url`: `(char_length(`AttachmentURL`) > 0)`

### `Course`

**Foreign keys**
- `CreatedByAdminID` → `Admin.UserID`
- `FacultyID` → `Faculty.FacultyID`

**Unique keys**
- `uq_course_code` (CourseCode)

**Checks**
- `ck_course_code`: `(char_length(`CourseCode`) > 0)`
- `ck_course_credits`: `(`Credits` between 1 and 10)`

### `CourseComponent`

**Foreign keys**
- `CourseID` → `Course.CourseID`

**Unique keys**
- `uq_course_component_type` (CourseID,ComponentType)

**Checks**
- `ck_component_type`: `(`ComponentType` in (_utf8mb4\'THEORY\',_utf8mb4\'PRACTICE\'))`

### `CourseSection`

**Foreign keys**
- `ComponentID` → `CourseComponent.ComponentID`
- `PrimaryInstructorID` → `Staff.UserID`
- `SemesterID` → `Semester.SemesterID`

**Unique keys**
- `uq_section_semester_code` (SemesterID,SectionCode)

**Checks**
- `ck_section_capacity`: `(`Capacity` > 0)`
- `ck_section_day`: `(`DayOfWeek` between 1 and 7)`
- `ck_section_room`: `(char_length(`RoomCode`) > 0)`
- `ck_section_status`: `(`SectionStatus` in (_utf8mb4\'OPEN\',_utf8mb4\'CLOSED\',_utf8mb4\'CANCELLED\'))`
- `ck_section_time`: `(`StartTime` < `EndTime`)`

### `Enrollment`

**Foreign keys**
- `SectionID` → `CourseSection.SectionID`
- `StudentID` → `Student.UserID`

**Unique keys**
- `uq_enrollment_student_section` (StudentID,SectionID)

**Checks**
- `ck_enrollment_status`: `(`EnrollmentStatus` in (_utf8mb4\'ACTIVE\',_utf8mb4\'DROPPED\',_utf8mb4\'COMPLETED\'))`

### `Faculty`

**Checks**
- `ck_faculty_name`: `(char_length(`FacultyName`) > 0)`

### `Feedback`

**Foreign keys**
- `AuthorID` → `UserAccount.UserID`
- `ParentFeedbackID` → `Feedback.FeedbackID`
- `SubmissionID` → `Submission.SubmissionID`

**Checks**
- `ck_feedback_content`: `(char_length(`Content`) > 0)`

### `Grade`

**Foreign keys**
- `AssessmentID` → `Assessment.AssessmentID`
- `EnrollmentID` → `Enrollment.EnrollmentID`
- `GradedByStaffID` → `Staff.UserID`

**Unique keys**
- `uq_grade_enrollment_assessment` (EnrollmentID,AssessmentID)

**Checks**
- `ck_grade_score`: `(`Score` >= 0)`

### `LearningResource`

**Foreign keys**
- `UploadedByStaffID` → `Staff.UserID`

**Checks**
- `ck_resource_type`: `(`ResourceType` in (_utf8mb4\'DOCUMENT\',_utf8mb4\'SLIDE\',_utf8mb4\'VIDEO\',_utf8mb4\'LINK\'))`
- `ck_resource_url`: `(char_length(`ResourceURL`) > 0)`

### `Quiz`

**Foreign keys**
- `AssessmentID` → `Assessment.AssessmentID`

**Checks**
- `ck_quiz_duration`: `(`DurationMinutes` > 0)`
- `ck_quiz_time`: `(`OpenTime` < `CloseTime`)`

### `QuizAttempt`

**Foreign keys**
- `QuizID` → `Quiz.AssessmentID`
- `StudentID` → `Student.UserID`

**Unique keys**
- `uq_quiz_attempt` (QuizID,StudentID,AttemptNo)

**Checks**
- `ck_quiz_attempt_no`: `(`AttemptNo` > 0)`
- `ck_quiz_attempt_score`: `((`Score` is null) or (`Score` >= 0))`
- `ck_quiz_attempt_time`: `((`FinishedAt` is null) or (`FinishedAt` >= `StartedAt`))`

### `Section_Resource`

**Foreign keys**
- `ResourceID` → `LearningResource.ResourceID`
- `SectionID` → `CourseSection.SectionID`

**Checks**
- `ck_sr_order`: `(`DisplayOrder` >= 0)`

### `Semester`

**Unique keys**
- `uq_semester_year_term` (AcademicYear,TermNo)

**Checks**
- `ck_semester_dates`: `(`StartDate` < `EndDate`)`
- `ck_semester_term`: `(`TermNo` between 1 and 3)`
- `ck_semester_year`: `regexp_like(`AcademicYear`,_utf8mb4\'^[0-9]{4}-[0-9]{4}$\')`

### `Staff`

**Foreign keys**
- `FacultyID` → `Faculty.FacultyID`
- `UserID` → `UserAccount.UserID`

### `Student`

**Foreign keys**
- `FacultyID` → `Faculty.FacultyID`
- `UserID` → `UserAccount.UserID`

**Unique keys**
- `uq_student_code` (StudentCode)

**Checks**
- `ck_student_code`: `(char_length(`StudentCode`) between 4 and 20)`

### `Submission`

**Foreign keys**
- `AssignmentID` → `Assignment.AssessmentID`
- `GradedByStaffID` → `Staff.UserID`
- `StudentID` → `Student.UserID`

**Unique keys**
- `uq_submission_attempt` (AssignmentID,StudentID,AttemptNo)

**Checks**
- `ck_submission_attempt_no`: `(`AttemptNo` > 0)`
- `ck_submission_grading`: `(((`Score` is null) and (`GradedAt` is null)) or ((`Score` is not null) and (`GradedAt` is not null)))`
- `ck_submission_score`: `((`Score` is null) or (`Score` >= 0))`
- `ck_submission_status`: `(`SubmissionStatus` in (_utf8mb4\'DRAFT\',_utf8mb4\'SUBMITTED\'))`

### `SubmissionFile`

**Foreign keys**
- `SubmissionID` → `Submission.SubmissionID`

**Checks**
- `ck_file_no`: `(`FileNo` > 0)`
- `ck_file_size`: `(`FileSize` >= 0)`

### `UserAccount`

**Unique keys**
- `uq_useraccount_email` (Email)

**Checks**
- `ck_user_avatar`: `(char_length(`AvatarURL`) > 0)`
- `ck_user_email`: `((`Email` like _utf8mb4\'%_@_%._%\') and (char_length(`FullName`) > 0))`
- `ck_user_status`: `(`AccountStatus` in (_utf8mb4\'ACTIVE\',_utf8mb4\'LOCKED\',_utf8mb4\'DISABLED\'))`
