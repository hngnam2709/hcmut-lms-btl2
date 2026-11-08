# Testing

## 1. Trạng thái hiện tại

Chạy ngày **2026-11-08** trên Linux, Python 3.12, MySQL 8.4.13 (Docker).

| Lớp kiểm thử | Lệnh | Kết quả |
|---|---|---|
| Python unit/API | `uv run pytest` | **57 passed** |
| Clean clone | `git clone` + `uv sync` + `uv run pytest` | **57 passed** |
| Coverage backend | `uv run pytest --cov=backend --cov-report=term-missing` | Chạy lại khi cần; không chốt số cũ |
| Database end-to-end | `python3 scripts/verify_database.py` | **PASS** |
| Live HTTP smoke | `python3 scripts/smoke_api.py --base-url http://127.0.0.1:5000` | **24/24 PASS** (gồm phân quyền 3 vai trò) |
| Frontend static | `curl` `/`, CSS, JS, Bootstrap, favicon | **PASS** |
| `database/run_all.sql` wrappers | Docker MySQL 8.4 + mount repo, `docker exec -i` | **PASS** (22 bảng / 13 trigger / 5 procedure / 2 function) |
| Windows `.bat` | Chưa có máy Windows | **Chưa xác minh** |
| Browser E2E (Chromium headless) | Playwright: login 3 role, Student/Staff/Admin, CRUD Ghi danh, Thống kê | **PASS, `ERRORS []`** |
| Visual cross-browser khác | Firefox/Safari/Edge | **Chưa xác minh** |

Không có kết quả nào ở trên là suy đoán; đây là output thật từ môi trường phát triển.

## 2. Python tests

Chạy:

```bash
uv run pytest
```

Các file:

| File | Nội dung |
|---|---|
| `backend/tests/test_health.py` | liveness, readiness, health degraded 503, request ID |
| `backend/tests/test_enrollments_api.py` | list/filter, validation, create/update/delete, duplicate 400 |
| `backend/tests/test_catalog_api.py` | semesters/students/sections/meta, section status |
| `backend/tests/test_statistics_api.py` | overview, filters, function endpoints |
| `backend/tests/test_validation.py` | int/bool/status/range |
| `backend/tests/test_repositories.py` | xác nhận đúng tên procedure/function được gọi |
| `backend/tests/test_json_provider.py` | Decimal, datetime, MySQL TIME (`timedelta`) |
| `backend/tests/test_auth.py` | login/logout, role guard, profile/catalog/enroll/drop, quiz finish, files |
| `backend/tests/test_config.py` | SECRET_KEY fail-fast ở production, cho phép demo secret ở local |
| `backend/tests/test_frontend.py` | index, JS/CSS, Bootstrap local, JSON 404, admin tabs Ghi danh/Thống kê |

Coverage 86% toàn backend. Phần chưa cover chủ yếu là nhánh kết nối PyMySQL thật (`backend/db.py`) và một số nhánh lỗi hiếm; các nhánh này được kiểm tra bằng verifier + live smoke.

## 3. Database verifier

Yêu cầu:

- Docker đang chạy.
- Python 3.
- Không cần MySQL cài trên host.

```bash
python3 scripts/verify_database.py
```

Script sẽ:

1. Tạo container MySQL 8.4 tạm.
2. Nạp `database/00_create_database.sql`, schema, FK, CHECK, index, trigger, procedure, function.
3. Nạp seed.
4. Chạy test dương/âm:
   - `01_procedure_success.sql`
   - `02_procedure_expected_fail_duplicate.sql`
   - `03_procedure_expected_fail_delete_grade.sql`
   - `04_trigger_expected_fail_schedule.sql`
   - `05_trigger_derived_submission_count.sql`
   - `06_function_smoke.sql`
   - `07_query_procedures.sql`
   - `08_constraint_expected_fail_email.sql`
   - `09_grade_expected_fail_score.sql`
   - `10_trigger_dml_matrix.sql` (INSERT/UPDATE/DELETE + move assignment + bulk)
   - `11_trigger_expected_fail_schedule_update.sql`
   - `12_function_boundary.sql`
   - `13_function_expected_fail_invalid.sql`
5. Kiểm tra:
   - đúng **22 bảng**
   - **13 trigger**, **5 procedure**, **2 function**
   - mọi bảng có **≥ 5 hàng**
   - `Assignment.SubmissionCount` khớp count thật
   - không có lịch giảng trùng
   - function trả giá trị mẫu đúng
6. Xóa container khi xong.

Kết quả mong đợi:

```text
DATABASE VERIFICATION: PASS
```

Giữ container để debug:

```bash
uv run python scripts/verify_database.py --keep
```

## 4. Live API smoke

Khởi động MySQL có seed và Flask:

```bash
uv run python run.py
```

Terminal khác:

```bash
python3 scripts/smoke_api.py --base-url http://127.0.0.1:5000
```

Script kiểm tra 24 bước:

1. health
2. meta
3. semesters
4. sections
5. enrollment list qua procedure
6. assignment statistics qua procedure
7. completion function
8. average function
9. create enrollment
10. get enrollment
11. update enrollment
12. delete enrollment
13. duplicate bị chặn (400)
14. limit sai bị chặn (422)
15. student login + profile + sections (chỉ 2 lớp)
16. student bị chặn section không ghi danh (404) và API Staff (403)
17. staff login + 3 lớp phụ trách + sinh viên lớp 1
18. staff bị chặn lớp không phụ trách (403)
19. admin login + 18 tài khoản + 22 bảng dữ liệu
20. admin không được chấm điểm (RB13, 403)

Script tự xóa enrollment vừa tạo. Chạy lại nhiều lần được.

## 5. Frontend smoke

```bash
curl -I http://127.0.0.1:5000/
curl -I http://127.0.0.1:5000/assets/app.js
curl -I http://127.0.0.1:5000/vendor/bootstrap/bootstrap.min.css
curl -I http://127.0.0.1:5000/vendor/bootstrap/bootstrap.bundle.min.js
curl -I http://127.0.0.1:5000/favicon.svg
```

Tất cả phải trả `200`. Kiểm tra không có request CDN:

```bash
grep -RIn "https\\?://" frontend/index.html frontend/assets || true
```

Chỉ được thấy URL minh họa trong text, không được thấy `<script src="https://...">` hoặc `<link href="https://...">`.

## 6. Manual UI checklist

- [ ] Trang tải, sidebar/topbar hiển thị đúng.
- [ ] Health badge chuyển "API & DB ổn định".
- [ ] Sáu thẻ dashboard có số liệu, không `undefined`.
- [ ] Bảng ghi danh có dữ liệu; filter sinh viên/học kỳ/status hoạt động.
- [ ] Nút "Thêm ghi danh" mở modal; chọn sinh viên/lớp; lưu thành công.
- [ ] Thêm trùng lớp hiện toast lỗi procedure, không crash.
- [ ] "Sửa" đổi được trạng thái; sinh viên bị khóa.
- [ ] "Xóa" hoạt động với ghi danh chưa có điểm; ghi danh có điểm bị chặn.
- [ ] Tab thống kê hiển thị progress bar và gọi hàm cập nhật được.
- [ ] Hai thẻ function trả kết quả.
- [ ] Mobile: menu mở/đóng, bảng scroll ngang, không tràn layout.
- [ ] Console không có lỗi JS.
- [ ] Không có request mạng ngoài localhost.

## 7. Windows test checklist

Chưa chạy trên Windows. Trước khi nộp, chạy:

```bat
setup.bat
check_environment.bat
run.bat
stop.bat
```

Kiểm tra thêm:

- `setup.bat` tạo `.env` và `.venv`.
- `check_environment.bat` nhận diện Python/uv/MySQL.
- `run.bat` mở được trình duyệt `http://127.0.0.1:5000`.
- `stop.bat` dừng đúng process ở port 5000.
- Không có lỗi CRLF/encoding trong `.bat`.

## 8. Giới hạn kiểm thử

- Chưa có load test/concurrency test quy mô lớn. Trigger capacity dùng `FOR UPDATE` + check; có thể test thêm bằng nhiều connection.
- Chưa test nhiều trình duyệt/OS.
- Chưa có auth/CSRF test vì demo không có auth.
- Không test upload file thật vì không có storage.
- Không test kết nối MySQL SSL/production.
