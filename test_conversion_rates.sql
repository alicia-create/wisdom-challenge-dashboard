-- Test query to simulate conversion rate calculation
SELECT 
  jsonb_build_object(
    'paidAdsFunnel', jsonb_build_object(
      'leads', 24892,
      'wisdomSales', 2418,
      'leadToWisdomRate', CASE WHEN 24892 > 0 THEN ROUND((2418::NUMERIC / 24892 * 100)::NUMERIC, 2) ELSE 0 END,
      'wisdomToKingdomRate', CASE WHEN 2418 > 0 THEN ROUND((0::NUMERIC / 2418 * 100)::NUMERIC, 2) ELSE 0 END
    )
  ) as test_result;
