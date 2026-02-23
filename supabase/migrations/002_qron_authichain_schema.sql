-- ============================================================================
-- QRON + AuthiChain Schema Extension
-- Add to existing schema with batches, codes, scans, users, brands
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE sku_category AS ENUM (
    'luxury_fashion',
    'pharma',
    'electronics',
    'automotive',
    'food_bev',
    'other'
);

CREATE TYPE historical_fact_type AS ENUM (
    'seizure',
    'recall',
    'chargeback_spike',
    'auction_rejection',
    'marketplace_flag',
    'regulatory_action'
);

CREATE TYPE truth_verdict AS ENUM (
    'authentic',
    'suspicious',
    'fake'
);

-- ============================================================================
-- SKUS TABLE
-- ============================================================================

CREATE TABLE skus (
    sku_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(brand_id) ON DELETE CASCADE,
    canonical_sku TEXT NOT NULL,
    category sku_category NOT NULL DEFAULT 'other',
    first_seen_year INTEGER CHECK (first_seen_year >= 1900 AND first_seen_year <= 2100),
    last_seen_year INTEGER CHECK (last_seen_year >= 1900 AND last_seen_year <= 2100),
    known_channels JSONB DEFAULT '[]'::jsonb,
    historical_counterfeit_count INTEGER NOT NULL DEFAULT 0 CHECK (historical_counterfeit_count >= 0),
    historical_confidence_score NUMERIC(5, 2) NOT NULL DEFAULT 100.00 CHECK (historical_confidence_score >= 0 AND historical_confidence_score <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (brand_id, canonical_sku),
    CHECK (last_seen_year IS NULL OR first_seen_year IS NULL OR last_seen_year >= first_seen_year)
);

-- Indexes for skus
CREATE INDEX idx_skus_brand_id ON skus (brand_id);
CREATE INDEX idx_skus_category ON skus (category);
CREATE INDEX idx_skus_canonical_sku ON skus (canonical_sku);
CREATE INDEX idx_skus_confidence_score ON skus (historical_confidence_score);
CREATE INDEX idx_skus_counterfeit_count ON skus (historical_counterfeit_count);

-- ============================================================================
-- HISTORICAL_FACTS TABLE
-- ============================================================================

CREATE TABLE historical_facts (
    fact_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku_id UUID NOT NULL REFERENCES skus(sku_id) ON DELETE CASCADE,
    type historical_fact_type NOT NULL,
    time_window_start TIMESTAMPTZ NOT NULL,
    time_window_end TIMESTAMPTZ NOT NULL,
    geo TEXT NOT NULL,
    source TEXT NOT NULL,
    severity INTEGER NOT NULL CHECK (severity >= 1 AND severity <= 10),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    blockchain_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (time_window_end >= time_window_start)
);

-- Indexes for historical_facts
CREATE INDEX idx_historical_facts_sku_id ON historical_facts (sku_id);
CREATE INDEX idx_historical_facts_type ON historical_facts (type);
CREATE INDEX idx_historical_facts_time_window ON historical_facts (time_window_start, time_window_end);
CREATE INDEX idx_historical_facts_geo ON historical_facts (geo);
CREATE INDEX idx_historical_facts_severity ON historical_facts (severity);
CREATE INDEX idx_historical_facts_created_at ON historical_facts (created_at DESC);
CREATE INDEX idx_historical_facts_blockchain_hash ON historical_facts (blockchain_hash) WHERE blockchain_hash IS NOT NULL;

-- ============================================================================
-- TRUTH_CLAIMS TABLE
-- ============================================================================

CREATE TABLE truth_claims (
    claim_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID NOT NULL REFERENCES scans(scan_id) ON DELETE CASCADE,
    sku_id UUID NOT NULL REFERENCES skus(sku_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    verdict truth_verdict NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    consensus_aligned BOOLEAN,
    reputation_weight NUMERIC(5, 2) NOT NULL CHECK (reputation_weight >= 0 AND reputation_weight <= 100),
    reward_amount NUMERIC(28, 18) NOT NULL DEFAULT 0 CHECK (reward_amount >= 0),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (scan_id, user_id)
);

-- Indexes for truth_claims
CREATE INDEX idx_truth_claims_scan_id ON truth_claims (scan_id);
CREATE INDEX idx_truth_claims_sku_id ON truth_claims (sku_id);
CREATE INDEX idx_truth_claims_user_id ON truth_claims (user_id);
CREATE INDEX idx_truth_claims_verdict ON truth_claims (verdict);
CREATE INDEX idx_truth_claims_consensus_aligned ON truth_claims (consensus_aligned) WHERE consensus_aligned IS NOT NULL;
CREATE INDEX idx_truth_claims_created_at ON truth_claims (created_at DESC);
CREATE INDEX idx_truth_claims_resolved_at ON truth_claims (resolved_at) WHERE resolved_at IS NOT NULL;
CREATE INDEX idx_truth_claims_reward_amount ON truth_claims (reward_amount) WHERE reward_amount > 0;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp for skus
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_skus_updated_at BEFORE UPDATE ON skus FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Recalculate historical_confidence_score when historical_facts are inserted
CREATE OR REPLACE FUNCTION recalculate_sku_confidence_score()
RETURNS TRIGGER AS $$
DECLARE
    total_severity NUMERIC;
    fact_count INTEGER;
    avg_severity NUMERIC;
    new_score NUMERIC;
BEGIN
    -- Get aggregated severity data for this SKU
    SELECT COALESCE(SUM(severity), 0), COUNT(*)
    INTO total_severity, fact_count
    FROM historical_facts
    WHERE sku_id = NEW.sku_id;

    -- Calculate new confidence score
    -- Formula: 100 - (avg_severity * 10) - (fact_count * 2)
    IF fact_count > 0 THEN
        avg_severity := total_severity / fact_count;
        new_score := 100 - (avg_severity * 10) - (fact_count * 2);
        new_score := GREATEST(0, LEAST(100, new_score));
    ELSE
        new_score := 100;
    END IF;

    -- Update the SKU
    UPDATE skus
    SET historical_confidence_score = new_score,
        historical_counterfeit_count = CASE
            WHEN NEW.type IN ('seizure', 'marketplace_flag', 'auction_rejection')
            THEN historical_counterfeit_count + 1
            ELSE historical_counterfeit_count
        END
    WHERE sku_id = NEW.sku_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sku_confidence_on_fact_insert
AFTER INSERT ON historical_facts
FOR EACH ROW
EXECUTE FUNCTION recalculate_sku_confidence_score();

-- Update historical_counterfeit_count when truth_claims reach consensus
CREATE OR REPLACE FUNCTION update_counterfeit_count_on_consensus()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process when consensus is newly aligned as fake
    IF NEW.consensus_aligned = true AND NEW.verdict = 'fake' AND
       (OLD.consensus_aligned IS NULL OR OLD.consensus_aligned = false)
    THEN
        UPDATE skus
        SET historical_counterfeit_count = historical_counterfeit_count + 1
        WHERE sku_id = NEW.sku_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_counterfeit_on_claim_consensus
AFTER UPDATE ON truth_claims
FOR EACH ROW
WHEN (NEW.consensus_aligned IS DISTINCT FROM OLD.consensus_aligned)
EXECUTE FUNCTION update_counterfeit_count_on_consensus();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE skus ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE truth_claims ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: SKUS
-- ============================================================================

-- Brands can read their own SKUs
CREATE POLICY "Brands can read own skus" ON skus FOR SELECT
USING (brand_id IN (SELECT brand_id FROM brands WHERE brands.user_id = auth.uid()));

-- Brands can insert their own SKUs
CREATE POLICY "Brands can insert own skus" ON skus FOR INSERT
WITH CHECK (brand_id IN (SELECT brand_id FROM brands WHERE brands.user_id = auth.uid()));

-- Brands can update their own SKUs
CREATE POLICY "Brands can update own skus" ON skus FOR UPDATE
USING (brand_id IN (SELECT brand_id FROM brands WHERE brands.user_id = auth.uid()))
WITH CHECK (brand_id IN (SELECT brand_id FROM brands WHERE brands.user_id = auth.uid()));

-- Brands can delete their own SKUs
CREATE POLICY "Brands can delete own skus" ON skus FOR DELETE
USING (brand_id IN (SELECT brand_id FROM brands WHERE brands.user_id = auth.uid()));

-- Authenticated users can read SKUs (for scanning/verification)
CREATE POLICY "Authenticated users can read skus" ON skus FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- RLS POLICIES: HISTORICAL_FACTS
-- ============================================================================

-- Brands can read historical_facts for their SKUs
CREATE POLICY "Brands can read own sku historical_facts" ON historical_facts FOR SELECT
USING (sku_id IN (SELECT sku_id FROM skus WHERE brand_id IN (SELECT brand_id FROM brands WHERE brands.user_id = auth.uid())));

-- Brands can insert historical_facts for their SKUs
CREATE POLICY "Brands can insert own sku historical_facts" ON historical_facts FOR INSERT
WITH CHECK (sku_id IN (SELECT sku_id FROM skus WHERE brand_id IN (SELECT brand_id FROM brands WHERE brands.user_id = auth.uid())));

-- Authenticated users can read historical_facts (for verification context)
CREATE POLICY "Authenticated users can read historical_facts" ON historical_facts FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- RLS POLICIES: TRUTH_CLAIMS
-- ============================================================================

-- Users can read their own truth_claims
CREATE POLICY "Users can read own truth_claims" ON truth_claims FOR SELECT
USING (user_id = auth.uid());

-- Users can insert their own truth_claims
CREATE POLICY "Users can insert own truth_claims" ON truth_claims FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Brands can read truth_claims for their SKUs
CREATE POLICY "Brands can read sku truth_claims" ON truth_claims FOR SELECT
USING (sku_id IN (SELECT sku_id FROM skus WHERE brand_id IN (SELECT brand_id FROM brands WHERE brands.user_id = auth.uid())));

-- System can update truth_claims for consensus resolution (via service role)
CREATE POLICY "Service role can update truth_claims" ON truth_claims FOR UPDATE
TO service_role
USING (true);

-- ============================================================================
-- MATERIALIZED VIEW: SKU ANALYTICS SUMMARY
-- ============================================================================

CREATE MATERIALIZED VIEW sku_analytics_summary AS
SELECT
    s.sku_id,
    s.brand_id,
    s.canonical_sku,
    s.category,
    s.historical_confidence_score,
    s.historical_counterfeit_count,
    COUNT(DISTINCT sc.scan_id) as total_scans,
    COUNT(DISTINCT tc.claim_id) as total_claims,
    COUNT(DISTINCT tc.claim_id) FILTER (WHERE tc.verdict = 'fake') as fake_claims,
    COUNT(DISTINCT tc.claim_id) FILTER (WHERE tc.verdict = 'suspicious') as suspicious_claims,
    COUNT(DISTINCT tc.claim_id) FILTER (WHERE tc.verdict = 'authentic') as authentic_claims,
    COUNT(DISTINCT tc.claim_id) FILTER (WHERE tc.consensus_aligned = true) as consensus_claims,
    COALESCE(AVG(tc.reward_amount) FILTER (WHERE tc.reward_amount > 0), 0) as avg_reward,
    COUNT(DISTINCT hf.fact_id) as historical_incident_count,
    MAX(sc.scanned_at) as last_scan_at,
    MAX(tc.created_at) as last_claim_at
FROM skus s
LEFT JOIN codes c ON c.sku_id = s.sku_id
LEFT JOIN scans sc ON sc.code_id = c.code_id
LEFT JOIN truth_claims tc ON tc.scan_id = sc.scan_id
LEFT JOIN historical_facts hf ON hf.sku_id = s.sku_id
GROUP BY s.sku_id, s.brand_id, s.canonical_sku, s.category, s.historical_confidence_score, s.historical_counterfeit_count;

CREATE UNIQUE INDEX idx_sku_analytics_summary_sku_id ON sku_analytics_summary (sku_id);
CREATE INDEX idx_sku_analytics_summary_brand_id ON sku_analytics_summary (brand_id);

-- Refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_sku_analytics_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY sku_analytics_summary;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get user's daily scan count
CREATE OR REPLACE FUNCTION get_user_scan_count_today(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    scan_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO scan_count
    FROM scans
    WHERE user_id = p_user_id
    AND scanned_at >= CURRENT_DATE
    AND scanned_at < CURRENT_DATE + INTERVAL '1 day';

    RETURN COALESCE(scan_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Get user's daily reward total
CREATE OR REPLACE FUNCTION get_user_reward_total_today(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    reward_total NUMERIC;
BEGIN
    SELECT COALESCE(SUM(reward_amount), 0)
    INTO reward_total
    FROM truth_claims
    WHERE user_id = p_user_id
    AND created_at >= CURRENT_DATE
    AND created_at < CURRENT_DATE + INTERVAL '1 day';

    RETURN reward_total;
END;
$$ LANGUAGE plpgsql;

-- Check if claim is first flag in region for SKU
CREATE OR REPLACE FUNCTION is_first_flag_in_region(p_sku_id UUID, p_geo TEXT, p_verdict truth_verdict)
RETURNS BOOLEAN AS $$
DECLARE
    existing_count INTEGER;
BEGIN
    IF p_verdict != 'fake' THEN
        RETURN false;
    END IF;

    SELECT COUNT(*)
    INTO existing_count
    FROM truth_claims tc
    JOIN scans s ON s.scan_id = tc.scan_id
    WHERE tc.sku_id = p_sku_id
    AND tc.verdict = 'fake'
    AND s.location_data ->> 'country' = p_geo;

    RETURN existing_count = 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT ON skus TO authenticated;
GRANT SELECT ON historical_facts TO authenticated;
GRANT SELECT, INSERT ON truth_claims TO authenticated;
GRANT SELECT ON sku_analytics_summary TO authenticated;

GRANT ALL ON skus TO service_role;
GRANT ALL ON historical_facts TO service_role;
GRANT ALL ON truth_claims TO service_role;
GRANT ALL ON sku_analytics_summary TO service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE skus IS 'Product SKUs with counterfeit history and confidence scoring';
COMMENT ON TABLE historical_facts IS 'Time-series incidents (seizures, recalls, flags) anchored to AuthiChain';
COMMENT ON TABLE truth_claims IS 'User-submitted authenticity verdicts with reputation-weighted consensus';
COMMENT ON COLUMN skus.historical_confidence_score IS 'Computed 0-100 score based on incident severity and frequency';
COMMENT ON COLUMN truth_claims.reputation_weight IS 'User reputation score at time of claim submission';
COMMENT ON COLUMN truth_claims.reward_amount IS 'QRON tokens awarded (18 decimal precision)';
