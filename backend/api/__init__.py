from flask import Flask

from backend.api import admin, auth, catalog, enrollments, health, staff, statistics, student


def register_blueprints(app: Flask) -> None:
    app.register_blueprint(auth.bp)
    app.register_blueprint(health.bp)
    app.register_blueprint(catalog.bp)
    app.register_blueprint(enrollments.bp)
    app.register_blueprint(statistics.bp)
    app.register_blueprint(student.bp)
    app.register_blueprint(staff.bp)
    app.register_blueprint(admin.bp)