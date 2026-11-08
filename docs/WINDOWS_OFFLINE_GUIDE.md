# Windows offline guide

Mục tiêu: chạy demo trên Windows với frontend/Bootstrap hoàn toàn offline. Python dependency cần được cài một lần (qua `uv`/pip; có thể dùng cache nếu không có mạng).

> **Trạng thái:** các script `.bat` đã được viết và rà soát, nhưng **chưa chạy trên máy Windows thật**. Hãy chạy `check_environment.bat` và ghi lại kết quả trước khi nộp.

## 1. Yêu cầu

- Windows 10/11.
- Python **3.12+** (khuyến nghị cài từ python.org, chọn "Add python.exe to PATH").
- [`uv`](https://docs.astral.sh/uv/) trên `PATH`.
- MySQL **8.0+** đang chạy, hoặc Docker Desktop với MySQL 8.4.
- Trình duyệt Edge/Chrome/Firefox.
- `mysql` client trên `PATH` nếu import bằng command line.

Kiểm tra nhanh trong PowerShell:

```powershell
python --version
uv --version
mysql --version
docker --version
```

## 2. Cài dependency

Mở Command Prompt tại thư mục `hcmut-lms-btl2`, chạy:

```bat
setup.bat
```

Script:

- kiểm tra `uv`;
- tạo `.env` từ `.env.example` nếu chưa có;
- chạy `uv sync --offline` nếu `.venv` đã tồn tại, nếu không thì `uv sync`;
- in các bước tiếp theo.

Nếu máy không có mạng lần đầu, cần chuẩn bị trước một trong hai cách:

1. Chạy `uv sync` trên máy có mạng rồi copy cả thư mục (gồm `.venv` và `uv.lock`) sang máy offline **cùng kiến trúc/OS**.
2. Dùng pip với wheel cache:
   ```bat
   python -m venv .venv
   .venv\Scripts\activate
   pip install --no-index --find-links=wheelhouse -r requirements.txt
   pip install --no-index --find-links=wheelhouse -r requirements-dev.txt
   ```
   Trong đó `wheelhouse/` chứa wheel đã tải trước.

Frontend không cần mạng: Bootstrap đã nằm trong `frontend/vendor/bootstrap/`.

## 3. Cấu hình `.env`

Mở `.env` bằng Notepad/VS Code:

```env
FLASK_ENV=development
SECRET_KEY=replace-with-a-random-value
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=hcmut_lms
LOG_LEVEL=INFO
LOG_TO_FILE=true
```

Không commit `.env`.

## 4. Tạo database

### Cách A — MySQL local

```bat
mysql -u root -p < database\run_all.sql
```

Nếu `mysql` không có trên PATH, dùng đường dẫn đầy đủ, ví dụ:

```bat
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < database\run_all.sql
```

### Cách B — Docker Desktop

```bat
docker run -d --name hcmut-lms-mysql ^
  -e MYSQL_ROOT_PASSWORD=root ^
  -e MYSQL_DATABASE=hcmut_lms ^
  -p 3306:3306 ^
  -v "%cd%:/repo" -w /repo ^
  mysql:8.4

docker exec -i hcmut-lms-mysql mysql -uroot -proot < database\run_all.sql
```

Nếu dùng Docker, đặt `MYSQL_PASSWORD=root` trong `.env`.

### Kiểm tra database

```bat
mysql -u root -p hcmut_lms < database\09_verify_database.sql
```

Hoặc chạy verifier tự động nếu có Docker:

```bat
python scripts\verify_database.py
```

## 5. Chạy ứng dụng

```bat
run.bat
```

Script đặt mặc định:

- `FLASK_RUN_HOST=127.0.0.1`
- `FLASK_RUN_PORT=5000`
- mở trình duyệt sau 2 giây

Mở thủ công nếu cần: <http://127.0.0.1:5000>

## 6. Dừng ứng dụng

```bat
stop.bat
```

Mặc định tìm process LISTENING trên port 5000 và `taskkill`. Nếu dùng port khác:

```bat
stop.bat 5050
```

Lưu ý: script dừng **process đang giữ port**, không dừng MySQL/Docker.

## 7. Kiểm tra môi trường

```bat
check_environment.bat
```

Script kiểm tra:

- Python 3.12+
- `uv`
- `mysql`, `docker` (nếu có)
- `.env`
- Bootstrap CSS/JS local
- `frontend/index.html`
- `.venv`

## 8. Kiểm thử

```bat
uv run pytest
uv run python run.py
```

Terminal khác:

```bat
python scripts\smoke_api.py --base-url http://127.0.0.1:5000
```

Frontend:

- Mở DevTools → Network.
- Không có request tới CDN.
- Console không có lỗi.
- Health badge chuyển "API & DB ổn định".

## 9. Sự cố thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
|---|---|---|
| `'uv' is not recognized` | uv chưa cài/PATH | Cài uv, mở lại cmd |
| `python` không đúng 3.12 | Python cũ | Cài 3.12, ưu tiên PATH |
| `Access denied for user` | Sai `.env` | Sửa user/password, restart |
| `Can't connect to MySQL` | MySQL chưa chạy/sai port | Start service/container, kiểm tra 3306 |
| `Unknown database 'hcmut_lms'` | Chưa import | Chạy `database\run_all.sql` |
| `Table ... doesn't exist` | Import thiếu file | Dùng `run_all.sql`, không chạy lẻ thiếu |
| Port 5000 bận | Process khác | `stop.bat`, hoặc đặt `FLASK_RUN_PORT=5050` |
| UI trắng | Asset 404/JS lỗi | Kiểm tra Network/Console, chạy `uv run pytest` |
| Bootstrap mất style | Thiếu vendor | Kiểm tra `frontend\vendor\bootstrap\bootstrap.min.css` |
| `source` không nhận | Đang dùng cmd | Dùng `run.bat`, không dùng lệnh bash |
| Seed lỗi trigger lịch | Dữ liệu seed trùng | Reset database rồi nạp lại `run_all.sql` |
| `cryptography`/auth lỗi | MySQL auth plugin | Dùng MySQL 8 user/password chuẩn, hoặc cài `cryptography` nếu cần |

## 10. Offline checklist

- [ ] `frontend/vendor/bootstrap/bootstrap.min.css` tồn tại.
- [ ] `frontend/vendor/bootstrap/bootstrap.bundle.min.js` tồn tại.
- [ ] `frontend/vendor/bootstrap/LICENSE` tồn tại.
- [ ] Không có `<script src="https://...">` hoặc `<link href="https://...">` trong `frontend/index.html`.
- [ ] DevTools Network chỉ có request tới `127.0.0.1:5000`.
- [ ] `setup.bat`, `run.bat`, `stop.bat`, `check_environment.bat` chạy được trên Windows thật.
- [ ] Ghi lại phiên bản Windows/Python/MySQL vào báo cáo.

## 11. Ghi chú

- Flask mặc định `127.0.0.1`, không mở LAN. Nếu cần demo qua máy khác, đặt `FLASK_RUN_HOST=0.0.0.0` và cấu hình firewall; chỉ làm trong mạng tin cậy.
- Không dùng `FLASK_DEBUG=1` khi demo công khai.
- Nếu dùng Docker, nhớ database trong container sẽ mất nếu xóa container; seed lại bằng `run_all.sql`.
- Nếu muốn reset demo: `mysql -u root -p < database\reset_database.sql` rồi `run_all.sql`. **`reset_database.sql` DROP DATABASE**, chỉ dùng cho demo.

## 12. Mẫu ghi nhận kết quả clean-install (điền trước khi nộp)

| Mục | Giá trị |
|---|---|
| Ngày chạy | |
| Windows | Windows 10 / 11, phiên bản build |
| Python | `python --version` |
| uv | `uv --version` |
| MySQL | phiên bản + cách chạy (service/Docker) |
| Lệnh setup | `setup.bat` |
| Kết quả `check_environment.bat` | PASS / FAIL |
| Kết quả `run.bat` | Flask chạy tại `http://127.0.0.1:5000` |
| Kết quả `uv run pytest` | 72 passed |
| Kết quả `python scripts\verify_database.py` | DATABASE VERIFICATION: PASS |
| Kết quả `python scripts\smoke_api.py` | LIVE API SMOKE: PASS (31/31) |
| Ảnh/log đính kèm | Đường dẫn file |

Checklist:

- [ ] Chạy trên máy Windows **sạch**, chưa có `.venv`, chưa có database `hcmut_lms`.
- [ ] `setup.bat` tạo `.venv` và cài dependency thành công.
- [ ] `check_environment.bat` báo đủ Python/MySQL.
- [ ] Import `database\run_all.sql` thành công (22 bảng, 13 trigger, 5 procedure, 2 function).
- [ ] `run.bat` mở được giao diện và đăng nhập 3 vai trò.
- [ ] Mở DevTools → Network: không có request CDN.
- [ ] Chạy `pytest`, `verify_database.py`, `smoke_api.py` và lưu log.
- [ ] Chụp ảnh màn hình Dashboard/Ghi danh/Thống kê.
