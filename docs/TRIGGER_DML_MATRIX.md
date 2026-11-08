# Trigger × DML matrix (BTL2 2.2)

Nguồn: `database/triggers/05_triggers.sql`. MySQL trigger là `FOR EACH ROW`, nên một câu lệnh nhiều dòng sẽ kích hoạt trigger cho từng dòng.

## 1. Trigger nghiệp vụ RB05 — trùng lịch giảng viên/phòng

| Trigger | Event / bảng | Kiểm tra | DML được bảo vệ | Test |
|---|---|---|---|---|
| `trg_section_schedule_bi` | BEFORE INSERT `CourseSection` | cùng `SemesterID`, cùng `DayOfWeek`, giao khoảng `Start < End`; kiểm tra cả `PrimaryInstructorID` và `RoomCode` | INSERT | `04_trigger_expected_fail_schedule.sql` |
| `trg_section_schedule_bu` | BEFORE UPDATE `CourseSection` | như trên, bỏ qua chính `SectionID` đang sửa (`<> OLD.SectionID`) | UPDATE (đổi thứ/giờ/phòng/giảng viên) | `11_trigger_expected_fail_schedule_update.sql` |

Công thức giao khoảng: `NEW.StartTime < cs.EndTime AND cs.StartTime < NEW.EndTime`.

## 2. Thuộc tính dẫn xuất `Assignment.SubmissionCount`

Công thức: `SubmissionCount = COUNT(*) FROM Submission WHERE AssignmentID = <assignment>`.

| Trigger | Event / bảng | Hành vi | Test |
|---|---|---|---|
| `trg_submission_count_ai` | AFTER INSERT `Submission` | đếm lại assignment mới | `05_trigger_derived_submission_count.sql`, `10_trigger_dml_matrix.sql` |
| `trg_submission_count_ad` | AFTER DELETE `Submission` | đếm lại assignment cũ | `05`, `10` |
| `trg_submission_count_au` | AFTER UPDATE `Submission` | luôn đếm lại `OLD.AssignmentID`; nếu `NEW.AssignmentID <> OLD.AssignmentID` thì đếm thêm `NEW.AssignmentID` | `10` (move assignment) |

`10_trigger_dml_matrix.sql` kiểm tra:
- INSERT nhiều dòng (2 submission) → +2;
- UPDATE đổi `AssignmentID` → assignment cũ −1, assignment mới +1;
- UPDATE cột không tham gia khóa → giá trị derived không đổi;
- DELETE từng dòng → trả về đúng baseline;
- toàn bộ chạy trong transaction và rollback.

## 3. Các trigger bảo vệ nghiệp vụ khác

| Trigger | Event / bảng | Mục đích |
|---|---|---|
| `trg_enrollment_capacity_bi` | BEFORE INSERT `Enrollment` | chặn vượt sĩ số khi ghi danh |
| `trg_enrollment_capacity_bu` | BEFORE UPDATE `Enrollment` | chặn vượt sĩ số khi đổi lớp/trạng thái |
| `trg_submission_validate_bi` | BEFORE INSERT `Submission` | assignment/ghi danh ACTIVE/thời gian mở–hạn/max attempts/điểm/giảng viên chấm |
| `trg_submission_validate_bu` | BEFORE UPDATE `Submission` | kiểm tra lại các quy tắc trên khi sửa |
| `trg_grade_validate_bi` | BEFORE INSERT `Grade` | enrollment/assessment cùng section, điểm 0..MaxScore, giảng viên phụ trách |
| `trg_grade_validate_bu` | BEFORE UPDATE `Grade` | kiểm tra lại khi sửa điểm/assessment |
| `trg_feedback_validate_bi` | BEFORE INSERT `Feedback` | feedback phải thuộc submission, parent cùng submission, người viết hợp lệ |
| `trg_feedback_validate_bu` | BEFORE UPDATE `Feedback` | kiểm tra lại khi sửa feedback |

## 4. Vì sao không lạm dụng trigger

- CHECK/UNIQUE/FK xử lý miền giá trị, duy nhất, tham chiếu.
- Trigger chỉ dùng cho quy tắc **liên bản ghi/liên bảng** hoặc **thuộc tính dẫn xuất** mà CHECK không biểu diễn được:
  - trùng lịch (so sánh nhiều dòng);
  - sĩ số (đếm enrollment);
  - `SubmissionCount` (derived);
  - validate submission/grade/feedback cần JOIN nhiều bảng.
- Không có trigger nào thay thế một CHECK đơn giản.

## 5. Chạy lại

```bash
.venv/bin/python scripts/verify_database.py
# [verify] run database/tests/10_trigger_dml_matrix.sql
# [verify] expect failure database/tests/11_trigger_expected_fail_schedule_update.sql
# DATABASE VERIFICATION: PASS
```
