USE `hcmut_lms`;
-- EXPECTED FAILURE: instructor 201 already teaches section 1 at this time.
INSERT INTO `CourseSection`
  (`ComponentID`, `SemesterID`, `PrimaryInstructorID`, `SectionCode`,
   `Capacity`, `SectionStatus`, `DayOfWeek`, `StartTime`, `EndTime`, `RoomCode`)
VALUES
  (1, 4, 201, 'CONFLICT-TEST', 10, 'OPEN', 2, '08:30:00', '10:00:00', 'A101');
