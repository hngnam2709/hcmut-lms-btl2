USE `hcmut_lms`;

-- BTL2 2.4: input validation must reject non-positive IDs.
SELECT `fn_CalculateAssignmentCompletionRate`(0) AS should_fail;
