# Project handover

## 1. Snapshot

| Mục | Giá trị |
|---|---|
| Dự án | HCMUT LMS BTL2 — Hệ cơ sở dữ liệu |
| Thư mục | `hcmut-lms-btl2/` |
| Ngày bàn giao | 2026-11-07 |
| Stack | Python 3.12, Flask 3.1, PyMySQL 1.2, MySQL 8.4, Bootstrap 5.3.3 local |
| Database | 22 bảng, 13 trigger, 5 procedure, 2 function |
| Frontend | Offline, phục vụ bởi Flask, không CDN |
| Trạng thái | **Hoàn thiện phần code + test + tài liệu; cần điền tên/MSSV và kiểm tra Windows trước khi nộp** |

## 2. Đã bàn giao

### Database

- `database/schema/01_tables.sql`: 22 bảng.
- `database/constraints/02_foreign_keys.sql`: 35 FK.
- `database/constraints/03_checks.sql`: CHECK domain/semantic.
- `database/indexes/04_indexes.sql`: index truy vấn.
- `database/triggers/05_triggers.sql`: 13 trigger.
- `database/procedures/06_procedures.sql`: 5 procedure.
- `database/functions/07_functions.sql`: 2 function (cursor + IF/LOOP).
- `database/seeds/*`: seed đủ 5 hàng/bảng.
- `database/run_all.sql`, `reset_database.sql`, `09_verify_database.sql`.
- `database/tests/*`: 9 SQL test dương/âm.

### Backend

- `backend/app.py`: application factory, JSON provider, static frontend.
- `backend/api/*`: 4 Blueprint.
- `backend/services/*`: 4 service.
- `backend/repositories/*`: 3 repository.
- `backend/db.py`: PyMySQL wrapper, `call_procedure`, `call_procedure_one`.
- `backend/validation.py`: validate int/status/body.
- `backend/errors.py`: AppError, MySQL error mapping, JSON errors.
- `backend/logging_config.py`: request ID + rotating log.
- Health check `/api/health`, liveness `/api/health/live`.
- CRUD `Enrollment` gọi đúng 3 procedure.
- Query procedure và function được gọi thật bởi API.

### Frontend

- `frontend/index.html`: dashboard, ghi danh, thống kê, function tools, kiến trúc.
- `frontend/assets/app.js`: fetch API, CRUD modal, filter, toast, health polling.
- `frontend/assets/styles.css`: responsive, accessible, print.
- `frontend/vendor/bootstrap/*`: Bootstrap 5.3.3 + license, không CDN.
- Không kết nối MySQL trực tiếp.

### Vận hành / tài liệu

- `setup.bat`, `run.bat`, `stop.bat`, `check_environment.bat`.
- `scripts/check_environment.sh`, `run_server.sh`, `stop_server.sh`.
- `scripts/verify_database.py` (Docker MySQL tạm), `verify_database.sh`.
- `scripts/smoke_api.py`.
- README + 10 tài liệu trong `docs/`.
- `pyproject.toml`, `uv.lock`, `requirements.txt`, `requirements-dev.txt`.

## 3. Bằng chứng xác minh

Đã chạy thật:

```text
uv run pytest
→ 38 passed

uv run pytest --cov=backend --cov-report=term-missing
→ TOTAL 86%

python3 scripts/verify_database.py
→ DATABASE VERIFICATION: PASS
  - 22 tables
  - 13 triggers
  - 5 procedures
  - 2 functions
  - mọi bảng ≥ 5 seed rows
  - SubmissionCount khớp
  - lịch giảng không trùng
  - CRUD procedure success/fail đúng
  - function smoke đúng

python3 scripts/smoke_api.py --base-url http://127.0.0.1:5000
→ LIVE API SMOKE: PASS (14/14)

curl frontend / assets / Bootstrap local / favicon
→ tất cả HTTP 200

database/run_all.sql qua Docker + mount repo
→ PASS: 22 bảng, 13 trigger, 5 procedure, 2 function, Assignment=6

git clone <repo> /tmp/hcmut-lms-clean && uv sync && uv run pytest
→ 38 passed trong checkout sạch
```

Chi tiết: `docs/TESTING.md`.

## 4. Chạy nhanh

```bash
cd hcmut-lms-btl2
uv sync
cp .env.example .env
# sửa MySQL trong .env
mysql -u root -p < database/run_all.sql
uv run python run.py
```

Mở `http://127.0.0.1:5000`.

Database demo bằng Docker (không cần MySQL host):

```bash
docker run -d --name hcmut-lms-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=hcmut_lms \
  -p 3306:3306 \
  -v "$PWD:/repo" -w /repo \
  mysql:8.4
docker exec -i hcmut-lms-mysql mysql -uroot -proot < database/run_all.sql
```

Windows: `setup.bat` → `check_environment.bat` → `run.bat` → `stop.bat`.

## 5. Việc còn lại trước khi nộp

### Bắt buộc

1. **Điền họ tên/MSSV** vào `docs/TEAM_ASSIGNMENT.md`; thay tất cả placeholder.
2. **Chạy `.bat` trên Windows thật** và ghi kết quả; hiện chưa xác minh.
3. Chạy lại toàn bộ verification trên máy sạch:

   ```bash
   python3 scripts/verify_database.py
   uv run pytest
   uv run python run.py
   python3 scripts/smoke_api.py --base-url http://127.0.0.1:5000
   ```

4. Kiểm tra `.env` không có trong Git:
   ```bash
   git status --ignored
   git ls-files | grep -E '(^|/)\\.env$' || echo "OK: no .env"
   ```
5. Kiểm tra trực quan UI trên Chrome/Edge/Firefox; chụp màn hình nếu báo cáo cần.
6. Nếu giảng viên yêu cầu file báo cáo `.docx/.pdf`, chuẩn bị ngoài repo; repo này là source + demo.

### Nên làm

- Thêm ảnh chụp màn hình vào báo cáo (không bắt buộc trong repo).
- Kiểm tra lại mapping BTL1 → BTL2 với giảng viên nếu có điểm chưa chắc.
- Test thêm đồng thời nhiều request ghi danh vào một lớp gần đầy.
- Kiểm tra seed có đủ 5 hàng ở bảng mới nếu nhóm bổ sung bảng.

## 6. Giới hạn / không tuyên bố

- **Không có authentication/authorization thật**; API mở trong phạm vi demo local.
- **Không upload file thật**; seed dùng URL minh họa.
- **Không có tích hợp LMS thật** hay dữ liệu cá nhân thật.
- **Chưa test Windows .bat**; chỉ viết và rà soát nội dung.
- **Chưa test đa trình duyệt/visual regression**; mới smoke HTTP và kiểm tra syntax JS.
- **Chưa load test** quy mô lớn.
- `fn_CalculateStudentAverageScore` là chỉ số phân tích, không phải công thức điểm chính thức.
- `Assignment.SubmissionCount` là cột vật lý có chủ đích; BTL1 mô tả derived. Xem `docs/TECHNICAL_DECISIONS.md`.

## 7. Rủi ro và cách xử lý

| Rủi ro | Dấu hiệu | Xử lý |
|---|---|---|
| MySQL không chạy | `/api/health` 503, UI "Mất kết nối" | Kiểm tra service/container, `.env`, port |
| Sai mật khẩu DB | lỗi 1045 trong log | Sửa `.env`, restart Flask |
| Chưa nạp seed | bảng rỗng, function trả 0 | Chạy `database/run_all.sql` |
| Procedure/function thiếu | API 500 hoặc verifier fail | Chạy lại `05/06/07` SQL, xem log |
| Trigger lịch chặn seed | seed fail khi nạp | Kiểm tra seed không tạo lịch trùng; reset rồi nạp lại |
| `SubmissionCount` lệch | verifier báo mismatch | Chạy lại trigger/seed hoặc `09_verify` để điều tra |
| Windows `setup.bat` lỗi | thiếu `uv`/Python | Cài uv/Python 3.12, chạy `check_environment.bat` |
| Port 5000 bận | Flask không start | Đổi `FLASK_RUN_PORT`, chạy `stop.bat` |
| Frontend trắng | JS lỗi/asset 404 | Kiểm tra Network/Console, chạy frontend test |

## 8. Bản đồ file quan trọng

| Cần sửa gì | File |
|---|---|
| Bảng/cột | `database/schema/01_tables.sql` |
| FK/CHECK | `database/constraints/*` |
| Trigger | `database/triggers/05_triggers.sql` |
| CRUD/query procedure | `database/procedures/06_procedures.sql` |
| Function | `database/functions/07_functions.sql` |
| Seed | `database/seeds/*` |
| API route | `backend/api/*` |
| Nghiệp vụ backend | `backend/services/*` |
| SQL/Procedure call | `backend/repositories/*` |
| Validate/error | `backend/validation.py`, `backend/errors.py` |
| UI | `frontend/*` |
| Test Python | `backend/tests/*` |
| Test SQL | `database/tests/*` |
| Docs | `docs/*`, `README.md`, `CONTRIBUTING.md` |

## 9. Liên hệ / ownership

Xem `docs/TEAM_ASSIGNMENT.md`. Trước khi nộp, điền:

- TV1: `[Họ tên]` — `[MSSV]`
- TV2: `[Họ tên]` — `[MSSV]`
- TV3: `[Họ tên]` — `[MSSV]`
- TV4: `[Họ tên]` — `[MSSV]`
- TV5: `[Họ tên]` — `[MSSV]`

## 10. Ghi chú cuối

Repo được xây dựng để **chạy thật**, không phải mock UI. Nếu có thay đổi schema/procedure, luôn chạy lại:

```bash
python3 scripts/verify_database.py
uv run pytest
```

và cập nhật `docs/BTL2_REQUIREMENTS_MAPPING.md` + `docs/API_CONTRACT.md` nếu hành vi thay đổi.
