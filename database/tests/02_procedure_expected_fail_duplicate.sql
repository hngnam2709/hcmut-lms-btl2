USE `hcmut_lms`;
-- EXPECTED FAILURE: student 101 already has an enrollment in section 1.
CALL `sp_InsertEnrollment`(101, 1, 'ACTIVE');
