#!/usr/bin/env python3
"""Generate docs/SCHEMA_INVENTORY.md from the live database.

This is evidence for BTL2 section 1.1: every table, PK, FK, UNIQUE and CHECK.
"""
from __future__ import annotations

import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.config import Config  # noqa: E402
from backend.db import Database  # noqa: E402

OUTPUT = ROOT / "docs" / "SCHEMA_INVENTORY.md"


def main() -> int:
    db = Database(Config.__dict__)
    schema = Config.MYSQL_DATABASE
    tables = db.fetch_all(
        """
        SELECT `TABLE_NAME` AS name
        FROM `information_schema`.`TABLES`
        WHERE `TABLE_SCHEMA` = %s AND `TABLE_TYPE` = 'BASE TABLE'
        ORDER BY `TABLE_NAME`
        """,
        (schema,),
    )

    lines = [
        "# Schema inventory",
        "",
        f"- Database: `{schema}`",
        f"- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "",
        "| Table | Columns | PK | FK | UNIQUE | CHECK |",
        "|---|---:|---:|---:|---:|---:|",
    ]
    details: list[str] = []
    totals = {"columns": 0, "fk": 0, "unique": 0, "check": 0}

    for table in tables:
        name = table["name"]
        columns = db.fetch_one(
            """
            SELECT COUNT(*) AS n FROM `information_schema`.`COLUMNS`
            WHERE `TABLE_SCHEMA` = %s AND `TABLE_NAME` = %s
            """,
            (schema, name),
        )
        pk_rows = db.fetch_all(
            """
            SELECT `COLUMN_NAME` FROM `information_schema`.`KEY_COLUMN_USAGE`
            WHERE `TABLE_SCHEMA` = %s AND `TABLE_NAME` = %s
              AND `CONSTRAINT_NAME` = 'PRIMARY'
            ORDER BY `ORDINAL_POSITION`
            """,
            (schema, name),
        )
        fk_rows = db.fetch_all(
            """
            SELECT `COLUMN_NAME`, `REFERENCED_TABLE_NAME`, `REFERENCED_COLUMN_NAME`
            FROM `information_schema`.`KEY_COLUMN_USAGE`
            WHERE `TABLE_SCHEMA` = %s AND `TABLE_NAME` = %s
              AND `REFERENCED_TABLE_NAME` IS NOT NULL
            ORDER BY `COLUMN_NAME`
            """,
            (schema, name),
        )
        unique_rows = db.fetch_all(
            """
            SELECT `INDEX_NAME`, GROUP_CONCAT(`COLUMN_NAME` ORDER BY `SEQ_IN_INDEX`) AS cols
            FROM `information_schema`.`STATISTICS`
            WHERE `TABLE_SCHEMA` = %s AND `TABLE_NAME` = %s
              AND `NON_UNIQUE` = 0 AND `INDEX_NAME` <> 'PRIMARY'
            GROUP BY `INDEX_NAME`
            ORDER BY `INDEX_NAME`
            """,
            (schema, name),
        )
        check_rows = db.fetch_all(
            """
            SELECT tc.`CONSTRAINT_NAME`, cc.`CHECK_CLAUSE`
            FROM `information_schema`.`TABLE_CONSTRAINTS` tc
            JOIN `information_schema`.`CHECK_CONSTRAINTS` cc
              ON cc.`CONSTRAINT_SCHEMA` = tc.`CONSTRAINT_SCHEMA`
             AND cc.`CONSTRAINT_NAME` = tc.`CONSTRAINT_NAME`
            WHERE tc.`CONSTRAINT_SCHEMA` = %s AND tc.`TABLE_NAME` = %s
              AND tc.`CONSTRAINT_TYPE` = 'CHECK'
            ORDER BY tc.`CONSTRAINT_NAME`
            """,
            (schema, name),
        )

        column_count = int(columns["n"]) if columns else 0
        totals["columns"] += column_count
        totals["fk"] += len(fk_rows)
        totals["unique"] += len(unique_rows)
        totals["check"] += len(check_rows)
        pk = ", ".join(row["COLUMN_NAME"] for row in pk_rows) or "—"
        lines.append(
            f"| `{name}` | {column_count} | {pk} | {len(fk_rows)} | "
            f"{len(unique_rows)} | {len(check_rows)} |"
        )

        block = [f"### `{name}`", ""]
        if fk_rows:
            block.append("**Foreign keys**")
            block.extend(
                f"- `{row['COLUMN_NAME']}` → `{row['REFERENCED_TABLE_NAME']}.{row['REFERENCED_COLUMN_NAME']}`"
                for row in fk_rows
            )
            block.append("")
        if unique_rows:
            block.append("**Unique keys**")
            block.extend(f"- `{row['INDEX_NAME']}` ({row['cols']})" for row in unique_rows)
            block.append("")
        if check_rows:
            block.append("**Checks**")
            for row in check_rows:
                clause = " ".join(str(row["CHECK_CLAUSE"]).split())
                block.append(f"- `{row['CONSTRAINT_NAME']}`: `{clause[:140]}`")
            block.append("")
        details.append("\n".join(block))

    lines.extend(
        [
            "",
            f"Totals: {len(tables)} tables, {totals['columns']} columns, "
            f"{totals['fk']} foreign keys, {totals['unique']} unique keys, "
            f"{totals['check']} checks.",
            "",
            "## Details",
            "",
            "\n".join(details),
        ]
    )
    OUTPUT.write_text("\n".join(lines))
    print(f"wrote {OUTPUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
