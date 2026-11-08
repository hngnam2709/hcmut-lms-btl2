#!/usr/bin/env python3
"""Check the P0/P1 evidence required by the BTL2 feedback before submission.

Exit code 0 means the repository is ready for the items that can be checked
statically. Items that require a Windows machine or real member names are
reported explicitly instead of being silently ignored.
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAIL: list[str] = []
WARN: list[str] = []


def run_command(label: str, command: list[str], timeout: int = 300) -> None:
    print(f"\n== {label} ==")
    result = subprocess.run(command, cwd=ROOT, timeout=timeout, check=False)
    if result.returncode != 0:
        FAIL.append(f"{label} failed (exit {result.returncode})")


def server_is_up() -> bool:
    try:
        with urllib.request.urlopen("http://127.0.0.1:5000/api/health", timeout=2):
            return True
    except (urllib.error.URLError, TimeoutError):
        return False


def require_file(relative: str) -> Path | None:
    path = ROOT / relative
    if not path.exists():
        FAIL.append(f"missing file: {relative}")
        return None
    return path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--with-tests",
        action="store_true",
        help="also run pytest, the database verifier and the live API smoke test",
    )
    args = parser.parse_args()

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
        if "Demo không có login" in text or "**Chưa có.**" in text:
            FAIL.append("SECURITY.md still claims there is no login/session")
        if "demo role selection" not in text:
            FAIL.append("SECURITY.md does not describe the demo role/session model")

    config = require_file("backend/config.py")
    if config:
        text = config.read_text()
        if "INSECURE_SECRET_KEYS" not in text or "APP_ENV" not in text:
            FAIL.append("backend/config.py is missing the APP_ENV/secret policy")

    session = require_file("backend/session_config.py")
    if session:
        text = session.read_text()
        if "SESSION_COOKIE_SECURE" not in text or "RuntimeError" not in text:
            FAIL.append("backend/session_config.py is missing Secure cookie/fail-fast")

    auth = require_file("backend/api/auth.py")
    if auth:
        text = auth.read_text()
        match = re.search(r'@bp\.get\("/accounts"\)(.*?)(?=\n@bp\.|\Z)', text, re.S)
        block = match.group(1) if match else ""
        if "u.Email" in block or "u.AvatarURL" in block:
            FAIL.append("/api/auth/accounts still selects Email/AvatarURL")

    counts = {}
    for relative in ("README.md", "docs/TESTING.md", "docs/PROJECT_HANDOVER.md"):
        path = ROOT / relative
        if path.exists():
            numbers = set(re.findall(r"(\d+) passed", path.read_text()))
            counts[relative] = sorted(numbers)
    all_counts = {value for values in counts.values() for value in values}
    if len(all_counts) > 1:
        FAIL.append(f"inconsistent pytest counts: {counts}")
    smoke_counts = {}
    for relative in ("README.md", "docs/TESTING.md", "docs/PROJECT_HANDOVER.md"):
        path = ROOT / relative
        if path.exists():
            numbers = set(re.findall(r"(\d+/\d+) PASS", path.read_text()))
            smoke_counts[relative] = sorted(numbers)
    all_smoke = {value for values in smoke_counts.values() for value in values}
    if len(all_smoke) > 1:
        FAIL.append(f"inconsistent smoke counts: {smoke_counts}")

    require_file("docs/FUNCTION_EVIDENCE.md")
    require_file("docs/TRIGGER_DML_MATRIX.md")
    require_file("docs/CRUD_PROCEDURE_TRACE.md")
    require_file("docs/QUERY_PROCEDURE_EVIDENCE.md")
    require_file("docs/SUBMISSION_EVIDENCE.md")
    require_file("docs/FEEDBACK_RESPONSE.md")
    require_file("docs/TEST_RESULTS.md")
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
    if args.with_tests:
        run_command("pytest", ["uv", "run", "pytest", "-q"])
        run_command("database verifier", [sys.executable, "scripts/verify_database.py"])
        if server_is_up():
            run_command("live API smoke", [sys.executable, "scripts/smoke_api.py"])
        else:
            WARN.append("live API smoke skipped: Flask is not running at 127.0.0.1:5000")
        if FAIL:
            print("\nRuntime failures:")
            for item in FAIL:
                print(f"FAIL: {item}")

    print()
    print("Manual items still required:")
    print("- Fill real member names/MSSV in docs/TEAM_ASSIGNMENT.md (P0).")
    print("- Run the clean Windows setup and record results (P1).")
    print("- Record a short demo video of CRUD Ghi danh + Thống kê (P1).")
    return 1 if FAIL else 0


if __name__ == "__main__":
    raise SystemExit(main())
