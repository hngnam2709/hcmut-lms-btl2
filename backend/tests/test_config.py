from __future__ import annotations

import pytest

from backend.app import create_app
from backend.config import Config


def test_production_rejects_demo_secret():
    with pytest.raises(RuntimeError):
        create_app(
            {
                "APP_ENV": "production",
                "SECRET_KEY": Config.DEFAULT_SECRET_KEY,
                "TESTING": True,
            }
        )


def test_production_rejects_env_example_placeholder():
    with pytest.raises(RuntimeError):
        create_app(
            {
                "APP_ENV": "production",
                "SECRET_KEY": "replace-with-a-random-value",
                "TESTING": True,
            }
        )


def test_local_allows_demo_secret():
    app = create_app({"APP_ENV": "local", "SECRET_KEY": Config.DEFAULT_SECRET_KEY, "TESTING": True})
    assert app.secret_key == Config.DEFAULT_SECRET_KEY
