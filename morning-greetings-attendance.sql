CREATE TABLE IF NOT EXISTS morning_greeting_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  name TEXT NOT NULL,
  checked BOOLEAN NOT NULL DEFAULT false,
  status TEXT,
  checked_at TIMESTAMPTZ,
  excused BOOLEAN NOT NULL DEFAULT false,
  excuse_reason TEXT,
  excused_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (date, name)
);

ALTER TABLE morning_greeting_attendance
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS checked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS excused BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS excuse_reason TEXT,
  ADD COLUMN IF NOT EXISTS excused_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS morning_greeting_attendance_date_name_unique
  ON morning_greeting_attendance (date, name);

ALTER TABLE morning_greeting_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read on morning_greeting_attendance" ON morning_greeting_attendance
  FOR SELECT USING (true);
