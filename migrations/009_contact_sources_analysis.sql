-- Contact Sources Analysis Function
-- Analyzes where non-Wisdom contacts came from

CREATE OR REPLACE FUNCTION get_contact_sources_analysis()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_contacts', (SELECT COUNT(*) FROM contacts),
    'wisdom_contacts', (SELECT COUNT(*) FROM wisdom_contacts),
    'non_wisdom_contacts', (SELECT COUNT(*) FROM contacts) - (SELECT COUNT(*) FROM wisdom_contacts),
    
    -- Top event names for non-wisdom contacts
    'top_event_names', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT 
          ae.name as event_name,
          COUNT(DISTINCT ae.contact_id) as contact_count
        FROM analytics_events ae
        WHERE ae.contact_id NOT IN (SELECT contact_id FROM wisdom_contacts)
        GROUP BY ae.name
        ORDER BY COUNT(DISTINCT ae.contact_id) DESC
        LIMIT 20
      ) t
    ),
    
    -- Contacts with no events at all
    'contacts_without_events', (
      SELECT COUNT(*)
      FROM contacts c
      WHERE NOT EXISTS (
        SELECT 1 FROM analytics_events ae WHERE ae.contact_id = c.id
      )
    ),
    
    -- Non-wisdom contacts by creation date (top 20 dates)
    'top_creation_dates', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT 
          DATE(c.created_at) as date,
          COUNT(*) as contact_count
        FROM contacts c
        WHERE c.id NOT IN (SELECT contact_id FROM wisdom_contacts)
        GROUP BY DATE(c.created_at)
        ORDER BY COUNT(*) DESC
        LIMIT 20
      ) t
    ),
    
    -- Sample non-wisdom contacts with their events
    'sample_non_wisdom_with_events', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT 
          c.id as contact_id,
          c.email,
          c.created_at,
          (
            SELECT json_agg(json_build_object(
              'name', ae.name,
              'comment', LEFT(ae.comment, 100),
              'timestamp', ae.timestamp
            ))
            FROM analytics_events ae
            WHERE ae.contact_id = c.id
            ORDER BY ae.timestamp DESC
            LIMIT 5
          ) as recent_events
        FROM contacts c
        WHERE c.id NOT IN (SELECT contact_id FROM wisdom_contacts)
        AND EXISTS (SELECT 1 FROM analytics_events ae WHERE ae.contact_id = c.id)
        LIMIT 10
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Test the function
-- SELECT get_contact_sources_analysis();
