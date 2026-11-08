from __future__ import annotations

from flask import Blueprint, jsonify, request

from backend.api.dependencies import service
from backend.auth_guard import current_user_id, require_role
from backend.errors import ValidationError
from backend.repositories.admin_repository import EXPLORER_TABLES
from backend.validation import parse_int, parse_optional_int, require_json_object

bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def _str(body: dict, key: str, required: bool = True) -> str:
    value = (body.get(key) or "").strip()
    if not value and required:
        raise ValidationError(f"Thieu {key}.", {key: "required"})
    return value


# ---- Users ----
@bp.get("/users")
@require_role("ADMIN")
def users():
    return jsonify({"data": service("admin").users()})


@bp.post("/users")
@require_role("ADMIN")
def create_user():
    body = require_json_object()
    email = _str(body, "email")
    full_name = _str(body, "full_name")
    role = _str(body, "role").upper()
    if role not in {"STUDENT", "STAFF", "ADMIN"}:
        raise ValidationError("Role khong hop le.")
    extra = {
        "avatar_url": body.get("avatar_url") or "",
        "student_code": (body.get("student_code") or "").strip(),
        "faculty_id": parse_optional_int(body.get("faculty_id"), "faculty_id", min_value=1),
    }
    return jsonify({"data": service("admin").create_user(email, full_name, role, extra)}), 201


@bp.patch("/users/<int:user_id>/status")
@require_role("ADMIN")
def set_status(user_id: int):
    body = require_json_object()
    status = _str(body, "status").upper()
    if status not in {"ACTIVE", "LOCKED", "INACTIVE"}:
        raise ValidationError("Status khong hop le.")
    return jsonify({"data": service("admin").set_status(user_id, status)})


# ---- Faculty ----
@bp.get("/faculties")
@require_role("ADMIN")
def faculties():
    return jsonify({"data": service("admin").faculties()})


@bp.post("/faculties")
@require_role("ADMIN")
def create_faculty():
    body = require_json_object()
    return jsonify({"data": service("admin").create_faculty(_str(body, "name"), body.get("name_en") or None)}), 201


@bp.put("/faculties/<int:faculty_id>")
@require_role("ADMIN")
def update_faculty(faculty_id: int):
    body = require_json_object()
    return jsonify({"data": service("admin").update_faculty(faculty_id, _str(body, "name"), body.get("name_en") or None)})


@bp.delete("/faculties/<int:faculty_id>")
@require_role("ADMIN")
def delete_faculty(faculty_id: int):
    service("admin").delete_faculty(faculty_id)
    return jsonify({"data": {"message": "Da xoa khoa."}})


# ---- Semester ----
@bp.get("/semesters")
@require_role("ADMIN")
def semesters():
    return jsonify({"data": service("admin").semesters()})


@bp.post("/semesters")
@require_role("ADMIN")
def create_semester():
    body = require_json_object()
    return jsonify({"data": service("admin").create_semester(
        _str(body, "academic_year"),
        parse_int(body.get("term_no"), "term_no", required=True, min_value=1),
        _str(body, "start_date"), _str(body, "end_date"),
    )}), 201


@bp.put("/semesters/<int:semester_id>")
@require_role("ADMIN")
def update_semester(semester_id: int):
    body = require_json_object()
    return jsonify({"data": service("admin").update_semester(
        semester_id, _str(body, "academic_year"),
        parse_int(body.get("term_no"), "term_no", required=True, min_value=1),
        _str(body, "start_date"), _str(body, "end_date"),
    )})


@bp.delete("/semesters/<int:semester_id>")
@require_role("ADMIN")
def delete_semester(semester_id: int):
    service("admin").delete_semester(semester_id)
    return jsonify({"data": {"message": "Da xoa hoc ky."}})


# ---- Course ----
@bp.get("/courses")
@require_role("ADMIN")
def courses():
    return jsonify({"data": service("admin").courses()})


@bp.post("/courses")
@require_role("ADMIN")
def create_course():
    body = require_json_object()
    return jsonify({"data": service("admin").create_course(
        _str(body, "course_code"), _str(body, "course_name"),
        parse_int(body.get("credits"), "credits", required=True, min_value=1),
        parse_int(body.get("faculty_id"), "faculty_id", required=True, min_value=1),
        current_user_id(),
    )}), 201


@bp.put("/courses/<int:course_id>")
@require_role("ADMIN")
def update_course(course_id: int):
    body = require_json_object()
    return jsonify({"data": service("admin").update_course(
        course_id, _str(body, "course_code"), _str(body, "course_name"),
        parse_int(body.get("credits"), "credits", required=True, min_value=1),
        parse_int(body.get("faculty_id"), "faculty_id", required=True, min_value=1),
    )})


@bp.delete("/courses/<int:course_id>")
@require_role("ADMIN")
def delete_course(course_id: int):
    service("admin").delete_course(course_id)
    return jsonify({"data": {"message": "Da xoa mon hoc."}})


# ---- CourseComponent ----
@bp.get("/components")
@require_role("ADMIN")
def components():
    return jsonify({"data": service("admin").components()})


@bp.post("/components")
@require_role("ADMIN")
def create_component():
    body = require_json_object()
    return jsonify({"data": service("admin").create_component(
        parse_int(body.get("course_id"), "course_id", required=True, min_value=1),
        _str(body, "component_type").upper(), _str(body, "component_name"),
    )}), 201


@bp.put("/components/<int:component_id>")
@require_role("ADMIN")
def update_component(component_id: int):
    body = require_json_object()
    return jsonify({"data": service("admin").update_component(
        component_id, _str(body, "component_type").upper(), _str(body, "component_name"),
    )})


@bp.delete("/components/<int:component_id>")
@require_role("ADMIN")
def delete_component(component_id: int):
    service("admin").delete_component(component_id)
    return jsonify({"data": {"message": "Da xoa thanh phan mon hoc."}})


# ---- CourseSection ----
@bp.get("/sections")
@require_role("ADMIN")
def sections():
    return jsonify({"data": service("admin").sections()})


@bp.post("/sections")
@require_role("ADMIN")
def create_section():
    body = require_json_object()
    payload = {
        "component_id": parse_int(body.get("component_id"), "component_id", required=True, min_value=1),
        "semester_id": parse_int(body.get("semester_id"), "semester_id", required=True, min_value=1),
        "instructor_id": parse_optional_int(body.get("instructor_id"), "instructor_id", min_value=1),
        "section_code": _str(body, "section_code"),
        "capacity": parse_int(body.get("capacity"), "capacity", required=True, min_value=1),
        "status": (body.get("status") or "OPEN").upper(),
        "day_of_week": parse_int(body.get("day_of_week"), "day_of_week", required=True, min_value=2, max_value=8),
        "start_time": _str(body, "start_time"),
        "end_time": _str(body, "end_time"),
        "room_code": _str(body, "room_code"),
    }
    return jsonify({"data": service("admin").create_section(payload)}), 201


@bp.put("/sections/<int:section_id>")
@require_role("ADMIN")
def update_section(section_id: int):
    body = require_json_object()
    payload = {
        "component_id": parse_int(body.get("component_id"), "component_id", required=True, min_value=1),
        "semester_id": parse_int(body.get("semester_id"), "semester_id", required=True, min_value=1),
        "instructor_id": parse_optional_int(body.get("instructor_id"), "instructor_id", min_value=1),
        "section_code": _str(body, "section_code"),
        "capacity": parse_int(body.get("capacity"), "capacity", required=True, min_value=1),
        "status": (body.get("status") or "OPEN").upper(),
        "day_of_week": parse_int(body.get("day_of_week"), "day_of_week", required=True, min_value=2, max_value=8),
        "start_time": _str(body, "start_time"),
        "end_time": _str(body, "end_time"),
        "room_code": _str(body, "room_code"),
    }
    return jsonify({"data": service("admin").update_section(section_id, payload)})


@bp.delete("/sections/<int:section_id>")
@require_role("ADMIN")
def delete_section(section_id: int):
    service("admin").delete_section(section_id)
    return jsonify({"data": {"message": "Da xoa lop hoc phan."}})


# ---- Data explorer ----
@bp.get("/data/tables")
@require_role("ADMIN")
def data_tables():
    return jsonify({"data": sorted(EXPLORER_TABLES)})


@bp.get("/data/<table>")
@require_role("ADMIN")
def explore(table: str):
    limit = parse_int(request.args.get("limit", 50), "limit", min_value=1, max_value=500)
    return jsonify({"data": service("admin").explore(table, limit)})
