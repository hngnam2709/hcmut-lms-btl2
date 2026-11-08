#!/usr/bin/env python3
"""Live HTTP smoke test. Requires a running Flask server and seeded MySQL.

Example:
    uv run python scripts/smoke_api.py --base-url http://127.0.0.1:5000
"""
from __future__ import annotations

import argparse
import http.cookiejar
import json
import sys
import urllib.error
import urllib.request


def request(base_url: str, method: str, path: str, payload: dict | None = None,
            opener: urllib.request.OpenerDirector | None = None):
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(
        base_url.rstrip("/") + path,
        data=data,
        method=method,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
    )
    open_url = (opener.open if opener else urllib.request.urlopen)
    try:
        with open_url(req, timeout=15) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        return exc.code, json.loads(exc.read().decode("utf-8"))


def role_session(base_url: str, role: str, user_id: int):
    opener = urllib.request.build_opener(
        urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar())
    )

    def call(method: str, path: str, payload: dict | None = None):
        return request(base_url, method, path, payload, opener)

    status, body = call(
        "POST", "/api/auth/login", {"role": role, "user_id": user_id}
    )
    if status != 200:
        raise RuntimeError(f"Login failed for {role}: HTTP {status} {body}")
    return call


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="http://127.0.0.1:5000")
    args = parser.parse_args()
    base = args.base_url
    checks: list[bool] = []

    def check(label: str, method: str, path: str, expected: int, payload=None,
              predicate=None) -> dict:
        status, body = request(base, method, path, payload)
        ok = status == expected and (predicate(body) if predicate else True)
        checks.append(ok)
        rendered = json.dumps(body, ensure_ascii=False)[:180]
        print(f"{'PASS' if ok else 'FAIL'} {label}: HTTP {status} {rendered}")
        return body

    check("health", "GET", "/api/health", 200,
          predicate=lambda body: body["status"] == "ok")
    check("meta", "GET", "/api/meta", 200,
          predicate=lambda body: "sp_InsertEnrollment" in body["data"]["crud_procedures"])
    check("semesters", "GET", "/api/semesters", 200,
          predicate=lambda body: len(body["data"]) >= 5)
    check("sections", "GET", "/api/sections?semester_id=4&status=OPEN", 200,
          predicate=lambda body: len(body["data"]) >= 5)
    check("enrollment list procedure", "GET",
          "/api/enrollments?student_id=101&semester_id=4&limit=20", 200,
          predicate=lambda body: len(body["data"]) >= 2 and "StartTime" in body["data"][0])
    check("assignment statistics procedure", "GET",
          "/api/statistics/assignments?semester_id=4&min_submissions=0", 200,
          predicate=lambda body: len(body["data"]) >= 5)
    check("completion function", "GET", "/api/statistics/assignments/1/completion", 200,
          predicate=lambda body: float(body["data"]["completion_rate"]) == 100.0)
    check("average function", "GET", "/api/statistics/enrollments/1/average", 200,
          predicate=lambda body: float(body["data"]["average_score"]) == 82.5)

    created = check("create enrollment", "POST", "/api/enrollments", 201,
                    payload={"student_id": 107, "section_id": 1, "status": "ACTIVE"},
                    predicate=lambda body: body["data"]["success"] == 1)
    enrollment_id = created["data"]["EnrollmentID"]
    check("get enrollment", "GET", f"/api/enrollments/{enrollment_id}", 200,
          predicate=lambda body: body["data"]["EnrollmentID"] == enrollment_id)
    check("update enrollment", "PUT", f"/api/enrollments/{enrollment_id}", 200,
          payload={"status": "DROPPED"},
          predicate=lambda body: body["data"]["success"] == 1)
    check("delete enrollment", "DELETE", f"/api/enrollments/{enrollment_id}", 200,
          predicate=lambda body: body["data"]["success"] == 1)
    check("duplicate rejected", "POST", "/api/enrollments", 400,
          payload={"student_id": 101, "section_id": 1, "status": "ACTIVE"},
          predicate=lambda body: body["error"]["code"] == "database_rule_violation")
    check("bad limit rejected", "GET", "/api/enrollments?limit=0", 422,
          predicate=lambda body: body["error"]["code"] == "validation_error")

    student = role_session(base, "STUDENT", 101)
    staff = role_session(base, "STAFF", 201)
    admin = role_session(base, "ADMIN", 301)

    def role_check(label: str, call, method: str, path: str, expected: int,
                   payload=None, predicate=None) -> None:
        status, body = call(method, path, payload)
        ok = status == expected and (predicate(body) if predicate else True)
        checks.append(ok)
        rendered = json.dumps(body, ensure_ascii=False)[:180]
        print(f"{'PASS' if ok else 'FAIL'} {label}: HTTP {status} {rendered}")

    role_check("student profile", student, "GET", "/api/student/profile", 200,
               predicate=lambda body: body["data"]["StudentCode"] == "2210001")
    role_check("student sections", student, "GET", "/api/student/sections", 200,
               predicate=lambda body: len(body["data"]) == 2)
    role_check("student isolated section", student, "GET", "/api/student/sections/4", 404,
               predicate=lambda body: body["error"]["code"] == "not_found")
    role_check("student blocked from staff API", student, "GET", "/api/staff/sections", 403,
               predicate=lambda body: body["error"]["code"] == "forbidden")

    role_check("staff sections", staff, "GET", "/api/staff/sections", 200,
               predicate=lambda body: len(body["data"]) == 3)
    role_check("staff section students", staff, "GET",
               "/api/staff/sections/1/students", 200,
               predicate=lambda body: len(body["data"]) >= 4)
    role_check("staff isolated section", staff, "GET",
               "/api/staff/sections/3/students", 403,
               predicate=lambda body: body["error"]["code"] == "forbidden")

    role_check("admin users", admin, "GET", "/api/admin/users", 200,
               predicate=lambda body: len(body["data"]) >= 18)
    role_check("admin data explorer", admin, "GET", "/api/admin/data/tables", 200,
               predicate=lambda body: len(body["data"]) == 22)
    role_check("admin cannot grade", admin, "POST", "/api/staff/sections/1/grades", 403,
               payload={"enrollment_id": 1, "assessment_id": 1, "score": 5},
               predicate=lambda body: body["error"]["code"] == "forbidden")

    passed = sum(checks)
    print(f"\nLIVE API SMOKE: {'PASS' if all(checks) else 'FAIL'} ({passed}/{len(checks)})")
    return 0 if all(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
