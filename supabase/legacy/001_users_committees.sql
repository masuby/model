-- ============================================================================
-- MODULE 01: USERS AND COMMITTEES TABLES
-- ============================================================================
-- Run this migration in Supabase SQL Editor to create user and committee tables

-- Committees Table (Regional and Ward Disaster Committees)
CREATE TABLE IF NOT EXISTS committees (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('regional', 'ward')),
    adm1_code TEXT NOT NULL,
    adm1_name TEXT NOT NULL,
    adm2_code TEXT,
    adm2_name TEXT,
    contact_person TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'regional_committee', 'ward_committee', 'institution', 'viewer')),
    institution TEXT,
    committee_id BIGINT REFERENCES committees(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_committees_type ON committees(type);
CREATE INDEX IF NOT EXISTS idx_committees_adm1 ON committees(adm1_code);
CREATE INDEX IF NOT EXISTS idx_committees_active ON committees(is_active);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_committee ON user_profiles(committee_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_institution ON user_profiles(institution);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Committees: Everyone can view active committees
CREATE POLICY "Anyone can view active committees"
    ON committees FOR SELECT
    USING (is_active = true);

-- Committees: Only admins can create/update
CREATE POLICY "Admins can manage committees"
    ON committees FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- User Profiles: Users can view all profiles
CREATE POLICY "Authenticated users can view profiles"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (true);

-- User Profiles: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid());

-- ============================================================================
-- TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_committees_updated_at ON committees;
CREATE TRIGGER update_committees_updated_at
    BEFORE UPDATE ON committees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA: ALL 31 TANZANIA REGIONS
-- ============================================================================

INSERT INTO committees (name, type, adm1_code, adm1_name, is_active) VALUES
    -- Mainland regions (26)
    ('Dodoma Regional Disaster Committee', 'regional', 'TZ01', 'Dodoma', true),
    ('Arusha Regional Disaster Committee', 'regional', 'TZ02', 'Arusha', true),
    ('Kilimanjaro Regional Disaster Committee', 'regional', 'TZ03', 'Kilimanjaro', true),
    ('Tanga Regional Disaster Committee', 'regional', 'TZ04', 'Tanga', true),
    ('Morogoro Regional Disaster Committee', 'regional', 'TZ05', 'Morogoro', true),
    ('Pwani Regional Disaster Committee', 'regional', 'TZ06', 'Pwani', true),
    ('Dar es Salaam Regional Disaster Committee', 'regional', 'TZ07', 'Dar es Salaam', true),
    ('Lindi Regional Disaster Committee', 'regional', 'TZ08', 'Lindi', true),
    ('Mtwara Regional Disaster Committee', 'regional', 'TZ09', 'Mtwara', true),
    ('Ruvuma Regional Disaster Committee', 'regional', 'TZ10', 'Ruvuma', true),
    ('Iringa Regional Disaster Committee', 'regional', 'TZ11', 'Iringa', true),
    ('Mbeya Regional Disaster Committee', 'regional', 'TZ12', 'Mbeya', true),
    ('Singida Regional Disaster Committee', 'regional', 'TZ13', 'Singida', true),
    ('Tabora Regional Disaster Committee', 'regional', 'TZ14', 'Tabora', true),
    ('Rukwa Regional Disaster Committee', 'regional', 'TZ15', 'Rukwa', true),
    ('Kigoma Regional Disaster Committee', 'regional', 'TZ16', 'Kigoma', true),
    ('Shinyanga Regional Disaster Committee', 'regional', 'TZ17', 'Shinyanga', true),
    ('Kagera Regional Disaster Committee', 'regional', 'TZ18', 'Kagera', true),
    ('Mwanza Regional Disaster Committee', 'regional', 'TZ19', 'Mwanza', true),
    ('Mara Regional Disaster Committee', 'regional', 'TZ20', 'Mara', true),
    ('Manyara Regional Disaster Committee', 'regional', 'TZ21', 'Manyara', true),
    ('Njombe Regional Disaster Committee', 'regional', 'TZ22', 'Njombe', true),
    ('Katavi Regional Disaster Committee', 'regional', 'TZ23', 'Katavi', true),
    ('Simiyu Regional Disaster Committee', 'regional', 'TZ24', 'Simiyu', true),
    ('Geita Regional Disaster Committee', 'regional', 'TZ25', 'Geita', true),
    ('Songwe Regional Disaster Committee', 'regional', 'TZ26', 'Songwe', true),
    -- Zanzibar regions (5)
    ('Kaskazini Unguja Regional Disaster Committee', 'regional', 'TZ27', 'Kaskazini Unguja', true),
    ('Kusini Unguja Regional Disaster Committee', 'regional', 'TZ28', 'Kusini Unguja', true),
    ('Mjini Magharibi Regional Disaster Committee', 'regional', 'TZ29', 'Mjini Magharibi', true),
    ('Kaskazini Pemba Regional Disaster Committee', 'regional', 'TZ30', 'Kaskazini Pemba', true),
    ('Kusini Pemba Regional Disaster Committee', 'regional', 'TZ31', 'Kusini Pemba', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'Committees created: ' || COUNT(*) FROM committees;
