-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id                     SERIAL PRIMARY KEY,
  username               VARCHAR(50) UNIQUE NOT NULL,
  password               VARCHAR(255) NOT NULL,
  role                   VARCHAR(20) DEFAULT 'pending',
  approved               BOOLEAN DEFAULT FALSE,
  password_reset_required BOOLEAN DEFAULT FALSE,
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

-- Stations table
CREATE TABLE IF NOT EXISTS stations (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  lat           FLOAT NOT NULL,
  lng           FLOAT NOT NULL,
  water_level   FLOAT,
  rain_level    FLOAT,
  status        VARCHAR(20) DEFAULT 'normal',
  left_bank     FLOAT,
  right_bank    FLOAT,
  bed_data      TEXT,
  warning_level FLOAT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Station readings — TimescaleDB hypertable (time-series)
CREATE TABLE IF NOT EXISTS station_readings (
  time        TIMESTAMPTZ NOT NULL,
  station_id  INTEGER NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  water_level FLOAT,
  rain_level  FLOAT,
  flow_rate   FLOAT
);

SELECT create_hypertable('station_readings', 'time', if_not_exists => TRUE);

-- Continuous aggregate: hourly averages
CREATE MATERIALIZED VIEW IF NOT EXISTS station_readings_hourly
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', time) AS bucket,
  station_id,
  AVG(water_level) AS avg_water,
  AVG(rain_level)  AS avg_rain,
  AVG(flow_rate)   AS avg_flow,
  MAX(water_level) AS max_water
FROM station_readings
GROUP BY bucket, station_id
WITH NO DATA;

-- API Configs (external integrations)
CREATE TABLE IF NOT EXISTS api_configs (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  api_endpoint  VARCHAR(500) NOT NULL,
  api_key       VARCHAR(255),
  send_interval INTEGER DEFAULT 300,
  enabled       BOOLEAN DEFAULT TRUE,
  last_sent     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id        SERIAL PRIMARY KEY,
  user_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action    VARCHAR(100) NOT NULL,
  details   TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_readings_station ON station_readings (station_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON activity_logs (timestamp DESC);

-- Default admin user (password: 123456)
INSERT INTO users (username, password, role, approved) VALUES
  ('admin', '$2b$10$XxZJZJ3RS7tQogKiQm1blexeVd0NpQVyGXToJNLgEj/aE5aMPWefW', 'admin', TRUE)
ON CONFLICT (username) DO NOTHING;

-- Default API configs
INSERT INTO api_configs (name, api_endpoint, api_key, send_interval, enabled) VALUES
  ('กรมชลประทาน API', 'https://api.rid.go.th/api/v1/telemetry', '', 300, TRUE),
  ('ระบบแจ้งเตือนน้ำ', 'https://water-warning.example.com/data', '', 600, FALSE)
ON CONFLICT DO NOTHING;

-- Sample stations
INSERT INTO stations (name, lat, lng, water_level, rain_level, status, left_bank, right_bank, warning_level) VALUES
  ('สถานีวัดน้ำ คลองชัยนาท',   15.185, 100.133, 6.52,  0.0,  'normal',   7.0, 7.2, 7.5),
  ('สถานีวัดน้ำ แม่น้ำยม',     16.820, 100.270, 8.14, 12.6,  'warning',  8.5, 8.7, 8.8),
  ('สถานีวัดน้ำ คลองป่าสัก',   14.800, 100.750, 9.88, 38.2,  'critical', 9.5, 9.7, 9.9),
  ('สถานีวัดน้ำ แม่น้ำบางปะกง',13.810, 101.110, 2.30,  0.0,  'normal',   5.0, 5.2, 5.5),
  ('สถานีวัดน้ำ แม่น้ำกก',     19.908,  99.834, NULL, NULL,  'offline',  6.0, 6.2, 6.5)
ON CONFLICT DO NOTHING;

-- Seed 7 days of hourly readings for station 1 (sample data)
INSERT INTO station_readings (time, station_id, water_level, rain_level, flow_rate)
SELECT
  NOW() - (n || ' hours')::INTERVAL,
  1,
  6.0 + random() * 0.8,
  random() * 5,
  100 + random() * 50
FROM generate_series(0, 168) AS n
ON CONFLICT DO NOTHING;
