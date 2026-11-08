from __future__ import annotations

from flask import Blueprint, jsonify, request

from backend.api.dependencies import service
from backend.auth_guard import require_role
from backend.validation import (
    parse_int,
    parse_optional_int,
    parse_status,
    require_json_object,
)

bp = Blueprint("enrollments", __name__, url_prefix="/api/enrollments")


@bp.get("")
@require_role("ADMIN")
def list_enrollments():
    student_id = parse_optional_int(request.args.get("student_id"), "student_id", min_value=1)
    semester_id = parse_optional_int(request.args.get("semester_id"), "semester_id", min_value=1)
    status = parse_status(request.args.get("status"))
    limit = parse_int(request.args.get("limit", 100), "limit", min_value=1, max_value=500)
    offset = parse_int(request.args.get("offset", 0), "offset", min_value=0, max_value=1_000_000)

    rows = service("enrollment").list(
        student_id=student_id,
        semester_id=semester_id,
        status=status,
        limit=limit or 100,
        offset=offset or 0,
    )
    return jsonify({
        "data": rows,
        "meta": {"count": len(rows), "limit": limit, "offset": offset},
    })


@bp.get("/<int:enrollment_id>")
@require_role("ADMIN")
def get_enrollment(enrollment_id: int):
    parse_int(enrollment_id, "enrollment_id", required=True, min_value=1)
    return jsonify({"data": service("enrollment").get(enrollment_id)})


@bp.post("")
@require_role("ADMIN")
def create_enrollment():
    body = require_json_object()
    student_id = parse_int(body.get("student_id"), "student_id", required=True, min_value=1)
    section_id = parse_int(body.get("section_id"), "section_id", required=True, min_value=1)
    status = parse_status(body.get("status", "ACTIVE"), required=True)

    result = service("enrollment").create(student_id, section_id, status)
    return (
        jsonify({"data": result}),
        201,
        {"Location": f"/api/enrollments/{result.get('EnrollmentID', '')}"},
    )


@bp.put("/<int:enrollment_id>")
@require_role("ADMIN")
def update_enrollment(enrollment_id: int):
    parse_int(enrollment_id, "enrollment_id", required=True, min_value=1)
    body = require_json_object()
    section_id = parse_optional_int(body.get("section_id"), "section_id", min_value=1)
    status = parse_status(body.get("status"))
    if section_id is None and status is None:
        from backend.errors import ValidationError

        raise ValidationError(
            "Can cung cap it nhat section_id hoac status.",
            {"body": "at_least_one_field"},
        )

    result = service("enrollment").update(enrollment_id, section_id, status)
    return jsonify({"data": result})


@bp.delete("/<int:enrollment_id>")
@require_role("ADMIN")
def delete_enrollment(enrollment_id: int):
    parse_int(enrollment_id, "enrollment_id", required=True, min_value=1)
    result = service("enrollment").delete(enrollment_id)
    return jsonify({"data": result})
