USE `hcmut_lms`;
-- EXPECTED FAILURE: CHECK ck_user_email rejects this email.
INSERT INTO `UserAccount`
  (`Email`, `FullName`, `AvatarURL`, `AccountStatus`)
VALUES
  ('not-an-email', 'Invalid User', '/assets/avatars/invalid.svg', 'ACTIVE');
