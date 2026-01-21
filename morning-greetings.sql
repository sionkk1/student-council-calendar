CREATE TABLE IF NOT EXISTS morning_greetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekday SMALLINT NOT NULL UNIQUE,
  members TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE morning_greetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read on morning_greetings" ON morning_greetings
  FOR SELECT USING (true);
