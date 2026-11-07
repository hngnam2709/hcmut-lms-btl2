USE `hcmut_lms`;
-- Assignment 6 deliberately has no seed submissions.
INSERT INTO `Submission`
  (`AssignmentID`, `StudentID`, `AttemptNo`, `SubmittedAt`, `SubmissionStatus`)
VALUES
  (6, 105, 1, '2026-10-05 10:00:00', 'SUBMITTED');

SELECT `SubmissionCount` AS CountAfterInsert
FROM `Assignment` WHERE `AssessmentID` = 6;

DELETE FROM `Submission`
WHERE `AssignmentID` = 6 AND `StudentID` = 105 AND `AttemptNo` = 1;

SELECT `SubmissionCount` AS CountAfterDelete
FROM `Assignment` WHERE `AssessmentID` = 6;
