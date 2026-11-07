-- DEMO DATA ONLY. This wrapper resets the demo rows first.
-- Run from the repository root:
--   mysql -u root -p < database/08_seed_data.sql
SOURCE database/seeds/00_reset_demo_data.sql;
SOURCE database/seeds/01_users.sql;
SOURCE database/seeds/02_academic.sql;
SOURCE database/seeds/03_course_activity.sql;
SOURCE database/seeds/04_assessments.sql;
SOURCE database/seeds/05_submissions.sql;
