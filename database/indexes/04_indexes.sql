USE `hcmut_lms`;

-- Supporting indexes for filters and join paths that are not already covered
-- by a primary key, unique key, or an automatically-created FK index.

CREATE INDEX `idx_user_account_status`
  ON `UserAccount` (`AccountStatus`);

CREATE INDEX `idx_user_last_access`
  ON `UserAccount` (`LastAccessAt`);

CREATE INDEX `idx_course_faculty`
  ON `Course` (`FacultyID`, `CourseCode`);

CREATE INDEX `idx_component_course_type`
  ON `CourseComponent` (`CourseID`, `ComponentType`);

CREATE INDEX `idx_section_schedule`
  ON `CourseSection` (`SemesterID`, `DayOfWeek`, `StartTime`, `EndTime`);

CREATE INDEX `idx_section_instructor_semester`
  ON `CourseSection` (`PrimaryInstructorID`, `SemesterID`);

CREATE INDEX `idx_enrollment_section_status`
  ON `Enrollment` (`SectionID`, `EnrollmentStatus`);

CREATE INDEX `idx_enrollment_student_status`
  ON `Enrollment` (`StudentID`, `EnrollmentStatus`);

CREATE INDEX `idx_announcement_section_posted`
  ON `Announcement` (`SectionID`, `PostedAt`);

CREATE INDEX `idx_resource_staff_type`
  ON `LearningResource` (`UploadedByStaffID`, `ResourceType`);

CREATE INDEX `idx_submission_assignment_status`
  ON `Submission` (`AssignmentID`, `SubmissionStatus`);

CREATE INDEX `idx_submission_student_submitted`
  ON `Submission` (`StudentID`, `SubmittedAt`);

CREATE INDEX `idx_quiz_attempt_student`
  ON `QuizAttempt` (`StudentID`, `StartedAt`);

CREATE INDEX `idx_grade_assessment_published`
  ON `Grade` (`AssessmentID`, `IsPublished`);

CREATE INDEX `idx_feedback_parent`
  ON `Feedback` (`ParentFeedbackID`);
