from __future__ import annotations

from typing import Any

from flask import request

from backend.errors import AppError, ValidationError

ENROLLMENT_STATUSES = ("ACTIVE", "DROPPED", "COMPLETED")
SECTION_STATUSES = ("OPEN", "CLOSED", "CANCELLED")


def require_json_object() -> dict:
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise AppError(
            "Body phai la JSON object.",
            400,
            "invalid_json",
            {"content_type": request.content_type},
        )
    return data


def parse_int(
    value: Any,
    field: str,
    *,
    required: bool = False,
    min_value: int | None = None,
    max_value: int | None = None,
) -> int | None:
    if value is None or (isinstance(value, str) and value.strip() == ""):
        if required:
            raise ValidationError(f"Thieu truong {field}.", {field: "required"})
        return None
    if isinstance(value, bool):
        raise ValidationError(f"{field} phai la so nguyen.", {field: "invalid"})
    try:
        parsed = int(str(value).strip())
    except (TypeError, ValueError) as exc:
        raise ValidationError(f"{field} phai la so nguyen.", {field: "invalid"}) from exc
    if min_value is not None and parsed < min_value:
        raise ValidationError(
            f"{field} phai >= {min_value}.", {field: f"min:{min_value}"}
        )
    if max_value is not None and parsed > max_value:
        raise ValidationError(
            f"{field} phai <= {max_value}.", {field: f"max:{max_value}"}
        )
    return parsed


def parse_optional_int(value: Any, field: str, **kwargs) -> int | None:
    return parse_int(value, field, required=False, **kwargs)


def parse_status(value: Any, *, required: bool = False) -> str | None:
    if value is None or (isinstance(value, str) and value.strip() == ""):
        if required:
            raise ValidationError("Thieu EnrollmentStatus.", {"status": "required"})
        return None
    normalized = str(value).strip().upper()
    if normalized not in ENROLLMENT_STATUSES:
        raise ValidationError(
            "EnrollmentStatus chi nhan ACTIVE, DROPPED hoac COMPLETED.",
            {"status": normalized},
        )
    return normalized


def parse_bool(value: Any, default: bool = False) -> bool:
    if value is None:
        return default
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def parse_section_status(value: Any, *, required: bool = False) -> str | None:
    if value is None or (isinstance(value, str) and value.strip() == ""):
        if required:
            raise ValidationError("Thieu SectionStatus.", {"status": "required"})
        return None
    normalized = str(value).strip().upper()
    if normalized not in SECTION_STATUSES:
        raise ValidationError(
            "SectionStatus chi nhan OPEN, CLOSED hoac CANCELLED.",
            {"status": normalized},
        )
    return normalized
