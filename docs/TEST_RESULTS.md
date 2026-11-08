# Test results (single source of truth)

Cập nhật lần cuối: **2026-11-08**, môi trường Linux, Python 3.12, MySQL 8.4.13 (Docker).

> Đây là kết quả chạy thật trên working tree trước commit tài liệu này.
> Nếu README/TESTING/HANDOVER khác file này, **file này là nguồn chuẩn**.

## 1. Python tests

```text
$ uv run pytest -q
57 passed in 2.34s
```

Bao gồm:
- `backend/tests/test_auth.py`: login/logout, role guard, profile/catalog/enroll/drop, quiz finish, files, không PII.
- `backend/tests/test_config.py`: SECRET_KEY fail-fast ở production.
- `backend/tests/test_enrollments_api.py`: CRUD + validation + lỗi procedure.
- `backend/tests/test_repositories.py`: xác nhận gọi đúng `sp_*` / `fn_*`.
- `backend/tests/test_statistics_api.py`, `test_catalog_api.py`, `test_health.py`, `test_validation.py`, `test_json_provider.py`, `test_frontend.py`.

## 2. Database verifier

```text
$ .venv/bin/python scripts/verify_database.py
[PASS] table_count = 22
[PASS] trigger_count = 13
[PASS] procedure_count = 5
[PASS] function_count = 2
[PASS] submission_count_mismatches = 0
[PASS] schedule_conflicts = 0
[PASS] completion_rate_assignment_1 = 100.00
[PASS] completion_rate_assignment_6 = 0.00
[PASS] average_score_enrollment_1 = 82.50
[PASS] every one of the 22 tables has at least 5 seed rows
DATABASE VERIFICATION: PASS
```

Các test SQL mới:
- `10_trigger_dml_matrix.sql`
- `11_trigger_expected_fail_schedule_update.sql`
- `12_function_boundary.sql`
- `13_function_expected_fail_invalid.sql`

## 3. Live API smoke

```text
$ .venv/bin/python scripts/smoke_api.py
LIVE API SMOKE: PASS (24/24)
```

Gồm 14 check public/CRUD + 10 check phân quyền Student/Staff/Admin.

## 4. Browser E2E (Chromium headless)

Các luồng đã chạy, console/pageerror `[]`:
- Login 3 vai trò.
- Student: dashboard, courses, course tabs, assignment modal, quiz modal, grades, profile.
- Staff: dashboard, submissions, grade modal.
- Admin: users/sections, **Ghi danh CRUD**, **Thống kê + 2 function**, data explorer.

Ảnh: `docs/evidence/00-login-*.png` … `16-admin-data.png`.

## 5. Readiness check

```text
$ .venv/bin/python scripts/check_submission_readiness.py --with-tests
```

Kết quả hiện tại: **chỉ còn FAIL do `docs/TEAM_ASSIGNMENT.md` chưa điền tên/MSSV**. Đây là P0 cần nhóm hoàn thành.

## 6. Lệnh chạy lại toàn bộ

```bash
cd hcmut-lms-btl2
uv run pytest -q
.venv/bin/python scripts/verify_database.py
.venv/bin/python scripts/smoke_api.py          # cần Flask đang chạy
.venv/bin/python scripts/check_submission_readiness.py --with-tests
```

## 7. Ghi chú minh bạch

- Không có kết quả nào trong file này là suy đoán; đều lấy từ output terminal.
- Chưa chạy trên Windows thật; xem checklist trong `docs/WINDOWS_OFFLINE_GUIDE.md`.
- Chưa chạy trên Firefox/Safari/Edge; E2E dùng Chromium headless.
- Không chạy kiểm thử tải/đồng thời quy mô lớn.
