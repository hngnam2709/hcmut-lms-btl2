# BTL2 requirements mapping

Nguồn yêu cầu: `Mô tả BTL2 (1).docx` (thang điểm 10 + bonus). Nguồn schema/nghiệp vụ: `tailieu/BaoCao_LMS.tex` (BTL1). Tài liệu này map từng yêu cầu sang artefact thật trong repo và trạng thái xác minh.

## 1. Tạo bảng và dữ liệu mẫu (3 điểm)

| Yêu cầu | Hiện thực | Bằng chứng | Trạng thái |
|---|---|---|---|
| Hiện thực **tất cả** bảng của BTL1 | 22 bảng: `UserAccount`, `Student`, `Staff`, `Admin`, `Faculty`, `Semester`, `Course`, `CourseComponent`, `CourseSection`, `Enrollment`, `Announcement`, `LearningResource`, `Section_Resource`, `Assessment`, `Assignment`, `AssignmentAttachment`, `Submission`, `SubmissionFile`, `Quiz`, `QuizAttempt`, `Grade`, `Feedback` | `database/schema/01_tables.sql`; verifier báo `table_count = 22` | **PASS** |
| Khóa chính, khóa ngoại | PK trong từng bảng; 35 FK trong `database/constraints/02_foreign_keys.sql` | `03_verify_database.sql` inventory; `verify_database.py` | **PASS** |
| Ràng buộc dữ liệu và ngữ nghĩa bằng CHECK/trigger | 39 CHECK trong `03_checks.sql`; 13 trigger trong `database/triggers/05_triggers.sql` | Negative SQL tests; verifier `trigger_count = 13` | **PASS** |
| Dữ liệu mẫu có ý nghĩa ở tất cả bảng, ít nhất 5 hàng/bảng | Seed chia 5 nhóm phụ thuộc, 18 tài khoản, 8 sinh viên, 15 ghi danh, 11 assessment, 13 submission... | `database/seeds/`; verifier kiểm tra mọi bảng ≥ 5 hàng | **PASS** |
| Không dùng trigger khi CHECK đủ dùng | Domain checks dùng CHECK; trigger chỉ dùng cho quy tắc liên bảng/liên bản ghi/thời gian/derived | `docs/TECHNICAL_DECISIONS.md` | **PASS** |

## 2. Trigger, thủ tục, hàm (4 điểm)

### 2.1 CRUD procedures trên một bảng (1 điểm)

Bảng chọn: **`Enrollment`**.

| Procedure | Validation chính | File | Trạng thái |
|---|---|---|---|
| `sp_InsertEnrollment` | Student/account tồn tại và ACTIVE; section tồn tại và OPEN; không trùng `(StudentID, SectionID)`; capacity; status hợp lệ; khóa section `FOR UPDATE` | `database/procedures/06_procedures.sql` | **PASS** |
| `sp_UpdateEnrollment` | Enrollment tồn tại; status hợp lệ; section mới tồn tại/OPEN; không trùng; capacity (trừ chính nó); không đổi lớp/rút môn nếu đã có điểm | cùng file | **PASS** |
| `sp_DeleteEnrollment` | Tồn tại; **từ chối nếu có Grade**; xóa cứng khi chưa có điểm | cùng file | **PASS** |

Thông báo lỗi ví dụ: `Sinh vien da co ghi danh trong lop nay.`, `Khong the xoa ghi danh da co diem. Hay giu lich su hoc tap.`

### 2.2.1 Trigger cho ràng buộc nghiệp vụ (thuộc 1 điểm trigger)

Ràng buộc RB05: trong cùng học kỳ, một giảng viên không phụ trách hai lớp trùng thời gian và hai lớp không dùng cùng phòng cùng lúc.

- DML có thể vi phạm: `INSERT` và `UPDATE` trên `CourseSection`.
- Trigger: `trg_section_schedule_bi`, `trg_section_schedule_bu`.
- Điều kiện giao khoảng: `Start1 < End2 AND Start2 < End1`, cùng `SemesterID`, cùng `DayOfWeek`; kiểm tra cả `PrimaryInstructorID` và `RoomCode`.
- Test âm: `database/tests/04_trigger_expected_fail_schedule.sql`.

### 2.2.2 Trigger cho thuộc tính dẫn xuất (thuộc 1 điểm trigger)

Thuộc tính: `Assignment.SubmissionCount` (BTL1 mô tả là derived; BTL2 yêu cầu lưu và trigger tính).

- DML ảnh hưởng: `INSERT`, `DELETE`, `UPDATE` trên `Submission` (đặc biệt khi đổi `AssignmentID`).
- Trigger: `trg_submission_count_ai`, `trg_submission_count_ad`, `trg_submission_count_au`.
- Ý nghĩa: sau mỗi thay đổi, cột được tính lại từ dữ liệu thật, không giả sử có sẵn.
- Test dương: `database/tests/05_trigger_derived_submission_count.sql` (0 → 1 → 0).

### 2.3 Hai query procedures (1 điểm)

| Procedure | Yêu cầu | Bảng tham gia | File |
|---|---|---|---|
| `sp_GetStudentEnrollments` | ≥ 2 bảng, WHERE, ORDER BY; filter theo student/semester/status; limit/offset | Enrollment, Student, UserAccount, CourseSection, CourseComponent, Course, Semester | `database/procedures/06_procedures.sql` |
| `sp_GetAssignmentStatistics` | aggregate, GROUP BY, HAVING, WHERE, ORDER BY, ≥ 2 bảng | Assignment, Assessment, CourseSection, Semester, CourseComponent, Course, Enrollment, Submission | cùng file |

Có ít nhất một procedure liên quan trực tiếp đến bảng CRUD `Enrollment` (`sp_GetStudentEnrollments`). Cả hai được gọi thật bởi backend:

- `backend/repositories/enrollment_repository.py` → `sp_GetStudentEnrollments`
- `backend/repositories/statistics_repository.py` → `sp_GetAssignmentStatistics`

### 2.4 Hai stored functions (1 điểm)

| Function | Cursor + IF/LOOP | Query dữ liệu | Validate input | Kết quả |
|---|---|---|---|---|
| `fn_CalculateAssignmentCompletionRate` | Cursor duyệt enrollment ACTIVE; IF đếm submission | Assignment, Assessment, Enrollment, Submission | Kiểm tra ID dương, assignment tồn tại | % distinct student đã nộp / eligible, 0.00 nếu không có eligible |
| `fn_CalculateStudentAverageScore` | Cursor duyệt Grade đã publish; IF/LOOP cộng điểm | Grade, Assessment, Enrollment | Kiểm tra ID dương, enrollment tồn tại | Trung bình % các assessment published |

Cả hai được gọi thật qua API `/api/statistics/...` và được kiểm tra bởi `database/tests/06_function_smoke.sql`.

## 3. Hiện thực ứng dụng (3 điểm)

| Yêu cầu | Hiện thực | Bằng chứng | Trạng thái |
|---|---|---|---|
| 3.1 Màn hình thêm/xóa/sửa bảng ở 2.1 | Tab **Ghi danh**: modal thêm/sửa, nút xóa, gọi 3 procedure CRUD | `frontend/index.html`, `frontend/assets/app.js`; `backend/api/enrollments.py`; 48 tests; live smoke 14/14 | **PASS** |
| 3.2 Danh sách gọi query procedure; search/filter/sort/validate/error | Bảng ghi danh từ `sp_GetStudentEnrollments`; filter sinh viên/học kỳ/status/limit; cập nhật/xóa ngay trên bảng; lỗi procedure hiển thị toast | `GET /api/enrollments`; `frontend` tab Ghi danh | **PASS** |
| 3.3 Giao diện cho procedure/hàm khác | Tab **Thống kê bài tập** gọi `sp_GetAssignmentStatistics`; hai thẻ gọi 2 function | `frontend` tab Thống kê + Hàm; API statistics | **PASS** |
| Ứng dụng thực sự kết nối CSDL | Flask kết nối MySQL bằng PyMySQL; health check trả version/database thật | `GET /api/health` trả MySQL 8.4.13; live smoke PASS | **PASS** |
| Validate dữ liệu nhập, xử lý lỗi logic khi update/delete | Validation tầng API (422), procedure SIGNAL (400), FK/UNIQUE (409), DB unavailable (503) | `backend/validation.py`, `backend/errors.py`, tests | **PASS** |

### Mapping UI → API → database

```text
Thêm ghi danh      POST   /api/enrollments
                   → EnrollmentService.create
                   → EnrollmentRepository.create
                   → CALL sp_InsertEnrollment
                   → trigger capacity + UNIQUE + FK

Sửa ghi danh       PUT    /api/enrollments/<id>
                   → CALL sp_UpdateEnrollment

Xóa ghi danh       DELETE /api/enrollments/<id>
                   → CALL sp_DeleteEnrollment
                   → từ chối nếu Grade tồn tại

Danh sách          GET    /api/enrollments
                   → CALL sp_GetStudentEnrollments

Thống kê bài tập   GET    /api/statistics/assignments
                   → CALL sp_GetAssignmentStatistics

Tỷ lệ hoàn thành   GET    /api/statistics/assignments/<id>/completion
                   → SELECT fn_CalculateAssignmentCompletionRate

Điểm trung bình    GET    /api/statistics/enrollments/<id>/average
                   → SELECT fn_CalculateStudentAverageScore
```

## 4. Yêu cầu cả 5 thành viên đều viết SQL object

Xem `docs/TEAM_ASSIGNMENT.md`. Bảng phân công đảm bảo mỗi thành viên sở hữu ít nhất một trigger/function/procedure. Tên và MSSV đang để placeholder `[Họ tên]` / `[MSSV]`; nhóm phải điền trước khi nộp.

## 5. Tiêu chí tránh điểm trừ

| Tiêu chí | Cách đáp ứng |
|---|---|
| Các object không gần giống nhau | 3 procedure CRUD khác mục đích; 2 query procedure khác dạng truy vấn; 2 function khác nguồn dữ liệu; trigger chia 4 nhóm nghiệp vụ |
| Dữ liệu demo không quá ít/không vô nghĩa | 18 user, 8 sinh viên, 5 khoa, 8 lớp, 15 ghi danh, 6 assignment, 5 quiz, 13 submission, 10 grade, 7 feedback |
| Thành viên hiểu toàn bộ object | `docs/DEMO_SCRIPT.md` có Q&A; mỗi thành viên phải trình bày object của mình và giải thích ít nhất 1 object của người khác |
| Ứng dụng thực sự kết nối DB | Verifier + live smoke dùng MySQL thật; frontend chỉ gọi Flask |

## 6. Trạng thái tổng hợp

- **Đã kiểm thử tự động:** schema/seed/constraints/triggers/procedures/functions, 38 Python tests, live API 14/14, frontend static smoke.
- **Chưa kiểm thử:** chạy `.bat` trên Windows thật, kiểm thử hình ảnh trên nhiều trình duyệt, kiểm thử tải/đồng thời quy mô lớn.
- **Không tuyên bố:** không có đăng nhập/phân quyền thật, không có upload file thật, không có tích hợp LMS thật.
