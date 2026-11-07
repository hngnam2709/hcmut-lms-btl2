USE `hcmut_lms`;

-- =====================================================================
-- BTL2 section 2.1: CRUD procedures on Enrollment
-- BTL2 section 2.3: two read-only query procedures
-- MySQL 8.0+ syntax.
-- =====================================================================
DELIMITER $$

-- ---------------------------------------------------------------------
-- sp_InsertEnrollment
-- Validates account/student, section, duplicate, and capacity before insert.
-- The section row is locked so concurrent inserts cannot oversell capacity.
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_InsertEnrollment`$$
CREATE PROCEDURE `sp_InsertEnrollment`(
  IN p_student_id INT,
  IN p_section_id INT,
  IN p_enrollment_status VARCHAR(20)
)
BEGIN
  DECLARE v_exists INT DEFAULT 0;
  DECLARE v_status VARCHAR(20);
  DECLARE v_section_status VARCHAR(20);
  DECLARE v_capacity INT DEFAULT 0;
  DECLARE v_active_count INT DEFAULT 0;
  DECLARE v_new_id INT DEFAULT 0;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF p_student_id IS NULL OR p_student_id <= 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'StudentID phai la so nguyen duong.';
  END IF;

  IF p_section_id IS NULL OR p_section_id <= 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'SectionID phai la so nguyen duong.';
  END IF;

  SET v_status = COALESCE(p_enrollment_status, 'ACTIVE');
  IF v_status NOT IN ('ACTIVE', 'DROPPED', 'COMPLETED') THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'EnrollmentStatus chi nhan ACTIVE, DROPPED hoac COMPLETED.';
  END IF;

  START TRANSACTION;

  SELECT COUNT(*) INTO v_exists
    FROM `Student` s
    JOIN `UserAccount` u ON u.`UserID` = s.`UserID`
   WHERE s.`UserID` = p_student_id
     AND u.`AccountStatus` = 'ACTIVE';

  IF v_exists = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Sinh vien khong ton tai hoac tai khoan khong hoat dong.';
  END IF;

  SELECT COUNT(*) INTO v_exists
    FROM `CourseSection`
   WHERE `SectionID` = p_section_id;

  IF v_exists = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Lop hoc phan khong ton tai.';
  END IF;

  SELECT `Capacity`, `SectionStatus`
    INTO v_capacity, v_section_status
    FROM `CourseSection`
   WHERE `SectionID` = p_section_id
   FOR UPDATE;

  IF v_section_status <> 'OPEN' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Lop hoc phan khong o trang thai OPEN.';
  END IF;

  SELECT COUNT(*) INTO v_exists
    FROM `Enrollment`
   WHERE `StudentID` = p_student_id
     AND `SectionID` = p_section_id;

  IF v_exists > 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Sinh vien da co ghi danh trong lop nay.';
  END IF;

  IF v_status = 'ACTIVE' THEN
    SELECT COUNT(*) INTO v_active_count
      FROM `Enrollment`
     WHERE `SectionID` = p_section_id
       AND `EnrollmentStatus` = 'ACTIVE';

    IF v_active_count >= v_capacity THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lop hoc phan da du si so, khong the ghi danh.';
    END IF;
  END IF;

  INSERT INTO `Enrollment` (`StudentID`, `SectionID`, `EnrollmentDate`, `EnrollmentStatus`)
  VALUES (p_student_id, p_section_id, CURRENT_TIMESTAMP, v_status);

  SET v_new_id = LAST_INSERT_ID();
  COMMIT;

  SELECT 1 AS success, v_new_id AS EnrollmentID,
         'Ghi danh thanh cong.' AS message;
END$$

-- ---------------------------------------------------------------------
-- sp_UpdateEnrollment
-- StudentID is immutable; SectionID and status may be changed with checks.
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_UpdateEnrollment`$$
CREATE PROCEDURE `sp_UpdateEnrollment`(
  IN p_enrollment_id INT,
  IN p_section_id INT,
  IN p_enrollment_status VARCHAR(20)
)
BEGIN
  DECLARE v_exists INT DEFAULT 0;
  DECLARE v_student_id INT DEFAULT 0;
  DECLARE v_old_section INT DEFAULT 0;
  DECLARE v_old_status VARCHAR(20);
  DECLARE v_new_section INT DEFAULT 0;
  DECLARE v_new_status VARCHAR(20);
  DECLARE v_capacity INT DEFAULT 0;
  DECLARE v_section_status VARCHAR(20);
  DECLARE v_active_count INT DEFAULT 0;
  DECLARE v_grade_count INT DEFAULT 0;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF p_enrollment_id IS NULL OR p_enrollment_id <= 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'EnrollmentID phai la so nguyen duong.';
  END IF;

  START TRANSACTION;

  SELECT COUNT(*) INTO v_exists
    FROM `Enrollment`
   WHERE `EnrollmentID` = p_enrollment_id;

  IF v_exists = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Khong tim thay ghi danh can cap nhat.';
  END IF;

  SELECT `StudentID`, `SectionID`, `EnrollmentStatus`
    INTO v_student_id, v_old_section, v_old_status
    FROM `Enrollment`
   WHERE `EnrollmentID` = p_enrollment_id
   FOR UPDATE;

  SET v_new_section = COALESCE(p_section_id, v_old_section);
  SET v_new_status = COALESCE(p_enrollment_status, v_old_status);

  IF v_new_status NOT IN ('ACTIVE', 'DROPPED', 'COMPLETED') THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'EnrollmentStatus chi nhan ACTIVE, DROPPED hoac COMPLETED.';
  END IF;

  SELECT COUNT(*) INTO v_exists
    FROM `CourseSection`
   WHERE `SectionID` = v_new_section;

  IF v_exists = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Lop hoc phan moi khong ton tai.';
  END IF;

  SELECT `Capacity`, `SectionStatus`
    INTO v_capacity, v_section_status
    FROM `CourseSection`
   WHERE `SectionID` = v_new_section
   FOR UPDATE;

  SELECT COUNT(*) INTO v_grade_count
    FROM `Grade`
   WHERE `EnrollmentID` = p_enrollment_id;

  IF v_new_section <> v_old_section THEN
    IF v_grade_count > 0 THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Khong the chuyen lop khi ghi danh da co diem.';
    END IF;

    SELECT COUNT(*) INTO v_exists
      FROM `Enrollment`
     WHERE `StudentID` = v_student_id
       AND `SectionID` = v_new_section
       AND `EnrollmentID` <> p_enrollment_id;

    IF v_exists > 0 THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Sinh vien da co ghi danh trong lop moi.';
    END IF;
  END IF;

  IF v_new_status = 'ACTIVE' THEN
    IF v_section_status <> 'OPEN' THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Chi co the kich hoat ghi danh trong lop OPEN.';
    END IF;

    SELECT COUNT(*) INTO v_active_count
      FROM `Enrollment`
     WHERE `SectionID` = v_new_section
       AND `EnrollmentStatus` = 'ACTIVE'
       AND `EnrollmentID` <> p_enrollment_id;

    IF v_active_count >= v_capacity THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lop hoc phan da du si so.';
    END IF;
  END IF;

  IF v_new_status = 'DROPPED' AND v_grade_count > 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Khong the rut mon khi ghi danh da co diem.';
  END IF;

  UPDATE `Enrollment`
     SET `SectionID` = v_new_section,
         `EnrollmentStatus` = v_new_status
   WHERE `EnrollmentID` = p_enrollment_id;

  COMMIT;

  SELECT 1 AS success, p_enrollment_id AS EnrollmentID,
         'Cap nhat ghi danh thanh cong.' AS message;
END$$

-- ---------------------------------------------------------------------
-- sp_DeleteEnrollment
-- Hard delete is allowed only when no Grade depends on the enrollment.
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_DeleteEnrollment`$$
CREATE PROCEDURE `sp_DeleteEnrollment`(IN p_enrollment_id INT)
BEGIN
  DECLARE v_exists INT DEFAULT 0;
  DECLARE v_grade_count INT DEFAULT 0;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF p_enrollment_id IS NULL OR p_enrollment_id <= 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'EnrollmentID phai la so nguyen duong.';
  END IF;

  START TRANSACTION;

  SELECT COUNT(*) INTO v_exists
    FROM `Enrollment`
   WHERE `EnrollmentID` = p_enrollment_id;

  IF v_exists = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Khong tim thay ghi danh can xoa.';
  END IF;

  SELECT COUNT(*) INTO v_grade_count
    FROM `Grade`
   WHERE `EnrollmentID` = p_enrollment_id
   FOR UPDATE;

  IF v_grade_count > 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Khong the xoa ghi danh da co diem. Hay giu lich su hoc tap.';
  END IF;

  DELETE FROM `Enrollment`
   WHERE `EnrollmentID` = p_enrollment_id;

  COMMIT;

  SELECT 1 AS success, p_enrollment_id AS EnrollmentID,
         'Xoa ghi danh thanh cong.' AS message;
END$$

-- ---------------------------------------------------------------------
-- sp_GetStudentEnrollments
-- Dynamic filters are NULL-tolerant. LIMIT/OFFSET are validated.
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_GetStudentEnrollments`$$
CREATE PROCEDURE `sp_GetStudentEnrollments`(
  IN p_student_id INT,
  IN p_semester_id INT,
  IN p_status VARCHAR(20),
  IN p_limit INT,
  IN p_offset INT
)
BEGIN
  DECLARE v_limit INT DEFAULT 200;
  DECLARE v_offset INT DEFAULT 0;

  IF p_student_id IS NOT NULL AND p_student_id <= 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'StudentID phai la so nguyen duong hoac NULL.';
  END IF;

  IF p_semester_id IS NOT NULL AND p_semester_id <= 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'SemesterID phai la so nguyen duong hoac NULL.';
  END IF;

  IF p_status IS NOT NULL AND p_status NOT IN ('ACTIVE', 'DROPPED', 'COMPLETED') THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'EnrollmentStatus loc khong hop le.';
  END IF;

  SET v_limit = COALESCE(p_limit, 200);
  SET v_offset = COALESCE(p_offset, 0);

  IF v_limit < 1 OR v_limit > 500 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'p_limit phai trong khoang 1..500.';
  END IF;

  IF v_offset < 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'p_offset khong duoc am.';
  END IF;

  SELECT
    e.`EnrollmentID`,
    e.`StudentID`,
    s.`StudentCode`,
    u.`FullName` AS StudentName,
    e.`SectionID`,
    cs.`SectionCode`,
    cs.`SemesterID`,
    sem.`AcademicYear`,
    sem.`TermNo`,
    c.`CourseID`,
    c.`CourseCode`,
    c.`CourseName`,
    cc.`ComponentType`,
    cs.`DayOfWeek`,
    cs.`StartTime`,
    cs.`EndTime`,
    cs.`RoomCode`,
    cs.`Capacity`,
    e.`EnrollmentDate`,
    e.`EnrollmentStatus`
  FROM `Enrollment` e
  JOIN `Student` s ON s.`UserID` = e.`StudentID`
  JOIN `UserAccount` u ON u.`UserID` = s.`UserID`
  JOIN `CourseSection` cs ON cs.`SectionID` = e.`SectionID`
  JOIN `CourseComponent` cc ON cc.`ComponentID` = cs.`ComponentID`
  JOIN `Course` c ON c.`CourseID` = cc.`CourseID`
  JOIN `Semester` sem ON sem.`SemesterID` = cs.`SemesterID`
  WHERE (p_student_id IS NULL OR e.`StudentID` = p_student_id)
    AND (p_semester_id IS NULL OR cs.`SemesterID` = p_semester_id)
    AND (p_status IS NULL OR e.`EnrollmentStatus` = p_status)
  ORDER BY sem.`AcademicYear` DESC, sem.`TermNo` DESC,
           c.`CourseCode`, cs.`SectionCode`, e.`EnrollmentID`
  LIMIT v_limit OFFSET v_offset;
END$$

-- ---------------------------------------------------------------------
-- sp_GetAssignmentStatistics
-- One active-enrollment row per student prevents join multiplication.
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_GetAssignmentStatistics`$$
CREATE PROCEDURE `sp_GetAssignmentStatistics`(
  IN p_section_id INT,
  IN p_semester_id INT,
  IN p_min_submissions INT
)
BEGIN
  IF p_section_id IS NOT NULL AND p_section_id <= 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'SectionID phai la so nguyen duong hoac NULL.';
  END IF;

  IF p_semester_id IS NOT NULL AND p_semester_id <= 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'SemesterID phai la so nguyen duong hoac NULL.';
  END IF;

  IF p_min_submissions IS NOT NULL AND p_min_submissions < 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'p_min_submissions khong duoc am.';
  END IF;

  SELECT
    a.`AssessmentID` AS AssignmentID,
    ass.`Title` AS AssignmentTitle,
    ass.`SectionID`,
    cs.`SectionCode`,
    c.`CourseCode`,
    c.`CourseName`,
    sem.`AcademicYear`,
    sem.`TermNo`,
    COUNT(DISTINCT e.`StudentID`) AS EligibleStudentCount,
    COUNT(DISTINCT s.`StudentID`) AS SubmittedStudentCount,
    COUNT(s.`SubmissionID`) AS SubmissionCount,
    COUNT(DISTINCT e.`StudentID`) - COUNT(DISTINCT s.`StudentID`) AS MissingStudentCount,
    CASE
      WHEN COUNT(DISTINCT e.`StudentID`) = 0 THEN 0.00
      ELSE ROUND(COUNT(DISTINCT s.`StudentID`) * 100.0 /
                 COUNT(DISTINCT e.`StudentID`), 2)
    END AS CompletionRate,
    MAX(s.`SubmittedAt`) AS LastSubmittedAt
  FROM `Assignment` a
  JOIN `Assessment` ass ON ass.`AssessmentID` = a.`AssessmentID`
  JOIN `CourseSection` cs ON cs.`SectionID` = ass.`SectionID`
  JOIN `Semester` sem ON sem.`SemesterID` = cs.`SemesterID`
  JOIN `CourseComponent` cc ON cc.`ComponentID` = cs.`ComponentID`
  JOIN `Course` c ON c.`CourseID` = cc.`CourseID`
  LEFT JOIN `Enrollment` e
    ON e.`SectionID` = cs.`SectionID`
   AND e.`EnrollmentStatus` = 'ACTIVE'
  LEFT JOIN `Submission` s
    ON s.`AssignmentID` = a.`AssessmentID`
   AND s.`StudentID` = e.`StudentID`
   AND s.`SubmissionStatus` = 'SUBMITTED'
  WHERE (p_section_id IS NULL OR cs.`SectionID` = p_section_id)
    AND (p_semester_id IS NULL OR cs.`SemesterID` = p_semester_id)
  GROUP BY
    a.`AssessmentID`, ass.`Title`, ass.`SectionID`, cs.`SectionCode`,
    c.`CourseCode`, c.`CourseName`, sem.`AcademicYear`, sem.`TermNo`
  HAVING COUNT(s.`SubmissionID`) >= COALESCE(p_min_submissions, 0)
  ORDER BY CompletionRate DESC, c.`CourseCode`, cs.`SectionCode`, a.`AssessmentID`;
END$$

DELIMITER ;
