USE `hcmut_lms`;

-- Referential integrity. Delete rules are deliberate:
--   * CASCADE only for IS-A rows, weak rows, and N:M link rows.
--   * RESTRICT for business master data so history cannot silently disappear.
--   * SET NULL for optional staff assignments and recursive feedback parent.

ALTER TABLE `Student`
  ADD CONSTRAINT `fk_student_user`
    FOREIGN KEY (`UserID`) REFERENCES `UserAccount` (`UserID`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_student_faculty`
    FOREIGN KEY (`FacultyID`) REFERENCES `Faculty` (`FacultyID`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Staff`
  ADD CONSTRAINT `fk_staff_user`
    FOREIGN KEY (`UserID`) REFERENCES `UserAccount` (`UserID`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_staff_faculty`
    FOREIGN KEY (`FacultyID`) REFERENCES `Faculty` (`FacultyID`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Admin`
  ADD CONSTRAINT `fk_admin_user`
    FOREIGN KEY (`UserID`) REFERENCES `UserAccount` (`UserID`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Course`
  ADD CONSTRAINT `fk_course_faculty`
    FOREIGN KEY (`FacultyID`) REFERENCES `Faculty` (`FacultyID`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_course_admin`
    FOREIGN KEY (`CreatedByAdminID`) REFERENCES `Admin` (`UserID`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `CourseComponent`
  ADD CONSTRAINT `fk_component_course`
    FOREIGN KEY (`CourseID`) REFERENCES `Course` (`CourseID`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `CourseSection`
  ADD CONSTRAINT `fk_section_component`
    FOREIGN KEY (`ComponentID`) REFERENCES `CourseComponent` (`ComponentID`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_section_semester`
    FOREIGN KEY (`SemesterID`) REFERENCES `Semester` (`SemesterID`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_section_instructor`
    FOREIGN KEY (`PrimaryInstructorID`) REFERENCES `Staff` (`UserID`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Enrollment`
  ADD CONSTRAINT `fk_enrollment_student`
    FOREIGN KEY (`StudentID`) REFERENCES `Student` (`UserID`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_enrollment_section`
    FOREIGN KEY (`SectionID`) REFERENCES `CourseSection` (`SectionID`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Announcement`
  ADD CONSTRAINT `fk_announcement_section`
    FOREIGN KEY (`SectionID`) REFERENCES `CourseSection` (`SectionID`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_announcement_staff`
    FOREIGN KEY (`PostedByStaffID`) REFERENCES `Staff` (`UserID`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `LearningResource`
  ADD CONSTRAINT `fk_resource_staff`
    FOREIGN KEY (`UploadedByStaffID`) REFERENCES `Staff` (`UserID`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Section_Resource`
  ADD CONSTRAINT `fk_sr_section`
    FOREIGN KEY (`SectionID`) REFERENCES `CourseSection` (`SectionID`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_sr_resource`
    FOREIGN KEY (`ResourceID`) REFERENCES `LearningResource` (`ResourceID`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Assessment`
  ADD CONSTRAINT `fk_assessment_section`
    FOREIGN KEY (`SectionID`) REFERENCES `CourseSection` (`SectionID`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_assessment_staff`
    FOREIGN KEY (`CreatedByStaffID`) REFERENCES `Staff` (`UserID`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Assignment`
  ADD CONSTRAINT `fk_assignment_assessment`
    FOREIGN KEY (`AssessmentID`) REFERENCES `Assessment` (`AssessmentID`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AssignmentAttachment`
  ADD CONSTRAINT `fk_attachment_assignment`
    FOREIGN KEY (`AssessmentID`) REFERENCES `Assignment` (`AssessmentID`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Submission`
  ADD CONSTRAINT `fk_submission_assignment`
    FOREIGN KEY (`AssignmentID`) REFERENCES `Assignment` (`AssessmentID`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_submission_student`
    FOREIGN KEY (`StudentID`) REFERENCES `Student` (`UserID`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_submission_staff`
    FOREIGN KEY (`GradedByStaffID`) REFERENCES `Staff` (`UserID`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `SubmissionFile`
  ADD CONSTRAINT `fk_file_submission`
    FOREIGN KEY (`SubmissionID`) REFERENCES `Submission` (`SubmissionID`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Quiz`
  ADD CONSTRAINT `fk_quiz_assessment`
    FOREIGN KEY (`AssessmentID`) REFERENCES `Assessment` (`AssessmentID`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `QuizAttempt`
  ADD CONSTRAINT `fk_attempt_quiz`
    FOREIGN KEY (`QuizID`) REFERENCES `Quiz` (`AssessmentID`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_attempt_student`
    FOREIGN KEY (`StudentID`) REFERENCES `Student` (`UserID`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Grade`
  ADD CONSTRAINT `fk_grade_enrollment`
    FOREIGN KEY (`EnrollmentID`) REFERENCES `Enrollment` (`EnrollmentID`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_grade_assessment`
    FOREIGN KEY (`AssessmentID`) REFERENCES `Assessment` (`AssessmentID`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_grade_staff`
    FOREIGN KEY (`GradedByStaffID`) REFERENCES `Staff` (`UserID`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Feedback`
  ADD CONSTRAINT `fk_feedback_submission`
    FOREIGN KEY (`SubmissionID`) REFERENCES `Submission` (`SubmissionID`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_feedback_author`
    FOREIGN KEY (`AuthorID`) REFERENCES `UserAccount` (`UserID`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_feedback_parent`
    FOREIGN KEY (`ParentFeedbackID`) REFERENCES `Feedback` (`FeedbackID`)
    ON DELETE SET NULL ON UPDATE CASCADE;
