-- ============================================================================
-- INFORM TANZANIA — CONSOLIDATED SUPABASE SETUP  (single source of truth)
-- ============================================================================
-- Run this ONCE in the Supabase SQL Editor on a fresh project.
-- It is idempotent: safe to re-run.
--
-- This file supersedes schema.sql + migrations/001..003 (which had drifted
-- from the shipped frontend code: committees used region_code instead of
-- adm1_code, data_entries forced a NOT NULL indicator_id the app never sends,
-- and RLS assumed Supabase Auth while the app uses app-level (mock) auth with
-- the public anon key). This schema matches what src/services/*Supabase*.js
-- and src/services/excelStorageService.js actually read and write.
--
-- SECURITY NOTE (read me):
--   The frontend talks to Supabase with the PUBLIC anon key and does NOT use
--   Supabase Auth — user identity comes from the app's own authService. So RLS
--   cannot key on auth.uid(). The policies below are intentionally PERMISSIVE
--   (anon may read/write) to make the shared multi-user database work today.
--   This means anyone with the anon key (which ships in the frontend bundle)
--   can write. That is acceptable for a controlled rollout but should be
--   hardened later by migrating to real Supabase Auth and tightening the
--   policies (see "HARDENING" at the bottom).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- shared updated_at trigger function -----------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. admin_units  (regions = level 1, districts = level 2)
--    read by supabaseDataService.getRegions/getDistricts
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_units (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  name_sw     TEXT,
  level       INTEGER NOT NULL CHECK (level IN (1, 2)),
  parent_code TEXT,
  population  INTEGER,
  area_km2    NUMERIC,
  latitude    NUMERIC,
  longitude   NUMERIC,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_units_level  ON admin_units(level);
CREATE INDEX IF NOT EXISTS idx_admin_units_parent ON admin_units(parent_code);

-- ============================================================================
-- 2. committees  (matches committeeSupabaseService — adm1_/adm2_ naming)
-- ============================================================================
CREATE TABLE IF NOT EXISTS committees (
  id             BIGSERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  type           TEXT NOT NULL CHECK (type IN ('regional', 'ward', 'district')),
  adm1_code      TEXT NOT NULL,
  adm1_name      TEXT NOT NULL,
  adm2_code      TEXT,
  adm2_name      TEXT,
  contact_person TEXT,
  contact_phone  TEXT,
  contact_email  TEXT,
  is_active      BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_committees_type   ON committees(type);
CREATE INDEX IF NOT EXISTS idx_committees_adm1   ON committees(adm1_code);
CREATE INDEX IF NOT EXISTS idx_committees_active ON committees(is_active);
-- one regional committee per region — also makes the seed below idempotent
CREATE UNIQUE INDEX IF NOT EXISTS uq_committees_regional_adm1
  ON committees(adm1_code) WHERE type = 'regional';

DROP TRIGGER IF EXISTS committees_updated_at ON committees;
CREATE TRIGGER committees_updated_at BEFORE UPDATE ON committees
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- 3. submissions  (matches supabaseDataService.createSubmission/update)
--    NOTE: no FK to auth.users — submitter identity is stored as name/email
--    text fields supplied by the app's own auth layer.
-- ============================================================================
CREATE TABLE IF NOT EXISTS submissions (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_type        TEXT NOT NULL CHECK (source_type IN ('committee', 'institution', 'regional')),
  source_id          TEXT,
  source_name        TEXT,
  region_code        TEXT,
  district_code      TEXT,
  region_name        TEXT,
  district_name      TEXT,
  indicators         JSONB NOT NULL DEFAULT '{}',
  hazard_score        NUMERIC,
  vulnerability_score NUMERIC,
  coping_score        NUMERIC,
  risk_score          NUMERIC,
  risk_class          TEXT,
  status             TEXT DEFAULT 'pending' CHECK (status IN ('draft','pending','under_review','approved','rejected')),
  submitted_by_name  TEXT,
  submitted_by_email TEXT,
  submitted_at       TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by_name   TEXT,
  reviewed_at        TIMESTAMPTZ,
  review_notes       TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_submissions_status  ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_region  ON submissions(region_code);
CREATE INDEX IF NOT EXISTS idx_submissions_source  ON submissions(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_submissions_sub_at  ON submissions(submitted_at DESC);

DROP TRIGGER IF EXISTS submissions_updated_at ON submissions;
CREATE TRIGGER submissions_updated_at BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- 4. approved_risk_data  (matches supabaseDataService.approveSubmission)
-- ============================================================================
CREATE TABLE IF NOT EXISTS approved_risk_data (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id       UUID REFERENCES submissions(id) ON DELETE SET NULL,
  region_code         TEXT,
  district_code       TEXT,
  region_name         TEXT,
  district_name       TEXT,
  hazard_score        NUMERIC,
  vulnerability_score NUMERIC,
  coping_score        NUMERIC,
  risk_score          NUMERIC,
  risk_class          TEXT,
  dimension_details   JSONB,
  source_type         TEXT,
  source_name         TEXT,
  approved_by_name    TEXT,
  methodology         TEXT DEFAULT 'INFORM 2024',
  approved_at         TIMESTAMPTZ DEFAULT NOW(),
  is_current          BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_approved_region  ON approved_risk_data(region_code);
CREATE INDEX IF NOT EXISTS idx_approved_current ON approved_risk_data(is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_approved_at      ON approved_risk_data(approved_at DESC);

-- ============================================================================
-- 5. data_entries  (matches committeeSupabaseService.submitCommitteeDataEntry)
--    FIX vs migration 002: indicator_id is now NULLABLE with no FK, because the
--    app inserts indicator_CODE (text), not indicator_id. No FK to auth.users.
-- ============================================================================
CREATE TABLE IF NOT EXISTS data_entries (
  id               BIGSERIAL PRIMARY KEY,
  indicator_id     BIGINT,
  indicator_code   TEXT NOT NULL,
  country          TEXT DEFAULT 'Tanzania',
  iso3             TEXT DEFAULT 'TZA',
  adm1_code        TEXT,
  adm1_name        TEXT,
  adm2_code        TEXT,
  adm2_name        TEXT,
  raw_value        REAL NOT NULL,
  normalized_value REAL,
  year             INTEGER NOT NULL,
  quarter          INTEGER CHECK (quarter BETWEEN 1 AND 4),
  data_source      TEXT,
  notes            TEXT,
  entered_by_id    TEXT,
  entered_by       TEXT,
  verified_by_id   TEXT,
  status           TEXT DEFAULT 'submitted' CHECK (status IN ('draft','submitted','verified','rejected')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_data_entries_adm1   ON data_entries(adm1_code);
CREATE INDEX IF NOT EXISTS idx_data_entries_adm2   ON data_entries(adm2_code);
CREATE INDEX IF NOT EXISTS idx_data_entries_status ON data_entries(status);

DROP TRIGGER IF EXISTS data_entries_updated_at ON data_entries;
CREATE TRIGGER data_entries_updated_at BEFORE UPDATE ON data_entries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- 6. ROW LEVEL SECURITY — permissive (anon key, app-level auth). See note above.
-- ============================================================================
ALTER TABLE admin_units        ENABLE ROW LEVEL SECURITY;
ALTER TABLE committees         ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE approved_risk_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_entries       ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['admin_units','committees','submissions','approved_risk_data','data_entries']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "app read"  ON %I;', t);
    EXECUTE format('DROP POLICY IF EXISTS "app write" ON %I;', t);
    EXECUTE format('CREATE POLICY "app read"  ON %I FOR SELECT USING (true);', t);
    EXECUTE format('CREATE POLICY "app write" ON %I FOR ALL USING (true) WITH CHECK (true);', t);
  END LOOP;
END $$;

-- ============================================================================
-- 7. REALTIME — live updates for dashboards/PMO panels
-- ============================================================================
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['submissions','approved_risk_data','data_entries']
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I;', t);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

-- ============================================================================
-- 8. STORAGE — bucket "excel-files" for excelStorageService (public bucket)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('excel-files', 'excel-files', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "excel read"   ON storage.objects;
DROP POLICY IF EXISTS "excel write"  ON storage.objects;
DROP POLICY IF EXISTS "excel modify" ON storage.objects;
DROP POLICY IF EXISTS "excel delete" ON storage.objects;
CREATE POLICY "excel read"   ON storage.objects FOR SELECT USING (bucket_id = 'excel-files');
CREATE POLICY "excel write"  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'excel-files');
CREATE POLICY "excel modify" ON storage.objects FOR UPDATE USING (bucket_id = 'excel-files');
CREATE POLICY "excel delete" ON storage.objects FOR DELETE USING (bucket_id = 'excel-files');

-- ============================================================================
-- 9. SEED — 31 regional disaster committees + 26 mainland regions
-- ============================================================================
INSERT INTO committees (name, type, adm1_code, adm1_name, is_active) VALUES
  ('Dodoma Regional Disaster Committee','regional','TZ01','Dodoma',true),
  ('Arusha Regional Disaster Committee','regional','TZ02','Arusha',true),
  ('Kilimanjaro Regional Disaster Committee','regional','TZ03','Kilimanjaro',true),
  ('Tanga Regional Disaster Committee','regional','TZ04','Tanga',true),
  ('Morogoro Regional Disaster Committee','regional','TZ05','Morogoro',true),
  ('Pwani Regional Disaster Committee','regional','TZ06','Pwani',true),
  ('Dar es Salaam Regional Disaster Committee','regional','TZ07','Dar es Salaam',true),
  ('Lindi Regional Disaster Committee','regional','TZ08','Lindi',true),
  ('Mtwara Regional Disaster Committee','regional','TZ09','Mtwara',true),
  ('Ruvuma Regional Disaster Committee','regional','TZ10','Ruvuma',true),
  ('Iringa Regional Disaster Committee','regional','TZ11','Iringa',true),
  ('Mbeya Regional Disaster Committee','regional','TZ12','Mbeya',true),
  ('Singida Regional Disaster Committee','regional','TZ13','Singida',true),
  ('Tabora Regional Disaster Committee','regional','TZ14','Tabora',true),
  ('Rukwa Regional Disaster Committee','regional','TZ15','Rukwa',true),
  ('Kigoma Regional Disaster Committee','regional','TZ16','Kigoma',true),
  ('Shinyanga Regional Disaster Committee','regional','TZ17','Shinyanga',true),
  ('Kagera Regional Disaster Committee','regional','TZ18','Kagera',true),
  ('Mwanza Regional Disaster Committee','regional','TZ19','Mwanza',true),
  ('Mara Regional Disaster Committee','regional','TZ20','Mara',true),
  ('Manyara Regional Disaster Committee','regional','TZ21','Manyara',true),
  ('Njombe Regional Disaster Committee','regional','TZ22','Njombe',true),
  ('Katavi Regional Disaster Committee','regional','TZ23','Katavi',true),
  ('Simiyu Regional Disaster Committee','regional','TZ24','Simiyu',true),
  ('Geita Regional Disaster Committee','regional','TZ25','Geita',true),
  ('Songwe Regional Disaster Committee','regional','TZ26','Songwe',true),
  ('Kaskazini Unguja Regional Disaster Committee','regional','TZ27','Kaskazini Unguja',true),
  ('Kusini Unguja Regional Disaster Committee','regional','TZ28','Kusini Unguja',true),
  ('Mjini Magharibi Regional Disaster Committee','regional','TZ29','Mjini Magharibi',true),
  ('Kaskazini Pemba Regional Disaster Committee','regional','TZ30','Kaskazini Pemba',true),
  ('Kusini Pemba Regional Disaster Committee','regional','TZ31','Kusini Pemba',true)
ON CONFLICT (adm1_code) WHERE type = 'regional' DO NOTHING;

INSERT INTO admin_units (code, name, name_sw, level, population) VALUES
  ('TZ01','Dodoma','Dodoma',1,2083588),
  ('TZ02','Arusha','Arusha',1,1694310),
  ('TZ03','Kilimanjaro','Kilimanjaro',1,1640087),
  ('TZ04','Tanga','Tanga',1,2045205),
  ('TZ05','Morogoro','Morogoro',1,2218492),
  ('TZ06','Pwani','Pwani',1,1098668),
  ('TZ07','Dar es Salaam','Dar es Salaam',1,4364541),
  ('TZ08','Lindi','Lindi',1,864652),
  ('TZ09','Mtwara','Mtwara',1,1270854),
  ('TZ10','Ruvuma','Ruvuma',1,1376891),
  ('TZ11','Iringa','Iringa',1,941238),
  ('TZ12','Mbeya','Mbeya',1,2707410),
  ('TZ13','Singida','Singida',1,1370637),
  ('TZ14','Tabora','Tabora',1,2291623),
  ('TZ15','Rukwa','Rukwa',1,1004539),
  ('TZ16','Kigoma','Kigoma',1,2127930),
  ('TZ17','Shinyanga','Shinyanga',1,1534808),
  ('TZ18','Kagera','Kagera',1,2458023),
  ('TZ19','Mwanza','Mwanza',1,2772509),
  ('TZ20','Mara','Mara',1,1743830),
  ('TZ21','Manyara','Manyara',1,1425131),
  ('TZ22','Njombe','Njombe',1,702097),
  ('TZ23','Katavi','Katavi',1,564604),
  ('TZ24','Simiyu','Simiyu',1,1584157),
  ('TZ25','Geita','Geita',1,1739530),
  ('TZ26','Songwe','Songwe',1,998862)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- DONE.  Verify:
--   SELECT count(*) FROM committees;   -- expect 31
--   SELECT count(*) FROM admin_units;  -- expect 26
-- ============================================================================
-- HARDENING (later): migrate src/services/authService.js to Supabase Auth,
-- store submitted_by/entered_by_id as auth.uid(), then replace the permissive
-- "app write" policies with role-scoped ones (PMO/admin can approve, committee
-- users can only insert their own rows). Until then keep the anon key out of
-- public repos and rotate it if leaked.
-- ============================================================================
