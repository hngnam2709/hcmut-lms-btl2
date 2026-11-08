from __future__ import annotations

import logging
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from pathlib import Path

from flask import Flask, abort, send_from_directory
from flask.json.provider import DefaultJSONProvider

from backend.api import register_blueprints
from backend.config import Config
from backend.db import Database
from backend.errors import register_error_handlers
from backend.logging_config import configure_logging, register_request_logging
from backend.repositories import (
    AdminRepository,
    CatalogRepository,
    EnrollmentRepository,
    StatisticsRepository,
    StaffRepository,
    StudentRepository,
)
from backend.services import (
    AdminService,
    CatalogService,
    EnrollmentService,
    HealthService,
    StaffService,
    StatisticsService,
    StudentService,
)

# Import session configuration
from backend.session_config import configure_session


class APIJSONProvider(DefaultJSONProvider):
    @staticmethod
    def default(obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, datetime):
            return obj.isoformat(sep=" ")
        if isinstance(obj, (date, time)):
            return obj.isoformat()
        if isinstance(obj, timedelta):
            total = int(obj.total_seconds())
            sign = "-" if total < 0 else ""
            total = abs(total)
            hours, remainder = divmod(total, 3600)
            minutes, seconds = divmod(remainder, 60)
            return f"{sign}{hours:02d}:{minutes:02d}:{seconds:02d}"
        return DefaultJSONProvider.default(obj)


def create_app(config: dict | object | None = None) -> Flask:
    app = Flask(__name__, static_folder=None)
    app.config.from_object(Config)
    if config is not None:
        if isinstance(config, dict):
            app.config.update(config)
        else:
            app.config.from_object(config)

    app.json = APIJSONProvider(app)
    app.json.ensure_ascii = False
    app.json.sort_keys = False
    app.url_map.strict_slashes = False

    configure_logging(app)
    register_request_logging(app)
    app.logger.setLevel(logging.INFO)

    # Configure session support
    configure_session(app)

    db = Database(app.config)
    app.extensions["db"] = db
    app.extensions["services"] = {
        "enrollment": EnrollmentService(EnrollmentRepository(db)),
        "catalog": CatalogService(CatalogRepository(db)),
        "statistics": StatisticsService(StatisticsRepository(db)),
        "health": HealthService(db),
        "student": StudentService(StudentRepository(db)),
        "staff": StaffService(StaffRepository(db)),
        "admin": AdminService(AdminRepository(db)),
    }

    register_error_handlers(app)
    register_blueprints(app)

    frontend = Path(app.config["FRONTEND_DIR"])

    @app.get("/")
    def index():
        return send_from_directory(str(frontend), "index.html")

    @app.get("/<path:filename>")
    def frontend_file(filename: str):
        if filename.startswith("api/"):
            abort(404)
        return send_from_directory(str(frontend), filename)

    return app