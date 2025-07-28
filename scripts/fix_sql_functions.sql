-- Fix the exec_sql_with_results function
CREATE OR REPLACE FUNCTION exec_sql_with_results(sql_query TEXT)
RETURNS SETOF json AS $$
BEGIN
  RETURN QUERY EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
