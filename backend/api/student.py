from __future__ import annotations

from flask import Blueprint, jsonify, request

from backend.api.dependencies import service
from backend.auth_guard import current_user_id, require_role
from backend.validation import parse_optional_int, require_json_object

bp = Blueprint("student", __name__, url_prefix="/api/student")


@bp.get("/sections")
@require_role("STUDENT")
def sections():
    return jsonify({"data": service("student").sections(current_user_id())})


@bp.get("/sections/<int:section_id>")
@require_role("STUDENT")
def section(section_id: int):
    return jsonify({"data": service("student").section(current_user_id(), section_id)})


@bp.get("/sections/<int:section_id>/announcements")
@require_role("STUDENT")
def announcements(section_id: int):
    return jsonify({"data": service("student").announcements(current_user_id(), section_id)})


@bp.get("/sections/<int:section_id>/resources")
@require_role("STUDENT")
def resources(section_id: int):
    return jsonify({"data": service("student").resources(current_user_id(), section_id)})


@bp.get("/sections/<int:section_id>/assessments")
@require_role("STUDENT")
def assessments(section_id: int):
    return jsonify({"data": service("student").assessments(current_user_id(), section_id)})


@bp.get("/assignments/<int:assessment_id>")
@require_role("STUDENT")
def assignment(assessment_id: int):
    return jsonify({"data": service("student").assignment(current_user_id(), assessment_id)})


@bp.post("/assignments/<int:assessment_id>/submissions")
@require_role("STUDENT")
def submit(assessment_id: int):
    body = require_json_object()
    file_name = (body.get("file_name") or "").strip()
    file_url = (body.get("file_url") or "").strip()
    file_size = parse_optional_int(body.get("file_size"), "file_size", min_value=0) or 0
    return (
        jsonify({"data": service("student").submit(current_user_id(), assessment_id, file_name, file_url, file_size)}),
        201,
    )


@bp.get("/quizzes/<int:assessment_id>")
@require_role("STUDENT")
def quiz(assessment_id: int):
    return jsonify({"data": service("student").quiz(current_user_id(), assessment_id)})


@bp.post("/quizzes/<int:assessment_id>/attempts")
@require_role("STUDENT")
def start_quiz(assessment_id: int):
    return (
        jsonify({"data": service("student").start_quiz(current_user_id(), assessment_id)}),
        201,
    )


@bp.get("/grades")
@require_role("STUDENT")
def grades():
    return jsonify({"data": service("student").grades(current_user_id())})


@bp.post("/submissions/<int:submission_id>/feedback")
@require_role("STUDENT")
def feedback(submission_id: int):
    body = require_json_object()
    content = (body.get("content") or "").strip()
    parent_id = parse_optional_int(body.get("parent_id"), "parent_id", min_value=1)
    if not content:
        from backend.errors import ValidationError
        raise ValidationError("Thieu noi dung phan hoi.", {"content": "required"})
    return (
        jsonify({"data": service("student").feedback(current_user_id(), submission_id, content, parent_id)}),
        201,
    )


@bp.get("/submissions/<int:submission_id>/feedback")
@require_role("STUDENT")
def feedback_thread(submission_id: int):
    return jsonify({"data": service("student").feedback_thread(current_user_id(), submission_id)})
