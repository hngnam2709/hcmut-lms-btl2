# API contract

Base URL local: `http://127.0.0.1:5000`

## 1. Quy ước chung

| Mục | Giá trị |
|---|---|
| Content type | `application/json; charset=utf-8` |
| Authentication | Không có trong demo BTL2 (xem `SECURITY.md`) |
| Request ID | Tự sinh hoặc nhận từ header `X-Request-ID`; trả lại trong response |
| Logging | Mỗi request có request ID, method, path, status, thời gian xử lý |
| Frontend | Cùng origin với Flask; không cần CORS |
| SQL | Parameterized; CRUD ghi danh gọi stored procedure bắt buộc |

### Response thành công

Đa số endpoint trả:

```json
{
  "data": {},
  "meta": {}
}
```

`meta` chỉ có ở endpoint danh sách. Một số endpoint chỉ trả `data`.

### Response lỗi

```json
{
  "error": {
    "code": "validation_error",
    "message": "limit phai >= 1.",
    "details": { "limit": "min:1" }
  },
  "request_id": "8f4c2d1a9b7e"
}
```

`details` có thể vắng mặt. Không trả stack trace hay thông tin kết nối DB.

### HTTP status và error code

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `invalid_json` | Body không phải JSON object |
| 400 | `database_rule_violation` | Stored procedure/trigger `SIGNAL` (trùng ghi danh, vượt sĩ số, xóa có điểm, lịch trùng...) |
| 400 | `constraint_violation` | CHECK/kiểu dữ liệu/độ dài |
| 404 | `not_found`, `http_404` | Không tìm thấy resource/endpoint |
| 409 | `duplicate`, `foreign_key_conflict` | UNIQUE/FK |
| 422 | `validation_error` | Query/body không hợp lệ |
| 500 | `database_error`, `internal_error` | Lỗi không mong muốn |
| 503 | `database_unavailable` | Không kết nối được MySQL |

## 2. Endpoint tổng hợp

| Method | Path | Chức năng | Gọi DB |
|---|---|---|---|
| GET | `/api/health/live` | Liveness, không kiểm tra DB | Không |
| GET | `/api/health` | Readiness, kiểm tra MySQL | `SELECT VERSION()` |
| GET | `/api/meta` | Metadata ứng dụng/status/procedure | Không |
| GET | `/api/semesters` | Danh sách học kỳ | `SELECT` |
| GET | `/api/students` | Danh sách sinh viên | `SELECT` |
| GET | `/api/sections` | Danh sách lớp học phần | `SELECT` |
| GET | `/api/courses` | Danh sách môn | `SELECT` |
| GET | `/api/enrollments` | Danh sách ghi danh | `CALL sp_GetStudentEnrollments` |
| GET | `/api/enrollments/<id>` | Chi tiết một ghi danh | `SELECT` tham số hóa |
| POST | `/api/enrollments` | Thêm ghi danh | `CALL sp_InsertEnrollment` |
| PUT | `/api/enrollments/<id>` | Sửa ghi danh | `CALL sp_UpdateEnrollment` |
| DELETE | `/api/enrollments/<id>` | Xóa ghi danh | `CALL sp_DeleteEnrollment` |
| GET | `/api/statistics/overview` | Đếm tổng quan | `SELECT` aggregate |
| GET | `/api/statistics/assignments` | Thống kê bài tập | `CALL sp_GetAssignmentStatistics` |
| GET | `/api/statistics/assignments/<id>/completion` | Tỷ lệ hoàn thành | `SELECT fn_CalculateAssignmentCompletionRate` |
| GET | `/api/statistics/enrollments/<id>/average` | Điểm trung bình nội bộ | `SELECT fn_CalculateStudentAverageScore` |

## 3. Chi tiết endpoint

### 3.1 `GET /api/health/live`

Không cần DB. Dùng cho process check.

```json
{
  "status": "ok",
  "service": "hcmut-lms-btl2-api",
  "timestamp": "2026-11-07T18:25:06+00:00"
}
```

### 3.2 `GET /api/health`

Trả 200 nếu MySQL sẵn sàng; 503 nếu không.

```json
{
  "status": "ok",
  "database": {
    "version": "8.4.13",
    "database_name": "hcmut_lms",
    "server_time": "2026-11-07 18:25:06"
  }
}
```

### 3.3 `GET /api/meta`

```json
{
  "data": {
    "application": "HCMUT LMS BTL2",
    "enrollment_statuses": ["ACTIVE", "DROPPED", "COMPLETED"],
    "database": "MySQL 8+ / InnoDB / utf8mb4",
    "crud_procedures": [
      "sp_InsertEnrollment",
      "sp_UpdateEnrollment",
      "sp_DeleteEnrollment"
    ]
  }
}
```

### 3.4 `GET /api/semesters`

```json
{
  "data": [
    {
      "SemesterID": 4,
      "AcademicYear": "2026-2027",
      "TermNo": 1,
      "StartDate": "2026-09-01",
      "EndDate": "2027-01-15"
    }
  ]
}
```

### 3.5 `GET /api/students`

Query:

- `active_only` (bool, default `true`): chỉ tài khoản `ACTIVE`.

```json
{
  "data": [
    {
      "StudentID": 101,
      "StudentCode": "2210001",
      "FullName": "Nguyen Van An",
      "Email": "an.nguyen@hcmut.edu.vn",
      "AccountStatus": "ACTIVE",
      "FacultyID": 1,
      "FacultyName": "Khoa Khoa hoc va Ky thuat May tinh"
    }
  ]
}
```

### 3.6 `GET /api/sections`

Query:

- `semester_id` (int dương, optional)
- `status` (`OPEN`, `CLOSED`, `CANCELLED`, optional)

Response có `ActiveEnrollmentCount` để hiển thị sĩ số hiện tại.

```json
{
  "data": [
    {
      "SectionID": 1,
      "SectionCode": "CO1001-L01",
      "SemesterID": 4,
      "AcademicYear": "2026-2027",
      "TermNo": 1,
      "CourseID": 1,
      "CourseCode": "CO1001",
      "CourseName": "Introduction to Programming",
      "ComponentType": "THEORY",
      "PrimaryInstructorID": 201,
      "InstructorName": "Tran Minh Duc",
      "Capacity": 40,
      "SectionStatus": "OPEN",
      "DayOfWeek": 2,
      "StartTime": "08:00:00",
      "EndTime": "09:30:00",
      "RoomCode": "A1-101",
      "ActiveEnrollmentCount": 3
    }
  ]
}
```

### 3.7 `GET /api/courses`

```json
{
  "data": [
    {
      "CourseID": 1,
      "CourseCode": "CO1001",
      "CourseName": "Introduction to Programming",
      "Credits": 3,
      "FacultyID": 1,
      "FacultyName": "Khoa Khoa hoc va Ky thuat May tinh"
    }
  ]
}
```

### 3.8 `GET /api/enrollments`

Query:

| Tên | Kiểu | Mặc định | Ghi chú |
|---|---|---|---|
| `student_id` | int > 0 | null | Lọc theo sinh viên |
| `semester_id` | int > 0 | null | Lọc theo học kỳ |
| `status` | enum | null | `ACTIVE`, `DROPPED`, `COMPLETED` |
| `limit` | int 1..500 | 100 | Truyền vào procedure |
| `offset` | int >= 0 | 0 | Truyền vào procedure |

Ví dụ:

```bash
curl "http://127.0.0.1:5000/api/enrollments?student_id=101&semester_id=4&status=ACTIVE&limit=20"
```

```json
{
  "data": [
    {
      "EnrollmentID": 1,
      "StudentID": 101,
      "StudentCode": "2210001",
      "StudentName": "Nguyen Van An",
      "SectionID": 1,
      "SectionCode": "CO1001-L01",
      "SemesterID": 4,
      "AcademicYear": "2026-2027",
      "TermNo": 1,
      "CourseID": 1,
      "CourseCode": "CO1001",
      "CourseName": "Introduction to Programming",
      "ComponentType": "THEORY",
      "DayOfWeek": 2,
      "StartTime": "08:00:00",
      "EndTime": "09:30:00",
      "RoomCode": "A1-101",
      "Capacity": 40,
      "EnrollmentDate": "2026-09-05 09:00:00",
      "EnrollmentStatus": "ACTIVE"
    }
  ],
  "meta": { "count": 1, "limit": 20, "offset": 0 }
}
```

### 3.9 `GET /api/enrollments/<id>`

`id` phải là số nguyên dương. Trả 404 nếu không tồn tại.

```json
{ "data": { "EnrollmentID": 1, "StudentID": 101, "SectionID": 1 } }
```

### 3.10 `POST /api/enrollments`

Body:

```json
{
  "student_id": 107,
  "section_id": 1,
  "status": "ACTIVE"
}
```

- `student_id`, `section_id`: bắt buộc, int > 0.
- `status`: optional, mặc định `ACTIVE`; chỉ `ACTIVE`, `DROPPED`, `COMPLETED`.

Response `201 Created`, header `Location: /api/enrollments/<id>`:

```json
{
  "data": {
    "success": 1,
    "EnrollmentID": 15,
    "message": "Ghi danh thanh cong."
  }
}
```

Các lỗi nghiệp vụ thường gặp (HTTP 400, `database_rule_violation`):

- `Sinh vien da co ghi danh trong lop nay.`
- `Lop hoc phan da du si so, khong the ghi danh.`
- `Sinh vien khong ton tai hoac tai khoan khong hoat dong.`
- `Lop hoc phan khong o trang thai OPEN.`

### 3.11 `PUT /api/enrollments/<id>`

Body phải có ít nhất một trường:

```json
{ "section_id": 2, "status": "ACTIVE" }
```

Sinh viên không đổi. Procedure từ chối đổi lớp/rút môn nếu đã có điểm.

```json
{
  "data": {
    "success": 1,
    "EnrollmentID": 8,
    "message": "Cap nhat ghi danh thanh cong."
  }
}
```

### 3.12 `DELETE /api/enrollments/<id>`

```json
{
  "data": {
    "success": 1,
    "EnrollmentID": 8,
    "message": "Xoa ghi danh thanh cong."
  }
}
```

Nếu có `Grade`, procedure trả HTTP 400:

```text
Khong the xoa ghi danh da co diem. Hay giu lich su hoc tap.
```

### 3.13 `GET /api/statistics/overview`

```json
{
  "data": {
    "student_count": 8,
    "section_count": 8,
    "enrollment_count": 15,
    "active_enrollment_count": 12,
    "assignment_count": 6,
    "submission_count": 13,
    "published_grade_count": 8
  }
}
```

Số liệu phụ thuộc seed/trạng thái demo tại thời điểm gọi.

### 3.14 `GET /api/statistics/assignments`

Query:

- `semester_id` (optional)
- `section_id` (optional)
- `min_submissions` (int >= 0, optional)

```json
{
  "data": [
    {
      "AssignmentID": 1,
      "AssignmentTitle": "Assignment 1: Algorithms",
      "SectionID": 1,
      "SectionCode": "CO1001-L01",
      "CourseCode": "CO1001",
      "CourseName": "Introduction to Programming",
      "AcademicYear": "2026-2027",
      "TermNo": 1,
      "EligibleStudentCount": 3,
      "SubmittedStudentCount": 2,
      "SubmissionCount": 3,
      "MissingStudentCount": 1,
      "CompletionRate": 66.67,
      "LastSubmittedAt": "2026-09-20 10:00:00"
    }
  ],
  "meta": { "count": 1 }
}
```

### 3.15 `GET /api/statistics/assignments/<id>/completion`

```json
{
  "data": {
    "assignment_id": 1,
    "completion_rate": 100.0
  }
}
```

Đây là kết quả thật từ `fn_CalculateAssignmentCompletionRate`. Function trả `0.00` nếu assignment có 0 eligible student; ID không tồn tại sẽ trả lỗi.

### 3.16 `GET /api/statistics/enrollments/<id>/average`

```json
{
  "data": {
    "enrollment_id": 1,
    "average_score": 82.5
  }
}
```

Đây là chỉ số phân tích nội bộ, không phải công thức điểm chính thức.

## 4. Ví dụ lỗi validation

```bash
curl -i "http://127.0.0.1:5000/api/enrollments?limit=0"
```

```http
HTTP/1.1 422 UNPROCESSABLE ENTITY
Content-Type: application/json
X-Request-ID: 8f4c2d1a9b7e
```

```json
{
  "error": {
    "code": "validation_error",
    "message": "limit phai >= 1.",
    "details": { "limit": "min:1" }
  },
  "request_id": "8f4c2d1a9b7e"
}
```

## 5. Ghi chú tích hợp

- UI không gọi MySQL trực tiếp; tất cả qua `/api`.
- Frontend và API cùng origin; không cần CORS.
- Không có `POST /api/login`; demo không có auth.
- Không upload file thật; URL tài liệu/file chỉ là dữ liệu mẫu.
