CREATE TABLE IF NOT EXISTS morning_greeting_skips (
  date DATE PRIMARY KEY,
  reason TEXT NOT NULL DEFAULT '생략',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE morning_greeting_skips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read on morning_greeting_skips"
  ON morning_greeting_skips
  FOR SELECT USING (true);
