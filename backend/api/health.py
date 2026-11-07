from __future__ import annotations

from datetime import datetime, timezone

from flask import Blueprint, jsonify

from backend.api.dependencies import service

bp = Blueprint("health", __name__, url_prefix="/api/health")


@bp.get("/live")
def live():
    return jsonify({
        "status": "ok",
        "service": "hcmut-lms-btl2-api",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


@bp.get("")
def health():
    return jsonify(service("health").check())
