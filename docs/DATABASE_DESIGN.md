# Database design

## 1. Phạm vi

Schema hiện thực đúng mô hình BTL1 trong `tailieu/BaoCao_LMS.tex`, mở rộng vật lý tối thiểu cho yêu cầu BTL2. Tất cả bảng dùng:

- MySQL **8.0+**, InnoDB
- `utf8mb4`, collation `utf8mb4_0900_ai_ci`
- PK, FK, UNIQUE, CHECK và index tường minh

Chạy `database/run_all.sql` để tạo database `hcmut_lms` và nạp seed.

## 2. Danh sách bảng (22)

| Nhóm | Bảng | Vai trò |
|---|---|---|
| Người dùng | `UserAccount` | Lớp cha tài khoản |
| | `Student`, `Staff`, `Admin` | Các lớp con rời rạc, đầy đủ |
| | `Faculty` | Khoa |
| Học vụ | `Semester` | Học kỳ |
| | `Course`, `CourseComponent` | Môn và thành phần THEORY/PRACTICE |
| | `CourseSection` | Lớp học phần, lịch, phòng, sĩ số |
| | `Enrollment` | Ghi danh sinh viên vào lớp |
| Nội dung lớp | `Announcement` | Thông báo |
| | `LearningResource`, `Section_Resource` | Tài liệu và quan hệ N:M đăng vào lớp |
| Đánh giá | `Assessment` | Lớp cha hoạt động đánh giá |
| | `Assignment`, `AssignmentAttachment` | Bài tập + file đính kèm đa trị |
| | `Quiz` | Quiz trực tuyến |
| | `Submission`, `SubmissionFile` | Bài nộp + file |
| | `QuizAttempt` | Lần làm quiz |
| | `Grade` | Điểm theo enrollment/assessment |
| | `Feedback` | Phản hồi tự tham chiếu |

## 3. Quan hệ chính

- `UserAccount` 1:1 `Student`, `Staff`, `Admin` (disjoint, total).
- `Faculty` 1:N `Student`, `Staff`, `Course`.
- `Admin` 1:N `Course` qua `CreatedByAdminID`.
- `Course` 1:N `CourseComponent`; UNIQUE `(CourseID, ComponentType)` chặn trùng `THEORY`/`PRACTICE`, seed đảm bảo mỗi môn có một `THEORY`. Quy tắc "đúng một THEORY" ở mức nghiệp vụ được giữ bằng seed/dữ liệu demo, không có trigger đếm component.
- `CourseComponent` 1:N `CourseSection`.
- `Semester` 1:N `CourseSection`; `Staff` 0..1:N `CourseSection` qua `PrimaryInstructorID`.
- `Student` N:M `CourseSection` qua `Enrollment`; UNIQUE `(StudentID, SectionID)`.
- `CourseSection` 1:N `Announcement`, `Assessment`; N:M `LearningResource` qua `Section_Resource`.
- `Assessment` 1:1 `Assignment`/`Quiz` (disjoint, total).
- `Assignment` 1:N `AssignmentAttachment` (thuộc tính đa trị tách bảng).
- `Assignment` 1:N `Submission`; `Submission` 1:N `SubmissionFile`.
- `Quiz` 1:N `QuizAttempt`.
- `Enrollment` 1:N `Grade`; `Assessment` 1:N `Grade`; UNIQUE `(EnrollmentID, AssessmentID)`.
- `Submission` 1:N `Feedback`; `Feedback` tự tham chiếu `ParentFeedbackID`.

## 4. Ràng buộc

### Khóa và UNIQUE

- `Student.StudentCode`
- `UserAccount.Email`
- `Enrollment(StudentID, SectionID)`
- `Submission(AssignmentID, StudentID, AttemptNo)`
- `QuizAttempt(QuizID, StudentID, AttemptNo)`
- `Grade(EnrollmentID, AssessmentID)`
- `SubmissionFile(SubmissionID, FileNo)`
- `Section_Resource(SectionID, ResourceID)`
- `AssignmentAttachment(AssessmentID, AttachmentURL)`
- `CourseComponent(CourseID, ComponentType)`
- `CourseSection(SemesterID, SectionCode)`
- `Semester(AcademicYear, TermNo)`

### CHECK

Các CHECK nằm trong `database/constraints/03_checks.sql`, bao gồm:

- trạng thái tài khoản, email, avatar URL
- term 1–3, ngày học kỳ, format năm học
- credits > 0, component type THEORY/PRACTICE
- sức chứa > 0, section status OPEN/CLOSED/CANCELLED, thứ 2–8, giờ mở < đóng
- enrollment status ACTIVE/DROPPED/COMPLETED
- resource type, URL, thứ tự hiển thị
- MaxScore > 0, MaxAttempts NULL hoặc > 0
- Assignment OpenDate < DueDate, SubmissionCount >= 0
- Submission status DRAFT/SUBMITTED, attempt >= 1, score >= 0
- Quiz OpenTime < CloseTime, DurationMinutes > 0, attempt times/score
- Grade score >= 0
- Feedback content không rỗng

### Trigger

| Nhóm | Trigger | Sự kiện | Mục đích |
|---|---|---|---|
| RB05 | `trg_section_schedule_bi`, `trg_section_schedule_bu` | BEFORE INSERT/UPDATE `CourseSection` | Chặn trùng giảng viên hoặc phòng trong cùng học kỳ/thứ/giờ |
| Derived | `trg_submission_count_ai`, `_ad`, `_au` | AFTER INSERT/DELETE/UPDATE `Submission` | Duy trì `Assignment.SubmissionCount` |
| Capacity | `trg_enrollment_capacity_bi`, `_bu` | BEFORE INSERT/UPDATE `Enrollment` | Chặn vượt `Capacity` khi ACTIVE |
| Submission | `trg_submission_validate_bi`, `_bu` | BEFORE INSERT/UPDATE `Submission` | Active enrollment/account, thời gian mở/đóng, max attempts, score <= MaxScore, grader là primary instructor |
| Grade | `trg_grade_validate_bi`, `_bu` | BEFORE INSERT/UPDATE `Grade` | Enrollment và assessment cùng lớp, score <= MaxScore, grader là primary instructor |
| Feedback | `trg_feedback_validate_bi`, `_bu` | BEFORE INSERT/UPDATE `Feedback` | Author hợp lệ trên submission; parent cùng submission; chống tự tham chiếu |

Tổng: **13 trigger**.

## 5. Procedure và function

### CRUD (bảng `Enrollment`)

- `sp_InsertEnrollment(p_student_id, p_section_id, p_enrollment_status)`
- `sp_UpdateEnrollment(p_enrollment_id, p_section_id, p_enrollment_status)`
- `sp_DeleteEnrollment(p_enrollment_id)`

Xem chi tiết validation trong `docs/BTL2_REQUIREMENTS_MAPPING.md` và source `database/procedures/06_procedures.sql`.

### Query

- `sp_GetStudentEnrollments(p_student_id, p_semester_id, p_status, p_limit, p_offset)`
  - Join 7 bảng, filter NULL-tolerant, order by học kỳ/môn/lớp.
  - Dùng bởi UI Ghi danh.
- `sp_GetAssignmentStatistics(p_section_id, p_semester_id, p_min_submissions)`
  - Join 8 bảng, `LEFT JOIN` để giữ assignment chưa có submission.
  - `COUNT(DISTINCT ...)` tránh nhân dòng; `GROUP BY`, `HAVING`, `ORDER BY`.
  - Trả eligible/submitted/missing/completion/last submission.

### Function

- `fn_CalculateAssignmentCompletionRate(p_assignment_id) RETURNS DECIMAL(5,2)`
- `fn_CalculateStudentAverageScore(p_enrollment_id) RETURNS DECIMAL(5,2)`

Cả hai dùng cursor + IF/LOOP, validate input, trả 0.00 khi không có dữ liệu.

## 6. Index

`database/indexes/04_indexes.sql` thêm 15 index cho:

- trạng thái/lần truy cập tài khoản
- course/faculty, component/course
- lịch lớp và giảng viên/học kỳ
- enrollment theo section/status và student/status
- announcement theo section/ngày
- resource theo staff/type
- submission theo assignment/status và student/ngày nộp
- quiz attempt theo student
- grade theo assessment/published
- feedback theo parent

## 7. Xóa dữ liệu

- `Grade` chặn xóa `Enrollment` (procedure) và dùng FK `ON DELETE RESTRICT`.
- `Submission` xóa cascade `SubmissionFile`; `Feedback` cascade theo submission.
- `Assignment` cascade `AssignmentAttachment`; `Assessment` cascade subtype.
- `CourseSection` cascade nội dung lớp và enrollment; đây là lựa chọn demo, cần thận trọng nếu triển khai thật.
- `PrimaryInstructorID`, `GradedByStaffID`, `ParentFeedbackID` dùng SET NULL/RESTRICT theo ngữ nghĩa.

## 8. Seed

`database/seeds/` chia theo phụ thuộc:

1. `00_reset_demo_data.sql` — xóa dữ liệu demo theo thứ tự FK-safe (không DROP database).
2. `01_users.sql` — 5 faculty, 18 account, 8 student, 5 staff, 5 admin.
3. `02_academic.sql` — 5 semester, 5 course, 8 component, 8 section.
4. `03_course_activity.sql` — 15 enrollment, 6 announcement, 6 resource, 6 section_resource.
5. `04_assessments.sql` — 11 assessment, 6 assignment, 6 attachment, 5 quiz.
6. `05_submissions.sql` — 13 submission, 6 file, 7 quiz attempt, 10 grade, 7 feedback.

Verifier kiểm tra mọi bảng có ≥ 5 hàng, `SubmissionCount` khớp dữ liệu thật và không có lịch trùng.
