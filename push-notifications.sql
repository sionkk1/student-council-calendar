-- Push subscription storage
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT UNIQUE NOT NULL,
  subscription JSONB NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Notification log to avoid duplicate sends
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  event_id UUID,
  announcement_id UUID,
  scheduled_for DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_event_once
  ON notification_log(type, event_id, scheduled_for);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_announcement_once
  ON notification_log(type, announcement_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on push_subscriptions" ON push_subscriptions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on notification_log" ON notification_log
  FOR ALL USING (true) WITH CHECK (true);
