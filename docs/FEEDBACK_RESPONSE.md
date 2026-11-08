# Phản hồi feedback BTL2 (đối chiếu commit mới nhất)

> **Lưu ý quan trọng:** nhiều nhận xét trong feedback khớp với commit **`857f9e8`** (trước bản sửa). Commit mới nhất trên `main` là **`4cf5da4`** (sau đó thêm commit tài liệu). Reviewer cần mở đúng commit/branch `main`, không dùng snapshot cũ.

## P0 — SECURITY.md

**Nhận xét:** “dòng 36 vẫn ghi: Chưa có. Demo không có login, session, JWT, role check.”

**Hiện trạng `main`:**
- `SECURITY.md` đã viết lại; không còn chuỗi “Demo không có login”.
- Mục 2 ghi rõ: chọn role + tài khoản demo, không mật khẩu; có session cookie, `@require_role`, phân quyền dữ liệu Student/Staff/Admin.
- Dòng 22: “Đây là **demo role selection**, không phải authentication production.”

Kiểm tra:
```bash
grep -n "Demo không có login" SECURITY.md || echo "không còn"
grep -n "demo role selection" SECURITY.md
```

## P1 — SECRET_KEY

**Nhận xét:** `SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-change-this-secret")` và chưa có fail-fast/Secure cookie.

**Hiện trạng `main`:**

`backend/config.py`:
```python
DEFAULT_SECRET_KEY = "dev-only-change-this-secret"
INSECURE_SECRET_KEYS = {DEFAULT_SECRET_KEY, "replace-with-a-random-value"}
...
SECRET_KEY = os.getenv("SECRET_KEY") or DEFAULT_SECRET_KEY
APP_ENV = os.getenv("APP_ENV", "local").strip().lower()
```

`backend/session_config.py`:
- dùng `app.config["SECRET_KEY"]`;
- nếu secret thuộc `INSECURE_SECRET_KEYS` và `APP_ENV` không phải local/test/development → `raise RuntimeError`;
- đặt `SESSION_COOKIE_SECURE = (APP_ENV == "production")`.

Có test: `backend/tests/test_config.py` (2 test production phải fail, 1 test local được phép).

## P1 — `/api/auth/accounts` PII

**Nhận xét:** cả 3 nhánh vẫn trả `u.Email, u.AvatarURL`.

**Hiện trạng `main`:** khối `@bp.get("/accounts")` chỉ chọn:
- `UserID`, `FullName`, `AccountStatus`
- `StudentCode` (Student), `FacultyID`

Không còn `u.Email`/`u.AvatarURL` **trong khối accounts**. Hai dòng còn `u.Email` ở file là:
- query `POST /login` (trả user vừa đăng nhập);
- query `GET /me` (trả user của session hiện tại).

Đây không phải danh sách tài khoản công khai.

Kiểm tra:
```bash
sed -n '22,50p' backend/api/auth.py
```

## P1 — API authorization

**Đã sửa:**
- `backend/api/enrollments.py`: **toàn bộ** route GET/POST/PUT/DELETE có `@require_role("ADMIN")`.
- `backend/api/statistics.py`: **toàn bộ** 4 route có `@require_role("ADMIN")`.
- `backend/api/catalog.py`: `GET /api/students` (có email) chuyển sang `ADMIN`.
- Các route `/api/admin/*` đã có `ADMIN`; `/api/staff/*` có `STAFF`; `/api/student/*` có `STUDENT`.
- Metadata chỉ đọc `/api/meta`, `/api/semesters`, `/api/sections`, `/api/courses` vẫn public có chủ đích.

**Test mới:**
- 401 khi chưa đăng nhập: 5 route enrollment + 4 route statistics + `/api/students`.
- 403 khi Student/Staff gọi nhầm.
- 200/201 khi đúng ADMIN.
- Student/Staff flows giữ nguyên.

Bảng đầy đủ: `docs/API_AUTH_MATRIX.md`.

## P1 — Số lượng test không thống nhất

**Đã sửa:** tất cả tài liệu dùng **72 passed** và **31/31 smoke**:
- `README.md`
- `docs/TESTING.md`
- `docs/PROJECT_HANDOVER.md`
- `docs/BTL2_REQUIREMENTS_MAPPING.md`

Nguồn chuẩn mới: **`docs/TEST_RESULTS.md`** (output thật + ngày chạy). Nếu tài liệu khác lệch, file này thắng.

## P0 — TEAM_ASSIGNMENT placeholder

**Đây là lỗi thật, chưa đóng.** `docs/TEAM_ASSIGNMENT.md` vẫn còn `[Họ tên]`, `[MSSV]`, và cột Git evidence mới là lệnh gợi ý.

Cần nhóm:
1. Điền 5 tên + MSSV.
2. Mỗi thành viên commit gắn với object mình phụ trách (dù chỉ sửa comment/test) để `git shortlog` có dữ liệu thật.
3. Dán kết quả `git shortlog -sne --all` vào báo cáo.

## Script readiness

**Nhận xét:** script chỉ kiểm tra chuỗi, không chạy test.

**Đã nâng cấp:**
- Kiểm tra thêm `config.py`, `session_config.py`, khối accounts không PII, SECURITY.md, và **tính nhất quán số test** giữa README/TESTING/HANDOVER.
- Thêm cờ `--with-tests` để chạy thật:
```bash
.venv/bin/python scripts/check_submission_readiness.py --with-tests
```
Lệnh này chạy `pytest`, `verify_database.py`, và `smoke_api.py` nếu Flask đang chạy.

## Khả năng kiểm thử độc lập

Reviewer không clone được vì môi trường không phân giải `github.com`. Đây là giới hạn mạng của reviewer, không phải lỗi repo. Để hỗ trợ:
- `docs/TEST_RESULTS.md` ghi output thật.
- `scripts/check_submission_readiness.py --with-tests` chạy lại toàn bộ.
- `docs/evidence/` có 19 ảnh Chromium.

## Còn tồn tại (không tuyên bố đã xong)

| Mục | Trạng thái |
|---|---|
| Tên/MSSV + Git evidence từng thành viên | **Chưa xong — P0** |
| Chạy `.bat` trên Windows sạch | **Chưa xong — P1** |
| Firefox/Safari/Edge | Chưa test |
| Tải/đồng thời quy mô lớn | Chưa test |
| CSRF token đầy đủ | Chưa có; dựa vào SameSite=Lax + JSON body |
| Các endpoint demo `/api/enrollments`, `/api/statistics` | Chưa gắn `require_role`; đã ghi trong SECURITY.md |
