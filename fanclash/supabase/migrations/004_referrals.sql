-- Referral system: each streamer gets a unique referral code
ALTER TABLE streamers ADD COLUMN referral_code TEXT UNIQUE;
ALTER TABLE streamers ADD COLUMN referred_by UUID REFERENCES streamers(id);

-- Generate referral codes for existing streamers
UPDATE streamers SET referral_code = substr(md5(id::text || created_at::text), 1, 8)
WHERE referral_code IS NULL;

-- Make referral_code NOT NULL after backfill
ALTER TABLE streamers ALTER COLUMN referral_code SET NOT NULL;
ALTER TABLE streamers ALTER COLUMN referral_code SET DEFAULT substr(md5(random()::text), 1, 8);

-- Index for fast lookup by referral code
CREATE INDEX idx_streamers_referral_code ON streamers(referral_code);
