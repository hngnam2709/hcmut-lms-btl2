# Role-based LMS UI design

## 1. Mục tiêu

Chuyển ứng dụng BTL2 hiện tại từ dashboard CRUD ghi danh đơn giản thành một bản demo LMS bám sát BTL1:

- Có màn hình đăng nhập demo.
- Đăng nhập bằng cách chọn một trong ba role `STUDENT`, `STAFF`, `ADMIN`, sau đó chọn tài khoản có sẵn trong database.
- Mỗi role chỉ thấy dữ liệu và thao tác thuộc phạm vi của mình.
- Phủ đủ 22 bảng, toàn bộ thuộc tính BTL1, các FR-U/FR-S/FR-L và RB01–RB17.
- Giao diện theo phong cách Moodle: top navigation, course cards, nội dung rộng, ít sidebar.
- Palette hồng phấn, không dùng CDN.

## 2. Quyết định đã chốt

- **Không thêm `Password`**: BTL1 không có thuộc tính này trong `UserAccount`. Đăng nhập là demo role + account picker.
- Không thay đổi schema hiện tại nếu không bắt buộc. Schema đã có 22 bảng và đủ thuộc tính BTL1.
- `SubmissionCount` tiếp tục là cột vật lý do trigger cập nhật (yêu cầu BTL2).
- `IsLate` và `ScorePercent` tiếp tục được tính khi truy vấn/API, không lưu trùng.
- Không làm ngân hàng câu hỏi quiz, bài học/lesson, chứng chỉ, môn tiên quyết vì BTL1 ghi rõ các phần này chưa mô hình hóa.
- Không upload file nhị phân thật. `SubmissionFile` được nhập metadata `FileName`, `FileURL`, `FileSize` để phủ entity/attribute trong phạm vi offline demo.
- Admin không được chấm điểm (RB13). Admin chỉ xem dữ liệu học tập, quản lý tài khoản/danh mục/lớp/ghi danh.

## 3. Mô hình đăng nhập

### 3.1 Màn hình login

- Logo + tên “HCMUT LMS”.
- Ba role card: **Sinh viên**, **Cán bộ**, **Quản trị viên**.
- Sau khi chọn role, hiện dropdown tài khoản của role đó.
- Tài khoản hiển thị: `FullName`, `Email`, `StudentCode` (nếu Student), `AccountStatus`.
- Tài khoản `LOCKED`/`INACTIVE` vẫn hiển thị để minh họa RB01 nhưng bị disable, không đăng nhập được.
- Nút “Đăng nhập demo”. Không có ô mật khẩu.
- Ghi chú rõ: “Demo BTL2 — không dùng mật khẩu; không dùng cho production”.

### 3.2 Session

- `POST /api/auth/login` nhận `{role, user_id}`.
- Kiểm tra:
  - `UserID` tồn tại trong đúng subclass `Student`/`Staff`/`Admin`.
  - `AccountStatus = 'ACTIVE'` (RB01).
- Lưu `user_id`, `role` vào Flask session.
- Cập nhật `UserAccount.LastAccessAt = NOW()`.
- Mọi request sau đó kiểm tra lại trạng thái account; nếu bị khóa thì xóa session và trả 401.
- `POST /api/auth/logout`, `GET /api/auth/me`.
- Cookie: `HttpOnly`, `SameSite=Lax`, secret từ `.env`.
- Không có CSRF token trong phạm vi demo; ghi rõ trong `SECURITY.md`.

## 4. Ma trận quyền

| Chức năng | Student | Staff | Admin |
|---|---|---|---|
| Xem hồ sơ của mình | Có | Có | Có |
| Xem tài khoản khác | Không | Chỉ sinh viên trong lớp mình dạy | Tất cả |
| Khóa/mở khóa tài khoản | Không | Không | Có (RB07) |
| Quản lý Faculty/Semester/Course/Component/Section | Không | Không | Có |
| Tự đăng ký/rút môn | Có | Không | Có thể quản lý enrollment |
| Xem lớp | Lớp đã ghi danh | Lớp mình phụ trách | Tất cả |
| Xem thông báo/tài liệu | Lớp của mình | Lớp mình phụ trách | Tất cả |
| Tạo/sửa/xóa thông báo | Không | Lớp mình phụ trách | Không (chỉ xem) |
| Tạo/sửa/xóa tài liệu + Section_Resource | Không | Lớp mình phụ trách, là người upload (RB17) | Không (chỉ xem) |
| Tạo/sửa/xóa assessment/assignment/quiz | Không | Lớp mình phụ trách | Không (chỉ xem) |
| Nộp assignment | Bài của mình | Không | Không |
| Làm/finish quiz attempt | Bài của mình | Không | Không |
| Xem submission | Bài của mình | Lớp mình phụ trách | Tất cả |
| Chấm submission / nhập grade | Không | Lớp mình phụ trách, là primary instructor (RB13) | Không |
| Xem grade | Grade đã publish của mình | Grade trong lớp mình phụ trách | Tất cả |
| Viết feedback | Submission của mình | Submission trong lớp mình phụ trách | Không (chỉ xem) |

## 5. Phủ entity và attribute

Mọi bảng dưới đây phải xuất hiện trong ít nhất một màn hình/API. Các trường là đúng tên cột BTL1.

| # | Bảng | Thuộc tính | Nơi hiển thị / thao tác |
|---|---|---|---|
| 1 | `UserAccount` | UserID, Email, FullName, AvatarURL, AccountStatus, LastAccessAt | Login, profile, admin user management, lock/unlock |
| 2 | `Student` | UserID, StudentCode, FacultyID | Login Student, profile, admin, staff student list |
| 3 | `Staff` | UserID, FacultyID | Login Staff, profile, admin |
| 4 | `Admin` | UserID | Login Admin, admin list |
| 5 | `Faculty` | FacultyID, FacultyName, FacultyNameEN | Admin CRUD; profile/course display |
| 6 | `Semester` | SemesterID, AcademicYear, TermNo, StartDate, EndDate | Admin CRUD; filters |
| 7 | `Course` | CourseID, CourseCode, CourseName, Credits, FacultyID, CreatedByAdminID | Admin CRUD; course cards |
| 8 | `CourseComponent` | ComponentID, CourseID, ComponentType, ComponentName | Admin CRUD; section detail |
| 9 | `CourseSection` | SectionID, ComponentID, SemesterID, PrimaryInstructorID, SectionCode, Capacity, SectionStatus, DayOfWeek, StartTime, EndTime, RoomCode | Admin CRUD; student courses; staff sections |
| 10 | `Enrollment` | EnrollmentID, StudentID, SectionID, EnrollmentDate, EnrollmentStatus | Student register/drop; admin CRUD; staff student list |
| 11 | `Announcement` | AnnouncementID, SectionID, PostedByStaffID, Title, Content, PostedAt, ExpiredAt | Section announcements; staff CRUD |
| 12 | `LearningResource` | ResourceID, UploadedByStaffID, Title, Description, ResourceType, ResourceURL, UploadedAt | Section resources; staff CRUD |
| 13 | `Section_Resource` | SectionID, ResourceID, PostedAt, DisplayOrder, IsVisible | Staff post/unpost/order/visibility |
| 14 | `Assessment` | AssessmentID, SectionID, CreatedByStaffID, Title, Description, CreatedAt, MaxScore, MaxAttempts | Section assessments; staff CRUD |
| 15 | `Assignment` | AssessmentID, OpenDate, DueDate, AllowLateSubmission, SubmissionCount | Assignment list/detail; staff CRUD |
| 16 | `AssignmentAttachment` | AssessmentID, AttachmentURL | Attachment list; staff add/remove |
| 17 | `Submission` | SubmissionID, AssignmentID, StudentID, GradedByStaffID, AttemptNo, SubmittedAt, SubmissionStatus, Score, GradedAt | Student submit/list; staff grade |
| 18 | `SubmissionFile` | SubmissionID, FileNo, FileName, FileURL, FileSize, UploadedAt | Submit form metadata; staff view |
| 19 | `Quiz` | AssessmentID, OpenTime, CloseTime, DurationMinutes | Quiz list/detail; staff CRUD |
| 20 | `QuizAttempt` | AttemptID, QuizID, StudentID, AttemptNo, StartedAt, FinishedAt, Score | Student attempt; staff view/score |
| 21 | `Grade` | GradeID, EnrollmentID, AssessmentID, GradedByStaffID, Score, GradedAt, IsPublished | Student published grades; staff grade entry |
| 22 | `Feedback` | FeedbackID, SubmissionID, AuthorID, ParentFeedbackID, Content, CreatedAt | Submission feedback thread; student/staff reply |

Thuộc tính dẫn xuất:

- `SubmissionCount`: đọc từ `Assignment`, do trigger cập nhật.
- `IsLate`: `SubmittedAt > DueDate`, trả trong API submission.
- `ScorePercent`: `Score / MaxScore * 100`, trả trong API grade/assessment.
- `SubmissionPeriod`: hiển thị hai cột `OpenDate`, `DueDate`.
- `AttachmentURL`: hiển thị từ `AssignmentAttachment`.

## 6. API đề xuất

### 6.1 Auth

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/api/auth/roles` | Danh sách role + mô tả |
| GET | `/api/auth/accounts?role=STUDENT` | Tài khoản để chọn ở login, kèm status |
| POST | `/api/auth/login` | `{role, user_id}` |
| POST | `/api/auth/logout` | Xóa session |
| GET | `/api/auth/me` | Profile + role + quyền |

### 6.2 Student

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/api/student/dashboard` | Stats + lớp + deadline gần |
| GET | `/api/student/sections` | Enrollment của chính mình |
| GET | `/api/student/sections/<id>` | Chi tiết lớp, chỉ nếu đã ghi danh |
| GET | `/api/student/sections/<id>/announcements` | Thông báo còn hiệu lực |
| GET | `/api/student/sections/<id>/resources` | Resource visible |
| GET | `/api/student/sections/<id>/assessments` | Assignment + quiz + grade của mình |
| POST | `/api/student/enrollments` | Tự đăng ký, dùng `sp_InsertEnrollment` |
| PATCH | `/api/student/enrollments/<id>` | Chuyển `DROPPED`, dùng `sp_UpdateEnrollment` |
| GET | `/api/student/assignments/<id>` | Chi tiết + attachment + submission của mình |
| POST | `/api/student/assignments/<id>/submissions` | Tạo attempt mới, SubmissionFile metadata |
| GET | `/api/student/quizzes/<id>` | Chi tiết quiz + attempt của mình |
| POST | `/api/student/quizzes/<id>/attempts` | Bắt đầu/finish attempt |
| GET | `/api/student/grades` | Chỉ `IsPublished = TRUE` |
| POST | `/api/student/submissions/<id>/feedback` | Chỉ submission của mình |

### 6.3 Staff

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/api/staff/dashboard` | Lớp dạy, submission chờ chấm |
| GET | `/api/staff/sections` | `PrimaryInstructorID = session.user_id` |
| GET | `/api/staff/sections/<id>` | Chi tiết, kiểm tra ownership |
| GET | `/api/staff/sections/<id>/students` | Enrollment trong lớp |
| CRUD | `/api/staff/sections/<id>/announcements` | Chỉ lớp mình |
| CRUD | `/api/staff/sections/<id>/resources` | Tạo resource + Section_Resource |
| CRUD | `/api/staff/sections/<id>/assignments` | Assessment + Assignment + attachments |
| CRUD | `/api/staff/sections/<id>/quizzes` | Assessment + Quiz |
| GET | `/api/staff/sections/<id>/submissions` | Submission trong lớp |
| PATCH | `/api/staff/submissions/<id>/grade` | Cập nhật Submission.Score/GradedAt/GradedByStaffID + upsert Grade |
| GET/POST/PUT | `/api/staff/grades` | Grade của lớp mình; chỉ primary instructor |
| PATCH | `/api/staff/quiz-attempts/<id>` | Nhập score/finish |
| POST | `/api/staff/submissions/<id>/feedback` | Feedback của staff phụ trách |

### 6.4 Admin

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/api/admin/dashboard` | Counts toàn hệ thống |
| GET/POST/PUT/DELETE | `/api/admin/users` | Tạo/sửa UserAccount + subclass |
| PATCH | `/api/admin/users/<id>/status` | Lock/unlock (RB07) |
| GET/POST/PUT/DELETE | `/api/admin/faculties` | |
| GET/POST/PUT/DELETE | `/api/admin/semesters` | |
| GET/POST/PUT/DELETE | `/api/admin/courses` | |
| GET/POST/PUT/DELETE | `/api/admin/components` | |
| GET/POST/PUT/DELETE | `/api/admin/sections` | |
| GET/POST/PUT/DELETE | `/api/admin/enrollments` | |
| GET | `/api/admin/data/<entity>` | Read-only cho 22 bảng, role admin |
| GET | `/api/admin/audit/overview` | Có thể dùng statistics hiện có |

Admin không có endpoint ghi grade/submission/feedback.

## 7. UI/UX

### 7.1 Shell

- Top navbar giống Moodle:
  - trái: logo + “HCMUT LMS”;
  - giữa: nav theo role;
  - phải: thông báo (icon), user menu (avatar, tên, role), logout.
- Nền `#FFF8FA`, card trắng, border hồng nhạt.
- Không sidebar cố định; dùng top nav + content width ~1200px.
- Mobile: nav thu gọn, bảng scroll ngang, card 1 cột.

### 7.2 Palette

```css
--pink-50:  #FFF5F8;
--pink-100: #FDE7EF;
--pink-200: #FBCFE0;
--pink-300: #F8A9C4;
--pink-400: #F27AA6;
--pink-500: #E85D8A;
--pink-600: #D63D71;
--pink-700: #B32B5A;
--ink:      #3D2430;
--muted:    #8A6573;
--surface:  #FFFFFF;
--success:  #2E7D5B;
--warning:  #B26A00;
--danger:   #B3263B;
```

Gradient header: `linear-gradient(120deg, #F8A9C4, #E85D8A)`.
Course thumbnails dùng gradient pastel khác nhau, không dùng ảnh ngoài.

### 7.3 Login

- Nền gradient hồng nhạt + blob mờ.
- Card trắng giữa màn hình.
- Ba role card có icon/emoji, mô tả ngắn.
- Account dropdown chỉ hiện sau khi chọn role.
- Cảnh báo tài khoản không hoạt động.

### 7.4 Student

- Trang “Khóa học của tôi”:
  - stats: số lớp, bài sắp đến hạn, điểm mới;
  - filter học kỳ/trạng thái/tìm kiếm;
  - course cards: mã lớp, tên môn, giảng viên, lịch, phòng, progress.
- Trang lớp:
  - header màu hồng, tabs Tổng quan/Thông báo/Tài liệu/Bài tập/Quiz/Điểm/Bài nộp.
  - assignment card có due date, late allowed, submission status, attachment.
  - quiz card có open/close/duration/attempts.
  - grade table có Score, MaxScore, ScorePercent, IsPublished.
  - feedback thread.

### 7.5 Staff

- Trang “Lớp tôi dạy” dạng card/table.
- Trang lớp với tabs quản lý:
  - Tổng quan, Sinh viên, Thông báo, Tài liệu, Bài tập, Quiz, Bài nộp, Điểm, Feedback.
- Nút thêm/sửa/xóa mở modal.
- Form assignment gồm cả assessment fields + assignment fields + attachment URLs.
- Form grading gồm Score, IsPublished, feedback.
- Cảnh báo nếu không phải primary instructor.

### 7.6 Admin

- Dashboard counts.
- Menu: Người dùng, Khoa, Học kỳ, Môn học, Thành phần, Lớp học phần, Ghi danh, Dữ liệu.
- Bảng có filter, modal CRUD, badge trạng thái, toggle lock/unlock.
- “Dữ liệu” là read-only table explorer cho 22 bảng, hỗ trợ kiểm tra entity/attribute coverage.

## 8. Bảo mật và scope

- Session user là nguồn duy nhất cho `student_id`/`staff_id`.
- Mọi query student/staff thêm điều kiện ownership ở repository, không chỉ ẩn ở UI.
- Staff section ownership kiểm tra `CourseSection.PrimaryInstructorID = session.user_id`.
- Student section access kiểm tra `Enrollment.StudentID = session.user_id`.
- Grade/submission/feedback kiểm tra thêm section qua JOIN.
- Admin route yêu cầu role `ADMIN`; riêng lock/unlock yêu cầu account admin đang `ACTIVE`.
- Không trả dữ liệu của người khác qua IDán.
- Không có password; ghi rõ demo-only.

## 9. Quy tắc nghiệp vụ cần giữ

- RB01: account inactive không login/không dùng API.
- RB02: section chỉ có tối đa một primary instructor (schema/trigger hiện có).
- RB03: capacity (procedure/trigger hiện có).
- RB04: enrollment theo section; chưa mô hình nhóm lớp ghép — giữ theo schema BTL1 hiện tại.
- RB05: trùng lịch (trigger hiện có).
- RB06: một THEORY, tối đa một PRACTICE (UNIQUE; seed bảo đảm).
- RB07: chỉ admin active lock/unlock.
- RB08: chỉ admin active tạo/sửa course.
- RB09: submission/quiz chỉ khi enrollment ACTIVE và account active.
- RB10: open/due, late flag.
- RB11: attempt tăng 1, không vượt MaxAttempts.
- RB12: score trong [0, MaxScore].
- RB13: chỉ primary instructor chấm/sửa grade.
- RB14: quiz open < close, duration > 0, started <= finished.
- RB15: enrollment và assessment cùng section; enrollment không DROPPED; unique grade.
- RB16: feedback cùng submission, không cycle, đúng người viết.
- RB17: resource chỉ post vào lớp staff phụ trách.

Các RB đã có trigger/procedure ở DB sẽ tiếp tục là lớp bảo vệ cuối; API thêm kiểm tra scope và thông báo lỗi thân thiện.

## 10. Kế hoạch triển khai qua Workbench

Chia thành các task nhỏ, chạy tuần tự, mỗi task có test:

1. **Auth + shell + login**
   - Session, decorators, `/api/auth/*`.
   - Login UI, role/account picker.
   - Test login active/inactive, logout, guard.

2. **Student workspace**
   - APIs student-scoped.
   - UI course cards, section tabs, submit, quiz attempt, grades, feedback.
   - Tests ownership và published grades.

3. **Staff workspace**
   - APIs staff-scoped.
   - UI section management, announcements/resources/assessments, grading, feedback.
   - Tests ownership, RB13.

4. **Admin workspace**
   - APIs admin CRUD + data explorer.
   - UI admin tables/modals/lock.
   - Tests RB07/RB08, no grading.

5. **Theme + docs + full verification**
   - Palette, responsive, Moodle-like shell.
   - Update README/docs/API contract.
   - Run pytest, DB verifier, smoke, frontend checks.

Mỗi task dùng `workbench task --mode apply`, `--check "uv run pytest -q"`, `--max-fix-cycles` hợp lý. Nếu Workbench reviewer báo lỗi, kiểm tra diff trước khi chấp nhận.

## 11. Tiêu chí hoàn thành

- [ ] Login chọn role + account, inactive bị chặn.
- [ ] Student chỉ thấy dữ liệu của mình.
- [ ] Staff chỉ thấy lớp mình dạy; CRUD nội dung lớp; chấm điểm được.
- [ ] Admin quản lý account/catalog/section/enrollment; không chấm điểm.
- [ ] 22 bảng và mọi thuộc tính BTL1 xuất hiện ở đâu đó.
- [ ] Theme hồng phấn, top nav Moodle-like, offline, responsive.
- [ ] `uv run pytest` pass; DB verifier pass; live smoke pass.
- [ ] Docs cập nhật; không commit `.env`.

## 12. Non-goals

- Không làm password/auth production.
- Không upload file nhị phân thật.
- Không làm ngân hàng câu hỏi quiz.
- Không làm certificate, prerequisite, course completion vì BTL1 không mô hình hóa.
- Không đổi schema BTL1 nếu không cần.
