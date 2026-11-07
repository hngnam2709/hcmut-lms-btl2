-- DESTRUCTIVE DEMO RESET.
-- This file only removes the demo rows. It does NOT drop the database.
-- Run only against the course/demo database, never against real data.
USE `hcmut_lms`;

DELETE FROM `Feedback`;
DELETE FROM `SubmissionFile`;
DELETE FROM `Submission`;
DELETE FROM `AssignmentAttachment`;
DELETE FROM `Assignment`;
DELETE FROM `QuizAttempt`;
DELETE FROM `Quiz`;
DELETE FROM `Grade`;
DELETE FROM `Assessment`;
DELETE FROM `Section_Resource`;
DELETE FROM `LearningResource`;
DELETE FROM `Announcement`;
DELETE FROM `Enrollment`;
DELETE FROM `CourseSection`;
DELETE FROM `CourseComponent`;
DELETE FROM `Course`;
DELETE FROM `Semester`;
DELETE FROM `Admin`;
DELETE FROM `Staff`;
DELETE FROM `Student`;
DELETE FROM `UserAccount`;
DELETE FROM `Faculty`;
