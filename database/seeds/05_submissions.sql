-- Submissions, files, quiz attempts, grades, and feedback.
USE `hcmut_lms`;

INSERT INTO `Submission`
  (`SubmissionID`, `AssignmentID`, `StudentID`, `GradedByStaffID`, `AttemptNo`, `SubmittedAt`, `SubmissionStatus`, `Score`, `GradedAt`)
VALUES
  (1, 1, 101, 201, 1, '2026-09-20 10:00:00', 'SUBMITTED', 8.50, '2026-09-25 10:00:00'),
  (2, 1, 102, 201, 1, '2026-09-21 10:00:00', 'SUBMITTED', 7.00, '2026-09-25 10:10:00'),
  (3, 1, 103, 201, 1, '2026-09-22 10:00:00', 'SUBMITTED', 9.00, '2026-09-26 10:00:00'),
  (4, 1, 101, 201, 2, '2026-09-29 10:00:00', 'SUBMITTED', 9.50, '2026-09-30 10:00:00'),
  (5, 2, 101, 201, 1, '2026-09-30 10:00:00', 'SUBMITTED', 16.00, '2026-10-02 10:00:00'),
  (6, 2, 103, 201, 1, '2026-10-01 10:00:00', 'SUBMITTED', 14.00, '2026-10-03 10:00:00'),
  (7, 3, 101, 201, 1, '2026-09-25 10:00:00', 'SUBMITTED', 8.00, '2026-09-27 10:00:00'),
  (8, 3, 102, 201, 1, '2026-09-26 10:00:00', 'SUBMITTED', 9.00, '2026-09-28 10:00:00'),
  (9, 3, 103, 201, 1, '2026-09-27 10:00:00', 'SUBMITTED', 7.50, '2026-09-29 10:00:00'),
  (10, 4, 104, 202, 1, '2026-10-01 10:00:00', 'SUBMITTED', 14.50, '2026-10-04 10:00:00'),
  (11, 4, 105, 202, 1, '2026-10-02 10:00:00', 'SUBMITTED', 17.00, '2026-10-05 10:00:00'),
  (12, 5, 104, 203, 1, '2026-10-03 10:00:00', 'SUBMITTED', 7.50, '2026-10-06 10:00:00'),
  (13, 4, 105, NULL, 2, '2026-10-06 10:00:00', 'DRAFT', NULL, NULL);

INSERT INTO `SubmissionFile`
  (`SubmissionID`, `FileNo`, `FileName`, `FileURL`, `FileSize`, `UploadedAt`)
VALUES
  (1, 1, 'assignment1-an.pdf', '/uploads/assignment1-an.pdf', 102400, '2026-09-20 10:00:00'),
  (4, 1, 'assignment1-an-v2.pdf', '/uploads/assignment1-an-v2.pdf', 112640, '2026-09-29 10:00:00'),
  (5, 1, 'assignment2-an.pdf', '/uploads/assignment2-an.pdf', 204800, '2026-09-30 10:00:00'),
  (7, 1, 'lab1-an.zip', '/uploads/lab1-an.zip', 307200, '2026-09-25 10:00:00'),
  (10, 1, 'dsa-assignment1-dung.pdf', '/uploads/dsa-assignment1-dung.pdf', 256000, '2026-10-01 10:00:00'),
  (12, 1, 'circuit-homework-dung.pdf', '/uploads/circuit-homework-dung.pdf', 153600, '2026-10-03 10:00:00');

INSERT INTO `QuizAttempt`
  (`AttemptID`, `QuizID`, `StudentID`, `AttemptNo`, `StartedAt`, `FinishedAt`, `Score`)
VALUES
  (1, 7, 101, 1, '2026-09-20 08:05:00', '2026-09-20 08:25:00', 8.00),
  (2, 7, 102, 1, '2026-09-20 08:10:00', '2026-09-20 08:30:00', 7.50),
  (3, 7, 103, 1, '2026-09-20 08:15:00', '2026-09-20 08:35:00', 9.00),
  (4, 8, 101, 1, '2026-09-22 13:05:00', '2026-09-22 13:20:00', 4.50),
  (5, 9, 104, 1, '2026-09-28 09:00:00', '2026-09-28 09:30:00', 8.00),
  (6, 10, 104, 1, '2026-10-02 08:00:00', '2026-10-02 08:20:00', 7.00),
  (7, 11, 106, 1, '2026-10-03 10:05:00', NULL, NULL);

INSERT INTO `Grade`
  (`GradeID`, `EnrollmentID`, `AssessmentID`, `GradedByStaffID`, `Score`, `GradedAt`, `IsPublished`)
VALUES
  (1, 1, 1, 201, 8.50, '2026-09-25 10:00:00', TRUE),
  (2, 2, 1, 201, 7.00, '2026-09-25 10:10:00', TRUE),
  (3, 3, 1, 201, 9.00, '2026-09-26 10:00:00', TRUE),
  (4, 1, 2, 201, 16.00, '2026-10-02 10:00:00', TRUE),
  (5, 4, 4, 202, 14.50, '2026-10-04 10:00:00', TRUE),
  (6, 5, 4, 202, 17.00, '2026-10-05 10:00:00', TRUE),
  (7, 6, 3, 201, 8.00, '2026-09-27 10:00:00', TRUE),
  (8, 7, 3, 201, 9.00, '2026-09-28 10:00:00', TRUE),
  (9, 9, 5, 203, 7.50, '2026-10-06 10:00:00', TRUE),
  (10, 11, 11, 205, 8.00, '2026-10-07 10:00:00', FALSE);

INSERT INTO `Feedback`
  (`FeedbackID`, `SubmissionID`, `AuthorID`, `ParentFeedbackID`, `Content`, `CreatedAt`)
VALUES
  (1, 1, 201, NULL, 'Good structure; explain the worst-case bound more precisely.', '2026-09-25 10:05:00'),
  (2, 1, 101, 1, 'Thank you, I will add the derivation in the revision.', '2026-09-26 09:00:00'),
  (3, 2, 201, NULL, 'The complexity analysis is correct. Please format the table.', '2026-09-25 10:15:00'),
  (4, 5, 201, NULL, 'Your queue implementation is correct; add tests for the empty case.', '2026-10-02 10:05:00'),
  (5, 7, 201, NULL, 'Lab report is complete and reproducible.', '2026-09-27 10:05:00'),
  (6, 10, 202, NULL, 'Good graph traversal explanation. Clarify the visited set.', '2026-10-04 10:05:00'),
  (7, 10, 104, 6, 'I added the visited-set example to the appendix.', '2026-10-05 09:00:00');
