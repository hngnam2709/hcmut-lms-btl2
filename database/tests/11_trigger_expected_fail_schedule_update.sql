USE `hcmut_lms`;

-- BTL2 2.2.1: UPDATE on CourseSection must be checked for schedule
-- conflicts, not only INSERT. Section 3 already uses room A102 on day 3
-- from 09:30 to 11:00, so this UPDATE must be rejected.
UPDATE `CourseSection`
   SET `DayOfWeek` = 3,
       `StartTime` = '09:30:00',
       `EndTime` = '11:00:00',
       `RoomCode` = 'A102'
 WHERE `SectionID` = 1;
