# HCMUT LMS BTL2

Ứng dụng minh họa học phần **Hệ cơ sở dữ liệu** (BTL2) cho đề tài LMS/HCMUT: schema MySQL 8 đầy đủ, dữ liệu mẫu, trigger, stored procedure, stored function, Flask API và giao diện web chạy offline.

## Trạng thái xác minh

Các kết quả dưới đây được chạy trên môi trường phát triển Linux với MySQL 8.4.13 trong Docker:

| Hạng mục | Kết quả | Ghi chú |
|---|---|---|
| Python unit/API tests | **53 passed** | `uv run pytest` |
| Database verifier | **PASS** | `python3 scripts/verify_database.py` |
| Live API smoke | **24/24 PASS** | `scripts/smoke_api.py` với Flask + MySQL thật, gồm phân quyền 3 vai trò |
| Frontend static smoke | **PASS** | `/`, CSS, JS, Bootstrap local, favicon trả HTTP 200 |
| Windows `.bat` scripts | **Chưa chạy trên Windows** | Cần kiểm tra lại trên máy Windows trước khi nộp |

Chi tiết và giới hạn được ghi trong [`docs/TESTING.md`](docs/TESTING.md) và [`docs/PROJECT_HANDOVER.md`](docs/PROJECT_HANDOVER.md).

## Tính năng chính

- **Đăng nhập demo + phân quyền**: màn hình chọn role `Student / Staff / Admin` rồi chọn tài khoản có sẵn (không mật khẩu, đúng BTL1 — `UserAccount` không có thuộc tính password). Mỗi role có dashboard và API giới hạn đúng phạm vi của mình.
- **Student**: xem lớp đã ghi danh, thông báo, tài liệu, bài tập/quiz, nộp bài, xem điểm đã công bố, phản hồi trên bài nộp của mình.
- **Staff**: xem lớp mình phụ trách, quản lý sinh viên, thông báo, tài liệu, assignment/quiz, chấm điểm bài nộp và grade (RB13).
- **Admin**: quản lý tài khoản (khóa/mở khóa theo RB07), khoa, học kỳ, môn học, thành phần, lớp học phần, ghi danh; khám phá toàn bộ 22 bảng (read-only).
- **22 bảng** MySQL 8, InnoDB, `utf8mb4`, khóa chính/ngoại, UNIQUE, CHECK và index.
- **5 stored procedure**: 3 procedure CRUD cho `Enrollment` và 2 procedure truy vấn.
- **2 stored function**: tỷ lệ hoàn thành bài tập và điểm trung bình nội bộ, có cursor + IF/LOOP + kiểm tra tham số.
- **13 trigger**: kiểm tra trùng lịch giảng/phòng, duy trì `Assignment.SubmissionCount`, bảo vệ sĩ số, submission, grade và feedback.
- **Flask API** theo mô hình Blueprint → Service → Repository, session auth, validation, error handler, logging, health check.
- **Giao diện offline**: HTML5/CSS3/JS + Bootstrap 5 vendored trong `frontend/vendor`; không CDN, không truy cập MySQL trực tiếp; theme hồng phấn phong cách Moodle.
- **Windows scripts**: `setup.bat`, `check_environment.bat`, `run.bat`, `stop.bat`.
- **Kiểm thử thật**: SQL verifier dùng Docker MySQL, test API/unit, smoke test HTTP, tài liệu demo và bàn giao.

## Kiến trúc

```text
Browser (offline Bootstrap UI)
        │ fetch /api/*
        ▼
Flask Blueprints → Services → Repositories → PyMySQL → MySQL 8
                                                   ├── 22 tables
                                                   ├── constraints + indexes
                                                   ├── 5 procedures
                                                   ├── 2 functions
                                                   └── 13 triggers
```

Frontend **không** kết nối MySQL. Mọi thao tác CRUD ghi danh gọi đúng ba procedure:

- `sp_InsertEnrollment`
- `sp_UpdateEnrollment`
- `sp_DeleteEnrollment`

## Cấu trúc repository

```text
hcmut-lms-btl2/
├── backend/
│   ├── api/                 # Blueprint: health, catalog, enrollments, statistics
│   ├── repositories/        # SQL/procedure calls, parameterized
│   ├── services/            # Use cases và phối hợp repository
│   ├── tests/               # 53 unit/API tests
│   ├── app.py               # Application factory
│   ├── config.py            # .env/MySQL config
│   ├── db.py                # PyMySQL wrapper + procedure caller
│   ├── errors.py            # AppError, validation, MySQL error mapping
│   ├── logging_config.py    # Request ID + rotating log
│   └── validation.py        # Input validation
├── database/
│   ├── 00_create_database.sql
│   ├── 01_create_tables.sql ... 09_verify_database.sql
│   ├── schema/              # 22 table definitions
│   ├── constraints/         # FK + CHECK
│   ├── indexes/             # Query indexes
│   ├── triggers/            # 13 triggers
│   ├── procedures/          # 5 stored procedures
│   ├── functions/           # 2 stored functions
│   ├── seeds/               # Seed theo nhóm phụ thuộc
│   └── tests/               # SQL positive/negative tests
├── frontend/
│   ├── index.html
│   ├── favicon.svg
│   ├── assets/              # app.js, styles.css
│   └── vendor/bootstrap/    # Bootstrap 5.3.3 local + license
├── scripts/
│   ├── verify_database.py   # Docker MySQL verifier
│   ├── verify_database.sh
│   ├── smoke_api.py         # Live HTTP smoke test
│   ├── run_server.sh
│   ├── stop_server.sh
│   └── check_environment.sh
├── docs/                    # Handover, mapping, API, design, testing, Git workflow...
├── setup.bat / run.bat / stop.bat / check_environment.bat
├── run.py                   # Flask entrypoint
├── pyproject.toml / uv.lock
└── requirements.txt
```

## Yêu cầu

- Python **3.12+**
- [`uv`](https://docs.astral.sh/uv/) (khuyến nghị) hoặc pip
- MySQL **8.0+** (local hoặc Docker)
- Trình duyệt hiện đại
- Windows scripts giả định `uv`, `python` và MySQL client có trên `PATH`

## Quick start

### 1. Cài dependency Python

```bash
uv sync
cp .env.example .env
# Sửa MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD trong .env
```

Nếu không dùng `uv`:

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### 2. Tạo database và dữ liệu mẫu

Cách A — MySQL local:

```bash
mysql -u root -p < database/run_all.sql
```

Cách B — Docker MySQL 8.4, mount repo để `SOURCE` đường dẫn tương đối hoạt động:

```bash
docker run -d --name hcmut-lms-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=hcmut_lms \
  -p 3306:3306 \
  -v "$PWD:/repo" -w /repo \
  mysql:8.4
docker exec -i hcmut-lms-mysql mysql -uroot -proot < database/run_all.sql
```

Chỉ dùng `database/reset_database.sql` với database demo/disposable; file này **DROP DATABASE**.

### 3. Kiểm tra database tự động (không cần MySQL trên host)

```bash
python3 scripts/verify_database.py
```

Script tạo container MySQL tạm, nạp schema + seed, chạy positive/negative SQL tests, kiểm tra 22 bảng, 13 trigger, 5 procedure, 2 function, `SubmissionCount`, lịch trùng, function results, rồi xóa container.

### 4. Chạy Flask

```bash
uv run python run.py
```

Mở <http://127.0.0.1:5000>. Giao diện tự gọi API và hiển thị trạng thái DB.

### 5. Chạy test

```bash
uv run pytest
python3 scripts/smoke_api.py --base-url http://127.0.0.1:5000
```

## Windows offline

```bat
setup.bat
check_environment.bat
run.bat
stop.bat
```

Xem hướng dẫn đầy đủ tại [`docs/WINDOWS_OFFLINE_GUIDE.md`](docs/WINDOWS_OFFLINE_GUIDE.md). Lần cài dependency Python đầu tiên cần `uv`/pip và mạng (hoặc cache sẵn); sau đó frontend và Bootstrap chạy hoàn toàn offline.

## Tài liệu

| Tài liệu | Nội dung |
|---|---|
| [`docs/PROJECT_HANDOVER.md`](docs/PROJECT_HANDOVER.md) | Bàn giao, trạng thái thật, việc còn lại |
| [`docs/BTL2_REQUIREMENTS_MAPPING.md`](docs/BTL2_REQUIREMENTS_MAPPING.md) | Map từng yêu cầu BTL2 sang file/test/trạng thái |
| [`docs/TEAM_ASSIGNMENT.md`](docs/TEAM_ASSIGNMENT.md) | Phân công 5 thành viên, mỗi người có SQL object |
| [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) | Hợp đồng API, request/response, lỗi |
| [`docs/DATABASE_DESIGN.md`](docs/DATABASE_DESIGN.md) | 22 bảng, quan hệ, ràng buộc, trigger/procedure/function |
| [`docs/TECHNICAL_DECISIONS.md`](docs/TECHNICAL_DECISIONS.md) | Quyết định thiết kế và đánh đổi |
| [`docs/GIT_WORKFLOW.md`](docs/GIT_WORKFLOW.md) | Nhánh, commit, PR, review, merge |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Quy ước code/SQL/test và Definition of Done |
| [`docs/TESTING.md`](docs/TESTING.md) | Cách chạy và kết quả kiểm thử |
| [`docs/WINDOWS_OFFLINE_GUIDE.md`](docs/WINDOWS_OFFLINE_GUIDE.md) | Setup Windows offline |
| [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) | Kịch bản demo và câu hỏi bảo vệ |
| [`SECURITY.md`](SECURITY.md) | Bảo mật, secret, giới hạn demo |

## Ghi chú

- `Assignment.SubmissionCount` là **cột vật lý có chủ đích** để đáp ứng yêu cầu trigger cho thuộc tính dẫn xuất; BTL1 mô tả nó là derived. Quyết định này được ghi rõ trong `docs/TECHNICAL_DECISIONS.md`.
- `fn_CalculateStudentAverageScore` là chỉ số phân tích nội bộ (trung bình phần trăm các assessment đã publish), **không phải** công thức điểm tổng kết chính thức của HCMUT.
- Seed dùng dữ liệu giả lập, có script reset riêng; không chứa dữ liệu cá nhân thật.
- Đây là demo học phần, chưa có đăng nhập/phân quyền thật; xem `SECURITY.md` trước khi triển khai ngoài môi trường demo.
