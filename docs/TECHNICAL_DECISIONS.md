# Technical decisions

Tài liệu ghi lại các quyết định có ảnh hưởng đến điểm BTL2, để nhóm bảo vệ và tránh hiểu nhầm khi bàn giao.

## 1. Chọn MySQL 8 + InnoDB + utf8mb4

- Đề cho phép MS SQL Server hoặc MySQL; nhóm chọn MySQL vì môi trường Docker/CI dễ tái lập.
- Dùng `utf8mb4` để lưu tên tiếng Việt và emoji nếu có.
- Verifier chạy MySQL 8.4.13 trong Docker; schema/seed cũng tương thích MySQL 8.0+.

## 2. 22 bảng thay vì 20 entity type

BTL1 có 20 entity type + 2 specialization + quan hệ N:M và thuộc tính đa trị. Khi vật lý hóa:

- 3 lớp con `Student`, `Staff`, `Admin` trở thành 3 bảng.
- `SubmissionFile` là weak entity, bảng riêng.
- `Section_Resource` là bảng quan hệ N:M.
- `AssignmentAttachment` là bảng cho thuộc tính đa trị.

Vì vậy có **22 bảng vật lý**. Đây không phải thêm entity mới ngoài thiết kế.

## 3. `Assignment.SubmissionCount` là cột vật lý có chủ đích

BTL1 mô tả `SubmissionCount` là thuộc tính dẫn xuất và khuyến nghị tính khi truy vấn. BTL2 yêu cầu chọn một thuộc tính dẫn xuất và viết trigger tính giá trị.

Quyết định:

- Thêm cột vật lý `Assignment.SubmissionCount INT NOT NULL DEFAULT 0`.
- Trigger `AFTER INSERT/DELETE/UPDATE` trên `Submission` tính lại từ `COUNT(*)`.
- Không cho client ghi trực tiếp cột này; seed không insert cột này.
- Verifier so sánh `SubmissionCount` với count thật và báo mismatch nếu có.

Đánh đổi: dữ liệu có thể lệch nếu trigger bị tắt hoặc restore thủ công; verifier/`09_verify_database.sql` phát hiện.

## 4. Trigger lịch giảng thay vì UNIQUE index

RB05 là ràng buộc khoảng thời gian giao nhau, không thể biểu diễn bằng UNIQUE đơn giản:

```sql
a.StartTime < b.EndTime AND b.StartTime < a.EndTime
```

Trigger kiểm tra:

- cùng `SemesterID`, cùng `DayOfWeek`
- trùng `PrimaryInstructorID` **hoặc** trùng `RoomCode`
- bỏ qua NULL instructor
- kiểm tra cả INSERT và UPDATE

## 5. Chia ràng buộc giữa CHECK và trigger

Nguyên tắc: kiểm tra được trong một hàng / một bảng thì dùng CHECK; cần đọc bảng khác, nhiều bản ghi, thời gian hoặc derived thì dùng trigger.

- CHECK: domain, độ dài, khoảng ngày, score >= 0, status enum...
- Trigger: sĩ số, trùng lịch, active enrollment, max attempts, score <= MaxScore, grader đúng lớp, parent feedback...
- Procedure: validation nghiệp vụ của CRUD, khóa transaction, thông báo lỗi cụ thể.

## 6. Xóa cứng `Enrollment` có kiểm soát

- `sp_DeleteEnrollment` chỉ xóa khi không có `Grade`.
- Nếu đã có điểm, trả lỗi và giữ lịch sử học tập.
- FK `Grade → Enrollment` dùng `ON DELETE RESTRICT` để lớp DB cũng bảo vệ.
- Đây là lựa chọn phù hợp demo; hệ thống thật có thể dùng soft delete/audit log.

## 7. Procedure dùng `SIGNAL` với thông báo cụ thể

- Mỗi lỗi có `MESSAGE_TEXT` nêu rõ đối tượng và điều kiện.
- Backend map SQLSTATE `45000`/error 1644 thành HTTP 400 `database_rule_violation`.
- Không trả stack trace/DB nội bộ cho client.

## 8. Backend chia lớp, không ORM

- Blueprint → Service → Repository → PyMySQL.
- SQL viết tay, tham số hóa `%s`.
- Procedure/function gọi bằng tên cố định, không nối chuỗi từ input.
- `Database.call_procedure` giới hạn tên procedure bằng ký tự an toàn.
- Lý do: thể hiện rõ yêu cầu gọi procedure/function, dễ kiểm tra SQL, không phụ thuộc ORM.

## 9. JSON serialization cho MySQL types

PyMySQL trả `Decimal`, `datetime`, `date`, `time`, `timedelta` (MySQL TIME). Backend dùng custom `APIJSONProvider`:

- Decimal → float
- datetime/date/time → ISO-like string
- timedelta → `HH:MM:SS`

Nhờ vậy API trả JSON ổn định, không lỗi 500 khi có cột TIME.

## 10. Frontend offline, không CDN

- Bootstrap 5.3.3 được tải một lần và lưu tại `frontend/vendor/bootstrap/`.
- CSS/JS/CSS license đều local.
- Không dùng Google Fonts, icon CDN, chart CDN hay API bên ngoài.
- Flask phục vụ frontend và API cùng origin, không cần CORS.

## 11. Seed reset có kiểm soát

- `00_reset_demo_data.sql` xóa dữ liệu demo theo thứ tự FK-safe.
- Không `DROP DATABASE`; `reset_database.sql` tách riêng và cảnh báo.
- `08_seed_data.sql` chạy reset + seed; chỉ dùng cho database demo.
- Mục đích: demo lặp lại được, không phụ thuộc trạng thái lần chạy trước.

## 12. Error handling và logging

- `AppError` cho lỗi nghiệp vụ/validation.
- Map MySQL 1644 → 400, 1062 → 409, FK → 409, mất kết nối → 503.
- Request ID trong header `X-Request-ID` và log.
- Log rotating `logs/app.log` (có thể tắt bằng `LOG_TO_FILE=false`).

## 13. Không có đăng nhập/phân quyền thật

Đây là demo BTL2, không phải hệ thống production:

- Không có login/session/JWT.
- API mở trong phạm vi local.
- Không upload file thật; seed dùng URL minh họa.
- Nếu phát triển tiếp, cần auth, CSRF, rate limit, audit log, upload storage và phân quyền theo RB01/RB07/RB13.

## 14. Kiểm thử database bằng Docker

- `scripts/verify_database.py` tạo container MySQL 8.4 tạm, không cần MySQL host.
- Chạy schema + seed + SQL tests + invariant checks.
- Container bị xóa trong `finally` trừ khi `--keep`.
- Đây là cách tái lập gần nhất với môi trường chấm.
