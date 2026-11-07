from __future__ import annotations

from flask import Blueprint, jsonify, request

from backend.api.dependencies import service
from backend.validation import parse_bool, parse_optional_int, parse_section_status

bp = Blueprint("catalog", __name__, url_prefix="/api")


@bp.get("/semesters")
def semesters():
    return jsonify({"data": service("catalog").semesters()})


@bp.get("/students")
def students():
    active_only = parse_bool(request.args.get("active_only"), default=True)
    return jsonify({"data": service("catalog").students(active_only=active_only)})


@bp.get("/sections")
def sections():
    semester_id = parse_optional_int(request.args.get("semester_id"), "semester_id", min_value=1)
    status = parse_section_status(request.args.get("status"))
    return jsonify({"data": service("catalog").sections(semester_id, status)})


@bp.get("/courses")
def courses():
    return jsonify({"data": service("catalog").courses()})


@bp.get("/meta")
def meta():
    return jsonify({
        "data": {
            "application": "HCMUT LMS BTL2",
            "enrollment_statuses": list(service("catalog").STATUSES),
            "database": "MySQL 8+ / InnoDB / utf8mb4",
            "crud_procedures": [
                "sp_InsertEnrollment",
                "sp_UpdateEnrollment",
                "sp_DeleteEnrollment",
            ],
        }
    })
