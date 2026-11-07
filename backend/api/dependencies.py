from __future__ import annotations

from flask import current_app


def service(name: str):
    return current_app.extensions["services"][name]
