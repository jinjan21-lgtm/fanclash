-- Discord webhook integration
ALTER TABLE streamers ADD COLUMN IF NOT EXISTS discord_webhook_url text;
ALTER TABLE streamers ADD COLUMN IF NOT EXISTS discord_config jsonb DEFAULT '{"donations": true, "battles": true, "missions": true, "achievements": true}';
