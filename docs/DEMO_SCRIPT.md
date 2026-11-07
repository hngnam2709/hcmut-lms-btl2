# Demo script

Kịch bản gợi ý 10–15 phút. Có thể demo UI trước, SQL sau; hoặc ngược lại. Không cần mạng.

## 0. Chuẩn bị

```bash
# MySQL + Flask đang chạy
uv run python run.py
```

Mở <http://127.0.0.1:5000>. Kiểm tra nhanh:

```bash
python3 scripts/smoke_api.py --base-url http://127.0.0.1:5000
```

Nếu database đã bị sửa nhiều, reset demo:

```bash
mysql -u root -p < database/reset_database.sql
mysql -u root -p < database/run_all.sql
```

> `reset_database.sql` DROP DATABASE. Chỉ dùng cho demo.

## 1. Tổng quan (1 phút)

- Chỉ vào hero: MySQL 8 · Flask · Bootstrap offline.
- Sáu thẻ: sinh viên, lớp, ghi danh, bài tập, submission, grade.
- Chỉ vào health badge: "API & DB ổn định"; mở `/api/health` nếu muốn thấy version MySQL.
- Nói: frontend không truy cập MySQL; mọi request qua Flask.

## 2. CRUD ghi danh (4 phút)

### 2.1 Thêm

1. Tab **Ghi danh** → **+ Thêm ghi danh**.
2. Chọn sinh viên `2210007` (Nguyen Gia Huy / StudentID 107).
3. Chọn lớp `CO1001-L01 · 2026-2027 HK1`.
4. Trạng thái `ACTIVE` → **Lưu**.
5. Quan sát toast `Ghi danh thanh cong.`; bảng tự tải lại.

Điểm cần nói:

- Request `POST /api/enrollments`.
- Backend gọi `sp_InsertEnrollment`, không INSERT trực tiếp.
- Procedure kiểm tra student ACTIVE, section OPEN, trùng, capacity, khóa `FOR UPDATE`.

### 2.2 Lỗi trùng

1. Mở lại **+ Thêm ghi danh**.
2. Chọn sinh viên `2210001` (đã có trong CO1001-L01) và cùng lớp.
3. **Lưu** → toast đỏ:

```text
Sinh vien da co ghi danh trong lop nay.
```

Nói: đây là `SIGNAL SQLSTATE '45000'` từ procedure; backend map thành HTTP 400 `database_rule_violation`.

### 2.3 Sửa

1. Tìm ghi danh vừa thêm (student 2210007).
2. **Sửa** → đổi trạng thái `DROPPED` → **Lưu**.
3. Nói: sinh viên bị khóa, chỉ đổi lớp/trạng thái; gọi `sp_UpdateEnrollment`.

### 2.4 Xóa

1. Với ghi danh vừa thêm, bấm **Xóa** → xác nhận.
2. Toast `Xoa ghi danh thanh cong.`; gọi `sp_DeleteEnrollment`.

### 2.5 Xóa bị chặn

1. Tìm ghi danh `#1` (Nguyen Van An, CO1001-L01).
2. **Xóa** → toast:

```text
Khong the xoa ghi danh da co diem. Hay giu lich su hoc tap.
```

Nói: `Grade` tham chiếu enrollment; procedure và FK `RESTRICT` cùng bảo vệ.

## 3. Thống kê & function (3 phút)

1. Tab **Thống kê bài tập**.
2. Học kỳ `2026-2027 · HK1`, lớp `CO1001-L01`, min submissions `0`.
3. Chỉ vào bảng: eligible/submitted/missing, progress bar, last submission.
4. Nói: dữ liệu từ `sp_GetAssignmentStatistics` (JOIN 8 bảng, GROUP BY, HAVING, COUNT DISTINCT).
5. Bấm **Gọi hàm** ở Assignment 1 → cập nhật `100.00%`.
6. Xuống tab **Hàm & quy trình**:
   - Assignment ID `1` → **Tính** → 100.00%.
   - Enrollment ID `1` → **Tính** → 82.50%.
7. Nói: cả hai gọi `SELECT fn_...` thật; function dùng cursor + IF/LOOP.

## 4. Trigger demo bằng SQL (3 phút)

Mở MySQL client:

```bash
mysql -u root -p hcmut_lms
```

### 4.1 Trigger derived `SubmissionCount`

```sql
SELECT AssessmentID, SubmissionCount
FROM Assignment
ORDER BY AssessmentID;
```

Kỳ vọng seed: `4, 2, 3, 3, 1, 0` (Assignment 6 = 0).

Chạy test có sẵn:

```sql
SOURCE database/tests/05_trigger_derived_submission_count.sql;
```

Kỳ vọng:

```text
CountAfterInsert = 1
CountAfterDelete = 0
```

Nói: `trg_submission_count_ai/ad/au` tự tính lại, không do app gán.

### 4.2 Trigger lịch giảng

```sql
SOURCE database/tests/04_trigger_expected_fail_schedule.sql;
```

Kỳ vọng lỗi kiểu:

```text
Giang vien hoac phong hoc bi trung lich trong cung hoc ky.
```

Nói: điều kiện giao khoảng `Start1 < End2 AND Start2 < End1`; kiểm tra cả giảng viên và phòng; trigger BEFORE INSERT/UPDATE.

### 4.3 Trigger sĩ số (nếu muốn)

```sql
-- Xem capacity và số active
SELECT cs.SectionID, cs.Capacity,
       SUM(e.EnrollmentStatus = 'ACTIVE') AS active_count
FROM CourseSection cs
LEFT JOIN Enrollment e ON e.SectionID = cs.SectionID
GROUP BY cs.SectionID, cs.Capacity;
```

Có thể giải thích trigger `trg_enrollment_capacity_bi/bu` và procedure cùng kiểm tra.

## 5. Kiến trúc & tài liệu (1 phút)

- Tab **Kiến trúc**: 3 lớp frontend/API/DB; trigger/procedure/function.
- Mở `docs/BTL2_REQUIREMENTS_MAPPING.md`: map từng yêu cầu → file → trạng thái.
- Mở `docs/TEAM_ASSIGNMENT.md`: 5 thành viên, mỗi người có SQL object.
- Nói rõ giới hạn: không auth, không upload thật, Windows script chưa test trên Windows.

## 6. Câu hỏi bảo vệ gợi ý

### Database

1. Vì sao 22 bảng trong khi BTL1 nói 20 entity type?
   - 3 subclass + weak entity `SubmissionFile` + bảng N:M `Section_Resource` + đa trị `AssignmentAttachment`.
2. Vì sao `SubmissionCount` là cột vật lý?
   - BTL2 yêu cầu trigger cho thuộc tính dẫn xuất; BTL1 mô tả derived. Đã ghi quyết định/đánh đổi.
3. Trigger lịch giảng kiểm tra gì?
   - Cùng semester/day, giao khoảng thời gian, trùng instructor hoặc room; INSERT/UPDATE.
4. Vì sao dùng CHECK thay trigger ở đâu?
   - CHECK cho domain một hàng; trigger cho liên bảng/nhiều bản ghi/thời gian/derived.
5. `sp_DeleteEnrollment` bảo vệ lịch sử thế nào?
   - Đếm `Grade`; nếu >0 SIGNAL; FK RESTRICT hỗ trợ.
6. Procedure chống oversell thế nào?
   - `SELECT ... FOR UPDATE` trên section + đếm active + check capacity trong transaction.
7. Vì sao hàm average không phải điểm chính thức?
   - Đây là chỉ số phân tích nội bộ trên grade đã publish; công thức chính thức phức tạp hơn.

### Query/function

8. `sp_GetAssignmentStatistics` tránh nhân dòng thế nào?
   - `COUNT(DISTINCT e.StudentID)`, `COUNT(DISTINCT s.StudentID)`, LEFT JOIN.
9. Function có đúng yêu cầu cursor + IF/LOOP không?
   - Có; xem `database/functions/07_functions.sql`.
10. Function xử lý assignment không có eligible student thế nào?
    - Trả `0.00`, không chia cho 0.

### Ứng dụng

11. UI có gọi MySQL trực tiếp không?
    - Không; chỉ fetch `/api`.
12. CRUD có thật gọi procedure không?
    - Repository gọi đúng tên; test `test_repositories.py` xác nhận.
13. Lỗi procedure hiển thị thế nào?
    - MySQL 1644 → HTTP 400 `database_rule_violation`; toast hiển thị `message`.
14. Frontend có offline không?
    - Bootstrap local; không CDN; DevTools Network chỉ localhost.
15. Vì sao frontend vẫn cần Flask?
    - Flask phục vụ static + API; frontend không có quyền/kết nối DB.

## 7. Phương án dự phòng

- Nếu UI lỗi: demo API bằng `scripts/smoke_api.py` và Swagger-less curl trong `docs/API_CONTRACT.md`.
- Nếu MySQL lỗi: chạy `python3 scripts/verify_database.py` để tạo môi trường tạm và chứng minh schema.
- Nếu mạng yếu: frontend vẫn chạy; chỉ cần MySQL/Flask local.
- Nếu hết thời gian: ưu tiên CRUD + 1 trigger + 2 function + mapping tài liệu.
