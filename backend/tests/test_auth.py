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
