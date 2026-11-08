#!/usr/bin/env python3
"""Run the SQL foundation against a disposable MySQL 8 Docker container.

The host does not need a MySQL server. The container is removed on exit unless
--keep is supplied. This is intentionally a development/demo verifier, not a
production migration tool.
"""
from __future__ import annotations

import argparse
import subprocess
import sys
import time
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = "hcmut_lms"
FILES = [
    "database/00_create_database.sql",
    "database/schema/01_tables.sql",
    "database/constraints/02_foreign_keys.sql",
    "database/constraints/03_checks.sql",
    "database/indexes/04_indexes.sql",
    "database/triggers/05_triggers.sql",
    "database/procedures/06_procedures.sql",
    "database/functions/07_functions.sql",
    "database/seeds/00_reset_demo_data.sql",
    "database/seeds/01_users.sql",
    "database/seeds/02_academic.sql",
    "database/seeds/03_course_activity.sql",
    "database/seeds/04_assessments.sql",
    "database/seeds/05_submissions.sql",
]
POSITIVE_TESTS = [
    "database/tests/01_procedure_success.sql",
    "database/tests/05_trigger_derived_submission_count.sql",
    "database/tests/06_function_smoke.sql",
    "database/tests/07_query_procedures.sql",
    "database/tests/10_trigger_dml_matrix.sql",
    "database/tests/12_function_boundary.sql",
]
NEGATIVE_TESTS = [
    "database/tests/02_procedure_expected_fail_duplicate.sql",
    "database/tests/03_procedure_expected_fail_delete_grade.sql",
    "database/tests/04_trigger_expected_fail_schedule.sql",
    "database/tests/08_constraint_expected_fail_email.sql",
    "database/tests/09_grade_expected_fail_score.sql",
    "database/tests/11_trigger_expected_fail_schedule_update.sql",
    "database/tests/13_function_expected_fail_invalid.sql",
]


def run(cmd: list[str], *, stdin_path: Path | None = None, timeout: int = 120,
        check: bool = False) -> subprocess.CompletedProcess[str]:
    stdin = stdin_path.open("rb") if stdin_path else None
    try:
        proc = subprocess.run(
            cmd,
            stdin=stdin,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )
    finally:
        if stdin:
            stdin.close()
    if check and proc.returncode != 0:
        raise RuntimeError(
            f"command failed ({proc.returncode}): {' '.join(cmd)}\n{proc.stderr}"
        )
    return proc


def mysql_args(container: str) -> list[str]:
    return [
        "docker", "exec", "-i", container,
        "mysql", "-uroot", "-proot", "--default-character-set=utf8mb4",
        "-D", DB,
    ]


def mysql_exec(container: str, sql: str, *, timeout: int = 120) -> subprocess.CompletedProcess[str]:
    return run(
        ["docker", "exec", "-i", container, "mysql", "-uroot", "-proot",
         "--default-character-set=utf8mb4", "-D", DB,
         "--skip-column-names", "-e", sql],
        timeout=timeout,
    )


def wait_for_mysql(container: str, timeout: int) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        proc = mysql_exec(container, "SELECT 1;", timeout=10)
        if proc.returncode == 0:
            return
        time.sleep(2)
    raise RuntimeError(f"MySQL did not become ready within {timeout}s")


def print_step(name: str) -> None:
    print(f"[verify] {name}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", default="mysql:8.4")
    parser.add_argument("--timeout", type=int, default=180)
    parser.add_argument("--keep", action="store_true", help="keep the container")
    args = parser.parse_args()

    container = f"hcmut-lms-verify-{uuid.uuid4().hex[:8]}"
    print(f"[verify] starting {args.image} as {container}")
    start = run([
        "docker", "run", "-d", "--name", container,
        "-e", "MYSQL_ROOT_PASSWORD=root",
        "-e", f"MYSQL_DATABASE={DB}",
        args.image,
    ], timeout=180)
    if start.returncode != 0:
        print(start.stderr, file=sys.stderr)
        return 1

    try:
        wait_for_mysql(container, args.timeout)

        for relative in FILES:
            path = ROOT / relative
            print_step(f"load {relative}")
            proc = run(mysql_args(container), stdin_path=path, timeout=args.timeout)
            if proc.returncode != 0:
                print(proc.stdout, file=sys.stderr)
                print(proc.stderr, file=sys.stderr)
                return 1

        for relative in POSITIVE_TESTS:
            print_step(f"run {relative}")
            proc = run(mysql_args(container), stdin_path=ROOT / relative,
                       timeout=args.timeout)
            if proc.returncode != 0:
                print(proc.stdout, file=sys.stderr)
                print(proc.stderr, file=sys.stderr)
                return 1

        for relative in NEGATIVE_TESTS:
            print_step(f"expect failure {relative}")
            proc = run(mysql_args(container), stdin_path=ROOT / relative,
                       timeout=args.timeout)
            if proc.returncode == 0:
                print(f"expected failure but command succeeded: {relative}",
                      file=sys.stderr)
                return 1
            if "ERROR" not in (proc.stderr + proc.stdout):
                print(f"failure had no SQL ERROR text: {relative}", file=sys.stderr)
                return 1

        checks = {
            "table_count": ("SELECT COUNT(*) FROM information_schema.tables "
                            "WHERE table_schema='hcmut_lms' AND table_type='BASE TABLE';", "22"),
            "trigger_count": ("SELECT COUNT(*) FROM information_schema.triggers "
                              "WHERE trigger_schema='hcmut_lms';", "13"),
            "procedure_count": ("SELECT COUNT(*) FROM information_schema.routines "
                                "WHERE routine_schema='hcmut_lms' AND routine_type='PROCEDURE';", "5"),
            "function_count": ("SELECT COUNT(*) FROM information_schema.routines "
                               "WHERE routine_schema='hcmut_lms' AND routine_type='FUNCTION';", "2"),
            "submission_count_mismatches": (
                "SELECT COUNT(*) FROM (SELECT a.AssessmentID FROM Assignment a "
                "LEFT JOIN Submission s ON s.AssignmentID=a.AssessmentID "
                "GROUP BY a.AssessmentID, a.SubmissionCount "
                "HAVING a.SubmissionCount <> COUNT(s.SubmissionID)) x;", "0"),
            "schedule_conflicts": (
                "SELECT COUNT(*) FROM CourseSection a JOIN CourseSection b "
                "ON a.SectionID < b.SectionID AND a.SemesterID=b.SemesterID "
                "AND a.DayOfWeek=b.DayOfWeek AND a.StartTime < b.EndTime "
                "AND b.StartTime < a.EndTime AND "
                "((a.PrimaryInstructorID IS NOT NULL AND "
                "a.PrimaryInstructorID=b.PrimaryInstructorID) OR "
                "a.RoomCode=b.RoomCode);", "0"),
            "completion_rate_assignment_1": (
                "SELECT fn_CalculateAssignmentCompletionRate(1);", "100.00"),
            "completion_rate_assignment_6": (
                "SELECT fn_CalculateAssignmentCompletionRate(6);", "0.00"),
            "average_score_enrollment_1": (
                "SELECT fn_CalculateStudentAverageScore(1);", "82.50"),
        }
        for label, (sql, expected) in checks.items():
            proc = mysql_exec(container, sql, timeout=args.timeout)
            actual = proc.stdout.strip().splitlines()[-1].strip() if proc.stdout.strip() else ""
            if proc.returncode != 0 or actual != expected:
                print(f"[FAIL] {label}: expected {expected!r}, got {actual!r}",
                      file=sys.stderr)
                print(proc.stderr, file=sys.stderr)
                return 1
            print(f"[PASS] {label} = {actual}")

        counts = mysql_exec(
            container,
            "SELECT 'UserAccount',COUNT(*) FROM UserAccount UNION ALL "
            "SELECT 'Student',COUNT(*) FROM Student UNION ALL "
            "SELECT 'Staff',COUNT(*) FROM Staff UNION ALL "
            "SELECT 'Admin',COUNT(*) FROM Admin UNION ALL "
            "SELECT 'Faculty',COUNT(*) FROM Faculty UNION ALL "
            "SELECT 'Semester',COUNT(*) FROM Semester UNION ALL "
            "SELECT 'Course',COUNT(*) FROM Course UNION ALL "
            "SELECT 'CourseComponent',COUNT(*) FROM CourseComponent UNION ALL "
            "SELECT 'CourseSection',COUNT(*) FROM CourseSection UNION ALL "
            "SELECT 'Enrollment',COUNT(*) FROM Enrollment UNION ALL "
            "SELECT 'Announcement',COUNT(*) FROM Announcement UNION ALL "
            "SELECT 'LearningResource',COUNT(*) FROM LearningResource UNION ALL "
            "SELECT 'Section_Resource',COUNT(*) FROM Section_Resource UNION ALL "
            "SELECT 'Assessment',COUNT(*) FROM Assessment UNION ALL "
            "SELECT 'Assignment',COUNT(*) FROM Assignment UNION ALL "
            "SELECT 'AssignmentAttachment',COUNT(*) FROM AssignmentAttachment UNION ALL "
            "SELECT 'Submission',COUNT(*) FROM Submission UNION ALL "
            "SELECT 'SubmissionFile',COUNT(*) FROM SubmissionFile UNION ALL "
            "SELECT 'Quiz',COUNT(*) FROM Quiz UNION ALL "
            "SELECT 'QuizAttempt',COUNT(*) FROM QuizAttempt UNION ALL "
            "SELECT 'Grade',COUNT(*) FROM Grade UNION ALL "
            "SELECT 'Feedback',COUNT(*) FROM Feedback;",
            timeout=args.timeout,
        )
        if counts.returncode != 0:
            print(counts.stderr, file=sys.stderr)
            return 1
        low = []
        for line in counts.stdout.strip().splitlines():
            name, raw = line.split("\t", 1)
            if int(raw) < 5:
                low.append(f"{name}={raw}")
        if low:
            print(f"[FAIL] tables below 5 rows: {', '.join(low)}", file=sys.stderr)
            return 1
        print("[PASS] every one of the 22 tables has at least 5 seed rows")

        print("\nDATABASE VERIFICATION: PASS")
        return 0
    except Exception as exc:  # noqa: BLE001 - CLI reports a concise error
        print(f"\nDATABASE VERIFICATION: FAIL\n{exc}", file=sys.stderr)
        return 1
    finally:
        if args.keep:
            print(f"[verify] keeping container: {container}")
        else:
            run(["docker", "rm", "-f", container], timeout=60)


if __name__ == "__main__":
    raise SystemExit(main())
