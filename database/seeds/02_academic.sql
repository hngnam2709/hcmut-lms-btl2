-- Semesters, courses, components, and class sections.
USE `hcmut_lms`;

INSERT INTO `Semester` (`SemesterID`, `AcademicYear`, `TermNo`, `StartDate`, `EndDate`) VALUES
  (1, '2025-2026', 1, '2025-09-01', '2026-01-15'),
  (2, '2025-2026', 2, '2026-01-20', '2026-05-30'),
  (3, '2025-2026', 3, '2026-06-01', '2026-08-15'),
  (4, '2026-2027', 1, '2026-09-01', '2027-01-15'),
  (5, '2026-2027', 2, '2027-01-20', '2027-05-30');

INSERT INTO `Course` (`CourseID`, `CourseCode`, `CourseName`, `Credits`, `FacultyID`, `CreatedByAdminID`) VALUES
  (1, 'CO1001', 'Introduction to Programming', 3, 1, 301),
  (2, 'CO2001', 'Data Structures and Algorithms', 4, 1, 301),
  (3, 'EE1001', 'Circuit Theory', 3, 2, 302),
  (4, 'ME1001', 'Engineering Mechanics', 3, 3, 303),
  (5, 'AS1001', 'Applied Mathematics', 3, 5, 304);

INSERT INTO `CourseComponent` (`ComponentID`, `CourseID`, `ComponentType`, `ComponentName`) VALUES
  (1, 1, 'THEORY', 'Programming Theory'),
  (2, 1, 'PRACTICE', 'Programming Lab'),
  (3, 2, 'THEORY', 'DSA Theory'),
  (4, 2, 'PRACTICE', 'DSA Lab'),
  (5, 3, 'THEORY', 'Circuit Theory'),
  (6, 4, 'THEORY', 'Engineering Mechanics'),
  (7, 5, 'THEORY', 'Applied Mathematics'),
  (8, 5, 'PRACTICE', 'Applied Math Lab');

INSERT INTO `CourseSection`
  (`SectionID`, `ComponentID`, `SemesterID`, `PrimaryInstructorID`, `SectionCode`, `Capacity`, `SectionStatus`, `DayOfWeek`, `StartTime`, `EndTime`, `RoomCode`)
VALUES
  (1, 1, 4, 201, 'CO1001-L01', 40, 'OPEN', 2, '08:00:00', '09:30:00', 'A101'),
  (2, 2, 4, 201, 'CO1001-L01-P1', 20, 'OPEN', 4, '13:00:00', '14:30:00', 'LAB1'),
  (3, 3, 4, 202, 'CO2001-L01', 35, 'OPEN', 3, '09:30:00', '11:00:00', 'A102'),
  (4, 5, 4, 203, 'EE1001-L01', 30, 'OPEN', 5, '08:00:00', '09:30:00', 'B201'),
  (5, 6, 4, 204, 'ME1001-L01', 30, 'OPEN', 6, '13:00:00', '14:30:00', 'C301'),
  (6, 7, 4, 205, 'AS1001-L01', 45, 'OPEN', 2, '09:30:00', '11:00:00', 'D101'),
  (7, 8, 4, 205, 'AS1001-L01-P1', 20, 'OPEN', 4, '09:30:00', '11:00:00', 'LAB2'),
  (8, 1, 5, 201, 'CO1001-L01', 40, 'OPEN', 2, '08:00:00', '09:30:00', 'A101');
