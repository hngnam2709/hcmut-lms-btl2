USE `hcmut_lms`;
CALL `sp_GetStudentEnrollments`(101, 4, NULL, 20, 0);
CALL `sp_GetAssignmentStatistics`(NULL, 4, 0);
