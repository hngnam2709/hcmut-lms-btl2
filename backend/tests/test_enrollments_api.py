from __future__ import annotations

import pymysql
import pytest


def test_list_enrollments(admin_client, app):
    response = admin_client.get("/api/enrollments?student_id=101&semester_id=4&limit=5&offset=0")
    assert response.status_code == 200
    body = response.get_json()
    assert body["meta"] == {"count": 1, "limit": 5, "offset": 0}
    call = app.extensions["services"]["enrollment"].calls[-1]
    assert call[0] == "list"
    assert call[1]["student_id"] == 101
    assert call[1]["semester_id"] == 4
    assert call[1]["limit"] == 5


def test_list_invalid_limit(admin_client):
    response = admin_client.get("/api/enrollments?limit=0")
    assert response.status_code == 422
    assert response.get_json()["error"]["code"] == "validation_error"


def test_list_invalid_status(admin_client):
    response = admin_client.get("/api/enrollments?status=UNKNOWN")
    assert response.status_code == 422
    assert "ACTIVE" in response.get_json()["error"]["message"]


def test_create_enrollment(admin_client, app):
    response = admin_client.post(
        "/api/enrollments",
        json={"student_id": 107, "section_id": 1, "status": "active"},
    )
    assert response.status_code == 201
    assert response.headers["Location"] == "/api/enrollments/99"
    assert response.get_json()["data"]["EnrollmentID"] == 99
    assert app.extensions["services"]["enrollment"].calls[-1] == (
        "create", 107, 1, "ACTIVE"
    )


def test_create_requires_json_object(admin_client):
    response = admin_client.post("/api/enrollments", data="student_id=1",
                           content_type="application/x-www-form-urlencoded")
    assert response.status_code == 400
    assert response.get_json()["error"]["code"] == "invalid_json"


def test_create_requires_student(admin_client):
    response = admin_client.post("/api/enrollments", json={"section_id": 1})
    assert response.status_code == 422
    assert response.get_json()["error"]["details"] == {"student_id": "required"}


def test_create_database_rule_error(admin_client, app):
    app.extensions["services"]["enrollment"].create = lambda *args: (_ for _ in ()).throw(
        pymysql.err.OperationalError(1644, "Sinh vien da co ghi danh trong lop nay.")
    )
    response = admin_client.post("/api/enrollments", json={"student_id": 1, "section_id": 1})
    assert response.status_code == 400
    assert response.get_json()["error"]["code"] == "database_rule_violation"
    assert "da co ghi danh" in response.get_json()["error"]["message"]


def test_update_enrollment(admin_client, app):
    response = admin_client.put("/api/enrollments/8", json={"status": "DROPPED"})
    assert response.status_code == 200
    assert app.extensions["services"]["enrollment"].calls[-1] == (
        "update", 8, None, "DROPPED"
    )


def test_update_requires_a_field(admin_client):
    response = admin_client.put("/api/enrollments/8", json={})
    assert response.status_code == 422


def test_delete_enrollment(admin_client, app):
    response = admin_client.delete("/api/enrollments/8")
    assert response.status_code == 200
    assert app.extensions["services"]["enrollment"].calls[-1] == ("delete", 8)


def test_get_enrollment(admin_client):
    response = admin_client.get("/api/enrollments/8")
    assert response.status_code == 200
    assert response.get_json()["data"]["EnrollmentID"] == 8


@pytest.mark.parametrize("method,path,payload", [
    ("get", "/api/enrollments", None),
    ("get", "/api/enrollments/1", None),
    ("post", "/api/enrollments", {"student_id": 107, "section_id": 1}),
    ("put", "/api/enrollments/1", {"status": "DROPPED"}),
    ("delete", "/api/enrollments/1", None),
])
def test_enrollments_requires_login(client, method, path, payload):
    response = getattr(client, method)(path, json=payload) if payload else getattr(client, method)(path)
    assert response.status_code == 401
    assert response.get_json()["error"]["code"] == "unauthorized"


def test_enrollments_rejects_student_role(student_client):
    assert student_client.get("/api/enrollments").status_code == 403
    response = student_client.post(
        "/api/enrollments", json={"student_id": 107, "section_id": 1}
    )
    assert response.status_code == 403
    assert response.get_json()["error"]["code"] == "forbidden"


def test_enrollments_rejects_staff_role(staff_client):
    assert staff_client.get("/api/enrollments").status_code == 403
