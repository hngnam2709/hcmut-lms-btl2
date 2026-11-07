USE `hcmut_lms`;

-- Domain and row-level constraints. Cross-row and cross-table rules live in
-- database/triggers and are documented in docs/SEMANTIC_CONSTRAINTS.md.

ALTER TABLE `UserAccount`
  ADD CONSTRAINT `ck_user_status`
    CHECK (`AccountStatus` IN ('ACTIVE', 'LOCKED', 'DISABLED')),
  ADD CONSTRAINT `ck_user_email`
    CHECK (`Email` LIKE '%_@_%._%' AND CHAR_LENGTH(`FullName`) > 0),
  ADD CONSTRAINT `ck_user_avatar`
    CHECK (CHAR_LENGTH(`AvatarURL`) > 0);

ALTER TABLE `Faculty`
  ADD CONSTRAINT `ck_faculty_name`
    CHECK (CHAR_LENGTH(`FacultyName`) > 0);

ALTER TABLE `Student`
  ADD CONSTRAINT `ck_student_code`
    CHECK (CHAR_LENGTH(`StudentCode`) BETWEEN 4 AND 20);

ALTER TABLE `Semester`
  ADD CONSTRAINT `ck_semester_term`
    CHECK (`TermNo` BETWEEN 1 AND 3),
  ADD CONSTRAINT `ck_semester_dates`
    CHECK (`StartDate` < `EndDate`),
  ADD CONSTRAINT `ck_semester_year`
    CHECK (`AcademicYear` REGEXP '^[0-9]{4}-[0-9]{4}$');

ALTER TABLE `Course`
  ADD CONSTRAINT `ck_course_credits`
    CHECK (`Credits` BETWEEN 1 AND 10),
  ADD CONSTRAINT `ck_course_code`
    CHECK (CHAR_LENGTH(`CourseCode`) > 0);

ALTER TABLE `CourseComponent`
  ADD CONSTRAINT `ck_component_type`
    CHECK (`ComponentType` IN ('THEORY', 'PRACTICE'));

ALTER TABLE `CourseSection`
  ADD CONSTRAINT `ck_section_capacity`
    CHECK (`Capacity` > 0),
  ADD CONSTRAINT `ck_section_status`
    CHECK (`SectionStatus` IN ('OPEN', 'CLOSED', 'CANCELLED')),
  ADD CONSTRAINT `ck_section_day`
    CHECK (`DayOfWeek` BETWEEN 1 AND 7),
  ADD CONSTRAINT `ck_section_time`
    CHECK (`StartTime` < `EndTime`),
  ADD CONSTRAINT `ck_section_room`
    CHECK (CHAR_LENGTH(`RoomCode`) > 0);

ALTER TABLE `Enrollment`
  ADD CONSTRAINT `ck_enrollment_status`
    CHECK (`EnrollmentStatus` IN ('ACTIVE', 'DROPPED', 'COMPLETED'));

ALTER TABLE `Announcement`
  ADD CONSTRAINT `ck_announcement_expiry`
    CHECK (`ExpiredAt` IS NULL OR `ExpiredAt` > `PostedAt`);

ALTER TABLE `LearningResource`
  ADD CONSTRAINT `ck_resource_type`
    CHECK (`ResourceType` IN ('DOCUMENT', 'SLIDE', 'VIDEO', 'LINK')),
  ADD CONSTRAINT `ck_resource_url`
    CHECK (CHAR_LENGTH(`ResourceURL`) > 0);

ALTER TABLE `Section_Resource`
  ADD CONSTRAINT `ck_sr_order`
    CHECK (`DisplayOrder` >= 0);

ALTER TABLE `Assessment`
  ADD CONSTRAINT `ck_assessment_score`
    CHECK (`MaxScore` > 0),
  ADD CONSTRAINT `ck_assessment_attempts`
    CHECK (`MaxAttempts` IS NULL OR `MaxAttempts` > 0);

ALTER TABLE `Assignment`
  ADD CONSTRAINT `ck_assignment_period`
    CHECK (`OpenDate` < `DueDate`),
  ADD CONSTRAINT `ck_assignment_count`
    CHECK (`SubmissionCount` >= 0);

ALTER TABLE `AssignmentAttachment`
  ADD CONSTRAINT `ck_attachment_url`
    CHECK (CHAR_LENGTH(`AttachmentURL`) > 0);

ALTER TABLE `Submission`
  ADD CONSTRAINT `ck_submission_attempt_no`
    CHECK (`AttemptNo` > 0),
  ADD CONSTRAINT `ck_submission_status`
    CHECK (`SubmissionStatus` IN ('DRAFT', 'SUBMITTED')),
  ADD CONSTRAINT `ck_submission_score`
    CHECK (`Score` IS NULL OR `Score` >= 0),
  ADD CONSTRAINT `ck_submission_grading`
    CHECK (
      (`Score` IS NULL AND `GradedAt` IS NULL)
      OR
      (`Score` IS NOT NULL AND `GradedAt` IS NOT NULL)
    );

ALTER TABLE `SubmissionFile`
  ADD CONSTRAINT `ck_file_no`
    CHECK (`FileNo` > 0),
  ADD CONSTRAINT `ck_file_size`
    CHECK (`FileSize` >= 0);

ALTER TABLE `Quiz`
  ADD CONSTRAINT `ck_quiz_time`
    CHECK (`OpenTime` < `CloseTime`),
  ADD CONSTRAINT `ck_quiz_duration`
    CHECK (`DurationMinutes` > 0);

ALTER TABLE `QuizAttempt`
  ADD CONSTRAINT `ck_quiz_attempt_no`
    CHECK (`AttemptNo` > 0),
  ADD CONSTRAINT `ck_quiz_attempt_time`
    CHECK (`FinishedAt` IS NULL OR `FinishedAt` >= `StartedAt`),
  ADD CONSTRAINT `ck_quiz_attempt_score`
    CHECK (`Score` IS NULL OR `Score` >= 0);

ALTER TABLE `Grade`
  ADD CONSTRAINT `ck_grade_score`
    CHECK (`Score` >= 0);

ALTER TABLE `Feedback`
  ADD CONSTRAINT `ck_feedback_content`
    CHECK (CHAR_LENGTH(`Content`) > 0);
