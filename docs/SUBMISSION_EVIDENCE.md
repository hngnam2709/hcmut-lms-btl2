# Submission evidence index (BTL2)

Tài liệu này gom các bằng chứng theo đúng rubric để đưa vào báo cáo/demo.

## 1. Tạo bảng và dữ liệu mẫu (3 điểm)

| Mục | File / lệnh | Kết quả |
|---|---|---|
| 1.1 Danh sách bảng, PK/FK/UNIQUE/CHECK | `docs/SCHEMA_INVENTORY.md` | 22 bảng, 119 cột, 35 FK, 10 UNIQUE, 39 CHECK |
| 1.1 Thiết kế & quan hệ | `docs/DATABASE_DESIGN.md` | mapping bảng BTL1, quan hệ, ràng buộc |
| 1.2 Số hàng mỗi bảng | `docs/ROW_COUNTS.md` | 22/22 bảng ≥ 5 hàng |
| 1.2 Seed chạy từ DB rỗng | `python scripts/verify_database.py` | PASS |
| 1.2 Tình huống trigger | `docs/TRIGGER_DML_MATRIX.md` | mô tả case vi phạm/giá trị dẫn xuất |

## 2. Trigger, procedure, function (4 điểm)

| Mục | File / lệnh | Kết quả |
|---|---|---|
| 2.1 CRUD procedure | `docs/CRUD_PROCEDURE_TRACE.md`; `database/tests/01–03` | INSERT/UPDATE/DELETE + lỗi trùng/xóa có điểm |
| 2.2 Trigger nghiệp vụ RB05 | `docs/TRIGGER_DML_MATRIX.md`; `database/tests/04, 11` | INSERT + UPDATE trùng lịch bị chặn |
| 2.2 Thuộc tính dẫn xuất | `docs/TRIGGER_DML_MATRIX.md`; `database/tests/05, 10` | INSERT/DELETE/UPDATE/move/bulk đúng |
| 2.3 Query procedures | `docs/QUERY_PROCEDURE_EVIDENCE.md`; `database/tests/07` | JOIN/WHERE/ORDER BY; aggregate/GROUP BY/HAVING |
| 2.4 Functions | `docs/FUNCTION_EVIDENCE.md`; `database/tests/06, 12, 13` | cursor + handler + loop + IF + validate + query |
| Phân công thành viên | `docs/TEAM_ASSIGNMENT.md` | **cần điền tên/MSSV + Git evidence** |

## 3. Ứng dụng (3 điểm)

| Mục | File / lệnh | Kết quả |
|---|---|---|
| 3.1 CRUD Ghi danh gọi procedure | `docs/CRUD_PROCEDURE_TRACE.md`; UI tab Ghi danh; `backend/tests/test_repositories.py` | `sp_InsertEnrollment`, `sp_UpdateEnrollment`, `sp_DeleteEnrollment` |
| 3.2 Danh sách + filter/sort/update/delete | UI tab Ghi danh; `GET /api/enrollments` | filter student/semester/status; sort; toast lỗi procedure |
| 3.3 UI procedure/function khác | UI tab Thống kê; `docs/QUERY_PROCEDURE_EVIDENCE.md` | bảng `sp_GetAssignmentStatistics`; 2 nút gọi function |
| Kết nối DB thật | `GET /api/health`; `scripts/smoke_api.py` | MySQL 8.4.13, `hcmut_lms` |

## 4. Lệnh chạy lại

```bash
uv run pytest -q                         # 57 passed
.venv/bin/python scripts/verify_database.py
.venv/bin/python scripts/smoke_api.py
.venv/bin/python scripts/report_row_counts.py
.venv/bin/python scripts/report_schema.py
.venv/bin/python scripts/check_submission_readiness.py
```

E2E Playwright (Chromium headless) đã chạy các luồng:
- đăng nhập 3 vai trò;
- Student: dashboard, courses, course tabs, nộp bài, quiz, grades, profile;
- Staff: dashboard, lớp, submissions, chấm điểm, tạo thông báo;
- Admin: users, sections, Ghi danh CRUD, Thống kê + 2 function, data explorer.

Ảnh minh chứng: `docs/evidence/00-login-*.png` … `16-admin-data.png` (18 ảnh, chụp từ Chromium headless).
