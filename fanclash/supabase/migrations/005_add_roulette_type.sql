-- Add 'roulette' to widget type constraint
ALTER TABLE widgets DROP CONSTRAINT IF EXISTS widgets_type_check;
ALTER TABLE widgets ADD CONSTRAINT widgets_type_check
  CHECK (type IN ('ranking', 'throne', 'goal', 'affinity', 'battle', 'team_battle', 'alert', 'timer', 'messages', 'roulette'));
