# Database test scripts

Run these against a disposable `hcmut_lms` database after `database/08_seed_data.sql`.
The machine-readable runner is `scripts/verify_database.py`; it starts an isolated
MySQL 8 Docker container, loads the schema and seed, and treats the files whose
names contain `expected_fail` as negative tests (they must return a non-zero exit).

| File | Type | Expected result |
|---|---|---|
| 01_procedure_success.sql | CRUD success | Inserts, updates, and deletes a temporary enrollment |
| 02_procedure_expected_fail_duplicate.sql | Negative | Error: duplicate enrollment |
| 03_procedure_expected_fail_delete_grade.sql | Negative | Error: cannot delete enrollment with a grade |
| 04_trigger_expected_fail_schedule.sql | Negative | Error: instructor/room schedule conflict |
| 05_trigger_derived_submission_count.sql | Trigger | SubmissionCount changes 0 -> 1 -> 0 |
| 06_function_smoke.sql | Function | Completion rate and average score are returned |
| 07_query_procedures.sql | Query procedures | Enrollment list and assignment statistics are returned |
| 08_constraint_expected_fail_email.sql | Negative | CHECK constraint rejects an invalid email |
| 09_grade_expected_fail_score.sql | Negative | Trigger rejects a score above MaxScore |

The test scripts are intentionally explicit SQL so they can also be pasted into
MySQL Workbench for the demo. Negative tests are expected to abort with SQLSTATE
`45000` and a specific Vietnamese/ASCII message.
