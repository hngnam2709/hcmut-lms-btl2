from __future__ import annotations

from flask import Blueprint, jsonify, request

from backend.api.dependencies import service
from backend.auth_guard import require_role
from backend.errors import ValidationError
from backend.validation import parse_int, parse_optional_int

bp = Blueprint("statistics", __name__, url_prefix="/api/statistics")


@bp.get("/overview")
@require_role("ADMIN")
def overview():
    return jsonify({"data": service("statistics").overview()})


@bp.get("/assignments")
@require_role("ADMIN")
def assignment_statistics():
    section_id = parse_optional_int(request.args.get("section_id"), "section_id", min_value=1)
    semester_id = parse_optional_int(request.args.get("semester_id"), "semester_id", min_value=1)
    min_submissions = parse_optional_int(
        request.args.get("min_submissions"), "min_submissions", min_value=0
    )
    rows = service("statistics").assignment_statistics(
        section_id, semester_id, min_submissions
    )
    return jsonify({"data": rows, "meta": {"count": len(rows)}})


@bp.get("/assignments/<int:assignment_id>/completion")
@require_role("ADMIN")
def assignment_completion(assignment_id: int):
    if assignment_id <= 0:
        raise ValidationError("assignment_id phai la so nguyen duong.")
    return jsonify({"data": service("statistics").assignment_completion(assignment_id)})


@bp.get("/enrollments/<int:enrollment_id>/average")
@require_role("ADMIN")
def student_average(enrollment_id: int):
    if enrollment_id <= 0:
        raise ValidationError("enrollment_id phai la so nguyen duong.")
    return jsonify({"data": service("statistics").student_average(enrollment_id)})
