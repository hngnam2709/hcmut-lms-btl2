# Security

## 1. Phạm vi

Đây là ứng dụng demo học phần BTL2, chạy local. Không phải hệ thống production. Mục tiêu bảo mật là:

- chứng minh phân quyền theo vai trò Student / Staff / Admin;
- không để lộ secret hoặc dữ liệu nhạy cảm ngoài phạm vi demo;
- ghi rõ giới hạn để người chấm không hiểu nhầm đây là hệ thống xác thực thật.

## 2. Xác thực demo (không phải đăng nhập thật)

- Người dùng chọn **vai trò** rồi chọn **tài khoản demo**; không có mật khẩu.
- Lý do: mô hình BTL1 (`UserAccount`) không có thuộc tính password, nên demo không thể xác thực bằng mật khẩu.
- Sau khi chọn, server tạo **session cookie** ký bằng `SECRET_KEY`, lưu `user_id` và `role`.
- `@require_role("STUDENT" | "STAFF" | "ADMIN")` chặn mọi API sai vai trò (401 nếu chưa đăng nhập, 403 nếu sai vai trò).
- `current_user_id()` lấy user từ session; service kiểm tra thêm phạm vi dữ liệu:
  - Student chỉ đọc/ghi dữ liệu của chính mình;
  - Staff chỉ thao tác trên lớp mình phụ trách;
  - Admin được xem dữ liệu học tập nhưng **không được chấm điểm** (RB13) — API chấm điểm chỉ cho STAFF.

Đây là **demo role selection**, không phải authentication production. Không dùng mô hình này cho hệ thống thật.

## 3. Secret và cấu hình

- Không commit `.env`; `.env.example` chỉ chứa placeholder.
- `SECRET_KEY` lấy từ biến môi trường. Nếu thiếu:
  - `APP_ENV=local|test|development`: dùng giá trị demo và ghi warning;
  - `APP_ENV` khác (ví dụ `production`): **dừng khởi động** với `RuntimeError`.
- Cookie session đặt `HttpOnly`, `SameSite=Lax`; bật `Secure` khi `APP_ENV=production`.
- Kiểm tra nhanh:

```bash
git ls-files | grep -E '(^|/)\.env$' || echo "OK: no .env tracked"
grep -RIn --exclude-dir=.git --exclude-dir=.venv "dev-only-change-this-secret" . || true
```

## 4. Danh sách tài khoản demo

`GET /api/auth/accounts?role=...` là endpoint công khai **có chủ đích** để màn hình đăng nhập demo hoạt động. Endpoint chỉ trả:

- `UserID`, `FullName`, `AccountStatus`
- `StudentCode` (chỉ Student), `FacultyID`

Không trả email, avatar hay thông tin cá nhân khác. Với hệ thống thật, endpoint này phải được bỏ hoặc thay bằng đăng nhập thật.

## 5. SQL injection

- Mọi input đi qua parameterized query `%s` của PyMySQL.
- Không nối chuỗi input vào SQL.
- Tên procedure cố định trong repository; `Database.call_procedure` từ chối tên không phải identifier.
- Catalog query dùng danh sách điều kiện tĩnh + params.
- `LIMIT/OFFSET` được validate số nguyên/range trước khi truyền procedure.

## 6. XSS

- Frontend escape dữ liệu bằng `escapeHtml` trước khi chèn vào `innerHTML`.
- Không dùng `eval`/`new Function`.
- Nội dung lỗi từ server cũng được escape khi hiển thị toast.
- Không render HTML tùy ý từ DB.

## 7. CSRF / CORS

- Có session cookie, nhưng chưa triển khai CSRF token.
- Giảm rủi ro bằng:
  - `SameSite=Lax`;
  - API thay đổi dữ liệu yêu cầu JSON object (`require_json_object`) — form cross-site thông thường không gửi được `application/json`;
  - frontend cùng origin, không mở CORS wildcard.
- Nếu triển khai thật, bổ sung CSRF token và kiểm tra `Origin`.

## 8. Error handling

- Không trả stack trace/DB credentials cho client.
- Lỗi MySQL được map sang thông báo an toàn (`validation_error`, `database_rule_violation`, `constraint_violation`, `database_unavailable`…).
- Log server có request ID; file log nằm trong `logs/` và bị `.gitignore`.
- Không log mật khẩu/body nhạy cảm.

## 9. Database

- Dùng user MySQL riêng cho app nếu triển khai thật, không dùng root.
- Giới hạn quyền: chỉ SELECT/INSERT/UPDATE/DELETE/EXECUTE cần thiết.
- Không mở port MySQL ra Internet.
- Backup trước khi chạy `reset_database.sql` hoặc seed reset.
- Trigger/procedure là lớp bảo vệ nghiệp vụ, không thay thế backup/audit.

## 10. Frontend / tài nguyên

- Bootstrap và license nằm local; không CDN.
- Không có analytics/tracker.
- Không upload file thật; URL file chỉ là dữ liệu mẫu.
- Nội dung từ DB luôn được escape trước khi render.

## 11. Giới hạn đã biết

- Không có password, MFA, OAuth hay quản lý phiên nâng cao.
- Không có CSRF token, rate limit, audit log đầy đủ.
- Demo account list là công khai trong môi trường local.
- Các endpoint demo dùng chung `/api/enrollments` (CRUD Ghi danh) và `/api/statistics` chưa gắn `require_role`; frontend chỉ gọi chúng từ màn hình Admin. Khi triển khai thật, bọc `@require_role("ADMIN")` cho các endpoint này.
- Chưa kiểm thử trên Windows thật; xem `docs/WINDOWS_OFFLINE_GUIDE.md`.
- Chưa có kiểm thử tải/đồng thời quy mô lớn.
