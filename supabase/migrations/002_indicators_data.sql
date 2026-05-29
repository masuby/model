-- ============================================================================
-- MODULE 02: INDICATORS AND DATA ENTRY TABLES
-- ============================================================================
-- Run this migration in Supabase SQL Editor to create indicator and data tables

-- Indicators Table (INFORM indicator definitions)
CREATE TABLE IF NOT EXISTS indicators (
    id BIGSERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    dimension TEXT NOT NULL CHECK (dimension IN ('HAZARD', 'VULNERABILITY', 'COPING_CAPACITY')),
    category TEXT NOT NULL,
    component TEXT,
    unit TEXT,
    data_type TEXT DEFAULT 'numeric' CHECK (data_type IN ('numeric', 'percentage', 'index', 'count', 'binary')),
    min_value REAL DEFAULT 0,
    max_value REAL DEFAULT 10,
    resolution TEXT DEFAULT 'adm1' CHECK (resolution IN ('national', 'adm1', 'adm2')),
    transformation TEXT DEFAULT 'none' CHECK (transformation IN ('none', 'log', 'sqrt')),
    invert_scale BOOLEAN DEFAULT false,
    weight REAL DEFAULT 1.0,
    data_source TEXT,
    update_frequency TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data Entries Table (Raw indicator data)
CREATE TABLE IF NOT EXISTS data_entries (
    id BIGSERIAL PRIMARY KEY,
    indicator_id BIGINT NOT NULL REFERENCES indicators(id),
    indicator_code TEXT NOT NULL,
    country TEXT DEFAULT 'Tanzania',
    iso3 TEXT DEFAULT 'TZA',
    adm1_code TEXT,
    adm1_name TEXT,
    adm2_code TEXT,
    adm2_name TEXT,
    raw_value REAL NOT NULL,
    normalized_value REAL,
    year INTEGER NOT NULL,
    quarter INTEGER CHECK (quarter BETWEEN 1 AND 4),
    data_source TEXT,
    notes TEXT,
    entered_by_id UUID REFERENCES auth.users(id),
    entered_by TEXT,
    verified_by_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'verified', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk Scores Table (Calculated INFORM risk scores)
CREATE TABLE IF NOT EXISTS risk_scores (
    id BIGSERIAL PRIMARY KEY,
    country TEXT DEFAULT 'Tanzania',
    iso3 TEXT DEFAULT 'TZA',
    adm1_code TEXT,
    adm1_name TEXT,
    adm2_code TEXT,
    adm2_name TEXT,
    resolution TEXT NOT NULL CHECK (resolution IN ('national', 'adm1', 'adm2')),
    year INTEGER NOT NULL,

    -- Hazard Dimension
    hazard_natural REAL DEFAULT 0,
    hazard_human REAL DEFAULT 0,
    hazard_total REAL DEFAULT 0,

    -- Vulnerability Dimension
    vulnerability_socio_econ REAL DEFAULT 0,
    vulnerability_vuln_group REAL DEFAULT 0,
    vulnerability_total REAL DEFAULT 0,

    -- Coping Capacity Dimension
    coping_infrastructure REAL DEFAULT 0,
    coping_institutional REAL DEFAULT 0,
    lack_of_coping_capacity REAL DEFAULT 0,

    -- Final INFORM Risk Score
    risk_score REAL DEFAULT 0,
    risk_class TEXT CHECK (risk_class IN ('Very Low', 'Low', 'Medium', 'High', 'Very High')),

    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(adm1_code, adm2_code, year, resolution)
);

-- Audit Log Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT,
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'verify', 'approve', 'reject')),
    entity_type TEXT NOT NULL,
    entity_id BIGINT,
    old_value JSONB,
    new_value JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_indicators_dimension ON indicators(dimension);
CREATE INDEX IF NOT EXISTS idx_indicators_category ON indicators(category);
CREATE INDEX IF NOT EXISTS idx_indicators_code ON indicators(code);
CREATE INDEX IF NOT EXISTS idx_indicators_active ON indicators(is_active);

CREATE INDEX IF NOT EXISTS idx_data_entries_indicator ON data_entries(indicator_id);
CREATE INDEX IF NOT EXISTS idx_data_entries_location ON data_entries(adm1_code, adm2_code);
CREATE INDEX IF NOT EXISTS idx_data_entries_year ON data_entries(year);
CREATE INDEX IF NOT EXISTS idx_data_entries_status ON data_entries(status);

CREATE INDEX IF NOT EXISTS idx_risk_scores_location ON risk_scores(adm1_code, adm2_code);
CREATE INDEX IF NOT EXISTS idx_risk_scores_year ON risk_scores(year);
CREATE INDEX IF NOT EXISTS idx_risk_scores_resolution ON risk_scores(resolution);
CREATE INDEX IF NOT EXISTS idx_risk_scores_class ON risk_scores(risk_class);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Indicators: Everyone can view
CREATE POLICY "Anyone can view indicators"
    ON indicators FOR SELECT
    TO authenticated
    USING (true);

-- Indicators: Only admins can manage
CREATE POLICY "Admins can manage indicators"
    ON indicators FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- Data Entries: Authenticated users can view
CREATE POLICY "Authenticated users can view data entries"
    ON data_entries FOR SELECT
    TO authenticated
    USING (true);

-- Data Entries: Users can create
CREATE POLICY "Authenticated users can create data entries"
    ON data_entries FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Data Entries: Users can update their own entries or admins can update any
CREATE POLICY "Users can update own entries"
    ON data_entries FOR UPDATE
    TO authenticated
    USING (
        entered_by_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role IN ('admin', 'regional_committee')
        )
    );

-- Risk Scores: Everyone can view
CREATE POLICY "Anyone can view risk scores"
    ON risk_scores FOR SELECT
    TO authenticated
    USING (true);

-- Risk Scores: System can manage
CREATE POLICY "System can manage risk scores"
    ON risk_scores FOR ALL
    TO authenticated
    USING (true);

-- Audit Logs: Admins can view
CREATE POLICY "Admins can view audit logs"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- Audit Logs: System can create
CREATE POLICY "System can create audit logs"
    ON audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ============================================================================
-- REALTIME SUBSCRIPTIONS
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE data_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE risk_scores;

-- ============================================================================
-- TRIGGER FOR UPDATED_AT
-- ============================================================================

DROP TRIGGER IF EXISTS update_indicators_updated_at ON indicators;
CREATE TRIGGER update_indicators_updated_at
    BEFORE UPDATE ON indicators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_data_entries_updated_at ON data_entries;
CREATE TRIGGER update_data_entries_updated_at
    BEFORE UPDATE ON data_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_risk_scores_updated_at ON risk_scores;
CREATE TRIGGER update_risk_scores_updated_at
    BEFORE UPDATE ON risk_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA: INFORM INDICATORS
-- ============================================================================

INSERT INTO indicators (code, name, description, dimension, category, component, unit, data_type, min_value, max_value, weight, data_source) VALUES
    -- HAZARD - Natural
    ('HA.NAT.FL', 'Flood Risk', 'Flood frequency and probability', 'HAZARD', 'Natural', 'Flood', 'index', 'index', 0, 10, 1.0, 'TMA/TANROADS'),
    ('HA.NAT.DR', 'Drought Risk', 'Drought frequency and severity', 'HAZARD', 'Natural', 'Drought', 'index', 'index', 0, 10, 1.0, 'TMA'),
    ('HA.NAT.TC', 'Tropical Cyclone Risk', 'Cyclone exposure and frequency', 'HAZARD', 'Natural', 'Cyclone', 'index', 'index', 0, 10, 0.8, 'TMA'),
    ('HA.NAT.EQ', 'Earthquake Risk', 'Seismic hazard exposure', 'HAZARD', 'Natural', 'Earthquake', 'index', 'index', 0, 10, 0.6, 'GST'),
    ('HA.NAT.EP', 'Epidemic Risk', 'Disease outbreak probability', 'HAZARD', 'Natural', 'Epidemic', 'index', 'index', 0, 10, 1.0, 'MoH'),

    -- HAZARD - Human
    ('HA.HUM.CF', 'Conflict Intensity', 'Current conflict intensity', 'HAZARD', 'Human', 'Conflict', 'index', 'index', 0, 10, 1.0, 'Security Reports'),
    ('HA.HUM.PR', 'Projected Conflict Risk', 'Projected conflict risk', 'HAZARD', 'Human', 'Conflict', 'index', 'index', 0, 10, 0.8, 'Security Analysis'),

    -- VULNERABILITY - Socio-Economic
    ('VU.SEV.DEV', 'Development Index', 'Human development deprivation', 'VULNERABILITY', 'Socio-Economic', 'Development', 'index', 'index', 0, 10, 1.0, 'NBS'),
    ('VU.SEV.INE', 'Inequality', 'Income/wealth inequality (Gini)', 'VULNERABILITY', 'Socio-Economic', 'Inequality', 'index', 'index', 0, 10, 0.8, 'NBS'),
    ('VU.SEV.POV', 'Poverty Rate', 'Population below poverty line', 'VULNERABILITY', 'Socio-Economic', 'Poverty', 'percentage', 'percentage', 0, 100, 1.0, 'NBS'),

    -- VULNERABILITY - Vulnerable Groups
    ('VU.VGR.UPR', 'Uprooted People', 'Refugees and IDPs', 'VULNERABILITY', 'Vulnerable Groups', 'Displaced', 'count', 'count', 0, 1000000, 1.0, 'UNHCR/IOM'),
    ('VU.VGR.OTH', 'Other Vulnerable Groups', 'Children, elderly, disabled', 'VULNERABILITY', 'Vulnerable Groups', 'Demographics', 'percentage', 'percentage', 0, 100, 0.8, 'NBS'),

    -- COPING CAPACITY - Infrastructure
    ('CC.INF.PHY', 'Physical Infrastructure', 'Roads, hospitals, schools access', 'COPING_CAPACITY', 'Infrastructure', 'Physical', 'index', 'index', 0, 10, 1.0, 'NBS/Sectoral'),
    ('CC.INF.COM', 'Communication', 'Phone and internet access', 'COPING_CAPACITY', 'Infrastructure', 'Communication', 'percentage', 'percentage', 0, 100, 0.8, 'TCRA'),
    ('CC.INF.ACC', 'Access to Healthcare', 'Healthcare facility access', 'COPING_CAPACITY', 'Infrastructure', 'Healthcare', 'percentage', 'percentage', 0, 100, 1.0, 'MoH'),

    -- COPING CAPACITY - Institutional
    ('CC.INS.DRR', 'DRR Capacity', 'Disaster risk reduction capacity', 'COPING_CAPACITY', 'Institutional', 'DRR', 'index', 'index', 0, 10, 1.0, 'PMO-DMD'),
    ('CC.INS.GOV', 'Governance', 'Government effectiveness', 'COPING_CAPACITY', 'Institutional', 'Governance', 'index', 'index', 0, 10, 0.8, 'WGI')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'Indicators created: ' || COUNT(*) FROM indicators;
