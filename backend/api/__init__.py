from flask import Flask

from backend.api import catalog, enrollments, health, statistics


def register_blueprints(app: Flask) -> None:
    app.register_blueprint(health.bp)
    app.register_blueprint(catalog.bp)
    app.register_blueprint(enrollments.bp)
    app.register_blueprint(statistics.bp)
