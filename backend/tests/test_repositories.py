from __future__ import annotations

from backend.repositories.enrollment_repository import EnrollmentRepository
from backend.repositories.statistics_repository import StatisticsRepository


class FakeDB:
    def __init__(self) -> None:
        self.procedure_calls = []
        self.procedure_one_calls = []
        self.fetch_one_calls = []
        self.fetch_all_calls = []

    def call_procedure(self, name, params=None):
        self.procedure_calls.append((name, params))
        return [{"ok": 1}]

    def call_procedure_one(self, name, params=None):
        self.procedure_one_calls.append((name, params))
        return {"success": 1}

    def fetch_one(self, sql, params=None):
        self.fetch_one_calls.append((sql, params))
        return {"value": 1}

    def fetch_all(self, sql, params=None):
        self.fetch_all_calls.append((sql, params))
        return [{"value": 1}]


def test_enrollment_list_uses_query_procedure():
    db = FakeDB()
    repository = EnrollmentRepository(db)
    rows = repository.list(101, 4, "ACTIVE", 20, 0)
    assert rows == [{"ok": 1}]
    assert db.procedure_calls == [
        ("sp_GetStudentEnrollments", (101, 4, "ACTIVE", 20, 0))
    ]


def test_enrollment_crud_uses_required_procedures():
    db = FakeDB()
    repository = EnrollmentRepository(db)
    repository.create(107, 1, "ACTIVE")
    repository.update(8, 2, "DROPPED")
    repository.delete(8)
    assert db.procedure_one_calls == [
        ("sp_InsertEnrollment", (107, 1, "ACTIVE")),
        ("sp_UpdateEnrollment", (8, 2, "DROPPED")),
        ("sp_DeleteEnrollment", (8,)),
    ]


def test_statistics_uses_query_procedure_and_functions():
    db = FakeDB()
    repository = StatisticsRepository(db)
    repository.assignment_statistics(1, 4, 0)
    repository.assignment_completion_rate(1)
    repository.student_average_score(1)
    assert db.procedure_calls == [
        ("sp_GetAssignmentStatistics", (1, 4, 0))
    ]
    sqls = [call[0] for call in db.fetch_one_calls]
    assert "fn_CalculateAssignmentCompletionRate" in sqls[0]
    assert "fn_CalculateStudentAverageScore" in sqls[1]
    assert db.fetch_one_calls[0][1] == (1,)
