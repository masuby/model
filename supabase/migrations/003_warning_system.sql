-- ============================================================================
-- MODULE 03: EARLY WARNING SYSTEM TABLES
-- ============================================================================
-- Run this migration in Supabase SQL Editor to create warning system tables

-- Hazard Forecasts Table (Input from TMA, MoW, MoH, MoA, GST)
CREATE TABLE IF NOT EXISTS hazard_forecasts (
    id BIGSERIAL PRIMARY KEY,
    hazard_type TEXT NOT NULL,
    institution TEXT NOT NULL,
    institution_name TEXT,
    intensity_level TEXT NOT NULL CHECK (intensity_level IN ('low', 'moderate', 'high', 'very_high')),
    intensity_value REAL,
    intensity_unit TEXT,
    confidence TEXT DEFAULT 'medium' CHECK (confidence IN ('low', 'medium', 'high')),
    spatial_extent JSONB NOT NULL DEFAULT '[]',
    valid_from TIMESTAMPTZ NOT NULL,
    valid_to TIMESTAMPTZ NOT NULL,
    forecast_day INTEGER NOT NULL CHECK (forecast_day BETWEEN 1 AND 5),
    description TEXT,
    data_source TEXT,
    issued_by_id UUID REFERENCES auth.users(id),
    issued_by_name TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'validated', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Warnings Table (Risk-informed warnings generated from hazard + risk context)
CREATE TABLE IF NOT EXISTS warnings (
    id BIGSERIAL PRIMARY KEY,
    warning_id TEXT UNIQUE NOT NULL,
    hazard_forecast_id BIGINT REFERENCES hazard_forecasts(id),
    hazard_type TEXT NOT NULL,
    adm1_code TEXT NOT NULL,
    adm1_name TEXT NOT NULL,
    adm2_code TEXT,
    adm2_name TEXT,

    -- Hazard component
    hazard_intensity REAL NOT NULL,

    -- Risk context from Module 02
    vulnerability_score REAL NOT NULL,
    coping_capacity_score REAL NOT NULL,
    baseline_risk_score REAL NOT NULL,
    baseline_risk_class TEXT NOT NULL,

    -- Risk-informed warning calculation
    risk_sensitivity REAL NOT NULL,
    warning_score REAL NOT NULL,
    warning_level TEXT NOT NULL CHECK (warning_level IN ('monitor', 'advisory', 'warning', 'major_warning', 'emergency')),
    warning_color TEXT NOT NULL,

    -- Impact assessment
    population_affected BIGINT DEFAULT 0,
    vulnerable_population BIGINT DEFAULT 0,
    infrastructure_at_risk JSONB DEFAULT '{}',

    -- Response information
    recommended_actions JSONB DEFAULT '[]',
    response_level TEXT NOT NULL CHECK (response_level IN ('none', 'preparedness', 'partial', 'full')),

    -- PMO validation
    validated_by_id UUID REFERENCES auth.users(id),
    validated_by_name TEXT,
    validation_notes TEXT,
    validated_at TIMESTAMPTZ,

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'disseminated', 'rejected', 'expired')),
    disseminated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Warning Disseminations Table (Track message distribution)
CREATE TABLE IF NOT EXISTS warning_disseminations (
    id BIGSERIAL PRIMARY KEY,
    warning_id BIGINT REFERENCES warnings(id),
    audience TEXT NOT NULL,
    channel TEXT NOT NULL,
    message TEXT NOT NULL,
    recipients JSONB DEFAULT '[]',
    sent_at TIMESTAMPTZ,
    delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Warning Feedback Table (For learning and threshold calibration)
CREATE TABLE IF NOT EXISTS warning_feedback (
    id BIGSERIAL PRIMARY KEY,
    warning_id BIGINT REFERENCES warnings(id),
    actual_impacts JSONB,
    population_actual BIGINT,
    casualties_actual BIGINT,
    economic_loss_actual REAL,
    response_time_hours REAL,
    warning_effectiveness TEXT CHECK (warning_effectiveness IN ('poor', 'adequate', 'good', 'excellent')),
    lessons_learned TEXT,
    threshold_adjustments JSONB,
    submitted_by_id UUID REFERENCES auth.users(id),
    submitted_by_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_hazard_forecasts_institution ON hazard_forecasts(institution);
CREATE INDEX IF NOT EXISTS idx_hazard_forecasts_type ON hazard_forecasts(hazard_type);
CREATE INDEX IF NOT EXISTS idx_hazard_forecasts_day ON hazard_forecasts(forecast_day);
CREATE INDEX IF NOT EXISTS idx_hazard_forecasts_status ON hazard_forecasts(status);
CREATE INDEX IF NOT EXISTS idx_hazard_forecasts_valid ON hazard_forecasts(valid_from, valid_to);

CREATE INDEX IF NOT EXISTS idx_warnings_level ON warnings(warning_level);
CREATE INDEX IF NOT EXISTS idx_warnings_status ON warnings(status);
CREATE INDEX IF NOT EXISTS idx_warnings_location ON warnings(adm1_code, adm2_code);
CREATE INDEX IF NOT EXISTS idx_warnings_expires ON warnings(expires_at);
CREATE INDEX IF NOT EXISTS idx_warnings_score ON warnings(warning_score DESC);

CREATE INDEX IF NOT EXISTS idx_disseminations_warning ON warning_disseminations(warning_id);
CREATE INDEX IF NOT EXISTS idx_disseminations_status ON warning_disseminations(delivery_status);

CREATE INDEX IF NOT EXISTS idx_feedback_warning ON warning_feedback(warning_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE hazard_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE warning_disseminations ENABLE ROW LEVEL SECURITY;
ALTER TABLE warning_feedback ENABLE ROW LEVEL SECURITY;

-- Hazard Forecasts policies
-- Authenticated users can read all forecasts
CREATE POLICY "Authenticated users can view hazard forecasts"
    ON hazard_forecasts FOR SELECT
    TO authenticated
    USING (true);

-- Institution users can create forecasts
CREATE POLICY "Institution users can create hazard forecasts"
    ON hazard_forecasts FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Creators can update their own forecasts
CREATE POLICY "Users can update their own hazard forecasts"
    ON hazard_forecasts FOR UPDATE
    TO authenticated
    USING (issued_by_id = auth.uid());

-- Warnings policies
-- Everyone can view validated/disseminated warnings
CREATE POLICY "Anyone can view active warnings"
    ON warnings FOR SELECT
    TO authenticated
    USING (true);

-- System can create warnings
CREATE POLICY "System can create warnings"
    ON warnings FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- PMO users can update warnings (validate/disseminate)
CREATE POLICY "PMO can update warnings"
    ON warnings FOR UPDATE
    TO authenticated
    USING (true);

-- Disseminations policies
CREATE POLICY "Authenticated users can view disseminations"
    ON warning_disseminations FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "System can create disseminations"
    ON warning_disseminations FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Feedback policies
CREATE POLICY "Authenticated users can view feedback"
    ON warning_feedback FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can submit feedback"
    ON warning_feedback FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ============================================================================
-- REALTIME SUBSCRIPTIONS
-- ============================================================================

-- Enable realtime for warnings table
ALTER PUBLICATION supabase_realtime ADD TABLE warnings;
ALTER PUBLICATION supabase_realtime ADD TABLE hazard_forecasts;

-- ============================================================================
-- TRIGGER FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to hazard_forecasts
DROP TRIGGER IF EXISTS update_hazard_forecasts_updated_at ON hazard_forecasts;
CREATE TRIGGER update_hazard_forecasts_updated_at
    BEFORE UPDATE ON hazard_forecasts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to warnings
DROP TRIGGER IF EXISTS update_warnings_updated_at ON warnings;
CREATE TRIGGER update_warnings_updated_at
    BEFORE UPDATE ON warnings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert sample hazard forecast (commented out for production)
/*
INSERT INTO hazard_forecasts (hazard_type, institution, institution_name, intensity_level, intensity_value, intensity_unit, confidence, spatial_extent, valid_from, valid_to, forecast_day, description, data_source, status)
VALUES
    ('flood', 'TMA', 'Tanzania Meteorological Authority', 'high', 150, 'mm', 'high', '["Dar es Salaam", "Pwani", "Morogoro"]', NOW(), NOW() + INTERVAL '24 hours', 1, 'Heavy rainfall expected to cause flooding in coastal regions', 'TMA Weather Forecast', 'submitted'),
    ('drought', 'TMA', 'Tanzania Meteorological Authority', 'moderate', 0, 'mm', 'medium', '["Dodoma", "Singida"]', NOW(), NOW() + INTERVAL '72 hours', 3, 'Extended dry spell expected in central regions', 'TMA Seasonal Forecast', 'submitted');
*/

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify tables created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('hazard_forecasts', 'warnings', 'warning_disseminations', 'warning_feedback');
