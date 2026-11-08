from __future__ import annotations

from flask import Blueprint, jsonify, request

from backend.api.dependencies import service
from backend.auth_guard import current_user_id, require_role
from backend.errors import ValidationError
from backend.validation import parse_bool, parse_optional_int, require_json_object

bp = Blueprint("staff", __name__, url_prefix="/api/staff")


def _float(body: dict, key: str, required: bool = True) -> float:
    value = body.get(key)
    if value is None or value == "":
        if required:
            raise ValidationError(f"Thieu {key}.", {key: "required"})
        return 0.0
    try:
        return float(value)
    except (TypeError, ValueError):
        raise ValidationError(f"{key} phai la so.", {key: "invalid"})


def _str(body: dict, key: str, required: bool = True) -> str:
    value = (body.get(key) or "").strip()
    if not value and required:
        raise ValidationError(f"Thieu {key}.", {key: "required"})
    return value


@bp.get("/sections")
@require_role("STAFF")
def sections():
    return jsonify({"data": service("staff").sections(current_user_id())})


@bp.get("/sections/<int:section_id>/students")
@require_role("STAFF")
def students(section_id: int):
    return jsonify({"data": service("staff").students(current_user_id(), section_id)})


@bp.get("/sections/<int:section_id>/announcements")
@require_role("STAFF")
def announcements(section_id: int):
    return jsonify({"data": service("staff").announcements(current_user_id(), section_id)})


@bp.post("/sections/<int:section_id>/announcements")
@require_role("STAFF")
def create_announcement(section_id: int):
    body = require_json_object()
    title = _str(body, "title")
    content = _str(body, "content")
    expired_at = (body.get("expired_at") or "").strip() or None
    return jsonify({"data": service("staff").create_announcement(current_user_id(), section_id, title, content, expired_at)}), 201


@bp.delete("/announcements/<int:announcement_id>")
@require_role("STAFF")
def delete_announcement(announcement_id: int):
    service("staff").delete_announcement(current_user_id(), announcement_id)
    return jsonify({"data": {"message": "Da xoa thong bao."}})


@bp.get("/sections/<int:section_id>/resources")
@require_role("STAFF")
def resources(section_id: int):
    return jsonify({"data": service("staff").resources(current_user_id(), section_id)})


@bp.post("/sections/<int:section_id>/resources")
@require_role("STAFF")
def create_resource(section_id: int):
    body = require_json_object()
    title = _str(body, "title")
    description = _str(body, "description", required=False)
    rtype = _str(body, "resource_type")
    url = _str(body, "resource_url")
    display_order = parse_optional_int(body.get("display_order"), "display_order", min_value=0) or 0
    return jsonify({"data": service("staff").create_resource(current_user_id(), section_id, title, description, rtype, url, display_order)}), 201


@bp.delete("/sections/<int:section_id>/resources/<int:resource_id>")
@require_role("STAFF")
def unpost_resource(section_id: int, resource_id: int):
    service("staff").unpost_resource(current_user_id(), section_id, resource_id)
    return jsonify({"data": {"message": "Da go tai lieu khoi lop."}})


@bp.get("/sections/<int:section_id>/assessments")
@require_role("STAFF")
def assessments(section_id: int):
    return jsonify({"data": service("staff").assessments(current_user_id(), section_id)})


@bp.post("/sections/<int:section_id>/assignments")
@require_role("STAFF")
def create_assignment(section_id: int):
    body = require_json_object()
    payload = {
        "title": _str(body, "title"),
        "description": _str(body, "description", required=False),
        "max_score": _float(body, "max_score"),
        "max_attempts": parse_optional_int(body.get("max_attempts"), "max_attempts", min_value=1),
        "open_date": _str(body, "open_date"),
        "due_date": _str(body, "due_date"),
        "allow_late": parse_bool(body.get("allow_late"), False),
        "attachments": [a for a in (body.get("attachments") or []) if a],
    }
    return jsonify({"data": service("staff").create_assignment(current_user_id(), section_id, payload)}), 201


@bp.post("/sections/<int:section_id>/quizzes")
@require_role("STAFF")
def create_quiz(section_id: int):
    body = require_json_object()
    payload = {
        "title": _str(body, "title"),
        "description": _str(body, "description", required=False),
        "max_score": _float(body, "max_score"),
        "max_attempts": parse_optional_int(body.get("max_attempts"), "max_attempts", min_value=1),
        "open_time": _str(body, "open_time"),
        "close_time": _str(body, "close_time"),
        "duration": parse_optional_int(body.get("duration"), "duration", min_value=1) or 1,
    }
    return jsonify({"data": service("staff").create_quiz(current_user_id(), section_id, payload)}), 201


@bp.delete("/assessments/<int:assessment_id>")
@require_role("STAFF")
def delete_assessment(assessment_id: int):
    service("staff").delete_assessment(current_user_id(), assessment_id)
    return jsonify({"data": {"message": "Da xoa assessment."}})


@bp.get("/sections/<int:section_id>/submissions")
@require_role("STAFF")
def submissions(section_id: int):
    return jsonify({"data": service("staff").submissions(current_user_id(), section_id)})


@bp.patch("/submissions/<int:submission_id>/grade")
@require_role("STAFF")
def grade_submission(submission_id: int):
    body = require_json_object()
    score = _float(body, "score")
    return jsonify({"data": service("staff").grade_submission(current_user_id(), submission_id, score)})


@bp.get("/sections/<int:section_id>/grades")
@require_role("STAFF")
def grades(section_id: int):
    return jsonify({"data": service("staff").grades(current_user_id(), section_id)})


@bp.post("/sections/<int:section_id>/grades")
@require_role("STAFF")
def upsert_grade(section_id: int):
    body = require_json_object()
    enrollment_id = parse_optional_int(body.get("enrollment_id"), "enrollment_id", min_value=1)
    assessment_id = parse_optional_int(body.get("assessment_id"), "assessment_id", min_value=1)
    score = _float(body, "score")
    published = parse_bool(body.get("published"), True)
    if not enrollment_id or not assessment_id:
        raise ValidationError("Thieu enrollment_id hoac assessment_id.")
    return jsonify({"data": service("staff").upsert_grade(current_user_id(), section_id, enrollment_id, assessment_id, score, published)}), 201


@bp.get("/sections/<int:section_id>/quiz-attempts")
@require_role("STAFF")
def quiz_attempts(section_id: int):
    return jsonify({"data": service("staff").quiz_attempts(current_user_id(), section_id)})


@bp.patch("/quiz-attempts/<int:attempt_id>/score")
@require_role("STAFF")
def set_quiz_attempt_score(attempt_id: int):
    body = require_json_object()
    section_id = parse_optional_int(body.get("section_id"), "section_id", min_value=1)
    score = _float(body, "score")
    if not section_id:
        raise ValidationError("Thieu section_id.")
    return jsonify({"data": service("staff").set_quiz_attempt_score(current_user_id(), section_id, attempt_id, score)})


@bp.get("/submissions/<int:submission_id>/feedback")
@require_role("STAFF")
def feedback_thread(submission_id: int):
    return jsonify({"data": service("staff").feedback_thread(current_user_id(), submission_id)})


@bp.post("/submissions/<int:submission_id>/feedback")
@require_role("STAFF")
def feedback(submission_id: int):
    body = require_json_object()
    content = _str(body, "content")
    parent_id = parse_optional_int(body.get("parent_id"), "parent_id", min_value=1)
    return jsonify({"data": service("staff").feedback(current_user_id(), submission_id, content, parent_id)}), 201
