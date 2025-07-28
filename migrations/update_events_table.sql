-- Add new columns to the events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS type character varying DEFAULT 'meeting'::character varying;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_time time without time zone;
