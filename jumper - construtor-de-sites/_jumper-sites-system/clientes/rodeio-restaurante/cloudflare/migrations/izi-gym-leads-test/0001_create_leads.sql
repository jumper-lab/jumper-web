CREATE TABLE IF NOT EXISTS izi_gym_leads (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  name TEXT NOT NULL CHECK (length(name) BETWEEN 2 AND 120),
  phone TEXT NOT NULL CHECK (length(phone) BETWEEN 10 AND 15),
  email TEXT NOT NULL CHECK (length(email) BETWEEN 3 AND 254),
  consent_version TEXT NOT NULL,
  consented_at TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  gclid TEXT,
  fbclid TEXT
) STRICT;

CREATE INDEX IF NOT EXISTS idx_izi_gym_leads_created_at
  ON izi_gym_leads (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_izi_gym_leads_email
  ON izi_gym_leads (email);
