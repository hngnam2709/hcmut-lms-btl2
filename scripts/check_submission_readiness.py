#!/usr/bin/env python3
"""Check the P0/P1 evidence required by the BTL2 feedback before submission.

Exit code 0 means the repository is ready for the items that can be checked
statically. Items that require a Windows machine or real member names are
reported explicitly instead of being silently ignored.
"""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAIL: list[str] = []
WARN: list[str] = []


def require_file(relative: str) -> Path | None:
    path = ROOT / relative
    if not path.exists():
        FAIL.append(f"missing file: {relative}")
        return None
    return path


def main() -> int:
    team = require_file("docs/TEAM_ASSIGNMENT.md")
    if team:
        text = team.read_text()
        if "[Họ tên]" in text or "[MSSV]" in text:
            FAIL.append("TEAM_ASSIGNMENT.md still contains [Họ tên] / [MSSV] placeholders")
        if "git shortlog" not in text:
            WARN.append("TEAM_ASSIGNMENT.md should reference Git history evidence")

    rows = require_file("docs/ROW_COUNTS.md")
    if rows and "every table has at least 5 seed rows" not in rows.read_text():
        FAIL.append("docs/ROW_COUNTS.md does not confirm >=5 rows for every table")

    schema = require_file("docs/SCHEMA_INVENTORY.md")
    if schema:
        text = schema.read_text()
        if "22 tables" not in text or "39 checks" not in text:
            FAIL.append("docs/SCHEMA_INVENTORY.md is missing expected totals")

    functions = require_file("database/functions/07_functions.sql")
    if functions:
        text = functions.read_text()
        if text.count("CURSOR FOR") < 2 or text.count("LOOP") < 2:
            FAIL.append("both functions must declare a cursor and a loop")

    app_js = require_file("frontend/assets/app.js")
    if app_js:
        text = app_js.read_text()
        if "renderAdminEnrollments" not in text or "renderAdminStatistics" not in text:
            FAIL.append("admin UI is missing the Ghi danh / Thống kê tabs")

    security = require_file("SECURITY.md")
    if security:
        text = security.read_text()
        if "**Chưa có.** Demo không có login" in text:
            FAIL.append("SECURITY.md still claims there is no login/session")

    require_file("docs/FUNCTION_EVIDENCE.md")
    require_file("docs/TRIGGER_DML_MATRIX.md")
    require_file("docs/CRUD_PROCEDURE_TRACE.md")
    require_file("docs/QUERY_PROCEDURE_EVIDENCE.md")
    require_file("docs/SUBMISSION_EVIDENCE.md")
    require_file("database/tests/10_trigger_dml_matrix.sql")
    require_file("database/tests/11_trigger_expected_fail_schedule_update.sql")
    require_file("database/tests/12_function_boundary.sql")
    require_file("database/tests/13_function_expected_fail_invalid.sql")

    tracked = subprocess.run(
        ["git", "ls-files", ".env"], cwd=ROOT, capture_output=True, text=True, check=False
    )
    if tracked.stdout.strip():
        FAIL.append(".env is tracked by git")

    print("BTL2 submission readiness")
    print("=" * 32)
    if FAIL:
        for item in FAIL:
            print(f"FAIL: {item}")
    else:
        print("PASS: static P0/P1 evidence is present")
    for item in WARN:
        print(f"WARN: {item}")
    print()
    print("Manual items still required:")
    print("- Fill real member names/MSSV in docs/TEAM_ASSIGNMENT.md (P0).")
    print("- Run the clean Windows setup and record results (P1).")
    print("- Record a short demo video of CRUD Ghi danh + Thống kê (P1).")
    return 1 if FAIL else 0


if __name__ == "__main__":
    raise SystemExit(main())
