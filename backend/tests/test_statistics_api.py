from __future__ import annotations

import pytest


def test_overview(admin_client):
    response = admin_client.get("/api/statistics/overview")
    assert response.status_code == 200
    assert response.get_json()["data"]["student_count"] == 8


def test_assignment_statistics_filters(admin_client):
    response = admin_client.get("/api/statistics/assignments?section_id=1&semester_id=4&min_submissions=0")
    assert response.status_code == 200
    data = response.get_json()["data"][0]
    assert data["section_id"] == 1
    assert data["semester_id"] == 4
    assert data["min_submissions"] == 0


def test_assignment_statistics_invalid_filter(admin_client):
    response = admin_client.get("/api/statistics/assignments?min_submissions=-1")
    assert response.status_code == 422


def test_completion_function_endpoint(admin_client):
    response = admin_client.get("/api/statistics/assignments/1/completion")
    assert response.status_code == 200
    assert response.get_json()["data"]["completion_rate"] == 100.0


def test_average_function_endpoint(admin_client):
    response = admin_client.get("/api/statistics/enrollments/1/average")
    assert response.status_code == 200
    assert response.get_json()["data"]["average_score"] == 82.5


@pytest.mark.parametrize("path", [
    "/api/statistics/overview",
    "/api/statistics/assignments",
    "/api/statistics/assignments/1/completion",
    "/api/statistics/enrollments/1/average",
])
def test_statistics_requires_login(client, path):
    response = client.get(path)
    assert response.status_code == 401
    assert response.get_json()["error"]["code"] == "unauthorized"


def test_statistics_rejects_student(student_client):
    assert student_client.get("/api/statistics/overview").status_code == 403


def test_statistics_rejects_staff(staff_client):
    assert staff_client.get("/api/statistics/overview").status_code == 403
