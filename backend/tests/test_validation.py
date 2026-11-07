from __future__ import annotations

import pytest
from flask import Flask

from backend.errors import ValidationError
from backend.validation import parse_bool, parse_int, parse_status


def test_parse_int_accepts_numeric_string():
    assert parse_int("42", "x", min_value=1) == 42


def test_parse_int_rejects_bool():
    with pytest.raises(ValidationError):
        parse_int(True, "x")


def test_parse_int_rejects_out_of_range():
    with pytest.raises(ValidationError):
        parse_int(0, "x", min_value=1)


def test_parse_status_normalizes():
    assert parse_status(" active ") == "ACTIVE"


def test_parse_status_rejects_unknown():
    with pytest.raises(ValidationError):
        parse_status("WAITING")


def test_parse_bool():
    assert parse_bool("true") is True
    assert parse_bool("0") is False
