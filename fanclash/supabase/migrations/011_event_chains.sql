-- Add event_chains column to streamers table for widget-to-widget event chaining configuration
ALTER TABLE streamers ADD COLUMN IF NOT EXISTS event_chains jsonb DEFAULT '[]';

COMMENT ON COLUMN streamers.event_chains IS 'Widget event chain configuration: [{id, enabled}]';
