# Query procedure evidence (BTL2 2.3)

Nguồn: `database/procedures/06_procedures.sql`.

## 1. `sp_GetStudentEnrollments`

Tham số: `p_student_id`, `p_semester_id`, `p_status`, `p_limit`, `p_offset`.

| Yêu cầu | Bằng chứng |
|---|---|
| JOIN ≥ 2 bảng | `Enrollment` + `Student` + `UserAccount` + `CourseSection` + `CourseComponent` + `Course` + `Semester` |
| WHERE | `(p_student_id IS NULL OR e.StudentID = p_student_id)`; tương tự semester/status |
| ORDER BY | `sem.AcademicYear DESC, sem.TermNo DESC, c.CourseCode, cs.SectionCode` |
| Tham số từ UI | Tab **Quản trị → Ghi danh** gửi `student_id`, `semester_id`, `status`, `limit`, `offset` |
| Validate | ID dương hoặc NULL; status thuộc `ACTIVE/DROPPED/COMPLETED`; limit 1..500; offset ≥ 0 |
| Liên quan bảng CRUD | Truy vấn trực tiếp `Enrollment` — đúng bảng đã chọn ở mục 2.1 |

Gọi thử:
```sql
CALL sp_GetStudentEnrollments(101, 4, 'ACTIVE', 20, 0);
CALL sp_GetStudentEnrollments(NULL, 4, 'DROPPED', 20, 0);
```

## 2. `sp_GetAssignmentStatistics`

Tham số: `p_section_id`, `p_semester_id`, `p_min_submissions`.

| Yêu cầu | Bằng chứng |
|---|---|
| JOIN ≥ 2 bảng | `Assignment` + `Assessment` + `CourseSection` + `Semester` + `CourseComponent` + `Course` + `Enrollment` + `Submission` |
| Aggregate | `COUNT(DISTINCT e.StudentID)`, `COUNT(DISTINCT s.StudentID)`, `COUNT(s.SubmissionID)`, `MAX(s.SubmittedAt)` |
| GROUP BY | `a.AssessmentID, ass.Title, ass.SectionID, cs.SectionCode, c.CourseCode, c.CourseName, sem.AcademicYear, sem.TermNo` |
| HAVING | `HAVING COUNT(s.SubmissionID) >= COALESCE(p_min_submissions, 0)` |
| WHERE | `(p_section_id IS NULL OR cs.SectionID = p_section_id)` và semester |
| ORDER BY | `CompletionRate DESC, c.CourseCode, cs.SectionCode, a.AssessmentID` |
| Tham số từ UI | Tab **Quản trị → Thống kê**: lớp, học kỳ, “Số bài nộp tối thiểu (HAVING)” |
| Validate | ID dương hoặc NULL; `p_min_submissions` ≥ 0 |

Gọi thử:
```sql
CALL sp_GetAssignmentStatistics(NULL, 4, 0);
CALL sp_GetAssignmentStatistics(1, 4, 2);
```

## 3. Không trùng nội dung

- `sp_GetStudentEnrollments`: liệt kê ghi danh theo sinh viên/học kỳ/trạng thái, không aggregate.
- `sp_GetAssignmentStatistics`: thống kê bài tập theo lớp/học kỳ/ngưỡng nộp, có aggregate + HAVING.
- Hai procedure khác bảng chính, khác mục đích, khác dạng truy vấn.

## 4. Test

- `database/tests/07_query_procedures.sql`
- `scripts/smoke_api.py`: “enrollment list procedure”, “assignment statistics procedure”
- UI E2E: `44-admin-statistics.png`, `45-admin-functions.png`
