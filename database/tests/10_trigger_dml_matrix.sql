USE `hcmut_lms`;

-- BTL2 2.2.2: derive Assignment.SubmissionCount for INSERT, UPDATE and
-- DELETE, including moving a submission to another assignment and a
-- multi-row INSERT. Every assertion fails loudly through tmp_assert.
DROP PROCEDURE IF EXISTS `tmp_assert`;
DELIMITER $$
CREATE PROCEDURE `tmp_assert`(IN p_ok INT)
BEGIN
  IF p_ok = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Assertion failed in 10_trigger_dml_matrix.sql';
  END IF;
END$$
DELIMITER ;

START TRANSACTION;

SET @a1 = (SELECT `SubmissionCount` FROM `Assignment` WHERE `AssessmentID` = 1);
SET @a2 = (SELECT `SubmissionCount` FROM `Assignment` WHERE `AssessmentID` = 2);

-- Multi-row INSERT: trigger must run once per inserted row.
INSERT INTO `Submission`
  (`AssignmentID`, `StudentID`, `AttemptNo`, `SubmittedAt`, `SubmissionStatus`)
VALUES
  (1, 102, 2, '2026-09-20 10:00:00', 'SUBMITTED'),
  (1, 103, 2, '2026-09-20 10:00:00', 'SUBMITTED');

CALL `tmp_assert`((SELECT `SubmissionCount` FROM `Assignment` WHERE `AssessmentID` = 1) = @a1 + 2);

-- UPDATE that moves the foreign key: subtract from old assignment, add to new.
SET @moved_id = (
  SELECT `SubmissionID` FROM `Submission`
   WHERE `AssignmentID` = 1 AND `StudentID` = 102 AND `AttemptNo` = 2
);
UPDATE `Submission` SET `AssignmentID` = 2 WHERE `SubmissionID` = @moved_id;

CALL `tmp_assert`((SELECT `SubmissionCount` FROM `Assignment` WHERE `AssessmentID` = 1) = @a1 + 1);
CALL `tmp_assert`((SELECT `SubmissionCount` FROM `Assignment` WHERE `AssessmentID` = 2) = @a2 + 1);

-- UPDATE of a non-key column must keep the derived value consistent.
UPDATE `Submission` SET `SubmissionStatus` = 'SUBMITTED' WHERE `SubmissionID` = @moved_id;
CALL `tmp_assert`((SELECT `SubmissionCount` FROM `Assignment` WHERE `AssessmentID` = 1) = @a1 + 1);
CALL `tmp_assert`((SELECT `SubmissionCount` FROM `Assignment` WHERE `AssessmentID` = 2) = @a2 + 1);

-- DELETE must decrement the correct assignment.
DELETE FROM `Submission`
 WHERE `AssignmentID` = 1 AND `StudentID` = 103 AND `AttemptNo` = 2;
CALL `tmp_assert`((SELECT `SubmissionCount` FROM `Assignment` WHERE `AssessmentID` = 1) = @a1);

DELETE FROM `Submission` WHERE `SubmissionID` = @moved_id;
CALL `tmp_assert`((SELECT `SubmissionCount` FROM `Assignment` WHERE `AssessmentID` = 2) = @a2);

ROLLBACK;
DROP PROCEDURE `tmp_assert`;

SELECT 'trigger DML matrix: PASS' AS result;
