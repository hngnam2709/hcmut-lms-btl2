# API authorization matrix

Kiểm tra ngày **2026-11-08** trên `main`. Mọi route dưới đây được rà trực tiếp từ decorator trong `backend/api/*.py`.

## 1. Quy ước

- **Public**: không cần session (dữ liệu metadata hoặc health).
- **STUDENT / STAFF / ADMIN**: `@require_role(...)`; thiếu session → **401**, sai role → **403**.
- Ngoài role, service còn kiểm tra ownership (Student chỉ dữ liệu của mình; Staff chỉ lớp mình phụ trách; Admin không chấm điểm — RB13).

## 2. Bảng route

| Nhóm | Method + path | Role | Ghi chú |
|---|---|---|---|
| Health | `GET /api/health/live`, `GET /api/health` | Public | health check |
| Auth | `GET /api/auth/roles`, `GET /api/auth/accounts` | Public | chọn tài khoản demo; accounts đã giảm PII |
| Auth | `POST /api/auth/login`, `POST /api/auth/logout` | Public (login) / session (logout) | login ghi session |
| Auth | `GET /api/auth/me` | Session | 401 nếu chưa đăng nhập |
| Catalog | `GET /api/meta`, `GET /api/semesters`, `GET /api/sections`, `GET /api/courses` | Public | metadata chỉ đọc |
| Catalog | `GET /api/students` | **ADMIN** | có email → không public |
| Enrollment CRUD | `GET /api/enrollments`, `GET /api/enrollments/<id>` | **ADMIN** | `sp_GetStudentEnrollments` |
| Enrollment CRUD | `POST/PUT/DELETE /api/enrollments...` | **ADMIN** | `sp_Insert/Update/DeleteEnrollment` |
| Statistics | `GET /api/statistics/overview` | **ADMIN** | aggregate |
| Statistics | `GET /api/statistics/assignments` | **ADMIN** | `sp_GetAssignmentStatistics` |
| Statistics | `GET /api/statistics/assignments/<id>/completion` | **ADMIN** | `fn_CalculateAssignmentCompletionRate` |
| Statistics | `GET /api/statistics/enrollments/<id>/average` | **ADMIN** | `fn_CalculateStudentAverageScore` |
| Student | `/api/student/*` | **STUDENT** | service giới hạn theo `current_user_id()` |
| Staff | `/api/staff/*` | **STAFF** | service kiểm tra `PrimaryInstructorID` |
| Admin | `/api/admin/*` | **ADMIN** | users/faculties/semesters/courses/components/sections/data |
| Admin grade | `POST /api/staff/sections/<id>/grades` | **STAFF** | Admin gọi → 403 (RB13) |

## 3. Test 401 / 403 / đúng role

| Endpoint | 401 (không login) | 403 (sai role) | 200/201 (đúng role) | Test |
|---|---|---|---|---|
| `GET /api/enrollments` | ✅ | Student, Staff → 403 | Admin → 200 | `test_enrollments_requires_login`, `test_enrollments_rejects_student_role`, `test_enrollments_rejects_staff_role`, `test_list_enrollments` |
| `POST/PUT/DELETE /api/enrollments` | ✅ (parametrize 5 route) | Student → 403 | Admin → 201/200 | `test_enrollments_requires_login`, `test_create_enrollment`, `test_update_enrollment`, `test_delete_enrollment` |
| `GET /api/statistics/*` | ✅ (4 route) | Student, Staff → 403 | Admin → 200 | `test_statistics_requires_login`, `test_statistics_rejects_student`, `test_statistics_rejects_staff`, `test_overview` |
| `GET /api/students` | ✅ | Student → 403 | Admin → 200 | `test_students_requires_login`, `test_students_rejects_student_role`, `test_students_default_active_only` |
| `/api/student/*` | ✅ (test auth hiện có) | Staff/Admin → 403 | Student → 200 | `test_auth.py` |
| `/api/staff/*` | ✅ | Student/Admin → 403 | Staff → 200 | `test_auth.py`, smoke |
| `/api/admin/*` | ✅ | Student/Staff → 403 | Admin → 200 | smoke, `test_auth.py` |

## 4. Lệnh kiểm tra

```bash
uv run pytest -q
.venv/bin/python scripts/smoke_api.py
```

Smoke hiện có **31 check**, gồm:
- 2 check 401 cho `/api/enrollments` và `/api/statistics`;
- 5 check 403 cho Student/Staff;
- CRUD Ghi danh chỉ với Admin;
- Student/Staff flows vẫn 200 như cũ.
