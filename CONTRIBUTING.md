# Contributing

Cảm ơn bạn đã tham gia `hcmut-lms-btl2`. Tài liệu này là quy ước bắt buộc cho thành viên nhóm và người review.

## 1. Setup

```bash
uv sync
cp .env.example .env
# sửa .env
mysql -u root -p < database/run_all.sql
uv run pytest
```

Với Windows, dùng `setup.bat` và đọc `docs/WINDOWS_OFFLINE_GUIDE.md`.

## 2. Phạm vi thay đổi

- Giữ thay đổi nhỏ, đúng một mục đích.
- Không sửa file ngoài phạm vi task.
- Không đổi schema/BTL1 nếu chưa thống nhất với TV1.
- Không thêm dependency nếu thư viện chuẩn hoặc dependency hiện có đủ dùng.
- Không xóa object/tài liệu của người khác khi chưa kiểm tra.

## 3. Python

- Python **3.12+**.
- Dùng `uv` để quản lý môi trường/dependency.
- Chạy lệnh bằng `uv run`.
- Theo mô hình hiện có: Blueprint → Service → Repository.
- SQL phải parameterized `%s`, không f-string/nối chuỗi với input.
- Không đưa logic DB vào route; route chỉ validate/parse và gọi service.
- Lỗi nghiệp vụ dùng `AppError`/`ValidationError`; không tự trả stack trace.
- Log bằng `logging`, không `print` trong code chạy thật.
- Type hint khi hợp lý; giữ code ngắn, dễ đọc.

Kiểm tra:

```bash
uv run pytest
python3 -m py_compile backend/app.py backend/db.py
```

## 4. SQL

- MySQL 8.0+, InnoDB, `utf8mb4`.
- Tên bảng/cột giữ đúng BTL1 (`PascalCase` như hiện tại).
- Mỗi file phải chạy độc lập được: có `USE hcmut_lms;` khi cần.
- CHECK nếu kiểm tra được trong một hàng; trigger nếu cần đọc bảng khác/nhiều bản ghi/thời gian/derived.
- Procedure/function/trigger phải có `DROP ... IF EXISTS`.
- Trigger phải xử lý cả INSERT và UPDATE nếu có thể vi phạm.
- Không dùng `SELECT *` trong procedure/query trả API.
- Không quên `DELIMITER $$ ... $$ DELIMITER ;`.
- Thông báo `SIGNAL` phải nêu rõ điều kiện, không dùng "Lỗi dữ liệu" chung chung.
- Thêm test dương và âm trong `database/tests/`.
- Chạy `python3 scripts/verify_database.py` trước khi mở PR.

Quy ước đặt tên:

| Loại | Tiền tố | Ví dụ |
|---|---|---|
| Trigger | `trg_` | `trg_enrollment_capacity_bi` |
| Procedure | `sp_` | `sp_InsertEnrollment` |
| Function | `fn_` | `fn_CalculateStudentAverageScore` |
| Index | `idx_` | `idx_enrollment_section_status` |
| Unique | `uq_` | `uq_enrollment_student_section` |
| Check | `ck_` | `ck_enrollment_status` |
| Foreign key | `fk_` | `fk_enrollment_student` |

## 5. Frontend

- HTML5/CSS3/JavaScript thuần + Bootstrap 5 local.
- Không thêm CDN, Google Fonts, analytics hay request ra ngoài.
- Không gọi MySQL trực tiếp; mọi dữ liệu qua `/api`.
- Luôn escape dữ liệu khi render bằng `escapeHtml`.
- Có trạng thái loading/empty/error; không hiển thị `undefined`.
- Giữ responsive ở desktop/tablet/mobile.
- Không dùng thư viện mới nếu không cần.
- Kiểm tra console trình duyệt không có lỗi.

## 6. Test

Mọi thay đổi cần tối thiểu:

```bash
uv run pytest
```

Nếu chạm database:

```bash
python3 scripts/verify_database.py
```

Nếu chạm UI/API tích hợp:

```bash
uv run python run.py
python3 scripts/smoke_api.py --base-url http://127.0.0.1:5000
```

Không tuyên bố "đã xong/pass" nếu chưa chạy lệnh và thấy kết quả.

## 7. Definition of Done

- [ ] Code chạy được, không lỗi cú pháp.
- [ ] Test liên quan pass.
- [ ] DB verifier pass nếu chạm DB.
- [ ] Không có secret/file rác trong diff.
- [ ] API contract/tài liệu cập nhật nếu cần.
- [ ] Reviewer đã duyệt.
- [ ] Commit message rõ ràng.

## 8. Review etiquette

- Review trong 24h nếu có thể.
- Comment cụ thể, kèm đề xuất.
- Phân biệt `blocking` và `nit`.
- Tác giả phản hồi từng comment hoặc resolve có lý do.
- Không merge khi còn blocking chưa xử lý.

## 9. Báo lỗi

Dùng GitHub Issue với:

- Môi trường (OS, Python, MySQL).
- Bước tái hiện.
- Kết quả mong đợi/thực tế.
- Log/request ID (không kèm mật khẩu).
- Nếu là lỗi DB: output `verify_database.py` hoặc câu SQL tối thiểu.
