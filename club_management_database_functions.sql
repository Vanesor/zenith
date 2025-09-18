-- Enhanced database function for club management access control
-- This function provides a comprehensive check for club management permissions

CREATE OR REPLACE FUNCTION has_club_management_access(user_email text, club_id text DEFAULT NULL) 
RETURNS TABLE(
    has_access BOOLEAN,
    access_level TEXT,
    managed_clubs TEXT[],
    user_info JSONB
) AS $$
DECLARE
    user_record RECORD;
    user_role TEXT;
    managed_clubs_array TEXT[] := ARRAY[]::TEXT[];
    access_granted BOOLEAN := false;
    access_type TEXT := 'none';
BEGIN
    -- Get user details
    SELECT u.id, u.email, u.name, u.role 
    INTO user_record
    FROM users u 
    WHERE u.email = user_email;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'none'::TEXT, ARRAY[]::TEXT[], '{}'::JSONB;
        RETURN;
    END IF;
    
    user_role := LOWER(COALESCE(user_record.role, ''));
    
    -- Check for super admin access
    IF user_role = 'super_admin' THEN
        SELECT ARRAY_AGG(c.id) INTO managed_clubs_array FROM clubs c;
        access_granted := true;
        access_type := 'super_admin';
    
    -- Check for system admin access
    ELSIF user_role = 'admin' THEN
        SELECT ARRAY_AGG(c.id) INTO managed_clubs_array FROM clubs c;
        access_granted := true;
        access_type := 'admin';
    
    -- Check for Zenith committee access
    ELSIF user_role IN ('president', 'vice_president', 'innovation_head', 'secretary', 'treasurer', 'outreach_coordinator', 'media_coordinator', 'zenith_committee') THEN
        SELECT ARRAY_AGG(c.id) INTO managed_clubs_array FROM clubs c;
        access_granted := true;
        access_type := 'zenith';
    
    -- Check for club-level access
    ELSE
        SELECT ARRAY_AGG(cm.club_id) 
        INTO managed_clubs_array
        FROM club_members cm 
        WHERE cm.user_id = user_record.id 
        AND cm.role IN ('coordinator', 'co_coordinator', 'secretary')
        AND cm.is_active = true;
        
        IF managed_clubs_array IS NOT NULL AND array_length(managed_clubs_array, 1) > 0 THEN
            access_granted := true;
            access_type := 'club';
            
            -- If specific club requested, check if user can manage it
            IF club_id IS NOT NULL AND NOT (club_id = ANY(managed_clubs_array)) THEN
                access_granted := false;
            END IF;
        END IF;
    END IF;
    
    -- Ensure managed_clubs_array is not null
    IF managed_clubs_array IS NULL THEN
        managed_clubs_array := ARRAY[]::TEXT[];
    END IF;
    
    RETURN QUERY SELECT 
        access_granted,
        access_type,
        managed_clubs_array,
        jsonb_build_object(
            'id', user_record.id,
            'email', user_record.email,
            'name', user_record.name,
            'role', user_record.role
        );
END;
$$ LANGUAGE plpgsql;

-- Function to get club statistics for management dashboard
CREATE OR REPLACE FUNCTION get_club_management_stats(user_email text, club_id text DEFAULT NULL)
RETURNS TABLE(
    club_info JSONB,
    member_stats JSONB,
    activity_stats JSONB
) AS $$
DECLARE
    access_check RECORD;
    target_clubs TEXT[];
BEGIN
    -- Check if user has access
    SELECT * INTO access_check 
    FROM has_club_management_access(user_email, club_id) 
    LIMIT 1;
    
    IF NOT access_check.has_access THEN
        RETURN QUERY SELECT '{}'::JSONB, '{}'::JSONB, '{}'::JSONB;
        RETURN;
    END IF;
    
    -- Determine which clubs to get stats for
    IF club_id IS NOT NULL THEN
        target_clubs := ARRAY[club_id];
    ELSE
        target_clubs := access_check.managed_clubs;
    END IF;
    
    RETURN QUERY
    WITH club_stats AS (
        SELECT 
            c.id,
            c.name,
            c.description,
            c.type,
            c.color,
            c.member_count,
            c.created_at,
            (
                SELECT COUNT(*)::integer
                FROM events e
                WHERE e.club_id = c.id
            ) as events_count,
            (
                SELECT COUNT(*)::integer
                FROM assignments a
                WHERE a.target_audience = 'club' 
                AND a.club_ids::jsonb ? c.id
            ) as assignments_count,
            (
                SELECT json_build_object(
                    'id', u.id,
                    'name', u.name,
                    'email', u.email
                )
                FROM club_members cm2
                JOIN users u ON cm2.user_id = u.id
                WHERE cm2.club_id = c.id 
                AND cm2.role = 'coordinator'
                AND cm2.is_active = true
                LIMIT 1
            ) as coordinator
        FROM clubs c
        WHERE c.id = ANY(target_clubs)
    ),
    member_stats AS (
        SELECT 
            COUNT(*)::integer as total_members,
            COUNT(CASE WHEN cm.is_active THEN 1 END)::integer as active_members,
            COUNT(CASE WHEN cm.role IN ('coordinator', 'co_coordinator') THEN 1 END)::integer as coordinators,
            array_agg(
                DISTINCT jsonb_build_object(
                    'role', cm.role,
                    'count', (
                        SELECT COUNT(*)::integer 
                        FROM club_members cm3 
                        WHERE cm3.club_id = ANY(target_clubs) 
                        AND cm3.role = cm.role 
                        AND cm3.is_active = true
                    )
                )
            ) as role_distribution
        FROM club_members cm
        WHERE cm.club_id = ANY(target_clubs)
        AND cm.is_active = true
    ),
    activity_stats AS (
        SELECT 
            (
                SELECT COUNT(*)::integer
                FROM events e
                WHERE e.club_id = ANY(target_clubs)
                AND e.date >= CURRENT_DATE
            ) as upcoming_events,
            (
                SELECT COUNT(*)::integer
                FROM assignments a
                WHERE a.target_audience = 'club'
                AND EXISTS (
                    SELECT 1 FROM unnest(target_clubs) tc
                    WHERE a.club_ids::jsonb ? tc
                )
                AND a.due_date >= CURRENT_DATE
            ) as active_assignments,
            (
                SELECT COUNT(*)::integer
                FROM posts p
                WHERE p.club_id = ANY(target_clubs)
                AND p.created_at >= CURRENT_DATE - INTERVAL '30 days'
            ) as recent_posts
    )
    SELECT 
        jsonb_agg(to_jsonb(cs.*)) as club_info,
        to_jsonb(ms.*) as member_stats,
        to_jsonb(acs.*) as activity_stats
    FROM club_stats cs, member_stats ms, activity_stats acs;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION has_club_management_access(text, text) TO zenithpostgres;
GRANT EXECUTE ON FUNCTION get_club_management_stats(text, text) TO zenithpostgres;