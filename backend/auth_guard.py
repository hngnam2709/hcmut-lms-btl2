from functools import wraps

from flask import session

from backend.errors import AppError


def require_role(*allowed_roles):
    """Require an authenticated session with one of the allowed roles."""

    def decorator(view):
        @wraps(view)
        def wrapper(*args, **kwargs):
            if "user_id" not in session or "role" not in session:
                raise AppError("Chua dang nhap.", 401, "unauthorized")
            if session["role"] not in allowed_roles:
                raise AppError("Khong co quyen truy cap.", 403, "forbidden")
            return view(*args, **kwargs)

        return wrapper

    return decorator


def current_user_id() -> int:
    user_id = session.get("user_id")
    if user_id is None:
        raise AppError("Chua dang nhap.", 401, "unauthorized")
    return int(user_id)
