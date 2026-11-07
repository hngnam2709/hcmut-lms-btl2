-- Read-only verification. Run after schema + seed.
USE `hcmut_lms`;

SELECT
  (SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = 'hcmut_lms' AND table_type = 'BASE TABLE') AS TableCount,
  CASE WHEN (SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = 'hcmut_lms' AND table_type = 'BASE TABLE') = 22
    THEN 'PASS' ELSE 'FAIL' END AS TableCountStatus;

SELECT
  (SELECT COUNT(*) FROM information_schema.triggers
    WHERE trigger_schema = 'hcmut_lms') AS TriggerCount,
  (SELECT COUNT(*) FROM information_schema.routines
    WHERE routine_schema = 'hcmut_lms' AND routine_type = 'PROCEDURE') AS ProcedureCount,
  (SELECT COUNT(*) FROM information_schema.routines
    WHERE routine_schema = 'hcmut_lms' AND routine_type = 'FUNCTION') AS FunctionCount;

SELECT
  (SELECT COUNT(*) FROM information_schema.table_constraints
    WHERE table_schema = 'hcmut_lms' AND constraint_type = 'FOREIGN KEY') AS ForeignKeyCount,
  (SELECT COUNT(*) FROM information_schema.table_constraints
    WHERE table_schema = 'hcmut_lms' AND constraint_type = 'CHECK') AS CheckConstraintCount,
  (SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = 'hcmut_lms') AS IndexedColumnCount;

SELECT 'UserAccount' AS TableName, COUNT(*) AS RowCount FROM `UserAccount`
UNION ALL SELECT 'Student', COUNT(*) FROM `Student`
UNION ALL SELECT 'Staff', COUNT(*) FROM `Staff`
UNION ALL SELECT 'Admin', COUNT(*) FROM `Admin`
UNION ALL SELECT 'Faculty', COUNT(*) FROM `Faculty`
UNION ALL SELECT 'Semester', COUNT(*) FROM `Semester`
UNION ALL SELECT 'Course', COUNT(*) FROM `Course`
UNION ALL SELECT 'CourseComponent', COUNT(*) FROM `CourseComponent`
UNION ALL SELECT 'CourseSection', COUNT(*) FROM `CourseSection`
UNION ALL SELECT 'Enrollment', COUNT(*) FROM `Enrollment`
UNION ALL SELECT 'Announcement', COUNT(*) FROM `Announcement`
UNION ALL SELECT 'LearningResource', COUNT(*) FROM `LearningResource`
UNION ALL SELECT 'Section_Resource', COUNT(*) FROM `Section_Resource`
UNION ALL SELECT 'Assessment', COUNT(*) FROM `Assessment`
UNION ALL SELECT 'Assignment', COUNT(*) FROM `Assignment`
UNION ALL SELECT 'AssignmentAttachment', COUNT(*) FROM `AssignmentAttachment`
UNION ALL SELECT 'Submission', COUNT(*) FROM `Submission`
UNION ALL SELECT 'SubmissionFile', COUNT(*) FROM `SubmissionFile`
UNION ALL SELECT 'Quiz', COUNT(*) FROM `Quiz`
UNION ALL SELECT 'QuizAttempt', COUNT(*) FROM `QuizAttempt`
UNION ALL SELECT 'Grade', COUNT(*) FROM `Grade`
UNION ALL SELECT 'Feedback', COUNT(*) FROM `Feedback`;

SELECT
  a.`AssessmentID`,
  a.`SubmissionCount`,
  COUNT(s.`SubmissionID`) AS ActualSubmissionCount,
  CASE WHEN a.`SubmissionCount` = COUNT(s.`SubmissionID`)
    THEN 'PASS' ELSE 'FAIL' END AS DerivedValueStatus
FROM `Assignment` a
LEFT JOIN `Submission` s ON s.`AssignmentID` = a.`AssessmentID`
GROUP BY a.`AssessmentID`, a.`SubmissionCount`
ORDER BY a.`AssessmentID`;

SELECT COUNT(*) AS ScheduleConflictCount
FROM `CourseSection` a
JOIN `CourseSection` b
  ON a.`SectionID` < b.`SectionID`
 AND a.`SemesterID` = b.`SemesterID`
 AND a.`DayOfWeek` = b.`DayOfWeek`
 AND a.`StartTime` < b.`EndTime`
 AND b.`StartTime` < a.`EndTime`
 AND (
   (a.`PrimaryInstructorID` IS NOT NULL
    AND a.`PrimaryInstructorID` = b.`PrimaryInstructorID`)
   OR a.`RoomCode` = b.`RoomCode`
 );

CALL `sp_GetAssignmentStatistics`(NULL, 4, 0);
SELECT `fn_CalculateAssignmentCompletionRate`(1) AS CompletionRateDemo;
SELECT `fn_CalculateStudentAverageScore`(1) AS AverageScoreDemo;
