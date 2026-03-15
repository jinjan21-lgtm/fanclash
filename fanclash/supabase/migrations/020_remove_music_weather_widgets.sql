-- Convert existing weather widgets to meter with weather skin
UPDATE widgets SET type = 'meter', config = jsonb_set(COALESCE(config, '{}'), '{skin}', '"weather"') WHERE type = 'weather';

-- Delete music widgets
DELETE FROM widgets WHERE type = 'music';

-- Update the CHECK constraint: remove 'music' and 'weather'
ALTER TABLE widgets DROP CONSTRAINT IF EXISTS widgets_type_check;
ALTER TABLE widgets ADD CONSTRAINT widgets_type_check CHECK (type = ANY (ARRAY[
  'ranking', 'throne', 'goal', 'affinity', 'battle', 'team_battle',
  'alert', 'timer', 'messages', 'roulette',
  'gacha', 'physics', 'territory',
  'train', 'slots', 'meter', 'quiz', 'rpg', 'mission'
]));
