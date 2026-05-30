-- ============================================================================
-- INFORM TANZANIA - SUPABASE DATABASE SCHEMA
-- ============================================================================
-- Run this SQL in Supabase SQL Editor to create all tables
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. USER PROFILES (extends Supabase auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'institution_user' CHECK (role IN ('admin', 'pmo_officer', 'regional_officer', 'institution_user')),
  institution_id TEXT,
  region_code TEXT,
  district_code TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- 2. ADMINISTRATIVE UNITS (Regions & Districts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_sw TEXT, -- Swahili name
  level INTEGER NOT NULL CHECK (level IN (1, 2)), -- 1=Region, 2=District
  parent_code TEXT REFERENCES admin_units(code),
  population INTEGER,
  area_km2 NUMERIC,
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_units ENABLE ROW LEVEL SECURITY;

-- Public read access for admin units
CREATE POLICY "Anyone can view admin units" ON admin_units
  FOR SELECT USING (true);

-- ============================================================================
-- 3. INSTITUTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS institutions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  type TEXT NOT NULL CHECK (type IN ('government', 'ngo', 'research', 'international')),
  category TEXT,
  region_code TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view institutions" ON institutions
  FOR SELECT USING (true);

-- ============================================================================
-- 4. COMMITTEES
-- ============================================================================
CREATE TABLE IF NOT EXISTS committees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ward', 'district', 'regional')),
  region_code TEXT NOT NULL,
  district_code TEXT,
  ward_code TEXT,
  chairperson TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  member_count INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE committees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view committees" ON committees
  FOR SELECT USING (true);

-- ============================================================================
-- 5. INDICATOR DEFINITIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS indicator_definitions (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_sw TEXT,
  dimension TEXT NOT NULL CHECK (dimension IN ('HAZARD', 'VULNERABILITY', 'COPING_CAPACITY')),
  category TEXT NOT NULL,
  aggregation TEXT DEFAULT 'MEAN' CHECK (aggregation IN ('MAX', 'MEAN', 'MIN', 'SUM')),
  polarity TEXT DEFAULT 'NEGATIVE' CHECK (polarity IN ('POSITIVE', 'NEGATIVE')),
  unit TEXT,
  min_value NUMERIC DEFAULT 0,
  max_value NUMERIC DEFAULT 10,
  description TEXT,
  data_source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE indicator_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view indicators" ON indicator_definitions
  FOR SELECT USING (true);

-- ============================================================================
-- 6. SUBMISSIONS (Core data collection)
-- ============================================================================
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Source identification
  source_type TEXT NOT NULL CHECK (source_type IN ('committee', 'institution', 'regional')),
  source_id TEXT NOT NULL, -- committee_id or institution_id
  source_name TEXT,

  -- Geographic reference
  region_code TEXT NOT NULL,
  district_code TEXT,
  ward_code TEXT,
  region_name TEXT,
  district_name TEXT,

  -- Indicator data (JSONB for flexibility)
  indicators JSONB NOT NULL DEFAULT '{}',
  indicator_count INTEGER GENERATED ALWAYS AS (jsonb_object_keys(indicators)::int) STORED,

  -- Calculated scores (system-computed)
  hazard_score NUMERIC,
  vulnerability_score NUMERIC,
  coping_score NUMERIC,
  risk_score NUMERIC,
  risk_class TEXT,

  -- Workflow status
  status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'under_review', 'approved', 'rejected')),

  -- Submission metadata
  submitted_by UUID REFERENCES profiles(id),
  submitted_by_name TEXT,
  submitted_by_email TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),

  -- Review metadata
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_by_name TEXT,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Policies for submissions
CREATE POLICY "Users can view own submissions" ON submissions
  FOR SELECT USING (submitted_by = auth.uid());

CREATE POLICY "Users can create submissions" ON submissions
  FOR INSERT WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "PMO can view all submissions" ON submissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'pmo_officer'))
  );

CREATE POLICY "PMO can update submissions" ON submissions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'pmo_officer'))
  );

-- Index for fast queries
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_region ON submissions(region_code);
CREATE INDEX idx_submissions_source ON submissions(source_type, source_id);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at DESC);

-- ============================================================================
-- 7. APPROVED RISK DATA (Official risk profile)
-- ============================================================================
CREATE TABLE IF NOT EXISTS approved_risk_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID REFERENCES submissions(id),

  -- Geographic reference
  region_code TEXT NOT NULL,
  district_code TEXT,
  region_name TEXT,
  district_name TEXT,

  -- INFORM scores
  hazard_score NUMERIC NOT NULL,
  vulnerability_score NUMERIC NOT NULL,
  coping_score NUMERIC NOT NULL,
  risk_score NUMERIC NOT NULL,
  risk_class TEXT NOT NULL,

  -- Dimension breakdown (JSONB)
  dimension_details JSONB,

  -- Source tracking
  source_type TEXT,
  source_name TEXT,
  methodology TEXT DEFAULT 'INFORM 2024',

  -- Approval metadata
  approved_by UUID REFERENCES profiles(id),
  approved_by_name TEXT,
  approved_at TIMESTAMPTZ DEFAULT NOW(),

  -- Validity period
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  is_current BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE approved_risk_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved data" ON approved_risk_data
  FOR SELECT USING (true);

CREATE POLICY "PMO can insert approved data" ON approved_risk_data
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'pmo_officer'))
  );

-- Index for fast queries
CREATE INDEX idx_approved_risk_region ON approved_risk_data(region_code);
CREATE INDEX idx_approved_risk_current ON approved_risk_data(is_current) WHERE is_current = true;

-- ============================================================================
-- 8. AUDIT LOG
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  user_id UUID REFERENCES profiles(id),
  user_email TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log" ON audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- 9. FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for submissions
CREATE TRIGGER submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Trigger for profiles
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'institution_user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-creating profiles
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 10. SEED DATA - Tanzania Regions
-- ============================================================================
INSERT INTO admin_units (code, name, name_sw, level, population) VALUES
  ('TZ-01', 'Arusha', 'Arusha', 1, 1694310),
  ('TZ-02', 'Dar es Salaam', 'Dar es Salaam', 1, 4364541),
  ('TZ-03', 'Dodoma', 'Dodoma', 1, 2083588),
  ('TZ-04', 'Geita', 'Geita', 1, 1739530),
  ('TZ-05', 'Iringa', 'Iringa', 1, 941238),
  ('TZ-06', 'Kagera', 'Kagera', 1, 2458023),
  ('TZ-07', 'Katavi', 'Katavi', 1, 564604),
  ('TZ-08', 'Kigoma', 'Kigoma', 1, 2127930),
  ('TZ-09', 'Kilimanjaro', 'Kilimanjaro', 1, 1640087),
  ('TZ-10', 'Lindi', 'Lindi', 1, 864652),
  ('TZ-11', 'Manyara', 'Manyara', 1, 1425131),
  ('TZ-12', 'Mara', 'Mara', 1, 1743830),
  ('TZ-13', 'Mbeya', 'Mbeya', 1, 2707410),
  ('TZ-14', 'Morogoro', 'Morogoro', 1, 2218492),
  ('TZ-15', 'Mtwara', 'Mtwara', 1, 1270854),
  ('TZ-16', 'Mwanza', 'Mwanza', 1, 2772509),
  ('TZ-17', 'Njombe', 'Njombe', 1, 702097),
  ('TZ-18', 'Pwani', 'Pwani', 1, 1098668),
  ('TZ-19', 'Rukwa', 'Rukwa', 1, 1004539),
  ('TZ-20', 'Ruvuma', 'Ruvuma', 1, 1376891),
  ('TZ-21', 'Shinyanga', 'Shinyanga', 1, 1534808),
  ('TZ-22', 'Simiyu', 'Simiyu', 1, 1584157),
  ('TZ-23', 'Singida', 'Singida', 1, 1370637),
  ('TZ-24', 'Songwe', 'Songwe', 1, 998862),
  ('TZ-25', 'Tabora', 'Tabora', 1, 2291623),
  ('TZ-26', 'Tanga', 'Tanga', 1, 2045205)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 11. SEED DATA - INFORM Indicators
-- ============================================================================
INSERT INTO indicator_definitions (id, code, name, dimension, category, aggregation, polarity) VALUES
  ('flood_exposure', 'HA.NAT.FL', 'Flood Exposure', 'HAZARD', 'Natural', 'MAX', 'NEGATIVE'),
  ('drought_exposure', 'HA.NAT.DR', 'Drought Exposure', 'HAZARD', 'Natural', 'MAX', 'NEGATIVE'),
  ('earthquake_exposure', 'HA.NAT.EQ', 'Earthquake Exposure', 'HAZARD', 'Natural', 'MAX', 'NEGATIVE'),
  ('conflict_intensity', 'HA.HUM.CI', 'Conflict Intensity', 'HAZARD', 'Human', 'MAX', 'NEGATIVE'),
  ('development_deprivation', 'VU.SEV.DEP', 'Development & Deprivation', 'VULNERABILITY', 'Socio-Economic', 'MEAN', 'NEGATIVE'),
  ('inequality', 'VU.SEV.INE', 'Inequality', 'VULNERABILITY', 'Socio-Economic', 'MEAN', 'NEGATIVE'),
  ('food_security', 'VU.VGR.FS', 'Food Security', 'VULNERABILITY', 'Vulnerable Groups', 'MEAN', 'NEGATIVE'),
  ('health_conditions', 'VU.VGR.HC', 'Health Conditions', 'VULNERABILITY', 'Vulnerable Groups', 'MEAN', 'NEGATIVE'),
  ('drr_capacity', 'CC.INS.DRR', 'DRR Capacity', 'COPING_CAPACITY', 'Institutional', 'MEAN', 'POSITIVE'),
  ('governance', 'CC.INS.GOV', 'Governance', 'COPING_CAPACITY', 'Institutional', 'MEAN', 'POSITIVE'),
  ('communication', 'CC.INF.COM', 'Communication', 'COPING_CAPACITY', 'Infrastructure', 'MEAN', 'POSITIVE'),
  ('physical_infrastructure', 'CC.INF.PHY', 'Physical Infrastructure', 'COPING_CAPACITY', 'Infrastructure', 'MEAN', 'POSITIVE')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 12. REAL-TIME SUBSCRIPTIONS (Enable in Supabase Dashboard)
-- ============================================================================
-- Go to Database > Replication and enable for:
-- - submissions
-- - approved_risk_data
-- - audit_log

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- Next steps:
-- 1. Go to Authentication > Providers and enable Email
-- 2. Go to Database > Replication and enable real-time for tables
-- 3. Create initial admin user through Supabase Auth
-- 4. Update .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
