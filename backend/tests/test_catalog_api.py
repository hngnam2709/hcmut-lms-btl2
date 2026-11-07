from __future__ import annotations


def test_semesters(client):
    response = client.get("/api/semesters")
    assert response.status_code == 200
    assert response.get_json()["data"][0]["SemesterID"] == 4


def test_students_default_active_only(client):
    response = client.get("/api/students")
    assert response.status_code == 200
    assert response.get_json()["data"][0]["active_only"] is True


def test_students_can_include_inactive(client):
    response = client.get("/api/students?active_only=false")
    assert response.status_code == 200
    assert response.get_json()["data"][0]["active_only"] is False


def test_sections_filters(client):
    response = client.get("/api/sections?semester_id=4&status=OPEN")
    assert response.status_code == 200
    data = response.get_json()["data"][0]
    assert data["semester_id"] == 4
    assert data["status"] == "OPEN"


def test_meta(client):
    response = client.get("/api/meta")
    assert response.status_code == 200
    assert "sp_InsertEnrollment" in response.get_json()["data"]["crud_procedures"]
