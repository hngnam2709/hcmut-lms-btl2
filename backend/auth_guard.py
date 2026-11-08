from flask import session
from backend.errors import NotFoundError


def require_role(*allowed_roles):
    """Decorator to ensure user is logged in and has the required role."""
    def decorator(f):
        def wrapper(*args, **kwargs):
            if 'user_id' not in session or 'role' not in session:
                raise NotFoundError("User not logged in")
            if session['role'] not in allowed_roles:
                raise NotFoundError("Access denied")
            return f(*args, **kwargs)
        return wrapper
    return decorator