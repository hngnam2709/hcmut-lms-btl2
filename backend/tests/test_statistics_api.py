from __future__ import annotations


def test_overview(client):
    response = client.get("/api/statistics/overview")
    assert response.status_code == 200
    assert response.get_json()["data"]["student_count"] == 8


def test_assignment_statistics_filters(client):
    response = client.get("/api/statistics/assignments?section_id=1&semester_id=4&min_submissions=0")
    assert response.status_code == 200
    data = response.get_json()["data"][0]
    assert data["section_id"] == 1
    assert data["semester_id"] == 4
    assert data["min_submissions"] == 0


def test_assignment_statistics_invalid_filter(client):
    response = client.get("/api/statistics/assignments?min_submissions=-1")
    assert response.status_code == 422


def test_completion_function_endpoint(client):
    response = client.get("/api/statistics/assignments/1/completion")
    assert response.status_code == 200
    assert response.get_json()["data"]["completion_rate"] == 100.0


def test_average_function_endpoint(client):
    response = client.get("/api/statistics/enrollments/1/average")
    assert response.status_code == 200
    assert response.get_json()["data"]["average_score"] == 82.5
