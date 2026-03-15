-- Add broadcast profile columns to streamers table
ALTER TABLE streamers ADD COLUMN IF NOT EXISTS broadcast_style TEXT;
ALTER TABLE streamers ADD COLUMN IF NOT EXISTS broadcast_platforms TEXT[] DEFAULT '{}';
