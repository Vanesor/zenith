-- Required SQL Functions for Zenith Schema Migration
-- Run this SQL in your Supabase SQL Editor

-- Function to execute arbitrary SQL
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to execute SQL and return results
CREATE OR REPLACE FUNCTION exec_sql_with_results(sql_query TEXT)
RETURNS TABLE(result JSONB) AS $$
BEGIN
  RETURN QUERY EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the functions were created
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname IN ('exec_sql', 'exec_sql_with_results');
