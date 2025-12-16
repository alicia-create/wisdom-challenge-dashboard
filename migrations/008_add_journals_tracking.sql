-- ============================================================================
-- ADD JOURNALS TRACKING TO DASHBOARD METRICS
-- ============================================================================
-- Adds totalJournals calculation:
-- - 1 journal per Wisdom+ sale (product_id = 1)
-- - Extra journals from orderbump (product_id = 4)
-- Goal: 20,000 journals
-- ============================================================================

-- First, let's create a simple function to get journals count
-- This can be called separately or we can update the main function

CREATE OR REPLACE FUNCTION get_journals_metrics(
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_wisdom_journals INT;
    v_extra_journals INT;
    v_total_journals INT;
    v_journal_goal INT := 20000;
BEGIN
    -- Count Wisdom+ journals (product_id = 1)
    -- Each Wisdom+ sale includes 1 journal
    SELECT COALESCE(SUM(quantity), 0)
    INTO v_wisdom_journals
    FROM order_items
    WHERE product_id = 1
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date + INTERVAL '1 day');
    
    -- Count Extra Journals from orderbump (product_id = 4)
    SELECT COALESCE(SUM(quantity), 0)
    INTO v_extra_journals
    FROM order_items
    WHERE product_id = 4
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date + INTERVAL '1 day');
    
    -- Calculate total
    v_total_journals := v_wisdom_journals + v_extra_journals;
    
    RETURN jsonb_build_object(
        'wisdomJournals', v_wisdom_journals,
        'extraJournals', v_extra_journals,
        'totalJournals', v_total_journals,
        'journalGoal', v_journal_goal,
        'journalProgress', CASE WHEN v_journal_goal > 0 
            THEN ROUND((v_total_journals::NUMERIC / v_journal_goal * 100)::NUMERIC, 2) 
            ELSE 0 
        END,
        'journalsRemaining', v_journal_goal - v_total_journals
    );
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION get_journals_metrics(DATE, DATE) TO anon;
GRANT EXECUTE ON FUNCTION get_journals_metrics(DATE, DATE) TO authenticated;
