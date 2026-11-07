-- HCMUT LMS - BTL2
-- Creates the production database only. It never drops an existing database.
-- Run from the repository root:
--   mysql -u root -p < database/00_create_database.sql

CREATE DATABASE IF NOT EXISTS `hcmut_lms`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE `hcmut_lms`;
