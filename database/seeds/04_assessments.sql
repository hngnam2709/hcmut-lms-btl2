-- Six assignments and five quizzes. Assessment is the shared parent table.
USE `hcmut_lms`;

INSERT INTO `Assessment`
  (`AssessmentID`, `SectionID`, `CreatedByStaffID`, `Title`, `Description`, `CreatedAt`, `MaxScore`, `MaxAttempts`)
VALUES
  (1, 1, 201, 'Assignment 1: Algorithms', 'Analyse a small algorithm and describe its complexity.', '2026-09-08 08:00:00', 10.00, 3),
  (2, 1, 201, 'Assignment 2: Data Structures', 'Implement a queue and a binary search tree.', '2026-09-12 08:00:00', 20.00, 2),
  (3, 2, 201, 'Lab 1: Programming Basics', 'Complete the programming lab exercises.', '2026-09-10 08:00:00', 10.00, 3),
  (4, 3, 202, 'DSA Assignment 1', 'Implement graph traversal and explain the result.', '2026-09-15 09:00:00', 20.00, 2),
  (5, 4, 203, 'Circuit Analysis Homework', 'Solve the assigned circuit analysis problems.', '2026-09-16 10:00:00', 10.00, 1),
  (6, 5, 204, 'Mechanics Problem Set', 'Solve the statics problem set.', '2026-09-20 11:00:00', 20.00, 2),
  (7, 1, 201, 'Quiz 1: Complexity', 'Short multiple-choice quiz on time complexity.', '2026-09-18 08:00:00', 10.00, 2),
  (8, 2, 201, 'Quiz: Lab Safety', 'Safety rules for the programming laboratory.', '2026-09-19 08:00:00', 5.00, 1),
  (9, 3, 202, 'Quiz: DSA Review', 'Review quiz on stacks, queues, and trees.', '2026-09-24 09:00:00', 10.00, 2),
  (10, 4, 203, 'Quiz: Circuit Basics', 'Quiz on basic circuit laws.', '2026-09-28 10:00:00', 10.00, 1),
  (11, 6, 205, 'Quiz: Derivatives', 'Applied mathematics review quiz.', '2026-09-30 12:00:00', 10.00, 2);

INSERT INTO `Assignment`
  (`AssessmentID`, `OpenDate`, `DueDate`, `AllowLateSubmission`)
VALUES
  (1, '2026-09-10 08:00:00', '2026-09-30 23:59:59', FALSE),
  (2, '2026-09-15 08:00:00', '2026-10-15 23:59:59', TRUE),
  (3, '2026-09-12 08:00:00', '2026-10-05 23:59:59', FALSE),
  (4, '2026-09-18 08:00:00', '2026-10-20 23:59:59', FALSE),
  (5, '2026-09-20 08:00:00', '2026-10-10 23:59:59', TRUE),
  (6, '2026-09-25 08:00:00', '2026-10-25 23:59:59', FALSE);

INSERT INTO `AssignmentAttachment`
  (`AssessmentID`, `AttachmentURL`)
VALUES
  (1, '/resources/assignment1-spec.pdf'),
  (1, '/resources/assignment1-starter.zip'),
  (2, '/resources/assignment2-spec.pdf'),
  (3, '/resources/lab1-guide.pdf'),
  (4, '/resources/dsa-assignment1.pdf'),
  (5, '/resources/circuit-homework.pdf');

INSERT INTO `Quiz`
  (`AssessmentID`, `OpenTime`, `CloseTime`, `DurationMinutes`)
VALUES
  (7, '2026-09-20 08:00:00', '2026-09-20 09:00:00', 30),
  (8, '2026-09-22 13:00:00', '2026-09-22 14:00:00', 20),
  (9, '2026-09-28 09:00:00', '2026-09-28 10:00:00', 30),
  (10, '2026-10-02 08:00:00', '2026-10-02 09:00:00', 20),
  (11, '2026-10-03 10:00:00', '2026-10-03 11:00:00', 30);
