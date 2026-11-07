from __future__ import annotations

import logging
from typing import Any

import pymysql
from flask import Flask, jsonify, request
from werkzeug.exceptions import HTTPException

from backend.logging_config import request_id

logger = logging.getLogger(__name__)


class AppError(Exception):
    """Operational error that is safe to expose through the API."""

    def __init__(
        self,
        message: str,
        status_code: int = 400,
        code: str = "bad_request",
        details: Any | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code
        self.details = details


class ValidationError(AppError):
    def __init__(self, message: str, details: Any | None = None) -> None:
        super().__init__(message, 422, "validation_error", details)


class NotFoundError(AppError):
    def __init__(self, message: str = "Khong tim thay tai nguyen.") -> None:
        super().__init__(message, 404, "not_found")


def _payload(message: str, code: str, details: Any | None = None) -> dict:
    body: dict[str, Any] = {
        "error": {"code": code, "message": message},
        "request_id": request_id(),
    }
    if details is not None:
        body["error"]["details"] = details
    return body


def _database_error(exc: pymysql.err.MySQLError):
    args = getattr(exc, "args", ())
    error_code = args[0] if args else None
    message = str(args[1]) if len(args) > 1 else "Database error"

    if error_code == 1644:
        return AppError(message, 400, "database_rule_violation")
    if error_code == 1062:
        return AppError("Du lieu da ton tai (vi pham UNIQUE).", 409, "duplicate")
    if error_code in {1451, 1452}:
        return AppError(
            "Khong the thuc hien vi rang buoc khoa ngoai.",
            409,
            "foreign_key_conflict",
        )
    if error_code in {1264, 1265, 1366, 3819, 4025}:
        return AppError(message, 400, "constraint_violation")
    if error_code in {1045, 2003, 2005, 2006, 2013}:
        return AppError(
            "Khong ket noi duoc MySQL. Kiem tra lai cau hinh va trang thai server.",
            503,
            "database_unavailable",
        )
    return AppError(
        "Loi co so du lieu. Vui long thu lai hoac xem log server.",
        500,
        "database_error",
    )


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(AppError)
    def handle_app_error(exc: AppError):
        return jsonify(_payload(exc.message, exc.code, exc.details)), exc.status_code

    @app.errorhandler(pymysql.err.MySQLError)
    def handle_mysql_error(exc: pymysql.err.MySQLError):
        app_error = _database_error(exc)
        if app_error.status_code >= 500:
            logger.exception("MySQL error: %s", exc)
        return (
            jsonify(_payload(app_error.message, app_error.code, app_error.details)),
            app_error.status_code,
        )

    @app.errorhandler(HTTPException)
    def handle_http_error(exc: HTTPException):
        if not request.path.startswith("/api/"):
            return exc
        message = exc.description or exc.name
        return (
            jsonify(_payload(message, f"http_{exc.code}")),
            exc.code or 500,
        )

    @app.errorhandler(Exception)
    def handle_unexpected_error(exc: Exception):
        logger.exception("Unhandled exception: %s", exc)
        return (
            jsonify(_payload("Loi server khong mong muon.", "internal_error")),
            500,
        )
