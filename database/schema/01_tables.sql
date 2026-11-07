USE `hcmut_lms`;

-- Tables are created without foreign keys so the key phase is explicit.
-- MySQL 8.0+, InnoDB, utf8mb4.

CREATE TABLE IF NOT EXISTS `UserAccount` (
  `UserID` INT NOT NULL AUTO_INCREMENT,
  `Email` VARCHAR(255) NOT NULL,
  `FullName` VARCHAR(150) NOT NULL,
  `AvatarURL` VARCHAR(500) NOT NULL,
  `AccountStatus` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  `LastAccessAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`UserID`),
  UNIQUE KEY `uq_useraccount_email` (`Email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `Faculty` (
  `FacultyID` INT NOT NULL AUTO_INCREMENT,
  `FacultyName` VARCHAR(150) NOT NULL,
  `FacultyNameEN` VARCHAR(150) NULL,
  PRIMARY KEY (`FacultyID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `Student` (
  `UserID` INT NOT NULL,
  `StudentCode` VARCHAR(20) NOT NULL,
  `FacultyID` INT NOT NULL,
  PRIMARY KEY (`UserID`),
  UNIQUE KEY `uq_student_code` (`StudentCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `Staff` (
  `UserID` INT NOT NULL,
  `FacultyID` INT NOT NULL,
  PRIMARY KEY (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `Admin` (
  `UserID` INT NOT NULL,
  PRIMARY KEY (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `Semester` (
  `SemesterID` INT NOT NULL AUTO_INCREMENT,
  `AcademicYear` VARCHAR(9) NOT NULL,
  `TermNo` TINYINT NOT NULL,
  `StartDate` DATE NOT NULL,
  `EndDate` DATE NOT NULL,
  PRIMARY KEY (`SemesterID`),
  UNIQUE KEY `uq_semester_year_term` (`AcademicYear`, `TermNo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `Course` (
  `CourseID` INT NOT NULL AUTO_INCREMENT,
  `CourseCode` VARCHAR(20) NOT NULL,
  `CourseName` VARCHAR(200) NOT NULL,
  `Credits` TINYINT NOT NULL,
  `FacultyID` INT NOT NULL,
  `CreatedByAdminID` INT NOT NULL,
  PRIMARY KEY (`CourseID`),
  UNIQUE KEY `uq_course_code` (`CourseCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `CourseComponent` (
  `ComponentID` INT NOT NULL AUTO_INCREMENT,
  `CourseID` INT NOT NULL,
  `ComponentType` VARCHAR(20) NOT NULL,
  `ComponentName` VARCHAR(150) NOT NULL,
  PRIMARY KEY (`ComponentID`),
  UNIQUE KEY `uq_course_component_type` (`CourseID`, `ComponentType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `CourseSection` (
  `SectionID` INT NOT NULL AUTO_INCREMENT,
  `ComponentID` INT NOT NULL,
  `SemesterID` INT NOT NULL,
  `PrimaryInstructorID` INT NULL,
  `SectionCode` VARCHAR(30) NOT NULL,
  `Capacity` SMALLINT NOT NULL,
  `SectionStatus` VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  `DayOfWeek` TINYINT NOT NULL,
  `StartTime` TIME NOT NULL,
  `EndTime` TIME NOT NULL,
  `RoomCode` VARCHAR(20) NOT NULL,
  PRIMARY KEY (`SectionID`),
  UNIQUE KEY `uq_section_semester_code` (`SemesterID`, `SectionCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `Enrollment` (
  `EnrollmentID` INT NOT NULL AUTO_INCREMENT,
  `StudentID` INT NOT NULL,
  `SectionID` INT NOT NULL,
  `EnrollmentDate` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `EnrollmentStatus` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`EnrollmentID`),
  UNIQUE KEY `uq_enrollment_student_section` (`StudentID`, `SectionID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `Announcement` (
  `AnnouncementID` INT NOT NULL AUTO_INCREMENT,
  `SectionID` INT NOT NULL,
  `PostedByStaffID` INT NOT NULL,
  `Title` VARCHAR(200) NOT NULL,
  `Content` TEXT NOT NULL,
  `PostedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ExpiredAt` DATETIME NULL,
  PRIMARY KEY (`AnnouncementID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `LearningResource` (
  `ResourceID` INT NOT NULL AUTO_INCREMENT,
  `UploadedByStaffID` INT NOT NULL,
  `Title` VARCHAR(200) NOT NULL,
  `Description` TEXT NOT NULL,
  `ResourceType` VARCHAR(30) NOT NULL,
  `ResourceURL` VARCHAR(500) NOT NULL,
  `UploadedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ResourceID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `Section_Resource` (
  `SectionID` INT NOT NULL,
  `ResourceID` INT NOT NULL,
  `PostedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `DisplayOrder` INT NOT NULL DEFAULT 0,
  `IsVisible` BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (`SectionID`, `ResourceID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `Assessment` (
  `AssessmentID` INT NOT NULL AUTO_INCREMENT,
  `SectionID` INT NOT NULL,
  `CreatedByStaffID` INT NOT NULL,
  `Title` VARCHAR(200) NOT NULL,
  `Description` TEXT NOT NULL,
  `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `MaxScore` DECIMAL(6,2) NOT NULL,
  `MaxAttempts` INT NULL,
  PRIMARY KEY (`AssessmentID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `Assignment` (
  `AssessmentID` INT NOT NULL,
  `OpenDate` DATETIME NOT NULL,
  `DueDate` DATETIME NOT NULL,
  `AllowLateSubmission` BOOLEAN NOT NULL DEFAULT FALSE,
  -- The BTL1 report marks SubmissionCount as derived. BTL2 requires a
  -- trigger-maintained derived value, so the physical column is intentional.
  `SubmissionCount` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`AssessmentID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `AssignmentAttachment` (
  `AssessmentID` INT NOT NULL,
  `AttachmentURL` VARCHAR(500) NOT NULL,
  PRIMARY KEY (`AssessmentID`, `AttachmentURL`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `Submission` (
  `SubmissionID` INT NOT NULL AUTO_INCREMENT,
  `AssignmentID` INT NOT NULL,
  `StudentID` INT NOT NULL,
  `GradedByStaffID` INT NULL,
  `AttemptNo` INT NOT NULL,
  `SubmittedAt` DATETIME NOT NULL,
  `SubmissionStatus` VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED',
  `Score` DECIMAL(6,2) NULL,
  `GradedAt` DATETIME NULL,
  PRIMARY KEY (`SubmissionID`),
  UNIQUE KEY `uq_submission_attempt` (`AssignmentID`, `StudentID`, `AttemptNo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `SubmissionFile` (
  `SubmissionID` INT NOT NULL,
  `FileNo` INT NOT NULL,
  `FileName` VARCHAR(255) NOT NULL,
  `FileURL` VARCHAR(500) NOT NULL,
  `FileSize` BIGINT UNSIGNED NOT NULL,
  `UploadedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`SubmissionID`, `FileNo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `Quiz` (
  `AssessmentID` INT NOT NULL,
  `OpenTime` DATETIME NOT NULL,
  `CloseTime` DATETIME NOT NULL,
  `DurationMinutes` INT NOT NULL,
  PRIMARY KEY (`AssessmentID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `QuizAttempt` (
  `AttemptID` INT NOT NULL AUTO_INCREMENT,
  `QuizID` INT NOT NULL,
  `StudentID` INT NOT NULL,
  `AttemptNo` INT NOT NULL,
  `StartedAt` DATETIME NOT NULL,
  `FinishedAt` DATETIME NULL,
  `Score` DECIMAL(6,2) NULL,
  PRIMARY KEY (`AttemptID`),
  UNIQUE KEY `uq_quiz_attempt` (`QuizID`, `StudentID`, `AttemptNo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `Grade` (
  `GradeID` INT NOT NULL AUTO_INCREMENT,
  `EnrollmentID` INT NOT NULL,
  `AssessmentID` INT NOT NULL,
  `GradedByStaffID` INT NOT NULL,
  `Score` DECIMAL(6,2) NOT NULL,
  `GradedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `IsPublished` BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (`GradeID`),
  UNIQUE KEY `uq_grade_enrollment_assessment` (`EnrollmentID`, `AssessmentID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `Feedback` (
  `FeedbackID` INT NOT NULL AUTO_INCREMENT,
  `SubmissionID` INT NOT NULL,
  `AuthorID` INT NOT NULL,
  `ParentFeedbackID` INT NULL,
  `Content` TEXT NOT NULL,
  `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`FeedbackID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
