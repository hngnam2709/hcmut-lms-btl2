from __future__ import annotations

from flask import session


def test_auth_roles(client):
    response = client.get("/api/auth/roles")
    assert response.status_code == 200
    roles = [item["role"] for item in response.get_json()["data"]]
    assert roles == ["STUDENT", "STAFF", "ADMIN"]


def test_auth_me_unauthenticated(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    assert response.get_json()["error"]["code"] == "unauthorized"


def test_student_requires_login(client):
    response = client.get("/api/student/sections")
    assert response.status_code == 401


def test_staff_requires_login(client):
    response = client.get("/api/staff/sections")
    assert response.status_code == 401


def test_admin_requires_login(client):
    response = client.get("/api/admin/users")
    assert response.status_code == 401


def test_student_sections_with_session(client):
    with client.session_transaction() as sess:
        sess["user_id"] = 101
        sess["role"] = "STUDENT"
    response = client.get("/api/student/sections")
    assert response.status_code == 200
    assert response.get_json()["data"][0]["student_id"] == 101


def test_staff_sections_with_session(client):
    with client.session_transaction() as sess:
        sess["user_id"] = 201
        sess["role"] = "STAFF"
    response = client.get("/api/staff/sections")
    assert response.status_code == 200
    assert response.get_json()["data"][0]["staff_id"] == 201


def test_admin_users_with_session(client):
    with client.session_transaction() as sess:
        sess["user_id"] = 301
        sess["role"] = "ADMIN"
    response = client.get("/api/admin/users")
    assert response.status_code == 200
    assert response.get_json()["data"][0]["Role"] == "ADMIN"


def test_student_cannot_access_admin(client):
    with client.session_transaction() as sess:
        sess["user_id"] = 101
        sess["role"] = "STUDENT"
    response = client.get("/api/admin/users")
    assert response.status_code == 403


def test_staff_cannot_access_student(client):
    with client.session_transaction() as sess:
        sess["user_id"] = 201
        sess["role"] = "STAFF"
    response = client.get("/api/student/sections")
    assert response.status_code == 403


def test_student_profile_and_catalog(client):
    with client.session_transaction() as sess:
        sess["user_id"] = 101
        sess["role"] = "STUDENT"
    profile = client.get("/api/student/profile")
    assert profile.status_code == 200
    assert profile.get_json()["data"]["StudentCode"] == "2210001"

    catalog = client.get("/api/student/catalog-sections")
    assert catalog.status_code == 200
    assert catalog.get_json()["data"][0]["SectionID"] == 2


def test_student_enroll_and_drop(client):
    with client.session_transaction() as sess:
        sess["user_id"] = 101
        sess["role"] = "STUDENT"
    enrolled = client.post("/api/student/enrollments", json={"section_id": 2})
    assert enrolled.status_code == 201
    assert enrolled.get_json()["data"]["section_id"] == 2

    dropped = client.patch("/api/student/enrollments/5/drop")
    assert dropped.status_code == 200
    assert dropped.get_json()["data"]["enrollment_id"] == 5


def test_student_enroll_requires_section(client):
    with client.session_transaction() as sess:
        sess["user_id"] = 101
        sess["role"] = "STUDENT"
    response = client.post("/api/student/enrollments", json={})
    assert response.status_code == 422


def test_student_quiz_finish_and_files(client):
    with client.session_transaction() as sess:
        sess["user_id"] = 101
        sess["role"] = "STUDENT"
    finished = client.patch("/api/student/quiz-attempts/7/finish", json={"score": 8.5})
    assert finished.status_code == 200
    assert finished.get_json()["data"]["score"] == 8.5

    files = client.get("/api/student/submissions/11/files")
    assert files.status_code == 200
    assert files.get_json()["data"][0]["FileName"] == "bai-nop.pdf"

def test_accounts_list_does_not_expose_email(client, app):
    class FakeDB:
        def fetch_all(self, sql, params=None):
            return [{
                "UserID": 101,
                "FullName": "Nguyen Van An",
                "AccountStatus": "ACTIVE",
                "StudentCode": "2210001",
                "FacultyID": 1,
            }]

    app.extensions["db"] = FakeDB()
    response = client.get("/api/auth/accounts?role=STUDENT")
    assert response.status_code == 200
    rows = response.get_json()["data"]
    assert rows
    assert set(rows[0]) == {"UserID", "FullName", "AccountStatus", "StudentCode", "FacultyID"}


