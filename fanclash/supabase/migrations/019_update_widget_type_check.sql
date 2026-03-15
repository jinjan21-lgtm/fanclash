-- Update widget type CHECK constraint to include all 21 widget types
ALTER TABLE widgets DROP CONSTRAINT IF EXISTS widgets_type_check;
ALTER TABLE widgets ADD CONSTRAINT widgets_type_check CHECK (type = ANY (ARRAY[
  'ranking', 'throne', 'goal', 'affinity', 'battle', 'team_battle',
  'alert', 'timer', 'messages', 'roulette',
  'music', 'gacha', 'physics', 'territory', 'weather',
  'train', 'slots', 'meter', 'quiz', 'rpg', 'mission'
]));
