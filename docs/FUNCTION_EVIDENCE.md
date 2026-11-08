# Function evidence (BTL2 2.4)

Nguồn: `database/functions/07_functions.sql`. Cả hai function đều `READS SQL DATA`, không ghi dữ liệu.

## 1. `fn_CalculateAssignmentCompletionRate(p_assignment_id INT)`

| Yêu cầu rubric | Bằng chứng trong source |
|---|---|
| Cursor | `DECLARE cur_enrolled CURSOR FOR SELECT e.StudentID ...` (dòng 29–34) |
| Handler + cờ kết thúc | `DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;` (dòng 36) |
| OPEN / FETCH / LOOP / CLOSE | `OPEN` dòng 53; `enrollment_loop: LOOP` + `FETCH` dòng 55–56; `LEAVE` dòng 58; `CLOSE` dòng 74 |
| IF/LOOP tính toán | `IF v_has_submission > 0 THEN v_submitted = v_submitted + 1` (dòng 68–70); `IF v_total = 0 THEN RETURN 0.00` (dòng 76–78) |
| Query dữ liệu | SELECT section của assignment (dòng 43–46); SELECT COUNT submission trong loop (dòng 63–67) |
| Validate input | `IF p_assignment_id IS NULL OR p_assignment_id <= 0 THEN SIGNAL ...` (dòng 38–41) |
| Validate tồn tại | `IF v_section_id IS NULL THEN SIGNAL 'Khong tim thay bai tap...'` (dòng 48–51) |
| Kết quả | `RETURN ROUND(v_submitted * 100.0 / v_total, 2)` (dòng 80) |

**Gọi hàm:**
```sql
SELECT fn_CalculateAssignmentCompletionRate(1); -- 100.00
SELECT fn_CalculateAssignmentCompletionRate(6); -- 0.00 (chưa có submission)
SELECT fn_CalculateAssignmentCompletionRate(0); -- SIGNAL: AssignmentID phai la so nguyen duong.
```
**API:** `GET /api/statistics/assignments/1/completion` → `{"completion_rate": 100.0}`.

## 2. `fn_CalculateStudentAverageScore(p_enrollment_id INT)`

| Yêu cầu rubric | Bằng chứng trong source |
|---|---|
| Cursor | `DECLARE cur_grades CURSOR FOR SELECT (g.Score * 100.0 / a.MaxScore) ...` (dòng 101–107) |
| Handler + cờ kết thúc | `DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;` (dòng 109) |
| OPEN / FETCH / LOOP / CLOSE | `OPEN` dòng 125; `grade_loop: LOOP` + `FETCH` dòng 127–128; `LEAVE` dòng 130; `CLOSE` dòng 137 |
| IF/LOOP tính toán | cộng dồn `v_sum`, đếm `v_grade_count` (dòng 133–134); trả 0 nếu không có grade (dòng 139–141) |
| Query dữ liệu | cursor JOIN `Grade` + `Assessment`, chỉ `IsPublished = TRUE` |
| Validate input | `IF p_enrollment_id IS NULL OR p_enrollment_id <= 0 THEN SIGNAL ...` (dòng 111–114) |
| Validate tồn tại | SELECT COUNT enrollment + SIGNAL nếu không có (dòng 116–123) |
| Kết quả | `RETURN ROUND(v_sum / v_grade_count, 2)` (dòng 143) |

**Gọi hàm:**
```sql
SELECT fn_CalculateStudentAverageScore(1); -- 82.50
SELECT fn_CalculateStudentAverageScore(8); -- 0.00 (chưa có grade published)
SELECT fn_CalculateStudentAverageScore(-1); -- SIGNAL: EnrollmentID phai la so nguyen duong.
```
**API:** `GET /api/statistics/enrollments/1/average` → `{"average_score": 82.5}`.
**UI:** tab Quản trị → Thống kê → nút “Kiểm tra hàm” và “Tính điểm trung bình”.

## 3. Test tự động

| Test | Nội dung | Kết quả |
|---|---|---|
| `database/tests/06_function_smoke.sql` | gọi hàm với dữ liệu chuẩn | PASS |
| `database/tests/12_function_boundary.sql` | normal + boundary (0.00) + assert | PASS |
| `database/tests/13_function_expected_fail_invalid.sql` | input 0 phải bị SIGNAL | PASS (expected failure) |
| `scripts/verify_database.py` | `completion_rate_assignment_1 = 100.00`, `completion_rate_assignment_6 = 0.00`, `average_score_enrollment_1 = 82.50` | PASS |
