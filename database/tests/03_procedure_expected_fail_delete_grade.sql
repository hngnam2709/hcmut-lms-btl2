USE `hcmut_lms`;
-- EXPECTED FAILURE: enrollment 1 has Grade rows and must be preserved.
CALL `sp_DeleteEnrollment`(1);
