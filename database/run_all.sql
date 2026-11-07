-- Full clean installation for a disposable/demo database.
-- Run from the repository root:
--   mysql -u root -p < database/run_all.sql
-- This does not DROP the database. Existing constraints/routines must not
-- already exist; use reset_database.sql only for a disposable database.
SOURCE database/00_create_database.sql;
SOURCE database/01_create_tables.sql;
SOURCE database/02_primary_foreign_keys.sql;
SOURCE database/03_constraints.sql;
SOURCE database/04_indexes.sql;
SOURCE database/05_triggers.sql;
SOURCE database/06_procedures.sql;
SOURCE database/07_functions.sql;
SOURCE database/08_seed_data.sql;
SOURCE database/09_verify_database.sql;
