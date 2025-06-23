-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'export', 'gdpr_request');

-- Users table with GDPR compliance
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE,
    role user_role DEFAULT 'user',
    
    -- GDPR compliance fields
    consent_given_at TIMESTAMPTZ,
    consent_version INTEGER DEFAULT 1,
    data_retention_until TIMESTAMPTZ,
    gdpr_delete_requested_at TIMESTAMPTZ,
    
    -- Access code authentication (Phase 2 requirement)
    access_code_hash TEXT,
    access_code_salt TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    
    -- Soft delete pattern for GDPR
    deleted_at TIMESTAMPTZ
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Households table for tax filing units
CREATE TABLE households (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    filing_year INTEGER NOT NULL,
    
    -- Primary user (required)
    primary_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Partner user (optional for joint filing)
    partner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Household metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT valid_filing_year CHECK (filing_year >= 2020 AND filing_year <= 2030),
    CONSTRAINT different_users CHECK (primary_user_id != partner_user_id)
);

-- Enable RLS on households table
ALTER TABLE households ENABLE ROW LEVEL SECURITY;

-- Questions table for dynamic tax questionnaire
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    text_nl TEXT NOT NULL,
    text_en TEXT,
    help_markdown TEXT,
    
    -- Question configuration
    question_type TEXT NOT NULL DEFAULT 'text', -- text, number, boolean, select, multiselect
    options JSONB, -- For select/multiselect questions
    validation_rules JSONB, -- Zod-compatible validation rules
    
    -- Conditional logic
    display_conditions JSONB, -- When to show this question
    
    -- Ordering and grouping
    category TEXT NOT NULL DEFAULT 'general',
    sort_order INTEGER DEFAULT 0,
    
    -- Lifecycle
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Answers table with encrypted values
CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    
    -- Encrypted answer value
    value_encrypted TEXT, -- pgcrypto encrypted JSONB
    value_hash TEXT, -- For searching without decryption
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, question_id, household_id)
);

-- Enable RLS on answers table
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Tax scenarios table
CREATE TABLE scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    description TEXT,
    
    -- Scenario configuration
    scenario_type TEXT DEFAULT 'optimization', -- baseline, optimization, aggressive
    parameters JSONB,
    
    -- Results (encrypted)
    results_encrypted TEXT, -- pgcrypto encrypted calculation results
    
    -- AI analysis
    ai_analysis TEXT,
    ai_confidence DECIMAL(3,2), -- 0.00 to 1.00
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Enable RLS on scenarios table
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

-- Document embeddings for RAG pipeline
CREATE TABLE public_docs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    content_hash TEXT UNIQUE NOT NULL, -- Prevent duplicates
    
    -- Vector embedding for similarity search
    embedding VECTOR(1536), -- OpenAI ada-002 dimensions
    
    -- Document metadata
    source TEXT DEFAULT 'belastingdienst.nl',
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    -- Content categorization
    doc_type TEXT DEFAULT 'general', -- tax_guide, regulation, form, faq
    tax_year INTEGER,
    
    -- Search optimization
    is_active BOOLEAN DEFAULT true
);

-- Create index for vector similarity search
CREATE INDEX ON public_docs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Audit logs table for GDPR compliance
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Audit details
    action audit_action NOT NULL,
    resource_type TEXT, -- 'user', 'household', 'answer', etc.
    resource_id UUID,
    
    -- Change tracking
    old_values JSONB,
    new_values JSONB,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- GDPR compliance: auto-delete after 90 days
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days')
);

-- Create index for efficient audit log queries
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Backup metadata table
CREATE TABLE backup_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_type TEXT NOT NULL, -- 'daily', 'weekly', 'manual', 'gdpr_export'
    
    -- Backup details
    file_path TEXT,
    file_size_bytes BIGINT,
    checksum TEXT,
    
    -- GitHub integration
    github_url TEXT,
    github_commit_sha TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    -- Status
    status TEXT DEFAULT 'pending', -- pending, completed, failed
    error_message TEXT
);

-- Functions for GDPR compliance

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_data(data TEXT, key_id TEXT DEFAULT 'belastactic-key')
RETURNS TEXT AS $$
BEGIN
    RETURN encode(pgp_sym_encrypt(data, key_id), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt sensitive data
CREATE OR REPLACE FUNCTION decrypt_data(encrypted_data TEXT, key_id TEXT DEFAULT 'belastactic-key')
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(decode(encrypted_data, 'base64'), key_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION create_audit_log(
    p_user_id UUID,
    p_action audit_action,
    p_resource_type TEXT,
    p_resource_id UUID,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO audit_logs (
        user_id, action, resource_type, resource_id,
        old_values, new_values
    ) VALUES (
        p_user_id, p_action, p_resource_type, p_resource_id,
        p_old_values, p_new_values
    ) RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle GDPR data deletion
CREATE OR REPLACE FUNCTION gdpr_delete_user_data(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Soft delete user data
    UPDATE users SET 
        email = 'deleted-user-' || id::text || '@deleted.local',
        gdpr_delete_requested_at = NOW(),
        deleted_at = NOW()
    WHERE id = p_user_id;
    
    -- Soft delete related data
    UPDATE households SET deleted_at = NOW() 
    WHERE primary_user_id = p_user_id OR partner_user_id = p_user_id;
    
    UPDATE scenarios SET deleted_at = NOW()
    WHERE household_id IN (
        SELECT id FROM households 
        WHERE primary_user_id = p_user_id OR partner_user_id = p_user_id
    );
    
    -- Delete answers (contains sensitive tax data)
    DELETE FROM answers WHERE user_id = p_user_id;
    
    -- Create audit log
    PERFORM create_audit_log(p_user_id, 'gdpr_request', 'user', p_user_id);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired audit logs
CREATE OR REPLACE FUNCTION cleanup_expired_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_logs WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security Policies

-- Users can only see their own data
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Households: users can see households they're part of
CREATE POLICY "Users can view their households" ON households
    FOR SELECT USING (
        auth.uid() = primary_user_id OR 
        auth.uid() = partner_user_id
    );

CREATE POLICY "Primary users can manage households" ON households
    FOR ALL USING (auth.uid() = primary_user_id);

-- Answers: users can only see their own answers
CREATE POLICY "Users can view their own answers" ON answers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own answers" ON answers
    FOR ALL USING (auth.uid() = user_id);

-- Scenarios: users can see scenarios for their households
CREATE POLICY "Users can view household scenarios" ON scenarios
    FOR SELECT USING (
        household_id IN (
            SELECT id FROM households 
            WHERE auth.uid() = primary_user_id OR auth.uid() = partner_user_id
        )
    );

-- Insert initial questions
INSERT INTO questions (slug, text_nl, text_en, question_type, category, sort_order) VALUES
('income_employment', 'Wat is uw bruto jaarsalaris?', 'What is your gross annual salary?', 'number', 'income', 1),
('income_freelance', 'Heeft u inkomsten uit freelance werk?', 'Do you have freelance income?', 'boolean', 'income', 2),
('mortgage_interest', 'Hoeveel hypotheekrente heeft u betaald?', 'How much mortgage interest did you pay?', 'number', 'deductions', 3),
('charitable_donations', 'Heeft u donaties gedaan aan goede doelen?', 'Did you make charitable donations?', 'boolean', 'deductions', 4),
('investment_income', 'Heeft u inkomsten uit beleggingen (Box 3)?', 'Do you have investment income (Box 3)?', 'boolean', 'investments', 5);

-- Create a cron job to clean up expired audit logs (if pg_cron is available)
-- SELECT cron.schedule('cleanup-audit-logs', '0 2 * * *', 'SELECT cleanup_expired_audit_logs();'); 