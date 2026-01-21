CREATE TABLE IF NOT EXISTS morning_greeting_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  name TEXT NOT NULL,
  checked BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (date, name)
);

ALTER TABLE morning_greeting_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read on morning_greeting_attendance" ON morning_greeting_attendance
  FOR SELECT USING (true);
