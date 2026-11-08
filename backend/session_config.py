from flask import session
from backend.config import Config


def configure_session(app):
    """Configure Flask session for secure authentication."""
    # Set secret key from config
    app.secret_key = Config.SECRET_KEY
    
    # Configure session cookies
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'