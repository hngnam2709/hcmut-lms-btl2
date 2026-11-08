# CRUD Enrollment → stored procedure trace (BTL2 2.1 / 3.1 / 3.2)

Màn hình: **Quản trị → Ghi danh** (`frontend/index.html` + `frontend/assets/app.js`, hàm `renderAdminEnrollments`).

## 1. Luồng đầy đủ

| Thao tác UI | HTTP | Service | Repository | Stored procedure |
|---|---|---|---|---|
| Danh sách + lọc | `GET /api/enrollments?student_id=&semester_id=&status=&limit=&offset=` | `EnrollmentService.list` | `EnrollmentRepository.list` | `CALL sp_GetStudentEnrollments(...)` |
| Xem 1 bản ghi | `GET /api/enrollments/<id>` | `EnrollmentService.get` | `EnrollmentRepository.get_by_id` | SELECT (không phải CRUD) |
| Thêm | `POST /api/enrollments` | `EnrollmentService.create` | `EnrollmentRepository.create` | `CALL sp_InsertEnrollment(...)` |
| Sửa | `PUT /api/enrollments/<id>` | `EnrollmentService.update` | `EnrollmentRepository.update` | `CALL sp_UpdateEnrollment(...)` |
| Xóa | `DELETE /api/enrollments/<id>` | `EnrollmentService.delete` | `EnrollmentRepository.delete` | `CALL sp_DeleteEnrollment(...)` |

File:
- UI: `frontend/assets/app.js` → `renderAdminEnrollments`, `openEnrollmentModal`.
- API: `backend/api/enrollments.py`.
- Service: `backend/services/enrollment_service.py`.
- Repository: `backend/repositories/enrollment_repository.py`.
- Procedure: `database/procedures/06_procedures.sql`.

## 2. Bằng chứng tự động rằng CRUD dùng procedure

`backend/tests/test_repositories.py::test_enrollment_crud_uses_required_procedures`:

```python
repository.create(107, 1, "ACTIVE")
repository.update(8, 2, "DROPPED")
repository.delete(8)
assert db.procedure_one_calls == [
    ("sp_InsertEnrollment", (107, 1, "ACTIVE")),
    ("sp_UpdateEnrollment", (8, 2, "DROPPED")),
    ("sp_DeleteEnrollment", (8,)),
]
```

`backend/tests/test_repositories.py::test_enrollment_list_uses_query_procedure`:

```python
rows = repository.list(101, 4, "ACTIVE", 20, 0)
assert db.procedure_calls == [
    ("sp_GetStudentEnrollments", (101, 4, "ACTIVE", 20, 0))
]
```

`backend/tests/test_enrollments_api.py` kiểm tra API truyền đúng tham số và map lỗi procedure (`database_rule_violation`).

## 3. Thao tác UI để chứng minh

1. Đăng nhập Admin `301` → **Quản trị** → tab **Ghi danh**.
2. Chọn **Sinh viên = 2210001 — Nguyen Van An** → bảng còn 2 dòng; xóa filter → 16 dòng.
3. Bấm **+ Thêm ghi danh** → chọn sinh viên `2210007 — Dang Thi Lan`, lớp `CO1001-L01`, trạng thái `ACTIVE` → **Lưu**.
   - Toast: “Đã thêm ghi danh.”
   - Bảng có dòng mới; `SELECT * FROM Enrollment WHERE StudentID=107` thấy bản ghi mới.
4. Bấm **Sửa** trên dòng mới → đổi trạng thái `DROPPED` → **Lưu**.
   - Toast: “Đã cập nhật ghi danh.”; cột trạng thái đổi `DROPPED`.
5. Bấm **Xóa** → xác nhận.
   - Toast: “Đã xóa ghi danh.”; dòng biến mất.
6. Thử xóa một ghi danh đã có điểm (ví dụ EnrollmentID 1) → procedure trả lỗi:
   - `Khong the xoa ghi danh da co diem. Hay giu lich su hoc tap.`
   - UI hiển thị toast đỏ, dòng vẫn còn.

## 4. Tham số người dùng → procedure

- `#enrollFilterStudent` → `student_id`
- `#enrollFilterSemester` → `semester_id`
- `#enrollFilterStatus` → `status`
- `#enrollSort` → sắp xếp phía client (Mới nhất / Tên SV / Mã lớp / Trạng thái)
- `limit=100`, `offset=0`

Các tham số này được gửi trong query string và truyền nguyên vẹn vào `sp_GetStudentEnrollments`.

## 5. Lỗi nghiệp vụ hiển thị từ procedure

| Tình huống | Thông báo |
|---|---|
| Trùng ghi danh | `Sinh vien da co ghi danh trong lop nay.` |
| Lớp đầy | `Lop hoc phan da day.` |
| Sinh viên không ACTIVE | `Tai khoan sinh vien khong hoat dong.` |
| Lớp không OPEN | `Lop hoc phan khong mo de ghi danh.` |
| Xóa ghi danh có điểm | `Khong the xoa ghi danh da co diem. Hay giu lich su hoc tap.` |

## 6. E2E

Script Playwright: `/tmp/admin_btl2_e2e.js` (không commit) chạy đúng chuỗi thêm → sửa → xóa và in:

```text
enrollment rows (initial): 16
filtered rows (student 101): 2
created row visible: 1
edited row text: ... DROPPED ...
rows after delete: 16
ERRORS []
```

Ảnh: `40-admin-enrollments.png`, `41-admin-enrollments-filtered.png`, `42-admin-enrollment-modal.png`, `43-admin-enrollments-after-crud.png`.
