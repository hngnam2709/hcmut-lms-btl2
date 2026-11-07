from __future__ import annotations

import logging
import logging.handlers
from pathlib import Path
from uuid import uuid4

from flask import Flask, g, has_request_context


def request_id() -> str:
    if has_request_context():
        return getattr(g, "request_id", "-")
    return "-"


def configure_logging(app: Flask) -> None:
    level = getattr(logging, str(app.config.get("LOG_LEVEL", "INFO")).upper(), logging.INFO)
    formatter = logging.Formatter(
        "%(asctime)s %(levelname)s %(name)s [%(request_id)s] %(message)s"
    )

    root = logging.getLogger()
    root.setLevel(level)
    for handler in list(root.handlers):
        root.removeHandler(handler)

    console = logging.StreamHandler()
    console.setFormatter(formatter)
    root.addHandler(console)

    if app.config.get("LOG_TO_FILE"):
        log_file = Path(app.config["LOG_FILE"])
        log_file.parent.mkdir(parents=True, exist_ok=True)
        file_handler = logging.handlers.RotatingFileHandler(
            log_file, maxBytes=1_000_000, backupCount=5, encoding="utf-8"
        )
        file_handler.setFormatter(formatter)
        root.addHandler(file_handler)

    old_factory = logging.getLogRecordFactory()

    def record_factory(*args, **kwargs):
        record = old_factory(*args, **kwargs)
        record.request_id = request_id()
        return record

    logging.setLogRecordFactory(record_factory)


def register_request_logging(app: Flask) -> None:
    import time

    logger = logging.getLogger("hcmut_lms.request")

    @app.before_request
    def before_request():
        from flask import request

        g.request_id = request_id_from_header()
        g.method = request.method
        g.path = request.path
        g.started_at = time.perf_counter()

    @app.after_request
    def after_request(response):
        elapsed_ms = (time.perf_counter() - getattr(g, "started_at", time.perf_counter())) * 1000
        response.headers["X-Request-ID"] = request_id()
        logger.info(
            "%s %s -> %s (%.1f ms)",
            getattr(g, "method", ""),
            getattr(g, "path", ""),
            response.status_code,
            elapsed_ms,
        )
        return response


def request_id_from_header() -> str:
    from flask import request

    incoming = request.headers.get("X-Request-ID", "").strip()
    return incoming[:80] if incoming else uuid4().hex[:12]
