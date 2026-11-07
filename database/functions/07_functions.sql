USE `hcmut_lms`;

-- =====================================================================
-- BTL2 section 2.4: two stored functions.
-- Both use a cursor, IF/LOOP, input validation, a query, and calculation.
-- =====================================================================
DELIMITER $$

-- ---------------------------------------------------------------------
-- fn_CalculateAssignmentCompletionRate
-- Completion = distinct ACTIVE enrolled students who submitted at least
-- one SUBMITTED attempt / all ACTIVE enrolled students * 100.
-- Returns 0.00 when there are no eligible students.
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS `fn_CalculateAssignmentCompletionRate`$$
CREATE FUNCTION `fn_CalculateAssignmentCompletionRate`(
  p_assignment_id INT
)
RETURNS DECIMAL(5,2)
READS SQL DATA
BEGIN
  DECLARE v_section_id INT DEFAULT NULL;
  DECLARE v_student_id INT DEFAULT NULL;
  DECLARE v_total INT DEFAULT 0;
  DECLARE v_submitted INT DEFAULT 0;
  DECLARE v_has_submission INT DEFAULT 0;
  DECLARE v_done BOOLEAN DEFAULT FALSE;

  DECLARE cur_enrolled CURSOR FOR
    SELECT e.`StudentID`
      FROM `Enrollment` e
     WHERE e.`SectionID` = v_section_id
       AND e.`EnrollmentStatus` = 'ACTIVE'
     ORDER BY e.`StudentID`;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

  IF p_assignment_id IS NULL OR p_assignment_id <= 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'AssignmentID phai la so nguyen duong.';
  END IF;

  SELECT MAX(a.`SectionID`) INTO v_section_id
    FROM `Assignment` asg
    JOIN `Assessment` a ON a.`AssessmentID` = asg.`AssessmentID`
   WHERE asg.`AssessmentID` = p_assignment_id;

  IF v_section_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Khong tim thay bai tap can tinh ty le hoan thanh.';
  END IF;

  OPEN cur_enrolled;

  enrollment_loop: LOOP
    FETCH cur_enrolled INTO v_student_id;
    IF v_done THEN
      LEAVE enrollment_loop;
    END IF;

    SET v_total = v_total + 1;

    SELECT COUNT(*) INTO v_has_submission
      FROM `Submission` s
     WHERE s.`AssignmentID` = p_assignment_id
       AND s.`StudentID` = v_student_id
       AND s.`SubmissionStatus` = 'SUBMITTED';

    IF v_has_submission > 0 THEN
      SET v_submitted = v_submitted + 1;
    END IF;
  END LOOP;

  CLOSE cur_enrolled;

  IF v_total = 0 THEN
    RETURN 0.00;
  END IF;

  RETURN ROUND(v_submitted * 100.0 / v_total, 2);
END$$

-- ---------------------------------------------------------------------
-- fn_CalculateStudentAverageScore
-- Internal analysis metric: arithmetic mean of published assessment
-- percentages. This is NOT the official HCMUT course-grade formula.
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS `fn_CalculateStudentAverageScore`$$
CREATE FUNCTION `fn_CalculateStudentAverageScore`(
  p_enrollment_id INT
)
RETURNS DECIMAL(5,2)
READS SQL DATA
BEGIN
  DECLARE v_exists INT DEFAULT 0;
  DECLARE v_grade_count INT DEFAULT 0;
  DECLARE v_percent DECIMAL(8,4) DEFAULT 0;
  DECLARE v_sum DECIMAL(12,4) DEFAULT 0;
  DECLARE v_done BOOLEAN DEFAULT FALSE;

  DECLARE cur_grades CURSOR FOR
    SELECT (g.`Score` * 100.0 / a.`MaxScore`)
      FROM `Grade` g
      JOIN `Assessment` a ON a.`AssessmentID` = g.`AssessmentID`
     WHERE g.`EnrollmentID` = p_enrollment_id
       AND g.`IsPublished` = TRUE
     ORDER BY g.`GradeID`;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

  IF p_enrollment_id IS NULL OR p_enrollment_id <= 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'EnrollmentID phai la so nguyen duong.';
  END IF;

  SELECT COUNT(*) INTO v_exists
    FROM `Enrollment`
   WHERE `EnrollmentID` = p_enrollment_id;

  IF v_exists = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Khong tim thay ghi danh can tinh diem trung binh.';
  END IF;

  OPEN cur_grades;

  grade_loop: LOOP
    FETCH cur_grades INTO v_percent;
    IF v_done THEN
      LEAVE grade_loop;
    END IF;

    SET v_sum = v_sum + v_percent;
    SET v_grade_count = v_grade_count + 1;
  END LOOP;

  CLOSE cur_grades;

  IF v_grade_count = 0 THEN
    RETURN 0.00;
  END IF;

  RETURN ROUND(v_sum / v_grade_count, 2);
END$$

DELIMITER ;
