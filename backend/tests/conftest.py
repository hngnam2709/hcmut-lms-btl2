from __future__ import annotations

import pytest

from backend.app import create_app


class FakeEnrollmentService:
    def __init__(self) -> None:
        self.calls = []
        self.rows = [{"EnrollmentID": 1, "StudentID": 101, "SectionID": 1}]
        self.error = None

    def list(self, **kwargs):
        self.calls.append(("list", kwargs))
        if self.error:
            raise self.error
        return self.rows

    def get(self, enrollment_id):
        self.calls.append(("get", enrollment_id))
        return {"EnrollmentID": enrollment_id}

    def create(self, student_id, section_id, status):
        self.calls.append(("create", student_id, section_id, status))
        return {"success": 1, "EnrollmentID": 99, "message": "ok"}

    def update(self, enrollment_id, section_id, status):
        self.calls.append(("update", enrollment_id, section_id, status))
        return {"success": 1, "EnrollmentID": enrollment_id, "message": "ok"}

    def delete(self, enrollment_id):
        self.calls.append(("delete", enrollment_id))
        return {"success": 1, "EnrollmentID": enrollment_id, "message": "ok"}


class FakeCatalogService:
    STATUSES = ("ACTIVE", "DROPPED", "COMPLETED")

    def semesters(self):
        return [{"SemesterID": 4, "AcademicYear": "2026-2027", "TermNo": 1}]

    def students(self, active_only=True):
        return [{"StudentID": 101, "StudentCode": "2210001", "active_only": active_only}]

    def sections(self, semester_id=None, status=None):
        return [{"SectionID": 1, "semester_id": semester_id, "status": status}]

    def courses(self):
        return [{"CourseID": 1, "CourseCode": "CO1001"}]


class FakeStatisticsService:
    def assignment_statistics(self, section_id=None, semester_id=None, min_submissions=None):
        return [{"AssignmentID": 1, "section_id": section_id,
                 "semester_id": semester_id, "min_submissions": min_submissions}]

    def assignment_completion(self, assignment_id):
        return {"assignment_id": assignment_id, "completion_rate": 100.0}

    def student_average(self, enrollment_id):
        return {"enrollment_id": enrollment_id, "average_score": 82.5}

    def overview(self):
        return {"student_count": 8, "enrollment_count": 15}


class FakeHealthService:
    def __init__(self) -> None:
        self.fail = False

    def check(self):
        if self.fail:
            from backend.errors import AppError

            raise AppError("Database khong san sang.", 503, "database_unavailable")
        return {"status": "ok", "database": {"version": "8.4.13"}}


class FakeStudentService:
    def sections(self, student_id):
        return [{"SectionID": 1, "student_id": student_id}]

    def grades(self, student_id):
        return [{"GradeID": 1, "student_id": student_id}]


class FakeStaffService:
    def sections(self, staff_id):
        return [{"SectionID": 1, "staff_id": staff_id}]


class FakeAdminService:
    def users(self):
        return [{"UserID": 301, "Role": "ADMIN"}]

    def explore(self, table, limit):
        return [{"table": table, "limit": limit}]


@pytest.fixture
def app():
    application = create_app({
        "TESTING": True,
        "PROPAGATE_EXCEPTIONS": False,
        "LOG_TO_FILE": False,
        "MYSQL_PASSWORD": "not-used-in-unit-tests",
    })
    application.extensions["services"] = {
        "enrollment": FakeEnrollmentService(),
        "catalog": FakeCatalogService(),
        "statistics": FakeStatisticsService(),
        "health": FakeHealthService(),
        "student": FakeStudentService(),
        "staff": FakeStaffService(),
        "admin": FakeAdminService(),
    }
    return application


@pytest.fixture
def client(app):
    return app.test_client()
