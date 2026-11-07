-- 5 faculties, 18 accounts (8 students, 5 staff, 5 admins).
USE `hcmut_lms`;

INSERT INTO `Faculty` (`FacultyID`, `FacultyName`, `FacultyNameEN`) VALUES
  (1, 'Khoa Khoa hoc va Ky thuat May tinh', 'Faculty of Computer Science and Engineering'),
  (2, 'Khoa Dien - Dien tu', 'Faculty of Electrical and Electronics Engineering'),
  (3, 'Khoa Co khi', 'Faculty of Mechanical Engineering'),
  (4, 'Khoa Ky thuat Xay dung', 'Faculty of Civil Engineering'),
  (5, 'Khoa Khoa hoc Ung dung', 'Faculty of Applied Science');

INSERT INTO `UserAccount` (`UserID`, `Email`, `FullName`, `AvatarURL`, `AccountStatus`, `LastAccessAt`) VALUES
  (101, 'an.nguyen@example.edu.vn', 'Nguyen Van An', '/assets/avatars/student-101.svg', 'ACTIVE', '2026-10-01 08:00:00'),
  (102, 'binh.tran@example.edu.vn', 'Tran Thi Binh', '/assets/avatars/student-102.svg', 'ACTIVE', '2026-10-02 09:00:00'),
  (103, 'cuong.le@example.edu.vn', 'Le Hoang Cuong', '/assets/avatars/student-103.svg', 'ACTIVE', '2026-10-03 10:00:00'),
  (104, 'dung.pham@example.edu.vn', 'Pham Minh Dung', '/assets/avatars/student-104.svg', 'ACTIVE', '2026-10-04 11:00:00'),
  (105, 'em.hoang@example.edu.vn', 'Hoang Thi Em', '/assets/avatars/student-105.svg', 'ACTIVE', '2026-10-05 12:00:00'),
  (106, 'huy.vo@example.edu.vn', 'Vo Quoc Huy', '/assets/avatars/student-106.svg', 'ACTIVE', '2026-10-06 13:00:00'),
  (107, 'lan.dang@example.edu.vn', 'Dang Thi Lan', '/assets/avatars/student-107.svg', 'ACTIVE', '2026-10-07 14:00:00'),
  (108, 'khoa.bui@example.edu.vn', 'Bui Minh Khoa', '/assets/avatars/student-108.svg', 'LOCKED', '2026-10-08 15:00:00'),

  (201, 'tam.nguyen@example.edu.vn', 'TS. Nguyen Minh Tam', '/assets/avatars/staff-201.svg', 'ACTIVE', '2026-10-01 07:30:00'),
  (202, 'huy.tran@example.edu.vn', 'TS. Tran Quang Huy', '/assets/avatars/staff-202.svg', 'ACTIVE', '2026-10-02 07:30:00'),
  (203, 'ha.le@example.edu.vn', 'TS. Le Thu Ha', '/assets/avatars/staff-203.svg', 'ACTIVE', '2026-10-03 07:30:00'),
  (204, 'long.pham@example.edu.vn', 'TS. Pham Van Long', '/assets/avatars/staff-204.svg', 'ACTIVE', '2026-10-04 07:30:00'),
  (205, 'mai.do@example.edu.vn', 'TS. Do Thi Mai', '/assets/avatars/staff-205.svg', 'ACTIVE', '2026-10-05 07:30:00'),

  (301, 'admin1@example.edu.vn', 'Nguyen Quan Tri', '/assets/avatars/admin-301.svg', 'ACTIVE', '2026-10-01 06:00:00'),
  (302, 'admin2@example.edu.vn', 'Tran Quan Tri', '/assets/avatars/admin-302.svg', 'ACTIVE', '2026-10-02 06:00:00'),
  (303, 'admin3@example.edu.vn', 'Le Quan Tri', '/assets/avatars/admin-303.svg', 'ACTIVE', '2026-10-03 06:00:00'),
  (304, 'admin4@example.edu.vn', 'Pham Quan Tri', '/assets/avatars/admin-304.svg', 'ACTIVE', '2026-10-04 06:00:00'),
  (305, 'admin5@example.edu.vn', 'Hoang Quan Tri', '/assets/avatars/admin-305.svg', 'ACTIVE', '2026-10-05 06:00:00');

INSERT INTO `Student` (`UserID`, `StudentCode`, `FacultyID`) VALUES
  (101, '2210001', 1),
  (102, '2210002', 1),
  (103, '2210003', 1),
  (104, '2210004', 2),
  (105, '2210005', 2),
  (106, '2210006', 3),
  (107, '2210007', 4),
  (108, '2210008', 5);

INSERT INTO `Staff` (`UserID`, `FacultyID`) VALUES
  (201, 1), (202, 1), (203, 2), (204, 3), (205, 5);

INSERT INTO `Admin` (`UserID`) VALUES
  (301), (302), (303), (304), (305);
