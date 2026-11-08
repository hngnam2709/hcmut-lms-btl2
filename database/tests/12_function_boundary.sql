USE `hcmut_lms`;

-- BTL2 2.4: boundary and normal cases for both stored functions.
DROP PROCEDURE IF EXISTS `tmp_assert`;
DELIMITER $$
CREATE PROCEDURE `tmp_assert`(IN p_ok INT)
BEGIN
  IF p_ok = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Assertion failed in 12_function_boundary.sql';
  END IF;
END$$
DELIMITER ;

START TRANSACTION;

SET @rate_normal = `fn_CalculateAssignmentCompletionRate`(1);
SET @rate_zero = `fn_CalculateAssignmentCompletionRate`(6);
SET @average_normal = `fn_CalculateStudentAverageScore`(1);
SET @average_zero = `fn_CalculateStudentAverageScore`(8);

CALL `tmp_assert`(@rate_normal = 100.00);
CALL `tmp_assert`(@rate_zero = 0.00);
CALL `tmp_assert`(@average_normal = 82.50);
CALL `tmp_assert`(@average_zero = 0.00);

ROLLBACK;
DROP PROCEDURE `tmp_assert`;

SELECT 'function boundary: PASS' AS result;
