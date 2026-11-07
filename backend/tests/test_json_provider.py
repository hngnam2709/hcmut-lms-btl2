from __future__ import annotations

from datetime import datetime, timedelta
from decimal import Decimal


def test_json_provider_serializes_mysql_values(app):
    payload = {
        "score": Decimal("8.50"),
        "time": timedelta(hours=8, minutes=5),
        "datetime": datetime(2026, 9, 20, 10, 0, 0),
    }
    rendered = app.json.dumps(payload)
    assert '"score": 8.5' in rendered
    assert '"time": "08:05:00"' in rendered
    assert '"datetime": "2026-09-20 10:00:00"' in rendered
