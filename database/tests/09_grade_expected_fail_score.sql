USE `hcmut_lms`;
-- EXPECTED FAILURE: Quiz 7 has MaxScore 10; 99 is rejected by the grade trigger.
INSERT INTO `Grade`
  (`EnrollmentID`, `AssessmentID`, `GradedByStaffID`, `Score`, `GradedAt`, `IsPublished`)
VALUES
  (1, 7, 201, 99.00, '2026-10-10 10:00:00', TRUE);
