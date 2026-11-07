# Security

## 1. Phạm vi

Đây là ứng dụng demo học phần BTL2, chạy local. Không phải hệ thống production. Các biện pháp dưới đây đủ cho demo, nhưng không thay thế một thiết kế bảo mật đầy đủ.

## 2. Secret

- Không commit `.env`.
- `.env.example` chỉ chứa placeholder.
- Không ghi mật khẩu/API key vào README, issue, PR, log.
- Nếu secret bị lộ:
  1. Thu hồi/đổi ngay.
  2. Xóa khỏi lịch sử Git nếu đã commit.
  3. Thông báo nhóm.

Kiểm tra nhanh:

```bash
git ls-files | grep -E '(^|/)\\.env$' || echo "OK: no .env tracked"
grep -RIn --exclude-dir=.git --exclude-dir=.venv "MYSQL_PASSWORD=.*[^e]$" . || true
```

## 3. SQL injection

- Mọi input đi qua `%s` parameterized query.
- Không nối chuỗi input vào SQL.
- Tên procedure cố định trong repository; `Database.call_procedure` từ chối tên không phải identifier.
- Catalog query dùng danh sách điều kiện tĩnh + params.
- `LIMIT/OFFSET` được validate số nguyên/range trước khi truyền procedure.

## 4. XSS

- Frontend escape dữ liệu bằng `escapeHtml` trước khi chèn vào `innerHTML`.
- Không dùng `eval`/`new Function`.
- Nội dung lỗi từ server cũng được escape khi hiển thị toast.
- Không render HTML tùy ý từ DB.

## 5. Authentication / authorization

**Chưa có.** Demo không có login, session, JWT, role check.

Hệ quả:

- Bất kỳ ai truy cập được Flask local đều gọi được API.
- Không dùng demo trong mạng công cộng.
- Nếu phát triển tiếp, cần:
  - đăng nhập và phân quyền Student/Staff/Admin;
  - kiểm tra RB01/RB07/RB13;
  - CSRF cho form/session;
  - rate limit;
  - audit log.

## 6. CSRF / CORS

- Không có auth/session nên chưa triển khai CSRF token.
- Frontend cùng origin với API; không cần CORS.
- Không mở CORS wildcard.
- Nếu thêm cookie/session, phải thêm CSRF protection.

## 7. Error handling

- Không trả stack trace/DB credentials cho client.
- Lỗi MySQL được map sang thông báo an toàn.
- Log server có request ID; log file nằm trong `logs/` và bị `.gitignore`.
- Không log mật khẩu/body nhạy cảm.

## 8. Database

- Dùng user MySQL riêng cho app nếu triển khai thật, không dùng root.
- Giới hạn quyền: chỉ SELECT/INSERT/UPDATE/DELETE/EXECUTE cần thiết.
- Không mở port MySQL ra Internet.
- Backup trước khi chạy `reset_database.sql` hoặc seed reset.
- Trigger/procedure là lớp bảo vệ nghiệp vụ, không thay thế backup/audit.

## 9. Frontend / tài nguyên

- Bootstrap và license nằm local; không CDN.
- Không có analytics/tracker.
- Không upload file thật; URL file chỉ là dữ liệu mẫu.
- Nếu thêm upload: validate MIME/kích thước/tên file, lưu ngoài webroot, quét malware.

## 10. Vận hành

- Chạy Flask mặc định `127.0.0.1`.
- Không bật debug khi demo công khai.
- Dùng `SECRET_KEY` ngẫu nhiên nếu triển khai thật.
- Cập nhật dependency định kỳ; kiểm tra `uv lock`.
- Log/DB demo có thể chứa dữ liệu giả; không dùng dữ liệu cá nhân thật.

## 11. Báo cáo lỗ hổng

Nếu phát hiện vấn đề:

1. Không công khai chi tiết khai thác.
2. Ghi lại bước tái hiện, môi trường, mức ảnh hưởng.
3. Liên hệ nhóm trưởng/TV1.
4. Với bài nộp, ghi vào phần "Hạn chế" của báo cáo thay vì che giấu.
