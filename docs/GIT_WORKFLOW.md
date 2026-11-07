# Git workflow

Tài liệu này mô tả quy trình làm việc nhóm cho repository `hcmut-lms-btl2`.

## 1. Nhánh

| Nhánh | Mục đích | Bảo vệ |
|---|---|---|
| `main` | Bản ổn định, đã chạy verifier/test | Không push trực tiếp sau khi chốt |
| `develop` | Tích hợp các feature trước khi lên `main` | Khuyến nghị |
| `feature/<scope>-<short-desc>` | Tính năng mới | PR vào `develop`/`main` |
| `db/<object>-<short-desc>` | Schema, trigger, procedure, function, seed | PR, bắt buộc verifier |
| `fix/<short-desc>` | Bug fix | PR |
| `docs/<short-desc>` | Tài liệu | PR |
| `chore/<short-desc>` | Script, CI, dependency | PR |

Ví dụ:

```bash
git switch -c feature/enrollment-crud
git switch -c db/trigger-submission-count
git switch -c docs/handover-windows
```

## 2. Commit message

Dùng Conventional Commits, ngắn và nêu rõ phạm vi:

```text
feat(api): add enrollment CRUD endpoints
feat(db): add capacity trigger for enrollment
fix(db): reject deleting enrollment with grades
docs(handover): record verification evidence
test(api): cover duplicate enrollment error
chore(setup): add Windows offline scripts
```

Quy tắc:

- Một commit = một thay đổi logic.
- Không commit `.env`, `.venv`, log, file tạm, secret.
- Commit message tiếng Anh hoặc tiếng Việt không dấu đều được; thống nhất trong nhóm.
- Không commit file generated nếu không cần (trừ `uv.lock`).
- Luôn xem `git diff` trước khi commit.

## 3. Quy trình feature

```bash
git switch main
git pull --ff-only
git switch -c feature/ten-ngan

# code + test
uv run pytest
python3 scripts/verify_database.py   # nếu chạm DB

git add <files>
git diff --cached
git commit -m "feat(scope): mo ta ngan"
git push -u origin feature/ten-ngan
```

Mở Pull Request vào `main` hoặc `develop`. Không merge khi còn review comment chưa xử lý.

## 4. Pull Request checklist

- [ ] Mô tả thay đổi và lý do.
- [ ] Liệt kê file/DB object bị ảnh hưởng.
- [ ] Đã chạy `uv run pytest`.
- [ ] Nếu chạm DB: đã chạy `python3 scripts/verify_database.py`.
- [ ] Nếu chạm UI: đã chạy Flask + `scripts/smoke_api.py`, kiểm tra desktop/mobile.
- [ ] Không có `.env`, secret, dữ liệu cá nhân.
- [ ] Không làm thay đổi ngoài phạm vi.
- [ ] Tài liệu/README được cập nhật nếu hành vi/API thay đổi.
- [ ] Có ít nhất 1 reviewer.

## 5. Review

Reviewer tập trung:

1. **Đúng yêu cầu BTL2:** bảng/ràng buộc/trigger/procedure/function có thật, không mock.
2. **Đúng BTL1:** tên bảng/cột/quan hệ không bị bịa; quy tắc RB được giữ.
3. **An toàn SQL:** parameterized; không nối chuỗi input; procedure name cố định.
4. **Lỗi:** thông báo có nghĩa; HTTP status đúng; không lộ stack trace.
5. **Test:** positive + negative; test chạy được trên database sạch.
6. **UI:** không CDN; không gọi MySQL trực tiếp; trạng thái loading/empty/error rõ.

Review comment nên chỉ rõ file/dòng và đề xuất, tránh chỉ trích chung chung.

## 6. Merge

- Ưu tiên **Squash and merge** để lịch sử gọn.
- Xóa branch sau merge.
- Không force-push `main`.
- Tag bản nộp:

```bash
git tag -a v1.0.0 -m "BTL2 final submission"
git push origin v1.0.0
```

## 7. Xử lý conflict

- Kéo `main` mới nhất, rebase/merge tùy nhóm.
- Với file SQL: đọc lại toàn bộ object sau conflict; chạy verifier.
- Với `uv.lock`: resolve bằng `uv lock`, không sửa tay.
- Không xóa object của người khác để giải quyết conflict.

## 8. Bảo vệ bí mật

- `.env` nằm trong `.gitignore`.
- Không đưa mật khẩu thật vào README, issue, PR, commit.
- Nếu lỡ commit secret: xóa khỏi lịch sử, đổi mật khẩu, thông báo nhóm.
- Dùng `.env.example` làm mẫu.

## 9. Trạng thái repository hiện tại

Repository được khởi tạo với commit đầu tiên sau khi hoàn tất code/docs. Nếu clone từ nơi khác, kiểm tra:

```bash
git log --oneline --decorate -5
git status
```

Xem thêm `CONTRIBUTING.md`, `.github/PULL_REQUEST_TEMPLATE.md`.
