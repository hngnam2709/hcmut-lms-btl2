-- Enrollment, announcements, resources, and the POSTED_IN link table.
USE `hcmut_lms`;

INSERT INTO `Enrollment` (`EnrollmentID`, `StudentID`, `SectionID`, `EnrollmentDate`, `EnrollmentStatus`) VALUES
  (1, 101, 1, '2026-09-02 08:00:00', 'ACTIVE'),
  (2, 102, 1, '2026-09-02 08:05:00', 'ACTIVE'),
  (3, 103, 1, '2026-09-02 08:10:00', 'ACTIVE'),
  (4, 104, 3, '2026-09-02 08:15:00', 'ACTIVE'),
  (5, 105, 3, '2026-09-02 08:20:00', 'ACTIVE'),
  (6, 101, 2, '2026-09-02 08:25:00', 'ACTIVE'),
  (7, 102, 2, '2026-09-02 08:30:00', 'ACTIVE'),
  (8, 103, 2, '2026-09-02 08:35:00', 'ACTIVE'),
  (9, 104, 4, '2026-09-02 08:40:00', 'ACTIVE'),
  (10, 105, 5, '2026-09-02 08:45:00', 'ACTIVE'),
  (11, 106, 6, '2026-09-02 08:50:00', 'ACTIVE'),
  (12, 107, 6, '2026-09-02 08:55:00', 'ACTIVE'),
  (13, 108, 7, '2026-09-02 09:00:00', 'ACTIVE'),
  (14, 108, 2, '2026-09-03 09:00:00', 'DROPPED'),
  (15, 106, 1, '2026-09-03 09:05:00', 'COMPLETED');

INSERT INTO `Announcement`
  (`AnnouncementID`, `SectionID`, `PostedByStaffID`, `Title`, `Content`, `PostedAt`, `ExpiredAt`)
VALUES
  (1, 1, 201, 'Welcome to CO1001', 'Please read the course outline before the first tutorial.', '2026-09-05 08:00:00', '2027-01-15 23:59:59'),
  (2, 2, 201, 'Lab safety rules', 'Bring your student card to every lab session.', '2026-09-05 08:10:00', NULL),
  (3, 3, 202, 'DSA consultation hours', 'Consultation is on Wednesday at 14:00.', '2026-09-06 09:00:00', '2027-01-15 23:59:59'),
  (4, 4, 203, 'Circuit lab groups', 'Group assignments are published in the resource folder.', '2026-09-07 10:00:00', NULL),
  (5, 5, 204, 'Mechanics problem set', 'The first problem set is now available.', '2026-09-08 11:00:00', '2026-12-31 23:59:59'),
  (6, 6, 205, 'Applied mathematics', 'Remember to review derivatives before week 3.', '2026-09-09 12:00:00', NULL);

INSERT INTO `LearningResource`
  (`ResourceID`, `UploadedByStaffID`, `Title`, `Description`, `ResourceType`, `ResourceURL`, `UploadedAt`)
VALUES
  (1, 201, 'CO1001 Course Outline', 'Syllabus and assessment plan.', 'DOCUMENT', '/resources/co1001-outline.pdf', '2026-09-03 08:00:00'),
  (2, 201, 'Programming Lab Slides', 'Slides for week 1 and week 2.', 'SLIDE', '/resources/co1001-lab-slides.pdf', '2026-09-04 08:00:00'),
  (3, 202, 'DSA Lecture Notes', 'Lecture notes for complexity analysis.', 'DOCUMENT', '/resources/co2001-notes.pdf', '2026-09-04 09:00:00'),
  (4, 203, 'Circuit Analysis Video', 'Recorded lecture on nodal analysis.', 'VIDEO', '/resources/ee1001-video.mp4', '2026-09-05 10:00:00'),
  (5, 204, 'Mechanics Reference', 'Reference formulas for statics.', 'LINK', 'https://example.edu.vn/resources/mechanics', '2026-09-06 11:00:00'),
  (6, 205, 'Applied Math Slides', 'Week 1 derivative review.', 'SLIDE', '/resources/as1001-week1.pdf', '2026-09-07 12:00:00');

INSERT INTO `Section_Resource`
  (`SectionID`, `ResourceID`, `PostedAt`, `DisplayOrder`, `IsVisible`)
VALUES
  (1, 1, '2026-09-03 08:05:00', 1, TRUE),
  (1, 2, '2026-09-04 08:05:00', 2, TRUE),
  (2, 2, '2026-09-04 08:10:00', 1, TRUE),
  (3, 3, '2026-09-04 09:05:00', 1, TRUE),
  (4, 4, '2026-09-05 10:05:00', 1, TRUE),
  (6, 6, '2026-09-07 12:05:00', 1, TRUE);
