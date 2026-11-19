-- PeopleLens: one spelling per place ("Delhi, India" / "delhi" -> "Delhi", etc.).
-- Run once in the Supabase SQL editor. Each line changes only that exact spelling.
-- 19 spellings, 44 videos. Afterwards make one small admin change so cached pages refresh.
BEGIN;
UPDATE "Video" SET "place" = 'Arunachal Pradesh' WHERE "place" = 'Arunachal Pradesh, India'; -- 1 video
UPDATE "Video" SET "place" = 'Bihar' WHERE "place" = 'bihar'; -- 1 video
UPDATE "Video" SET "place" = 'Delhi' WHERE "place" = 'delhi'; -- 4 videos
UPDATE "Video" SET "place" = 'Delhi' WHERE "place" = 'delhi, india'; -- 1 video
UPDATE "Video" SET "place" = 'Delhi' WHERE "place" = 'Delhi, India'; -- 13 videos
UPDATE "Video" SET "place" = 'Delhi, Bihar' WHERE "place" = 'Delhi, India, Bihar'; -- 1 video
UPDATE "Video" SET "place" = 'Delhi' WHERE "place" = 'Delhi,India'; -- 1 video
UPDATE "Video" SET "place" = 'Haryana' WHERE "place" = 'Haryana, India'; -- 1 video
UPDATE "Video" SET "place" = 'India' WHERE "place" = 'india'; -- 1 video
UPDATE "Video" SET "place" = 'Delhi' WHERE "place" = 'india, delhi'; -- 1 video
UPDATE "Video" SET "place" = 'Karnataka' WHERE "place" = 'Karnataka, India'; -- 2 videos
UPDATE "Video" SET "place" = 'Ladakh, Arunachal Pradesh' WHERE "place" = 'Ladakh, Arunachal Pradesh, India'; -- 1 video
UPDATE "Video" SET "place" = 'Maharashtra' WHERE "place" = 'Maharashtra, India'; -- 3 videos
UPDATE "Video" SET "place" = 'Uttar Pradesh' WHERE "place" = 'Uttar Pradesh, India'; -- 4 videos
UPDATE "Video" SET "place" = 'Uttar Pradesh' WHERE "place" = 'uttara pradesh, india'; -- 1 video
UPDATE "Video" SET "place" = 'Uttarakhand' WHERE "place" = 'uttarakhand'; -- 2 videos
UPDATE "Video" SET "place" = 'Uttarakhand' WHERE "place" = 'Uttarakhand, India'; -- 3 videos
UPDATE "Video" SET "place" = 'West Bengal' WHERE "place" = 'west bengal, india'; -- 1 video
UPDATE "Video" SET "place" = 'West Bengal' WHERE "place" = 'West Bengal, India'; -- 2 videos
COMMIT;

-- Check: every spelling now in use, most used first.
SELECT "place", count(*) FROM "Video" WHERE "place" IS NOT NULL GROUP BY "place" ORDER BY count(*) DESC;
