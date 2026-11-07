# Phân công 5 thành viên

> **Bắt buộc trước khi nộp:** thay `[Họ tên]` và `[MSSV]` bằng thông tin thật. Tài liệu này được thiết kế để mỗi thành viên sở hữu ít nhất một trigger/function/procedure, đúng yêu cầu BTL2.

## 1. Bảng phân công

| Thành viên | Vai trò chính | SQL object sở hữu | Backend / Frontend | Tài liệu / Test |
|---|---|---|---|---|
| **TV1** `[Họ tên]` — `[MSSV]` | Database lead, schema & ràng buộc | `trg_section_schedule_bi`, `trg_section_schedule_bu`, `trg_feedback_validate_bi`, `trg_feedback_validate_bu` | Review schema repository/DB wrapper | `docs/DATABASE_DESIGN.md`, `docs/TECHNICAL_DECISIONS.md`; kiểm tra 22 bảng/constraint/index |
| **TV2** `[Họ tên]` — `[MSSV]` | CRUD & backend enrollment | `sp_InsertEnrollment`, `sp_UpdateEnrollment`, `sp_DeleteEnrollment` | `backend/api/enrollments.py`, `services/enrollment_service.py`, `repositories/enrollment_repository.py`; UI tab Ghi danh | `backend/tests/test_enrollments_api.py`; SQL tests 01–03 |
| **TV3** `[Họ tên]` — `[MSSV]` | Data integrity & seed | `trg_enrollment_capacity_bi`, `trg_enrollment_capacity_bu`, `trg_grade_validate_bi`, `trg_grade_validate_bu` | Review error mapping/validation; hỗ trợ dữ liệu demo | `database/seeds/*`, kiểm tra ≥5 hàng/bảng; SQL test 09 (grade score) |
| **TV4** `[Họ tên]` — `[MSSV]` | Query, function & statistics | `sp_GetStudentEnrollments`, `sp_GetAssignmentStatistics`, `fn_CalculateAssignmentCompletionRate`, `fn_CalculateStudentAverageScore` | `backend/api/statistics.py`, `services/statistics_service.py`, `repositories/statistics_repository.py`; UI tab Thống kê/Hàm | `backend/tests/test_statistics_api.py`, `test_repositories.py`; SQL tests 06–07 |
| **TV5** `[Họ tên]` — `[MSSV]` | Submission rules & UI/ops | `trg_submission_count_ai`, `trg_submission_count_ad`, `trg_submission_count_au`, `trg_submission_validate_bi`, `trg_submission_validate_bu` | `frontend/*`, `run.py`, `setup.bat`, `run.bat`, `stop.bat`, `check_environment.bat` | `backend/tests/test_frontend.py`; SQL test 05; live smoke; Windows checklist |

## 2. Ma trận phủ SQL object

Tổng cộng 20 object có thể trình bày: **13 trigger + 5 procedure + 2 function**.

| Nhóm | Object | Owner |
|---|---|---|
| RB05 lịch giảng | `trg_section_schedule_bi` | TV1 |
| RB05 lịch giảng | `trg_section_schedule_bu` | TV1 |
| Feedback | `trg_feedback_validate_bi` | TV1 |
| Feedback | `trg_feedback_validate_bu` | TV1 |
| CRUD | `sp_InsertEnrollment` | TV2 |
| CRUD | `sp_UpdateEnrollment` | TV2 |
| CRUD | `sp_DeleteEnrollment` | TV2 |
| Capacity | `trg_enrollment_capacity_bi` | TV3 |
| Capacity | `trg_enrollment_capacity_bu` | TV3 |
| Grade | `trg_grade_validate_bi` | TV3 |
| Grade | `trg_grade_validate_bu` | TV3 |
| Query | `sp_GetStudentEnrollments` | TV4 |
| Query | `sp_GetAssignmentStatistics` | TV4 |
| Function | `fn_CalculateAssignmentCompletionRate` | TV4 |
| Function | `fn_CalculateStudentAverageScore` | TV4 |
| Derived | `trg_submission_count_ai` | TV5 |
| Derived | `trg_submission_count_ad` | TV5 |
| Derived | `trg_submission_count_au` | TV5 |
| Submission | `trg_submission_validate_bi` | TV5 |
| Submission | `trg_submission_validate_bu` | TV5 |

## 3. Trách nhiệm chung

- **TV1:** chốt thứ tự chạy schema/constraint/index; kiểm tra không thiếu bảng/BTL1; review mọi thay đổi FK/CHECK.
- **TV2:** đảm bảo UI CRUD chỉ gọi procedure; không viết SQL INSERT/UPDATE/DELETE trực tiếp cho `Enrollment`; test lỗi trùng/sĩ số/xóa có điểm.
- **TV3:** seed đủ 5 hàng/bảng, không tạo dữ liệu vô nghĩa; kiểm tra grade/capacity trigger; giữ seed idempotent.
- **TV4:** chứng minh query procedure có ≥2 bảng, aggregate/GROUP BY/HAVING; function có cursor + IF/LOOP; UI hiển thị kết quả thật.
- **TV5:** duy trì `SubmissionCount`; test 0→1→0; đảm bảo frontend offline, Windows scripts và health check hoạt động.

## 4. Cặp review

| Tác giả | Reviewer | Nội dung review |
|---|---|---|
| TV1 | TV5 | Schema, trigger lịch/feedback, thứ tự chạy |
| TV2 | TV3 | CRUD procedure, validation, lỗi xóa có điểm |
| TV3 | TV1 | Seed, capacity/grade trigger, dữ liệu biên |
| TV4 | TV2 | Query procedure, function, API statistics |
| TV5 | TV4 | UI, frontend/API contract, smoke test, scripts |

Reviewer phải chạy tối thiểu:

```bash
python3 scripts/verify_database.py
uv run pytest
```

và với thay đổi UI: chạy Flask + `python3 scripts/smoke_api.py`.

## 5. Cam kết hiểu bài

Mỗi thành viên phải:

1. Trình bày 1–2 phút về **object mình sở hữu**: mục đích, bảng liên quan, điều kiện lỗi, test tương ứng.
2. Trả lời được ít nhất một câu hỏi về object của thành viên khác.
3. Chỉ ra được UI/API nào gọi object đó.

Kịch bản câu hỏi có trong `docs/DEMO_SCRIPT.md`.

## 6. Lịch làm việc gợi ý

| Mốc | Việc |
|---|---|
| Ngày 1 | Chốt schema/BTL1 mapping, phân công, tạo branch |
| Ngày 2–3 | Schema + constraints + seed + trigger/procedure/function |
| Ngày 4 | Backend API + test + tích hợp DB |
| Ngày 5 | Frontend + docs + Windows scripts |
| Ngày 6 | Review chéo, chạy verifier/smoke, sửa lỗi |
| Ngày 7 | Đóng băng, điền tên/MSSV, kiểm tra nộp bài |

## 7. Việc bắt buộc trước khi nộp

- [ ] Điền đủ họ tên/MSSV vào bảng trên.
- [ ] Mỗi thành viên ký cam kết đã đọc object của mình và object được review.
- [ ] Chạy lại `verify_database.py`, `pytest`, `smoke_api.py` trên máy sạch.
- [ ] Chạy `check_environment.bat` trên Windows thật (hiện chưa xác minh).
- [ ] Kiểm tra `.env` không bị commit.
- [ ] Đính kèm hoặc chuẩn bị file `.docx/.pdf` báo cáo nếu giảng viên yêu cầu, ngoài repo này.
