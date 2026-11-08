#!/usr/bin/env python3
"""Generate docs/ROW_COUNTS.md from the live database.

Requires the seeded database used by the application.
"""
from __future__ import annotations

import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.config import Config  # noqa: E402
from backend.db import Database  # noqa: E402

OUTPUT = ROOT / "docs" / "ROW_COUNTS.md"


def main() -> int:
    db = Database(Config.__dict__)
    tables = db.fetch_all(
        """
        SELECT `TABLE_NAME` AS name
        FROM `information_schema`.`TABLES`
        WHERE `TABLE_SCHEMA` = %s AND `TABLE_TYPE` = 'BASE TABLE'
        ORDER BY `TABLE_NAME`
        """,
        (Config.MYSQL_DATABASE,),
    )
    rows: list[tuple[str, int]] = []
    for table in tables:
        name = table["name"]
        counted = db.fetch_one(f"SELECT COUNT(*) AS n FROM `{name}`")
        rows.append((name, int(counted["n"]) if counted else 0))

    missing = [name for name, count in rows if count < 5]
    lines = [
        "# Row counts (seeded database)",
        "",
        f"- Database: `{Config.MYSQL_DATABASE}`",
        f"- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        f"- Tables: {len(rows)}",
        f"- Tables with fewer than 5 rows: {len(missing)}",
        "",
        "| # | Table | Rows | >= 5 |",
        "|---:|---|---:|:---:|",
    ]
    for index, (name, count) in enumerate(rows, start=1):
        lines.append(f"| {index} | `{name}` | {count} | {'PASS' if count >= 5 else 'FAIL'} |")
    lines.append("")
    if missing:
        lines.append("**FAIL:** " + ", ".join(f"`{name}`" for name in missing))
    else:
        lines.append("**PASS:** every table has at least 5 seed rows.")
    lines.append("")

    OUTPUT.write_text("\n".join(lines))
    print(f"wrote {OUTPUT} ({len(rows)} tables)")
    return 0 if not missing else 1


if __name__ == "__main__":
    raise SystemExit(main())
