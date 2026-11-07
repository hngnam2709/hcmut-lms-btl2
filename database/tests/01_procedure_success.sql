USE `hcmut_lms`;
-- Student 107 is not enrolled in section 1 in the seed.
CALL `sp_InsertEnrollment`(107, 1, 'ACTIVE');
SELECT `EnrollmentID`, `StudentID`, `SectionID`, `EnrollmentStatus`
FROM `Enrollment`
WHERE `StudentID` = 107 AND `SectionID` = 1;

SET @tmp_enrollment := (
  SELECT `EnrollmentID` FROM `Enrollment`
  WHERE `StudentID` = 107 AND `SectionID` = 1
);
CALL `sp_UpdateEnrollment`(@tmp_enrollment, 1, 'DROPPED');
SELECT `EnrollmentID`, `EnrollmentStatus`
FROM `Enrollment` WHERE `EnrollmentID` = @tmp_enrollment;

CALL `sp_DeleteEnrollment`(@tmp_enrollment);
SELECT COUNT(*) AS Remaining
FROM `Enrollment` WHERE `EnrollmentID` = @tmp_enrollment;
