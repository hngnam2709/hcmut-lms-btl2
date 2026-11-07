USE `hcmut_lms`;

-- =====================================================================
-- Trigger 1 (BTL2 2.2.1): business rule RB05
-- A lecturer or a room may not be double-booked in the same semester.
-- DML that can violate it: INSERT and UPDATE on CourseSection.
-- =====================================================================
DELIMITER $$

DROP TRIGGER IF EXISTS `trg_section_schedule_bi`$$
CREATE TRIGGER `trg_section_schedule_bi`
BEFORE INSERT ON `CourseSection`
FOR EACH ROW
BEGIN
  DECLARE v_conflict INT DEFAULT 0;

  IF NEW.`PrimaryInstructorID` IS NOT NULL THEN
    SELECT COUNT(*) INTO v_conflict
    FROM `CourseSection` cs
    WHERE cs.`SemesterID` = NEW.`SemesterID`
      AND cs.`PrimaryInstructorID` = NEW.`PrimaryInstructorID`
      AND cs.`DayOfWeek` = NEW.`DayOfWeek`
      AND NEW.`StartTime` < cs.`EndTime`
      AND cs.`StartTime` < NEW.`EndTime`;

    IF v_conflict > 0 THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Trung lich giang vien trong cung hoc ky.';
    END IF;
  END IF;

  SELECT COUNT(*) INTO v_conflict
  FROM `CourseSection` cs
  WHERE cs.`SemesterID` = NEW.`SemesterID`
    AND cs.`RoomCode` = NEW.`RoomCode`
    AND cs.`DayOfWeek` = NEW.`DayOfWeek`
    AND NEW.`StartTime` < cs.`EndTime`
    AND cs.`StartTime` < NEW.`EndTime`;

  IF v_conflict > 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Trung phong hoc trong cung hoc ky.';
  END IF;
END$$

DROP TRIGGER IF EXISTS `trg_section_schedule_bu`$$
CREATE TRIGGER `trg_section_schedule_bu`
BEFORE UPDATE ON `CourseSection`
FOR EACH ROW
BEGIN
  DECLARE v_conflict INT DEFAULT 0;

  IF NEW.`PrimaryInstructorID` IS NOT NULL THEN
    SELECT COUNT(*) INTO v_conflict
    FROM `CourseSection` cs
    WHERE cs.`SemesterID` = NEW.`SemesterID`
      AND cs.`SectionID` <> OLD.`SectionID`
      AND cs.`PrimaryInstructorID` = NEW.`PrimaryInstructorID`
      AND cs.`DayOfWeek` = NEW.`DayOfWeek`
      AND NEW.`StartTime` < cs.`EndTime`
      AND cs.`StartTime` < NEW.`EndTime`;

    IF v_conflict > 0 THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Trung lich giang vien trong cung hoc ky.';
    END IF;
  END IF;

  SELECT COUNT(*) INTO v_conflict
  FROM `CourseSection` cs
  WHERE cs.`SemesterID` = NEW.`SemesterID`
    AND cs.`SectionID` <> OLD.`SectionID`
    AND cs.`RoomCode` = NEW.`RoomCode`
    AND cs.`DayOfWeek` = NEW.`DayOfWeek`
    AND NEW.`StartTime` < cs.`EndTime`
    AND cs.`StartTime` < NEW.`EndTime`;

  IF v_conflict > 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Trung phong hoc trong cung hoc ky.';
  END IF;
END$$

-- =====================================================================
-- Trigger 2 (BTL2 2.2.2): derived attribute Assignment.SubmissionCount
-- DML that can change it: INSERT, DELETE, and UPDATE on Submission
-- (including moving a submission to another assignment).
-- =====================================================================
DROP TRIGGER IF EXISTS `trg_submission_count_ai`$$
CREATE TRIGGER `trg_submission_count_ai`
AFTER INSERT ON `Submission`
FOR EACH ROW
BEGIN
  UPDATE `Assignment`
     SET `SubmissionCount` = (
       SELECT COUNT(*) FROM `Submission`
        WHERE `AssignmentID` = NEW.`AssignmentID`
     )
   WHERE `AssessmentID` = NEW.`AssignmentID`;
END$$

DROP TRIGGER IF EXISTS `trg_submission_count_ad`$$
CREATE TRIGGER `trg_submission_count_ad`
AFTER DELETE ON `Submission`
FOR EACH ROW
BEGIN
  UPDATE `Assignment`
     SET `SubmissionCount` = (
       SELECT COUNT(*) FROM `Submission`
        WHERE `AssignmentID` = OLD.`AssignmentID`
     )
   WHERE `AssessmentID` = OLD.`AssignmentID`;
END$$

DROP TRIGGER IF EXISTS `trg_submission_count_au`$$
CREATE TRIGGER `trg_submission_count_au`
AFTER UPDATE ON `Submission`
FOR EACH ROW
BEGIN
  UPDATE `Assignment`
     SET `SubmissionCount` = (
       SELECT COUNT(*) FROM `Submission`
        WHERE `AssignmentID` = OLD.`AssignmentID`
     )
   WHERE `AssessmentID` = OLD.`AssignmentID`;

  IF NEW.`AssignmentID` <> OLD.`AssignmentID` THEN
    UPDATE `Assignment`
       SET `SubmissionCount` = (
         SELECT COUNT(*) FROM `Submission`
          WHERE `AssignmentID` = NEW.`AssignmentID`
       )
     WHERE `AssessmentID` = NEW.`AssignmentID`;
  END IF;
END$$

-- =====================================================================
-- Additional integrity triggers for cross-row rules that CHECK cannot
-- express. They are part of the database foundation, not replacements
-- for the two required BTL2 triggers above.
-- =====================================================================
DROP TRIGGER IF EXISTS `trg_enrollment_capacity_bi`$$
CREATE TRIGGER `trg_enrollment_capacity_bi`
BEFORE INSERT ON `Enrollment`
FOR EACH ROW
BEGIN
  DECLARE v_capacity INT DEFAULT 0;
  DECLARE v_active INT DEFAULT 0;
  DECLARE v_status VARCHAR(20);

  SELECT `Capacity`, `SectionStatus` INTO v_capacity, v_status
    FROM `CourseSection`
   WHERE `SectionID` = NEW.`SectionID`;

  IF v_status IN ('CLOSED', 'CANCELLED') THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Lop hoc phan khong mo de ghi danh.';
  END IF;

  IF NEW.`EnrollmentStatus` = 'ACTIVE' THEN
    SELECT COUNT(*) INTO v_active
      FROM `Enrollment`
     WHERE `SectionID` = NEW.`SectionID`
       AND `EnrollmentStatus` = 'ACTIVE';

    IF v_active >= v_capacity THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lop hoc phan da du si so.';
    END IF;
  END IF;
END$$

DROP TRIGGER IF EXISTS `trg_enrollment_capacity_bu`$$
CREATE TRIGGER `trg_enrollment_capacity_bu`
BEFORE UPDATE ON `Enrollment`
FOR EACH ROW
BEGIN
  DECLARE v_capacity INT DEFAULT 0;
  DECLARE v_active INT DEFAULT 0;
  DECLARE v_status VARCHAR(20);

  SELECT `Capacity`, `SectionStatus` INTO v_capacity, v_status
    FROM `CourseSection`
   WHERE `SectionID` = NEW.`SectionID`;

  IF v_status IN ('CLOSED', 'CANCELLED') THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Lop hoc phan khong mo de ghi danh.';
  END IF;

  IF NEW.`EnrollmentStatus` = 'ACTIVE' THEN
    SELECT COUNT(*) INTO v_active
      FROM `Enrollment`
     WHERE `SectionID` = NEW.`SectionID`
       AND `EnrollmentStatus` = 'ACTIVE'
       AND `EnrollmentID` <> OLD.`EnrollmentID`;

    IF v_active >= v_capacity THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lop hoc phan da du si so.';
    END IF;
  END IF;
END$$

DROP TRIGGER IF EXISTS `trg_submission_validate_bi`$$
CREATE TRIGGER `trg_submission_validate_bi`
BEFORE INSERT ON `Submission`
FOR EACH ROW
BEGIN
  DECLARE v_exists INT DEFAULT 0;
  DECLARE v_section_id INT DEFAULT 0;
  DECLARE v_open_date DATETIME;
  DECLARE v_due_date DATETIME;
  DECLARE v_allow_late BOOLEAN DEFAULT FALSE;
  DECLARE v_max_score DECIMAL(6,2) DEFAULT 0;
  DECLARE v_max_attempts INT DEFAULT NULL;
  DECLARE v_instructor INT DEFAULT NULL;

  SELECT COUNT(*) INTO v_exists
    FROM `Assignment`
   WHERE `AssessmentID` = NEW.`AssignmentID`;

  IF v_exists = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Bai tap khong ton tai.';
  END IF;

  SELECT a.`SectionID`, asg.`OpenDate`, asg.`DueDate`,
         asg.`AllowLateSubmission`, a.`MaxScore`, a.`MaxAttempts`
    INTO v_section_id, v_open_date, v_due_date, v_allow_late,
         v_max_score, v_max_attempts
    FROM `Assignment` asg
    JOIN `Assessment` a ON a.`AssessmentID` = asg.`AssessmentID`
   WHERE asg.`AssessmentID` = NEW.`AssignmentID`;

  IF NOT EXISTS (
    SELECT 1 FROM `Enrollment`
     WHERE `StudentID` = NEW.`StudentID`
       AND `SectionID` = v_section_id
       AND `EnrollmentStatus` = 'ACTIVE'
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Sinh vien chua ghi danh ACTIVE trong lop cua bai tap.';
  END IF;

  IF NEW.`SubmittedAt` < v_open_date THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Khong duoc nop bai truoc thoi diem mo.';
  END IF;

  IF NEW.`SubmittedAt` > v_due_date AND v_allow_late = FALSE THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Bai tap khong cho phep nop muon.';
  END IF;

  IF v_max_attempts IS NOT NULL AND NEW.`AttemptNo` > v_max_attempts THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'So lan nop vuot qua MaxAttempts.';
  END IF;

  IF NEW.`Score` IS NOT NULL AND NEW.`Score` > v_max_score THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Diem bai nop vuot qua MaxScore.';
  END IF;

  IF NEW.`GradedByStaffID` IS NOT NULL THEN
    SELECT `PrimaryInstructorID` INTO v_instructor
      FROM `CourseSection`
     WHERE `SectionID` = v_section_id;

    IF v_instructor IS NULL OR v_instructor <> NEW.`GradedByStaffID` THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Chi giang vien phu trach chinh duoc cham bai.';
    END IF;
  END IF;
END$$

DROP TRIGGER IF EXISTS `trg_submission_validate_bu`$$
CREATE TRIGGER `trg_submission_validate_bu`
BEFORE UPDATE ON `Submission`
FOR EACH ROW
BEGIN
  DECLARE v_exists INT DEFAULT 0;
  DECLARE v_section_id INT DEFAULT 0;
  DECLARE v_open_date DATETIME;
  DECLARE v_due_date DATETIME;
  DECLARE v_allow_late BOOLEAN DEFAULT FALSE;
  DECLARE v_max_score DECIMAL(6,2) DEFAULT 0;
  DECLARE v_max_attempts INT DEFAULT NULL;
  DECLARE v_instructor INT DEFAULT NULL;

  SELECT COUNT(*) INTO v_exists
    FROM `Assignment`
   WHERE `AssessmentID` = NEW.`AssignmentID`;

  IF v_exists = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Bai tap khong ton tai.';
  END IF;

  SELECT a.`SectionID`, asg.`OpenDate`, asg.`DueDate`,
         asg.`AllowLateSubmission`, a.`MaxScore`, a.`MaxAttempts`
    INTO v_section_id, v_open_date, v_due_date, v_allow_late,
         v_max_score, v_max_attempts
    FROM `Assignment` asg
    JOIN `Assessment` a ON a.`AssessmentID` = asg.`AssessmentID`
   WHERE asg.`AssessmentID` = NEW.`AssignmentID`;

  IF NOT EXISTS (
    SELECT 1 FROM `Enrollment`
     WHERE `StudentID` = NEW.`StudentID`
       AND `SectionID` = v_section_id
       AND `EnrollmentStatus` = 'ACTIVE'
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Sinh vien chua ghi danh ACTIVE trong lop cua bai tap.';
  END IF;

  IF NEW.`SubmittedAt` < v_open_date THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Khong duoc nop bai truoc thoi diem mo.';
  END IF;

  IF NEW.`SubmittedAt` > v_due_date AND v_allow_late = FALSE THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Bai tap khong cho phep nop muon.';
  END IF;

  IF v_max_attempts IS NOT NULL AND NEW.`AttemptNo` > v_max_attempts THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'So lan nop vuot qua MaxAttempts.';
  END IF;

  IF NEW.`Score` IS NOT NULL AND NEW.`Score` > v_max_score THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Diem bai nop vuot qua MaxScore.';
  END IF;

  IF NEW.`GradedByStaffID` IS NOT NULL THEN
    SELECT `PrimaryInstructorID` INTO v_instructor
      FROM `CourseSection`
     WHERE `SectionID` = v_section_id;

    IF v_instructor IS NULL OR v_instructor <> NEW.`GradedByStaffID` THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Chi giang vien phu trach chinh duoc cham bai.';
    END IF;
  END IF;
END$$

DROP TRIGGER IF EXISTS `trg_grade_validate_bi`$$
CREATE TRIGGER `trg_grade_validate_bi`
BEFORE INSERT ON `Grade`
FOR EACH ROW
BEGIN
  DECLARE v_enrollment_section INT DEFAULT 0;
  DECLARE v_assessment_section INT DEFAULT 0;
  DECLARE v_max_score DECIMAL(6,2) DEFAULT 0;
  DECLARE v_status VARCHAR(20);
  DECLARE v_instructor INT DEFAULT NULL;

  SELECT e.`SectionID`, e.`EnrollmentStatus`
    INTO v_enrollment_section, v_status
    FROM `Enrollment` e
   WHERE e.`EnrollmentID` = NEW.`EnrollmentID`;

  SELECT a.`SectionID`, a.`MaxScore`
    INTO v_assessment_section, v_max_score
    FROM `Assessment` a
   WHERE a.`AssessmentID` = NEW.`AssessmentID`;

  IF v_enrollment_section <> v_assessment_section THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Ghi danh va hoat dong danh gia phai cung mot lop.';
  END IF;

  IF v_status = 'DROPPED' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Khong the ghi diem cho ghi danh da rut.';
  END IF;

  IF NEW.`Score` > v_max_score THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Diem vuot qua MaxScore cua hoat dong danh gia.';
  END IF;

  SELECT `PrimaryInstructorID` INTO v_instructor
    FROM `CourseSection`
   WHERE `SectionID` = v_assessment_section;

  IF v_instructor IS NULL OR v_instructor <> NEW.`GradedByStaffID` THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Chi giang vien phu trach chinh duoc ghi diem.';
  END IF;
END$$

DROP TRIGGER IF EXISTS `trg_grade_validate_bu`$$
CREATE TRIGGER `trg_grade_validate_bu`
BEFORE UPDATE ON `Grade`
FOR EACH ROW
BEGIN
  DECLARE v_enrollment_section INT DEFAULT 0;
  DECLARE v_assessment_section INT DEFAULT 0;
  DECLARE v_max_score DECIMAL(6,2) DEFAULT 0;
  DECLARE v_status VARCHAR(20);
  DECLARE v_instructor INT DEFAULT NULL;

  SELECT e.`SectionID`, e.`EnrollmentStatus`
    INTO v_enrollment_section, v_status
    FROM `Enrollment` e
   WHERE e.`EnrollmentID` = NEW.`EnrollmentID`;

  SELECT a.`SectionID`, a.`MaxScore`
    INTO v_assessment_section, v_max_score
    FROM `Assessment` a
   WHERE a.`AssessmentID` = NEW.`AssessmentID`;

  IF v_enrollment_section <> v_assessment_section THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Ghi danh va hoat dong danh gia phai cung mot lop.';
  END IF;

  IF v_status = 'DROPPED' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Khong the ghi diem cho ghi danh da rut.';
  END IF;

  IF NEW.`Score` > v_max_score THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Diem vuot qua MaxScore cua hoat dong danh gia.';
  END IF;

  SELECT `PrimaryInstructorID` INTO v_instructor
    FROM `CourseSection`
   WHERE `SectionID` = v_assessment_section;

  IF v_instructor IS NULL OR v_instructor <> NEW.`GradedByStaffID` THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Chi giang vien phu trach chinh duoc ghi diem.';
  END IF;
END$$

DROP TRIGGER IF EXISTS `trg_feedback_validate_bi`$$
CREATE TRIGGER `trg_feedback_validate_bi`
BEFORE INSERT ON `Feedback`
FOR EACH ROW
BEGIN
  DECLARE v_parent_submission INT DEFAULT NULL;
  DECLARE v_student_id INT DEFAULT NULL;
  DECLARE v_instructor INT DEFAULT NULL;
  DECLARE v_section_id INT DEFAULT NULL;

  SELECT s.`StudentID`, cs.`SectionID`, cs.`PrimaryInstructorID`
    INTO v_student_id, v_section_id, v_instructor
    FROM `Submission` s
    JOIN `Assignment` asg ON asg.`AssessmentID` = s.`AssignmentID`
    JOIN `Assessment` a ON a.`AssessmentID` = asg.`AssessmentID`
    JOIN `CourseSection` cs ON cs.`SectionID` = a.`SectionID`
   WHERE s.`SubmissionID` = NEW.`SubmissionID`;

  IF NEW.`AuthorID` <> v_student_id AND
     (v_instructor IS NULL OR NEW.`AuthorID` <> v_instructor) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Chi sinh vien nop bai hoac giang vien phu trach duoc phan hoi.';
  END IF;

  IF NEW.`ParentFeedbackID` IS NOT NULL THEN
    SELECT `SubmissionID` INTO v_parent_submission
      FROM `Feedback`
     WHERE `FeedbackID` = NEW.`ParentFeedbackID`;

    IF v_parent_submission <> NEW.`SubmissionID` THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Phan hoi cha va con phai cung mot bai nop.';
    END IF;
  END IF;
END$$

DROP TRIGGER IF EXISTS `trg_feedback_validate_bu`$$
CREATE TRIGGER `trg_feedback_validate_bu`
BEFORE UPDATE ON `Feedback`
FOR EACH ROW
BEGIN
  DECLARE v_parent_submission INT DEFAULT NULL;
  DECLARE v_student_id INT DEFAULT NULL;
  DECLARE v_instructor INT DEFAULT NULL;
  DECLARE v_section_id INT DEFAULT NULL;

  SELECT s.`StudentID`, cs.`SectionID`, cs.`PrimaryInstructorID`
    INTO v_student_id, v_section_id, v_instructor
    FROM `Submission` s
    JOIN `Assignment` asg ON asg.`AssessmentID` = s.`AssignmentID`
    JOIN `Assessment` a ON a.`AssessmentID` = asg.`AssessmentID`
    JOIN `CourseSection` cs ON cs.`SectionID` = a.`SectionID`
   WHERE s.`SubmissionID` = NEW.`SubmissionID`;

  IF NEW.`AuthorID` <> v_student_id AND
     (v_instructor IS NULL OR NEW.`AuthorID` <> v_instructor) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Chi sinh vien nop bai hoac giang vien phu trach duoc phan hoi.';
  END IF;

  IF NEW.`ParentFeedbackID` IS NOT NULL THEN
    IF NEW.`ParentFeedbackID` = NEW.`FeedbackID` THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Phan hoi khong duoc tu tra loi chinh no.';
    END IF;

    SELECT `SubmissionID` INTO v_parent_submission
      FROM `Feedback`
     WHERE `FeedbackID` = NEW.`ParentFeedbackID`;

    IF v_parent_submission <> NEW.`SubmissionID` THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Phan hoi cha va con phai cung mot bai nop.';
    END IF;
  END IF;
END$$

DELIMITER ;
