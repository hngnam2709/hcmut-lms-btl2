from backend.config import Config


def configure_session(app):
    """Configure Flask session for secure authentication."""
    app.secret_key = app.config["SECRET_KEY"]

    if app.secret_key in Config.INSECURE_SECRET_KEYS:
        if app.config.get("APP_ENV") not in {"local", "test", "development"}:
            raise RuntimeError(
                "SECRET_KEY must be configured when APP_ENV is not local/test/development."
            )
        app.logger.warning(
            "SECRET_KEY is using a demo/placeholder value; set a random SECRET_KEY "
            "in .env before deploying."
        )

    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    app.config["SESSION_COOKIE_SECURE"] = app.config.get("APP_ENV") == "production"
