--
-- PostgreSQL database dump
--

\restrict Q9awpkgy1QHkB2KTkPykZfPbILj6wBtWN3geqZIUkEfmW63BSVn4n2QbAynkPRo

-- Dumped from database version 14.19 (Ubuntu 14.19-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 14.19 (Ubuntu 14.19-0ubuntu0.22.04.1)

-- Started on 2025-09-18 14:08:41 IST

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 3 (class 3079 OID 16397)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 4447 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 2 (class 3079 OID 16386)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 4448 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 327 (class 1255 OID 19755)
-- Name: cleanup_expired_otps(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_expired_otps() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    DELETE FROM email_otps WHERE expires_at < NOW();
END;
$$;


--
-- TOC entry 341 (class 1255 OID 19219)
-- Name: generate_task_key(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_task_key() RETURNS trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    project_key_val text;
    next_number integer;
BEGIN
    -- Get project key
    SELECT project_key INTO project_key_val 
    FROM projects 
    WHERE id = NEW.project_id;
    
    -- Get next task number for this project
    SELECT COALESCE(MAX(CAST(SUBSTRING(task_key FROM '[0-9]+$') AS integer)), 0) + 1
    INTO next_number
    FROM tasks 
    WHERE project_id = NEW.project_id;
    
    -- Generate the task key
    NEW.task_key := project_key_val || '-' || next_number;
    
    RETURN NEW;
END;
$_$;


--
-- TOC entry 344 (class 1255 OID 19856)
-- Name: get_team_academic_years(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_team_academic_years(team_type text, team_id text) RETURNS TABLE(academic_year character varying, member_count bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF team_type = 'committee' THEN
        RETURN QUERY
        SELECT cm.academic_year, COUNT(*)
        FROM committee_members cm
        WHERE cm.committee_id::text = team_id
        AND cm.status = 'active'
        GROUP BY cm.academic_year
        ORDER BY cm.academic_year DESC;
    ELSIF team_type = 'club' THEN
        RETURN QUERY
        SELECT clm.academic_year, COUNT(*)
        FROM club_members clm
        WHERE clm.club_id = team_id
        GROUP BY clm.academic_year
        ORDER BY clm.academic_year DESC;
    END IF;
END;
$$;


--
-- TOC entry 4449 (class 0 OID 0)
-- Dependencies: 344
-- Name: FUNCTION get_team_academic_years(team_type text, team_id text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_team_academic_years(team_type text, team_id text) IS 'Get available academic years for a specific team with member counts';


--
-- TOC entry 345 (class 1255 OID 19857)
-- Name: has_privileged_permissions(text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_privileged_permissions(user_email text, team_type text, team_id text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    has_permission BOOLEAN := false;
    user_uuid UUID;
BEGIN
    -- Get user UUID from email
    SELECT id INTO user_uuid FROM users WHERE email = user_email;
    
    IF user_uuid IS NULL THEN
        RETURN false;
    END IF;
    
    IF team_type = 'committee' THEN
        -- Check if user has privileged role in committee for current/previous year
        SELECT EXISTS(
            SELECT 1 FROM committee_members cm
            JOIN committee_roles cr ON cm.role_id = cr.id
            WHERE cm.committee_id = team_id::UUID
            AND cm.user_id = user_uuid
            AND cr.is_privileged = true
            AND cm.status = 'active'
            AND cm.academic_year IN (
                SELECT academic_year 
                FROM committee_members 
                WHERE committee_id = team_id::UUID
                ORDER BY academic_year DESC 
                LIMIT 2
            )
        ) INTO has_permission;
        
    ELSIF team_type = 'club' THEN
        -- Check if user has leadership role in club for current/previous year
        SELECT EXISTS(
            SELECT 1 FROM club_members cm
            WHERE cm.club_id = team_id::UUID
            AND cm.user_id = user_uuid
            AND cm.role IN ('coordinator', 'co_coordinator')
            AND cm.academic_year IN (
                SELECT academic_year 
                FROM club_members 
                WHERE club_id = team_id::UUID
                ORDER BY academic_year DESC 
                LIMIT 2
            )
        ) INTO has_permission;
    END IF;
    
    RETURN has_permission;
END;
$$;


--
-- TOC entry 4450 (class 0 OID 0)
-- Dependencies: 345
-- Name: FUNCTION has_privileged_permissions(user_email text, team_type text, team_id text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.has_privileged_permissions(user_email text, team_type text, team_id text) IS 'Check if a user has privileged permissions for team operations';


--
-- TOC entry 347 (class 1255 OID 19883)
-- Name: update_club_privileges(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_club_privileges() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- For clubs, we don't have separate roles table, so we handle privileges directly
    -- This is a placeholder for club privilege logic
    RETURN NEW;
END;
$$;


--
-- TOC entry 346 (class 1255 OID 19882)
-- Name: update_committee_privileges(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_committee_privileges() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Update committee roles to mark privileged roles
    -- Only members from the current and previous academic year have privileges
    UPDATE committee_roles 
    SET is_privileged = true 
    WHERE committee_id = NEW.committee_id 
    AND id IN (
        SELECT DISTINCT cr.id 
        FROM committee_roles cr
        JOIN committee_members cm ON cr.id = cm.role_id
        WHERE cm.committee_id = NEW.committee_id
        AND cm.academic_year IN (
            SELECT academic_year 
            FROM committee_members 
            WHERE committee_id = NEW.committee_id
            ORDER BY academic_year DESC 
            LIMIT 2
        )
    );
    
    -- Mark non-privileged roles
    UPDATE committee_roles 
    SET is_privileged = false 
    WHERE committee_id = NEW.committee_id 
    AND id NOT IN (
        SELECT DISTINCT cr.id 
        FROM committee_roles cr
        JOIN committee_members cm ON cr.id = cm.role_id
        WHERE cm.committee_id = NEW.committee_id
        AND cm.academic_year IN (
            SELECT academic_year 
            FROM committee_members 
            WHERE committee_id = NEW.committee_id
            ORDER BY academic_year DESC 
            LIMIT 2
        )
    );
    
    RETURN NEW;
END;
$$;


--
-- TOC entry 329 (class 1255 OID 19217)
-- Name: update_post_search_vector(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_post_search_vector() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        COALESCE(NEW.title, '') || ' ' || 
        COALESCE(NEW.content, '') || ' ' || 
        COALESCE(NEW.excerpt, '') || ' ' ||
        COALESCE(array_to_string(NEW.tags, ' '), '')
    );
    RETURN NEW;
END;
$$;


--
-- TOC entry 343 (class 1255 OID 19845)
-- Name: update_privileged_roles(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_privileged_roles() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Mark all roles as non-privileged first
    UPDATE committee_roles 
    SET is_privileged = false 
    WHERE committee_id = NEW.committee_id;
    
    -- Mark current and previous year as privileged
    UPDATE committee_roles 
    SET is_privileged = true 
    WHERE committee_id = NEW.committee_id 
    AND id IN (
        SELECT DISTINCT cr.id 
        FROM committee_roles cr
        JOIN committee_members cm ON cr.id = cm.role_id
        WHERE cm.committee_id = NEW.committee_id
        AND cm.academic_year IN (
            SELECT academic_year 
            FROM committee_members 
            WHERE committee_id = NEW.committee_id
            ORDER BY academic_year DESC 
            LIMIT 2
        )
    );
    
    RETURN NEW;
END;
$$;


--
-- TOC entry 342 (class 1255 OID 19221)
-- Name: update_project_progress(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_project_progress() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    total_tasks_count integer;
    completed_tasks_count integer;
    progress_pct numeric;
BEGIN
    -- Count total and completed tasks for the project
    SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_completed = true) as completed
    INTO total_tasks_count, completed_tasks_count
    FROM tasks 
    WHERE project_id = COALESCE(NEW.project_id, OLD.project_id);
    
    -- Calculate progress percentage
    IF total_tasks_count > 0 THEN
        progress_pct := (completed_tasks_count::numeric / total_tasks_count::numeric) * 100;
    ELSE
        progress_pct := 0;
    END IF;
    
    -- Update project
    UPDATE projects 
    SET 
        total_tasks = total_tasks_count,
        completed_tasks = completed_tasks_count,
        progress_percentage = progress_pct,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- TOC entry 328 (class 1255 OID 17453)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 17634)
-- Name: ai_assignment_generations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_assignment_generations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    template_id uuid,
    generated_assignment_id uuid,
    source_file_url text NOT NULL,
    generation_prompt text,
    ai_model_used character varying,
    generation_status character varying DEFAULT 'pending'::character varying,
    questions_extracted integer DEFAULT 0,
    questions_created integer DEFAULT 0,
    processing_log jsonb DEFAULT '[]'::jsonb,
    error_details text,
    generated_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp with time zone
);


--
-- TOC entry 246 (class 1259 OID 18204)
-- Name: club_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.club_members (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    club_id character varying NOT NULL,
    is_leader boolean DEFAULT false,
    joined_at timestamp with time zone DEFAULT now(),
    academic_year character varying(9) DEFAULT '2024-2025'::character varying,
    role character varying(100) DEFAULT 'member'::character varying,
    is_current_term boolean DEFAULT true,
    display_order integer DEFAULT 0,
    bio text,
    achievements text[],
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    hierarchy integer DEFAULT 5
);


--
-- TOC entry 216 (class 1259 OID 17481)
-- Name: clubs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clubs (
    id character varying NOT NULL,
    name character varying NOT NULL,
    type character varying NOT NULL,
    description text NOT NULL,
    long_description text,
    icon character varying NOT NULL,
    color character varying NOT NULL,
    coordinator_id uuid,
    co_coordinator_id uuid,
    secretary_id uuid,
    media_id uuid,
    guidelines text,
    meeting_schedule jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    logo_url text,
    banner_image_url text,
    club_images jsonb DEFAULT '[]'::jsonb,
    member_count integer DEFAULT 0
);


--
-- TOC entry 219 (class 1259 OID 17540)
-- Name: committee_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.committee_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    committee_id uuid NOT NULL,
    role_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status character varying DEFAULT 'active'::character varying,
    joined_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    term_start timestamp with time zone,
    term_end timestamp with time zone,
    achievements jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    academic_year character varying(10) DEFAULT '2024-2025'::character varying,
    is_current_term boolean DEFAULT true
);


--
-- TOC entry 218 (class 1259 OID 17523)
-- Name: committee_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.committee_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    committee_id uuid NOT NULL,
    name character varying NOT NULL,
    description text,
    hierarchy integer DEFAULT 1 NOT NULL,
    permissions text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    can_create_projects boolean DEFAULT false,
    can_manage_events boolean DEFAULT false,
    can_approve_content boolean DEFAULT false,
    can_manage_members boolean DEFAULT false,
    role_color character varying(7) DEFAULT '#3b82f6'::character varying,
    role_icon character varying(50) DEFAULT 'user'::character varying,
    is_privileged boolean DEFAULT false
);


--
-- TOC entry 215 (class 1259 OID 17467)
-- Name: committees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.committees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    description text,
    hierarchy_level integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 217 (class 1259 OID 17493)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying NOT NULL,
    password_hash character varying NOT NULL,
    name character varying NOT NULL,
    username character varying,
    avatar text,
    role character varying DEFAULT 'student'::character varying NOT NULL,
    club_id character varying,
    bio text,
    social_links jsonb DEFAULT '{}'::jsonb,
    preferences jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    profile_image_url text,
    profile_images jsonb DEFAULT '[]'::jsonb,
    verification_photo_url text,
    phone_number character varying,
    date_of_birth date,
    address text,
    emergency_contact jsonb DEFAULT '{}'::jsonb,
    phone character varying,
    location character varying,
    website character varying,
    github character varying,
    linkedin character varying,
    twitter character varying,
    email_verified boolean DEFAULT false,
    email_verification_token character varying,
    email_verification_token_expires_at timestamp without time zone,
    password_reset_token character varying,
    password_reset_token_expires_at timestamp without time zone,
    oauth_provider character varying,
    oauth_id character varying,
    oauth_data jsonb,
    has_password boolean DEFAULT true,
    totp_secret character varying,
    totp_temp_secret character varying,
    totp_temp_secret_created_at timestamp without time zone,
    totp_enabled boolean DEFAULT false,
    totp_enabled_at timestamp without time zone,
    totp_recovery_codes jsonb,
    notification_preferences jsonb DEFAULT '{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}'::jsonb,
    email_otp_enabled boolean DEFAULT false,
    email_otp_verified boolean DEFAULT false,
    email_otp_secret character varying,
    email_otp_backup_codes jsonb DEFAULT '[]'::jsonb,
    email_otp_last_used timestamp with time zone,
    email_otp_created_at timestamp with time zone,
    email_otp character(6),
    email_otp_expires_at timestamp with time zone,
    last_activity timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 277 (class 1259 OID 19915)
-- Name: all_team_members; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.all_team_members AS
 SELECT 'committee'::text AS team_type,
    (com.id)::text AS team_id,
    com.name AS team_name,
    u.id AS user_id,
    u.name AS user_name,
    u.email AS user_email,
    u.avatar,
    cr.name AS role,
    cm.academic_year,
    cm.is_current_term,
    cm.status,
    cr.is_privileged,
    cr.can_create_projects,
    cr.can_manage_events,
    cr.can_approve_content,
    cm.created_at,
    cm.updated_at
   FROM (((public.committee_members cm
     JOIN public.committees com ON ((cm.committee_id = com.id)))
     JOIN public.users u ON ((cm.user_id = u.id)))
     JOIN public.committee_roles cr ON ((cm.role_id = cr.id)))
  WHERE ((cm.status)::text = 'active'::text)
UNION ALL
 SELECT 'club'::text AS team_type,
    c.id AS team_id,
    c.name AS team_name,
    u.id AS user_id,
    u.name AS user_name,
    u.email AS user_email,
    u.avatar,
    cm.role,
    cm.academic_year,
    cm.is_current_term,
    'active'::character varying AS status,
        CASE
            WHEN ((cm.role)::text = ANY ((ARRAY['coordinator'::character varying, 'co_coordinator'::character varying])::text[])) THEN true
            ELSE false
        END AS is_privileged,
        CASE
            WHEN ((cm.role)::text = ANY ((ARRAY['coordinator'::character varying, 'co_coordinator'::character varying])::text[])) THEN true
            ELSE false
        END AS can_create_projects,
        CASE
            WHEN ((cm.role)::text = ANY ((ARRAY['coordinator'::character varying, 'co_coordinator'::character varying, 'secretary'::character varying])::text[])) THEN true
            ELSE false
        END AS can_manage_events,
        CASE
            WHEN ((cm.role)::text = ANY ((ARRAY['coordinator'::character varying, 'co_coordinator'::character varying])::text[])) THEN true
            ELSE false
        END AS can_approve_content,
    cm.created_at,
    cm.updated_at
   FROM ((public.club_members cm
     JOIN public.clubs c ON (((cm.club_id)::text = (c.id)::text)))
     JOIN public.users u ON ((cm.user_id = u.id)));


--
-- TOC entry 235 (class 1259 OID 17916)
-- Name: announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announcements (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying NOT NULL,
    content text NOT NULL,
    author_id uuid,
    club_id character varying,
    priority character varying DEFAULT 'normal'::character varying,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 225 (class 1259 OID 17710)
-- Name: assignment_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignment_attempts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    assignment_id uuid NOT NULL,
    user_id uuid NOT NULL,
    attempt_number integer DEFAULT 1 NOT NULL,
    start_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    end_time timestamp with time zone,
    time_spent integer DEFAULT 0,
    score integer DEFAULT 0,
    max_score integer DEFAULT 0,
    percentage numeric DEFAULT 0,
    is_passing boolean DEFAULT false,
    answers jsonb DEFAULT '{}'::jsonb,
    graded_answers jsonb DEFAULT '{}'::jsonb,
    violations jsonb DEFAULT '[]'::jsonb,
    status character varying DEFAULT 'in_progress'::character varying,
    submitted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_fullscreen boolean DEFAULT false,
    auto_save_data jsonb DEFAULT '{}'::jsonb,
    window_violations integer DEFAULT 0,
    last_auto_save timestamp with time zone,
    browser_info jsonb DEFAULT '{}'::jsonb
);


--
-- TOC entry 226 (class 1259 OID 17745)
-- Name: assignment_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignment_audit_log (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    assignment_id uuid NOT NULL,
    user_id uuid NOT NULL,
    attempt_id uuid,
    action character varying NOT NULL,
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 223 (class 1259 OID 17662)
-- Name: assignment_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignment_questions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    assignment_id uuid NOT NULL,
    question_text text NOT NULL,
    question_type character varying NOT NULL,
    marks integer DEFAULT 1 NOT NULL,
    time_limit integer,
    code_language character varying,
    code_template text,
    test_cases jsonb,
    expected_output text,
    solution text,
    ordering integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    type character varying,
    title character varying,
    description text,
    options jsonb,
    correct_answer jsonb,
    points integer DEFAULT 1,
    question_order integer DEFAULT 0,
    starter_code text,
    integer_min numeric,
    integer_max numeric,
    integer_step numeric DEFAULT 1,
    explanation text,
    allowed_languages jsonb DEFAULT '[]'::jsonb,
    allow_any_language boolean DEFAULT false,
    question_image_url text,
    question_image_alt text,
    question_images jsonb DEFAULT '[]'::jsonb,
    answer_images jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT assignment_questions_question_type_check CHECK (((question_type)::text = ANY (ARRAY[('single_choice'::character varying)::text, ('multiple_choice'::character varying)::text, ('multi_select'::character varying)::text, ('coding'::character varying)::text, ('essay'::character varying)::text, ('true_false'::character varying)::text, ('integer'::character varying)::text])))
);


--
-- TOC entry 224 (class 1259 OID 17687)
-- Name: assignment_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignment_submissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    assignment_id uuid,
    user_id uuid,
    submission_text text,
    file_url text,
    submitted_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying DEFAULT 'submitted'::character varying,
    grade integer,
    feedback text,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    violation_count integer DEFAULT 0,
    time_spent integer,
    auto_submitted boolean DEFAULT false,
    ip_address character varying,
    user_agent text,
    total_score integer DEFAULT 0
);


--
-- TOC entry 221 (class 1259 OID 17616)
-- Name: assignment_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignment_templates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    description text,
    template_file_url text NOT NULL,
    template_type character varying NOT NULL,
    category character varying,
    subject character varying,
    difficulty_level character varying,
    estimated_questions integer,
    created_by uuid,
    is_active boolean DEFAULT true,
    usage_count integer DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 227 (class 1259 OID 17770)
-- Name: assignment_violations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignment_violations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    submission_id uuid NOT NULL,
    violation_type character varying NOT NULL,
    occurred_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    details jsonb
);


--
-- TOC entry 220 (class 1259 OID 17567)
-- Name: assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying NOT NULL,
    description text NOT NULL,
    club_id character varying,
    created_by uuid,
    due_date timestamp with time zone NOT NULL,
    max_points integer DEFAULT 100,
    instructions text,
    status character varying DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    assignment_type character varying DEFAULT 'regular'::character varying,
    target_audience character varying DEFAULT 'club'::character varying,
    target_clubs character varying[] DEFAULT '{}'::character varying[],
    time_limit integer,
    allow_navigation boolean DEFAULT true,
    passing_score integer DEFAULT 60,
    is_proctored boolean DEFAULT false,
    shuffle_questions boolean DEFAULT false,
    allow_calculator boolean DEFAULT true,
    show_results boolean DEFAULT true,
    allow_review boolean DEFAULT true,
    shuffle_options boolean DEFAULT false,
    max_attempts integer DEFAULT 1,
    is_published boolean DEFAULT false,
    coding_instructions text DEFAULT 'Write your code solution. Make sure to test your code thoroughly before submitting.'::text,
    objective_instructions text DEFAULT 'Choose the correct answer(s) for each question. For multi-select questions, you may choose multiple options.'::text,
    mixed_instructions text DEFAULT 'This assignment contains different types of questions. Read each question carefully and provide appropriate answers.'::text,
    essay_instructions text DEFAULT 'Provide detailed written responses to the essay questions. Ensure your answers are well-structured and comprehensive.'::text,
    require_fullscreen boolean DEFAULT false,
    auto_submit_on_violation boolean DEFAULT false,
    max_violations integer DEFAULT 3,
    code_editor_settings jsonb DEFAULT '{"theme": "vs-dark", "autoSave": true, "fontSize": 14, "wordWrap": true, "autoSaveInterval": 30000}'::jsonb,
    require_camera boolean DEFAULT false,
    require_microphone boolean DEFAULT false,
    require_face_verification boolean DEFAULT false,
    proctoring_settings jsonb DEFAULT '{}'::jsonb,
    start_date timestamp with time zone,
    start_time timestamp with time zone,
    CONSTRAINT assignments_assignment_type_check CHECK (((assignment_type)::text = ANY (ARRAY[('regular'::character varying)::text, ('objective'::character varying)::text, ('coding'::character varying)::text, ('essay'::character varying)::text]))),
    CONSTRAINT assignments_target_audience_check CHECK (((target_audience)::text = ANY (ARRAY[('club'::character varying)::text, ('all_clubs'::character varying)::text, ('specific_clubs'::character varying)::text])))
);


--
-- TOC entry 253 (class 1259 OID 18312)
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    action character varying NOT NULL,
    resource_type character varying NOT NULL,
    resource_id uuid,
    old_values jsonb,
    new_values jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- TOC entry 271 (class 1259 OID 19649)
-- Name: carousel_slides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carousel_slides (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    page_type character varying NOT NULL,
    page_reference_id character varying,
    title character varying NOT NULL,
    subtitle character varying,
    description text,
    image_url text NOT NULL,
    button_text character varying,
    button_link character varying,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT carousel_slides_page_type_check CHECK (((page_type)::text = ANY ((ARRAY['landing'::character varying, 'club_home'::character varying])::text[])))
);


--
-- TOC entry 244 (class 1259 OID 18168)
-- Name: chat_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_attachments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    message_id uuid,
    room_id uuid NOT NULL,
    filename character varying NOT NULL,
    original_filename character varying NOT NULL,
    file_path character varying NOT NULL,
    file_type character varying NOT NULL,
    file_size integer NOT NULL,
    mime_type character varying,
    encryption_key text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    user_id uuid,
    file_id uuid
);


--
-- TOC entry 245 (class 1259 OID 18182)
-- Name: chat_invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_invitations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    room_id uuid NOT NULL,
    inviter_id uuid NOT NULL,
    invitee_email character varying NOT NULL,
    invitation_token character varying NOT NULL,
    message text,
    status character varying DEFAULT 'pending'::character varying,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    accepted_at timestamp with time zone
);


--
-- TOC entry 243 (class 1259 OID 18123)
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    room_id uuid,
    user_id uuid,
    message text NOT NULL,
    message_type character varying DEFAULT 'text'::character varying,
    file_url text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    reply_to_message_id uuid,
    is_edited boolean DEFAULT false,
    reply_to uuid,
    sender_id uuid,
    content text,
    is_encrypted boolean DEFAULT false,
    updated_at timestamp with time zone,
    attachments jsonb DEFAULT '[]'::jsonb,
    message_images jsonb DEFAULT '[]'::jsonb,
    reactions jsonb DEFAULT '{}'::jsonb,
    thread_id uuid,
    edited_at timestamp with time zone,
    edited_by uuid,
    can_edit_until timestamp with time zone
);


--
-- TOC entry 242 (class 1259 OID 18103)
-- Name: chat_room_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_room_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    chat_room_id uuid,
    user_id uuid,
    joined_at timestamp with time zone DEFAULT now(),
    role character varying DEFAULT 'member'::character varying,
    user_email character varying
);


--
-- TOC entry 241 (class 1259 OID 18077)
-- Name: chat_rooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_rooms (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    description text,
    club_id character varying,
    type character varying DEFAULT 'public'::character varying,
    created_by uuid,
    members uuid[] DEFAULT '{}'::uuid[],
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    room_type character varying DEFAULT 'public'::character varying,
    encryption_enabled boolean DEFAULT false,
    cover_image_url text,
    room_images jsonb DEFAULT '[]'::jsonb,
    room_settings jsonb DEFAULT '{}'::jsonb,
    profile_picture_url text,
    edited_at timestamp with time zone,
    edited_by uuid,
    CONSTRAINT chat_room_type_check CHECK (((type)::text = ANY ((ARRAY['public'::character varying, 'club'::character varying])::text[])))
);


--
-- TOC entry 279 (class 1259 OID 20078)
-- Name: club_members_backup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.club_members_backup (
    id uuid,
    user_id uuid,
    club_id character varying,
    is_leader boolean,
    joined_at timestamp with time zone,
    academic_year character varying(9),
    role character varying(100),
    is_current_term boolean,
    display_order integer,
    bio text,
    achievements text[],
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    hierarchy integer
);


--
-- TOC entry 211 (class 1259 OID 17463)
-- Name: club_statistics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.club_statistics_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 247 (class 1259 OID 18212)
-- Name: club_statistics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.club_statistics (
    id integer DEFAULT nextval('public.club_statistics_id_seq'::regclass) NOT NULL,
    club_id character varying,
    member_count integer DEFAULT 0,
    event_count integer DEFAULT 0,
    assignment_count integer DEFAULT 0,
    comment_count integer DEFAULT 0,
    total_engagement integer DEFAULT 0,
    average_engagement numeric DEFAULT 0,
    last_updated timestamp with time zone DEFAULT now()
);


--
-- TOC entry 230 (class 1259 OID 17822)
-- Name: code_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.code_results (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    response_id uuid NOT NULL,
    test_case_index integer,
    passed boolean,
    stdout text,
    stderr text,
    execution_time integer,
    memory_used integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 231 (class 1259 OID 17836)
-- Name: coding_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coding_submissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    question_response_id uuid NOT NULL,
    language character varying NOT NULL,
    code text NOT NULL,
    is_final boolean DEFAULT false,
    execution_result jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 276 (class 1259 OID 19758)
-- Name: comment_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comment_likes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    comment_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 261 (class 1259 OID 19052)
-- Name: comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    post_id uuid,
    author_id uuid,
    content text NOT NULL,
    parent_id uuid,
    likes_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 280 (class 1259 OID 20083)
-- Name: committee_members_backup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.committee_members_backup (
    id uuid,
    committee_id uuid,
    role_id uuid,
    user_id uuid,
    status character varying,
    joined_at timestamp with time zone,
    term_start timestamp with time zone,
    term_end timestamp with time zone,
    achievements jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    academic_year character varying(10),
    is_current_term boolean
);


--
-- TOC entry 274 (class 1259 OID 19709)
-- Name: content_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_permissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    page_type character varying NOT NULL,
    page_reference_id character varying,
    permission_type character varying NOT NULL,
    granted_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT content_permissions_page_type_check CHECK (((page_type)::text = ANY ((ARRAY['landing'::character varying, 'club_home'::character varying])::text[]))),
    CONSTRAINT content_permissions_permission_type_check CHECK (((permission_type)::text = ANY ((ARRAY['read'::character varying, 'write'::character varying, 'delete'::character varying, 'admin'::character varying])::text[])))
);


--
-- TOC entry 237 (class 1259 OID 17997)
-- Name: discussion_replies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discussion_replies (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    discussion_id uuid,
    author_id uuid,
    content text NOT NULL,
    parent_id uuid,
    likes_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 236 (class 1259 OID 17971)
-- Name: discussions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discussions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying NOT NULL,
    description text,
    author_id uuid,
    club_id character varying,
    tags text[] DEFAULT '{}'::text[],
    is_locked boolean DEFAULT false,
    is_pinned boolean DEFAULT false,
    views_count integer DEFAULT 0,
    replies_count integer DEFAULT 0,
    last_activity timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 249 (class 1259 OID 18245)
-- Name: email_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    recipient character varying NOT NULL,
    subject character varying NOT NULL,
    content_preview text,
    status character varying DEFAULT 'sent'::character varying,
    message_id character varying,
    category character varying,
    related_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    sent_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    email_service character varying DEFAULT 'resend'::character varying,
    error_message text,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- TOC entry 275 (class 1259 OID 19741)
-- Name: email_otps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_otps (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    otp character varying(6) NOT NULL,
    type character varying(20) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT email_otps_type_check CHECK (((type)::text = ANY ((ARRAY['verification'::character varying, 'forgot_password'::character varying])::text[])))
);


--
-- TOC entry 239 (class 1259 OID 18046)
-- Name: event_attendees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_attendees (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    event_id uuid,
    user_id uuid,
    registered_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    attendance_status character varying DEFAULT 'registered'::character varying
);


--
-- TOC entry 240 (class 1259 OID 18066)
-- Name: event_registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_registrations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    event_id uuid,
    user_id uuid,
    status character varying DEFAULT 'registered'::character varying,
    registration_data jsonb,
    registered_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 238 (class 1259 OID 18023)
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying NOT NULL,
    description text NOT NULL,
    club_id character varying,
    created_by uuid,
    event_date date NOT NULL,
    event_time time without time zone NOT NULL,
    location character varying NOT NULL,
    max_attendees integer,
    status character varying DEFAULT 'upcoming'::character varying,
    image_url text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    event_images jsonb DEFAULT '[]'::jsonb,
    banner_image_url text,
    gallery_images jsonb DEFAULT '[]'::jsonb
);


--
-- TOC entry 273 (class 1259 OID 19686)
-- Name: featured_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.featured_events (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    event_id uuid,
    page_type character varying NOT NULL,
    page_reference_id character varying,
    custom_title character varying,
    custom_description text,
    custom_image_url text,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    featured_until timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT featured_events_page_type_check CHECK (((page_type)::text = ANY ((ARRAY['landing'::character varying, 'club_home'::character varying])::text[])))
);


--
-- TOC entry 260 (class 1259 OID 19033)
-- Name: likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.likes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    post_id uuid,
    user_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    comment_id uuid,
    CONSTRAINT likes_check_target CHECK ((((post_id IS NOT NULL) AND (comment_id IS NULL)) OR ((post_id IS NULL) AND (comment_id IS NOT NULL))))
);


--
-- TOC entry 232 (class 1259 OID 17852)
-- Name: media_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media_files (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    filename character varying NOT NULL,
    original_filename character varying NOT NULL,
    file_size integer NOT NULL,
    mime_type character varying NOT NULL,
    file_url text NOT NULL,
    thumbnail_url text,
    alt_text text,
    description text,
    uploaded_by uuid,
    upload_context character varying,
    upload_reference_id uuid,
    is_public boolean DEFAULT true,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 258 (class 1259 OID 18374)
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    chat_room_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    attachment_url text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- TOC entry 267 (class 1259 OID 19566)
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    name character varying(255) NOT NULL,
    applied_at timestamp with time zone DEFAULT now()
);


--
-- TOC entry 212 (class 1259 OID 17464)
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 248 (class 1259 OID 18232)
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer DEFAULT nextval('public.notifications_id_seq'::regclass) NOT NULL,
    user_id uuid NOT NULL,
    type character varying NOT NULL,
    title text,
    message text NOT NULL,
    link text,
    read boolean DEFAULT false,
    delivery_method character varying DEFAULT 'in-app'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    sent_by character varying,
    club_id character varying,
    email_sent boolean DEFAULT false,
    email_sent_at timestamp without time zone,
    related_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb
);


--
-- TOC entry 270 (class 1259 OID 19629)
-- Name: page_content; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_content (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    page_type character varying NOT NULL,
    page_reference_id character varying,
    content_type character varying NOT NULL,
    title character varying,
    subtitle character varying,
    description text,
    image_url text,
    link_url text,
    metadata jsonb DEFAULT '{}'::jsonb,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT page_content_content_type_check CHECK (((content_type)::text = ANY ((ARRAY['carousel'::character varying, 'team_card'::character varying, 'featured_event'::character varying, 'hero_section'::character varying, 'about_section'::character varying])::text[]))),
    CONSTRAINT page_content_page_type_check CHECK (((page_type)::text = ANY ((ARRAY['landing'::character varying, 'club_home'::character varying])::text[])))
);


--
-- TOC entry 269 (class 1259 OID 19590)
-- Name: post_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_attachments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    media_file_id uuid NOT NULL,
    file_name character varying(255) NOT NULL,
    file_type character varying(100) NOT NULL,
    file_size bigint NOT NULL,
    attachment_type character varying(50) DEFAULT 'general'::character varying,
    uploaded_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- TOC entry 259 (class 1259 OID 18994)
-- Name: posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.posts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying NOT NULL,
    content text NOT NULL,
    author_id uuid,
    club_id character varying,
    category character varying DEFAULT 'blog'::character varying,
    post_type character varying DEFAULT 'blog'::character varying,
    tags text[] DEFAULT '{}'::text[],
    excerpt text,
    reading_time_minutes integer DEFAULT 0,
    featured_image_url text,
    post_images jsonb DEFAULT '[]'::jsonb,
    content_blocks jsonb DEFAULT '[]'::jsonb,
    meta_description text,
    slug character varying,
    status character varying DEFAULT 'draft'::character varying,
    is_featured boolean DEFAULT false,
    is_pinned boolean DEFAULT false,
    view_count integer DEFAULT 0,
    likes_count integer DEFAULT 0,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    edited_by uuid,
    search_vector tsvector DEFAULT to_tsvector('english'::regconfig, ''::text)
);


--
-- TOC entry 234 (class 1259 OID 17890)
-- Name: proctoring_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proctoring_sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    assignment_id uuid NOT NULL,
    user_id uuid NOT NULL,
    session_start timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    session_end timestamp with time zone,
    camera_enabled boolean DEFAULT false,
    microphone_enabled boolean DEFAULT false,
    face_verified boolean DEFAULT false,
    violations jsonb DEFAULT '[]'::jsonb,
    screenshots jsonb DEFAULT '[]'::jsonb,
    system_info jsonb DEFAULT '{}'::jsonb,
    session_data jsonb DEFAULT '{}'::jsonb
);


--
-- TOC entry 265 (class 1259 OID 19173)
-- Name: project_invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_invitations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    project_id uuid NOT NULL,
    inviter_id uuid NOT NULL,
    email character varying NOT NULL,
    role character varying DEFAULT 'member'::character varying,
    invitation_token character varying NOT NULL,
    project_password character varying,
    status character varying DEFAULT 'pending'::character varying,
    message text,
    expires_at timestamp with time zone DEFAULT (CURRENT_TIMESTAMP + '7 days'::interval) NOT NULL,
    sent_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    accepted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    project_key character varying(32),
    access_key character varying(64)
);


--
-- TOC entry 263 (class 1259 OID 19107)
-- Name: project_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_members (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    project_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role character varying DEFAULT 'member'::character varying,
    status character varying DEFAULT 'active'::character varying,
    joined_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    invited_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 262 (class 1259 OID 19078)
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    description text,
    club_id character varying NOT NULL,
    created_by uuid NOT NULL,
    project_key character varying NOT NULL,
    project_type character varying DEFAULT 'development'::character varying,
    priority character varying DEFAULT 'medium'::character varying,
    status character varying DEFAULT 'planning'::character varying,
    start_date date,
    target_end_date date,
    actual_end_date date,
    access_password character varying,
    is_public boolean DEFAULT false,
    progress_percentage numeric DEFAULT 0,
    total_tasks integer DEFAULT 0,
    completed_tasks integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 257 (class 1259 OID 18366)
-- Name: query_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.query_cache (
    cache_key text NOT NULL,
    cache_value jsonb NOT NULL,
    last_updated timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone NOT NULL
);


--
-- TOC entry 233 (class 1259 OID 17869)
-- Name: question_media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.question_media (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    question_id uuid NOT NULL,
    media_file_id uuid NOT NULL,
    media_type character varying NOT NULL,
    display_order integer DEFAULT 0,
    is_primary boolean DEFAULT false,
    caption text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 228 (class 1259 OID 17784)
-- Name: question_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.question_options (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    question_id uuid NOT NULL,
    option_text text NOT NULL,
    is_correct boolean DEFAULT false,
    ordering integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 229 (class 1259 OID 17800)
-- Name: question_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.question_responses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    submission_id uuid NOT NULL,
    question_id uuid NOT NULL,
    selected_options uuid[],
    code_answer text,
    essay_answer text,
    is_correct boolean,
    score integer DEFAULT 0,
    time_spent integer,
    feedback text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    selected_language character varying,
    last_auto_save timestamp with time zone,
    attempt_history jsonb DEFAULT '[]'::jsonb
);


--
-- TOC entry 252 (class 1259 OID 18296)
-- Name: security_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.security_events (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    event_type character varying NOT NULL,
    ip_address character varying,
    device_info jsonb DEFAULT '{}'::jsonb,
    event_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 250 (class 1259 OID 18258)
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    token character varying NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    last_active_at timestamp with time zone DEFAULT now(),
    user_agent text,
    ip_address character varying,
    device_info jsonb DEFAULT '{}'::jsonb,
    is_trusted boolean DEFAULT false,
    requires_2fa boolean DEFAULT true,
    has_completed_2fa boolean DEFAULT false
);


--
-- TOC entry 268 (class 1259 OID 19572)
-- Name: submission_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.submission_attachments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    submission_id uuid NOT NULL,
    media_file_id uuid NOT NULL,
    file_name character varying(255) NOT NULL,
    file_type character varying(100) NOT NULL,
    file_size bigint NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- TOC entry 213 (class 1259 OID 17465)
-- Name: system_statistics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_statistics_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 256 (class 1259 OID 18350)
-- Name: system_statistics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_statistics (
    id integer DEFAULT nextval('public.system_statistics_id_seq'::regclass) NOT NULL,
    active_users_count integer DEFAULT 0,
    total_users_count integer DEFAULT 0,
    total_clubs_count integer DEFAULT 0,
    total_events_count integer DEFAULT 0,
    total_assignments_count integer DEFAULT 0,
    total_comments_count integer DEFAULT 0,
    daily_active_users integer DEFAULT 0,
    weekly_active_users integer DEFAULT 0,
    monthly_active_users integer DEFAULT 0,
    "timestamp" timestamp with time zone DEFAULT now()
);


--
-- TOC entry 266 (class 1259 OID 19546)
-- Name: task_activity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_activity (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id uuid NOT NULL,
    user_id uuid NOT NULL,
    action character varying NOT NULL,
    field_changed character varying,
    old_value text,
    new_value text,
    comment text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 264 (class 1259 OID 19136)
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    project_id uuid NOT NULL,
    title character varying NOT NULL,
    description text,
    task_key character varying NOT NULL,
    task_type character varying DEFAULT 'task'::character varying,
    priority character varying DEFAULT 'medium'::character varying,
    status character varying DEFAULT 'todo'::character varying,
    assignee_id uuid,
    reporter_id uuid NOT NULL,
    parent_task_id uuid,
    story_points integer,
    time_spent_hours numeric DEFAULT 0,
    due_date timestamp with time zone,
    completed_date timestamp with time zone,
    is_completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 272 (class 1259 OID 19667)
-- Name: team_cards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_cards (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    page_type character varying NOT NULL,
    page_reference_id character varying,
    member_name character varying NOT NULL,
    member_role character varying NOT NULL,
    member_email character varying,
    member_phone character varying,
    avatar_url text,
    bio text,
    social_links jsonb DEFAULT '{}'::jsonb,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT team_cards_page_type_check CHECK (((page_type)::text = ANY ((ARRAY['landing'::character varying, 'club_home'::character varying])::text[])))
);


--
-- TOC entry 251 (class 1259 OID 18279)
-- Name: trusted_devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trusted_devices (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    device_identifier character varying NOT NULL,
    device_name character varying NOT NULL,
    device_type character varying,
    browser character varying,
    os character varying,
    ip_address character varying,
    last_used timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp with time zone DEFAULT (CURRENT_TIMESTAMP + '30 days'::interval),
    trust_level character varying DEFAULT 'login_only'::character varying
);


--
-- TOC entry 214 (class 1259 OID 17466)
-- Name: user_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_activities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 254 (class 1259 OID 18327)
-- Name: user_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_activities (
    id integer DEFAULT nextval('public.user_activities_id_seq'::regclass) NOT NULL,
    user_id uuid,
    action character varying NOT NULL,
    target_type character varying NOT NULL,
    target_id text,
    target_name text,
    details jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- TOC entry 255 (class 1259 OID 18341)
-- Name: user_badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_badges (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    badge_name character varying NOT NULL,
    badge_description text,
    badge_icon character varying,
    earned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 278 (class 1259 OID 20072)
-- Name: users_backup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users_backup (
    id uuid,
    email character varying,
    password_hash character varying,
    name character varying,
    username character varying,
    avatar text,
    role character varying,
    club_id character varying,
    bio text,
    social_links jsonb,
    preferences jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    profile_image_url text,
    profile_images jsonb,
    verification_photo_url text,
    phone_number character varying,
    date_of_birth date,
    address text,
    emergency_contact jsonb,
    phone character varying,
    location character varying,
    website character varying,
    github character varying,
    linkedin character varying,
    twitter character varying,
    email_verified boolean,
    email_verification_token character varying,
    email_verification_token_expires_at timestamp without time zone,
    password_reset_token character varying,
    password_reset_token_expires_at timestamp without time zone,
    oauth_provider character varying,
    oauth_id character varying,
    oauth_data jsonb,
    has_password boolean,
    totp_secret character varying,
    totp_temp_secret character varying,
    totp_temp_secret_created_at timestamp without time zone,
    totp_enabled boolean,
    totp_enabled_at timestamp without time zone,
    totp_recovery_codes jsonb,
    notification_preferences jsonb,
    email_otp_enabled boolean,
    email_otp_verified boolean,
    email_otp_secret character varying,
    email_otp_backup_codes jsonb,
    email_otp_last_used timestamp with time zone,
    email_otp_created_at timestamp with time zone,
    email_otp character(6),
    email_otp_expires_at timestamp with time zone,
    last_activity timestamp with time zone
);


--
-- TOC entry 4384 (class 0 OID 17634)
-- Dependencies: 222
-- Data for Name: ai_assignment_generations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ai_assignment_generations (id, template_id, generated_assignment_id, source_file_url, generation_prompt, ai_model_used, generation_status, questions_extracted, questions_created, processing_log, error_details, generated_by, created_at, completed_at) FROM stdin;
\.


--
-- TOC entry 4397 (class 0 OID 17916)
-- Dependencies: 235
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.announcements (id, title, content, author_id, club_id, priority, expires_at, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4387 (class 0 OID 17710)
-- Dependencies: 225
-- Data for Name: assignment_attempts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assignment_attempts (id, assignment_id, user_id, attempt_number, start_time, end_time, time_spent, score, max_score, percentage, is_passing, answers, graded_answers, violations, status, submitted_at, created_at, updated_at, is_fullscreen, auto_save_data, window_violations, last_auto_save, browser_info) FROM stdin;
\.


--
-- TOC entry 4388 (class 0 OID 17745)
-- Dependencies: 226
-- Data for Name: assignment_audit_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assignment_audit_log (id, assignment_id, user_id, attempt_id, action, details, created_at) FROM stdin;
\.


--
-- TOC entry 4385 (class 0 OID 17662)
-- Dependencies: 223
-- Data for Name: assignment_questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assignment_questions (id, assignment_id, question_text, question_type, marks, time_limit, code_language, code_template, test_cases, expected_output, solution, ordering, created_at, updated_at, type, title, description, options, correct_answer, points, question_order, starter_code, integer_min, integer_max, integer_step, explanation, allowed_languages, allow_any_language, question_image_url, question_image_alt, question_images, answer_images) FROM stdin;
\.


--
-- TOC entry 4386 (class 0 OID 17687)
-- Dependencies: 224
-- Data for Name: assignment_submissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assignment_submissions (id, assignment_id, user_id, submission_text, file_url, submitted_at, status, grade, feedback, started_at, completed_at, violation_count, time_spent, auto_submitted, ip_address, user_agent, total_score) FROM stdin;
\.


--
-- TOC entry 4383 (class 0 OID 17616)
-- Dependencies: 221
-- Data for Name: assignment_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assignment_templates (id, name, description, template_file_url, template_type, category, subject, difficulty_level, estimated_questions, created_by, is_active, usage_count, metadata, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4389 (class 0 OID 17770)
-- Dependencies: 227
-- Data for Name: assignment_violations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assignment_violations (id, submission_id, violation_type, occurred_at, details) FROM stdin;
\.


--
-- TOC entry 4382 (class 0 OID 17567)
-- Dependencies: 220
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assignments (id, title, description, club_id, created_by, due_date, max_points, instructions, status, created_at, updated_at, assignment_type, target_audience, target_clubs, time_limit, allow_navigation, passing_score, is_proctored, shuffle_questions, allow_calculator, show_results, allow_review, shuffle_options, max_attempts, is_published, coding_instructions, objective_instructions, mixed_instructions, essay_instructions, require_fullscreen, auto_submit_on_violation, max_violations, code_editor_settings, require_camera, require_microphone, require_face_verification, proctoring_settings, start_date, start_time) FROM stdin;
\.


--
-- TOC entry 4415 (class 0 OID 18312)
-- Dependencies: 253
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, user_id, action, resource_type, resource_id, old_values, new_values, metadata, ip_address, user_agent, created_at) FROM stdin;
476befb2-f0a7-4c75-b728-1643929af315	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T07:08:05.341Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 12:38:05.342015+05:30
cb88a7b9-fab0-4360-9f40-b3d89b172624	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T07:35:01.316Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 13:05:01.317235+05:30
01d34500-b3e5-4d6b-8ccb-a59701903104	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T07:49:38.946Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 13:19:38.947284+05:30
a38f4e1d-e3e9-40d9-8587-b9104a0e1ea5	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T07:51:06.496Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 13:21:06.497079+05:30
a3eb5775-86a8-43b0-a3cd-c60523879dbd	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T07:51:30.046Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 13:21:30.047012+05:30
e91cbe1c-cca8-4ff7-a4e6-3205c6dd7e26	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T07:51:50.902Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 13:21:50.902149+05:30
43c9937b-eaf5-4154-8ddf-86564a46c3b7	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T07:52:06.192Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 13:22:06.192214+05:30
7b49a346-84da-4d85-ab2b-1bd6744bc2cd	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T07:52:36.770Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 13:22:36.770332+05:30
e63c2f40-7d50-4157-9259-96edbb058790	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T07:53:53.065Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 13:23:53.065836+05:30
2b849e34-ec5f-4c93-9f11-829af999c463	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T07:56:37.278Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 13:26:37.27923+05:30
cb2867fd-a777-44de-8a69-8908a631772c	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T07:59:30.216Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 13:29:30.217922+05:30
ed15392a-4051-404d-92bf-f30366e35cb3	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T07:59:30.394Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 13:29:30.394482+05:30
339069a4-1d95-4ec1-8e5e-ea2865860ce1	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T08:02:02.778Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 13:32:02.778184+05:30
ee45c201-b6f7-4093-901c-a10b5d16c001	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T08:20:39.065Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 13:50:39.065697+05:30
690b6b5c-67c4-4ffb-8215-31c1ffa7375d	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T09:02:44.413Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 14:32:44.413705+05:30
9e595694-a86f-4675-bf8c-6cc43c43dc6a	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T09:15:45.735Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 14:45:45.735615+05:30
cbe2b508-d186-4a2f-896a-4d776276f568	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T09:24:11.182Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 14:54:11.1827+05:30
6369dd45-c9b1-4b5c-9858-47d0fded22e8	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T09:27:28.671Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 14:57:28.671738+05:30
412737a5-c6ab-47ec-9e4a-25b52138b573	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T09:45:11.316Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 15:15:11.3171+05:30
5972fd05-994c-4e56-9023-d979681ddcad	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T09:49:18.062Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 15:19:18.062727+05:30
cf273e24-29e4-4db6-a589-bcb577fa38e6	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T10:00:43.249Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 15:30:43.250216+05:30
bace91d4-091c-45d1-9d91-08f930929d44	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-08-23T19:25:02.029Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 00:55:02.030064+05:30
f3fcf83d-c162-4ba3-865e-36fb18b31b1c	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T10:08:32.733Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 15:38:32.786047+05:30
0f08d232-947c-4a90-9939-c337ada66dda	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T10:08:33.371Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 15:38:33.372071+05:30
0d9172eb-5073-42d7-b254-c024e0f6eecd	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T10:08:50.744Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 15:38:50.744509+05:30
a19c1a84-5524-4e14-9fb3-5274415d26c1	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T10:09:12.666Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 15:39:12.66682+05:30
c4a9ce8e-1176-4db6-aa5f-26728c4603b6	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T10:10:41.557Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 15:40:41.558578+05:30
1dbcf006-b9e6-4478-adb0-86c91b073acf	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T10:17:04.234Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 15:47:04.234929+05:30
04e2acb8-8261-4142-9564-b6e5b02e6044	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T10:17:04.576Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 15:47:04.576747+05:30
5ded6959-8341-4157-9cf9-20bd1049ac11	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T10:18:02.664Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 15:48:02.664908+05:30
319c9ae1-67bf-4541-af96-d7c9fcc51bc9	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T10:18:14.717Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 15:48:14.717582+05:30
ab36d265-6f05-400a-971e-0b42bfa21e22	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T10:18:55.686Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 15:48:55.686575+05:30
93486c87-408c-4cdd-acc9-c2d0d088fa39	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T10:19:13.471Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 15:49:13.472262+05:30
329f8b9b-ade4-4433-b9ee-5d8805b445a8	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T10:19:23.932Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 15:49:23.93233+05:30
56d3ee26-d18b-4a6f-b350-ef3024dd8836	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T10:19:34.115Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 15:49:34.115369+05:30
016060bd-7fcd-414a-a775-2ee0bb6b011b	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T10:19:44.109Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 15:49:44.109933+05:30
b87ccd6f-924b-40c0-9104-12e66651c55e	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T10:19:52.837Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 15:49:52.837612+05:30
cc0334da-4356-4783-9bf4-df54e108ca3c	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T10:20:03.844Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 15:50:03.8447+05:30
32f7941e-858d-4af2-bf52-8326f9ae76ba	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T10:20:13.796Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 15:50:13.796355+05:30
da7405ec-b0a4-4570-91e9-48d4fd1ed9d9	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T10:20:24.681Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 15:50:24.681665+05:30
d015f23b-adab-4160-98e0-193ac379a57a	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T10:20:33.795Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 15:50:33.795828+05:30
41d55cd9-17ec-4ef7-aefc-6fe7150900dc	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T10:20:50.926Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 15:50:50.926866+05:30
97d6a989-5cdb-45ac-a2c3-00ea9f5f94c7	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T10:21:08.017Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 15:51:08.017984+05:30
4cccf4c8-3ae2-487a-9665-b6d67d524a81	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-08-23T19:32:22.645Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 01:02:22.645613+05:30
5c9d4fac-2ed7-4151-8fa9-637c8ffb1fe5	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T10:21:42.631Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 15:51:42.631449+05:30
5bf212ec-52f7-4d8e-bfa2-bd8d55415fba	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T10:28:01.725Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 15:58:01.726009+05:30
119c9abe-25ce-4486-9de9-b1db526134d4	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T10:55:28.809Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 16:25:28.809711+05:30
b530abac-8890-43e2-8329-221ffa5be8b5	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T11:03:42.690Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 16:33:42.690985+05:30
3a34fb42-8d2a-4202-94c6-b20bc1253223	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T11:05:28.544Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 16:35:28.54514+05:30
fa8b54b5-2a58-4da7-a087-142a4d4f468c	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T11:06:30.293Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 16:36:30.293614+05:30
99c883c5-00a0-4c3e-a28e-6621090d80e6	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T11:06:43.151Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 16:36:43.152226+05:30
e7c41fa8-4fb4-4283-8969-366c3f8f2591	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T11:11:32.729Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 16:41:32.7299+05:30
91a65492-1d3c-4fb5-b78e-22d87ff4d7aa	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T11:15:03.625Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 16:45:03.625841+05:30
4583f2b8-9dcd-41c3-8edc-a36a36ed6fa4	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T11:58:06.611Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 17:28:06.611576+05:30
00beaade-1ee5-466b-9a37-4c0b9a46b2e4	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T12:35:47.585Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 18:05:47.58568+05:30
b9be2565-622d-468d-a036-9ea796291901	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T12:42:55.868Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 18:12:55.869288+05:30
fd1e421a-3982-4802-88fa-25a569244a9b	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T12:52:01.253Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 18:22:01.254632+05:30
5c80edb8-495c-4b4a-a47a-169a756c94d6	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T12:53:12.681Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 18:23:12.681377+05:30
a44a4ab9-a4a3-4b82-9e24-432c6efcdb48	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T12:59:04.019Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 18:29:04.020129+05:30
d7effe69-2f27-4182-b82d-80f16a16e6cc	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T13:14:00.958Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 18:44:00.95994+05:30
820a97d7-e350-4f35-a837-45369c688f4e	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T13:27:07.260Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 18:57:07.260992+05:30
afe55038-4c61-4702-b17c-eb7ffad67f43	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T13:32:12.583Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 19:02:12.583834+05:30
25d6bb7f-f9e2-4b80-8a83-4b0921185f7e	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T13:40:51.620Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 19:10:51.621441+05:30
a015960a-459a-493f-8a44-f13bd78cdf10	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T14:12:31.952Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 19:42:31.952501+05:30
6f1b5b11-105e-4117-8783-60a5a89e2884	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T14:18:16.809Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 19:48:16.81037+05:30
50695684-85b4-4b14-9c15-c565331c5180	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-16T18:22:04.389Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-16 23:52:04.390333+05:30
5b139791-9427-4ea7-9873-59cd629eb371	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T14:23:08.734Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 19:53:08.734988+05:30
b389b017-5984-4b61-a8a1-44d2c6afed68	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T17:02:31.026Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 22:32:31.026617+05:30
69fe45d6-ddfc-4b4f-91ed-53dd4fcbabc2	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T17:05:34.228Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 22:35:34.228879+05:30
44d0f5e0-5ac9-4b14-b1f5-553d8f72646e	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T17:21:49.975Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 22:51:49.976061+05:30
d1adf258-2f43-48ed-8d56-dbbded364ec1	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T17:55:16.317Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 23:25:16.318327+05:30
b491b922-e5e1-4863-a620-ac7f3f5d9357	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T17:56:10.098Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 23:26:10.098832+05:30
19856fa4-565a-4da4-a9a8-9a42b8fe7ee5	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T18:03:06.326Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 23:33:06.326752+05:30
1f12ef23-4ede-4462-9ed1-7fa6d107355d	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "eb7b848c-cc67-4089-869b-a4e3f5cc9280", "timestamp": "2025-08-21T18:10:42.081Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.103.0 Chrome/138.0.7204.100 Electron/37.2.3 Safari/537.36	2025-08-21 23:40:42.081844+05:30
20c3ddfc-2345-4a8c-b6a8-e36842fca88d	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "eb7b848c-cc67-4089-869b-a4e3f5cc9280", "timestamp": "2025-08-21T18:10:46.946Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.103.0 Chrome/138.0.7204.100 Electron/37.2.3 Safari/537.36	2025-08-21 23:40:46.94671+05:30
cbd1b6eb-c457-4991-b1c9-d6d5ee1809bb	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T18:15:30.845Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 23:45:30.846377+05:30
69d57aa9-aed9-4185-b109-8fb9d7778662	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T18:29:22.202Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-21 23:59:22.202494+05:30
f1e40a89-566d-4ff8-adf3-288402f854b1	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T18:30:24.018Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-22 00:00:24.018903+05:30
ffe79013-71db-4df9-8acf-00a58d8ad438	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T18:43:04.259Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-22 00:13:04.259632+05:30
36d0e03c-198a-4207-aa08-cd077f377972	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "bb191d33-6c2b-4c29-80c7-0e61f13f77d1", "timestamp": "2025-08-21T18:43:26.608Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-22 00:13:26.609148+05:30
ee1f1863-6edb-4950-82ba-248412cac60f	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "e9c762ea-9363-417f-9311-4a49e71ca9a4", "timestamp": "2025-08-21T18:58:51.464Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-22 00:28:51.465197+05:30
d411e5a7-0cf8-4223-9fd5-26dbbb6febf9	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "e9c762ea-9363-417f-9311-4a49e71ca9a4", "timestamp": "2025-08-21T19:03:48.819Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-22 00:33:48.819779+05:30
7346e3b9-645f-4d18-95ca-a5c10b934c4a	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "e9c762ea-9363-417f-9311-4a49e71ca9a4", "timestamp": "2025-08-21T19:04:24.632Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-22 00:34:24.633009+05:30
b60a8703-25ad-40ea-87ca-5990140a86be	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "e9c762ea-9363-417f-9311-4a49e71ca9a4", "timestamp": "2025-08-21T19:11:21.379Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-22 00:41:21.379318+05:30
ce0b94ab-0bb1-4ba6-bc43-aa3307783628	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "e9c762ea-9363-417f-9311-4a49e71ca9a4", "timestamp": "2025-08-21T19:12:32.385Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-22 00:42:32.385475+05:30
10cd6066-e738-4043-9ce0-1c32bbb7ead3	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "e9c762ea-9363-417f-9311-4a49e71ca9a4", "timestamp": "2025-08-21T19:15:40.637Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-22 00:45:40.637718+05:30
dcd00647-e279-48ef-9c28-c11842ef8747	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "e9c762ea-9363-417f-9311-4a49e71ca9a4", "timestamp": "2025-08-21T19:16:16.210Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-22 00:46:16.211031+05:30
ec03d7ab-b044-47dc-a499-e8a7e43d29cf	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "e9c762ea-9363-417f-9311-4a49e71ca9a4", "timestamp": "2025-08-21T19:45:26.624Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-22 01:15:26.625189+05:30
7b1329fe-623e-4297-84a2-5d1a2713ee89	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "6c05eb68-9879-4b6a-8182-a824320271b5", "timestamp": "2025-08-22T04:38:44.774Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-22 10:08:44.774953+05:30
ff3f15c2-0d17-42e6-a4dd-73d24f854247	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "6c05eb68-9879-4b6a-8182-a824320271b5", "timestamp": "2025-08-22T04:43:42.527Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-22 10:13:42.527698+05:30
317be11f-de9f-4b6d-b859-43e7ecb567a3	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "6c05eb68-9879-4b6a-8182-a824320271b5", "timestamp": "2025-08-22T04:48:17.716Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-22 10:18:17.717122+05:30
23ab4861-790f-473d-a2a4-ce49dd02d705	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "6c05eb68-9879-4b6a-8182-a824320271b5", "timestamp": "2025-08-22T05:41:12.973Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-22 11:11:12.97399+05:30
7cf8db2c-0476-4b6f-8d14-3e1716ef1d95	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "6c05eb68-9879-4b6a-8182-a824320271b5", "timestamp": "2025-08-22T06:38:55.354Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-22 12:08:55.354582+05:30
feb403d2-d7dd-4279-9b51-90194448d5f5	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "6c05eb68-9879-4b6a-8182-a824320271b5", "timestamp": "2025-08-22T07:23:21.831Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-22 12:53:21.83181+05:30
d258814a-eb2a-4fdd-bfbd-0c817bf4b4ed	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "6c05eb68-9879-4b6a-8182-a824320271b5", "timestamp": "2025-08-22T10:31:46.897Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-22 16:01:46.898171+05:30
2930fa52-93cb-45e9-b341-d86c03b4d939	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "051b882c-51e1-4d3b-96b0-d64e5e924edd", "timestamp": "2025-08-22T10:51:47.684Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-22 16:21:47.685635+05:30
0894020b-ed5a-4cd9-92a9-9c1b71a00515	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "051b882c-51e1-4d3b-96b0-d64e5e924edd", "timestamp": "2025-08-22T15:16:28.509Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-22 20:46:28.510318+05:30
5971f391-2289-4fe2-8512-9312e58f40b1	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "051b882c-51e1-4d3b-96b0-d64e5e924edd", "timestamp": "2025-08-22T17:00:39.395Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-22 22:30:39.396226+05:30
19c2104a-5b6c-4a79-8ea1-7fbadde3e76f	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "051b882c-51e1-4d3b-96b0-d64e5e924edd", "timestamp": "2025-08-22T17:00:53.872Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-22 22:30:53.87257+05:30
0e0b3514-6544-4ffd-84a6-524e53d84bfb	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "051b882c-51e1-4d3b-96b0-d64e5e924edd", "timestamp": "2025-08-22T17:03:42.613Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-22 22:33:42.613872+05:30
b3b1a520-ec6f-4ee3-91ab-a686e86d8fe6	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "051b882c-51e1-4d3b-96b0-d64e5e924edd", "timestamp": "2025-08-22T17:12:49.891Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-22 22:42:49.891507+05:30
d51aa642-b09f-4f8b-aefb-4b322c5c5245	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "051b882c-51e1-4d3b-96b0-d64e5e924edd", "timestamp": "2025-08-22T17:12:57.715Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-22 22:42:57.715777+05:30
b380c602-a183-4b70-bf01-901bd8a8270b	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "051b882c-51e1-4d3b-96b0-d64e5e924edd", "timestamp": "2025-08-22T17:31:25.168Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-22 23:01:25.168199+05:30
3b3334cd-ac38-4bf4-b1d0-f513a26fb71e	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "051b882c-51e1-4d3b-96b0-d64e5e924edd", "timestamp": "2025-08-22T17:49:42.041Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-22 23:19:42.041862+05:30
2aebd841-dce7-47ed-bde4-a57d7e1f115d	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "051b882c-51e1-4d3b-96b0-d64e5e924edd", "timestamp": "2025-08-22T17:53:06.178Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-22 23:23:06.178299+05:30
e3c59aed-bf25-42a8-8716-e90038e07a75	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "051b882c-51e1-4d3b-96b0-d64e5e924edd", "timestamp": "2025-08-22T17:54:21.974Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-22 23:24:21.974428+05:30
826e7272-a253-4c4b-bc6b-99b36aac09c1	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "051b882c-51e1-4d3b-96b0-d64e5e924edd", "timestamp": "2025-08-22T17:55:46.896Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-22 23:25:46.897167+05:30
42c4ddfa-9d2c-45fd-b01d-3588d443f43a	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "051b882c-51e1-4d3b-96b0-d64e5e924edd", "timestamp": "2025-08-22T17:56:19.079Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-22 23:26:19.07985+05:30
cb665e07-2d17-4882-8d1b-62f2269a12a4	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-16T18:34:10.647Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-17 00:04:10.648113+05:30
cb92a600-b3f2-4780-9a09-2a63e43ccd9b	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "051b882c-51e1-4d3b-96b0-d64e5e924edd", "timestamp": "2025-08-22T17:57:30.882Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-22 23:27:30.882563+05:30
ed73278b-7943-46bd-80f8-4bfee012e646	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "051b882c-51e1-4d3b-96b0-d64e5e924edd", "timestamp": "2025-08-22T17:58:47.759Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-22 23:28:47.760237+05:30
831903f6-f71b-44a7-91af-77c8fda6f787	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "051b882c-51e1-4d3b-96b0-d64e5e924edd", "timestamp": "2025-08-22T17:59:11.418Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-22 23:29:11.420508+05:30
ab592f93-9739-4bc7-a180-63ba5355739d	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "051b882c-51e1-4d3b-96b0-d64e5e924edd", "timestamp": "2025-08-22T18:01:13.649Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-22 23:31:13.64997+05:30
7fedda70-8f9a-4d44-9aae-8d00b77858d8	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "051b882c-51e1-4d3b-96b0-d64e5e924edd", "timestamp": "2025-08-22T18:01:45.715Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-22 23:31:45.715964+05:30
0bb8cea9-db4b-4a94-bf71-ea5186456b41	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "051b882c-51e1-4d3b-96b0-d64e5e924edd", "timestamp": "2025-08-22T18:02:43.862Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-22 23:32:43.86353+05:30
6859061d-ee3e-4058-9e5c-145270cd684c	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "051b882c-51e1-4d3b-96b0-d64e5e924edd", "timestamp": "2025-08-22T18:12:35.620Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-22 23:42:35.620991+05:30
05812432-5b73-4c2d-89db-d6d8cf1d5d6c	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "051b882c-51e1-4d3b-96b0-d64e5e924edd", "timestamp": "2025-08-22T18:50:33.078Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 00:20:33.079088+05:30
0c55bc9d-5e1b-4c27-a615-4a53a6b2235b	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "051b882c-51e1-4d3b-96b0-d64e5e924edd", "timestamp": "2025-08-22T18:51:34.283Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 00:21:34.28388+05:30
1a5ed120-3e3c-4e34-9d8f-cdfee2d7bd26	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "051b882c-51e1-4d3b-96b0-d64e5e924edd", "timestamp": "2025-08-22T19:28:56.501Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 00:58:56.501435+05:30
55b7a83a-8f27-40a8-b86e-ca79ed3dde6b	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "051b882c-51e1-4d3b-96b0-d64e5e924edd", "timestamp": "2025-08-22T19:41:46.804Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 01:11:46.805077+05:30
e85902a3-64ae-42fe-bc4a-8e99d1998ad3	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "051b882c-51e1-4d3b-96b0-d64e5e924edd", "timestamp": "2025-08-22T19:57:39.013Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 01:27:39.013431+05:30
23c0d8f7-b8fb-4a89-9968-d1a5b652d5fd	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "051b882c-51e1-4d3b-96b0-d64e5e924edd", "timestamp": "2025-08-22T20:21:46.990Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 01:51:46.990762+05:30
2a589b45-0d42-4280-a87a-9c15cd714331	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "051b882c-51e1-4d3b-96b0-d64e5e924edd", "timestamp": "2025-08-22T20:27:59.311Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 01:57:59.311889+05:30
535fcb86-64ea-497c-9a2c-9e88f17fc6cc	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "051b882c-51e1-4d3b-96b0-d64e5e924edd", "timestamp": "2025-08-22T20:28:07.215Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 01:58:07.215735+05:30
446c3715-94c8-4547-966d-d0efee657b82	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "051b882c-51e1-4d3b-96b0-d64e5e924edd", "timestamp": "2025-08-22T20:51:16.271Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 02:21:16.272517+05:30
628855d4-d1c0-4aa8-bea3-0439e13affbc	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "dfb67aca-0bc8-4666-b58f-0fe50cb3591d", "timestamp": "2025-08-23T04:20:25.600Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 09:50:25.601651+05:30
3803c234-7650-4338-8f8e-2941b817336a	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "57c0e273-e448-44a6-819c-3a97b180eac1", "timestamp": "2025-08-23T05:00:55.226Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 10:30:55.22704+05:30
35ea399a-cfdc-4725-9684-c2c184081422	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "83b9c348-765d-4b81-b3d0-bbeb695329d8", "timestamp": "2025-08-23T05:28:20.398Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 10:58:20.398697+05:30
46c0775f-9d33-4457-a939-cc696f62c504	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "83b9c348-765d-4b81-b3d0-bbeb695329d8", "timestamp": "2025-08-23T05:38:07.903Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 11:08:07.904643+05:30
57d0aa6f-ed0d-4548-8a71-2bcd42b36949	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "83b9c348-765d-4b81-b3d0-bbeb695329d8", "timestamp": "2025-08-23T06:02:19.001Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 11:32:19.002243+05:30
ac32882a-f547-4874-a0ef-5dd587aaae9d	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-16T19:10:18.758Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-17 00:40:18.759294+05:30
5aed3815-e65d-44d4-aaa9-261a8cdea54e	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "83b9c348-765d-4b81-b3d0-bbeb695329d8", "timestamp": "2025-08-23T06:02:19.205Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 11:32:19.206134+05:30
b9604589-0ace-462e-9883-c39507c210e5	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "83b9c348-765d-4b81-b3d0-bbeb695329d8", "timestamp": "2025-08-23T06:02:29.339Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 11:32:29.339975+05:30
4ca60a50-4c77-4d91-baca-638de436e408	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "83b9c348-765d-4b81-b3d0-bbeb695329d8", "timestamp": "2025-08-23T06:02:36.308Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 11:32:36.309438+05:30
67a41347-2b15-4806-8bfc-3cb892c9b62f	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "83b9c348-765d-4b81-b3d0-bbeb695329d8", "timestamp": "2025-08-23T06:05:18.152Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 11:35:18.152933+05:30
62ab7191-9958-4125-9a5c-5aa7d8baf60e	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "83b9c348-765d-4b81-b3d0-bbeb695329d8", "timestamp": "2025-08-23T06:05:25.087Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 11:35:25.08795+05:30
07fef68e-34da-4995-a86b-e9ac673e3fb5	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "83b9c348-765d-4b81-b3d0-bbeb695329d8", "timestamp": "2025-08-23T06:05:37.396Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 11:35:37.396479+05:30
966d4e38-1404-4ab3-bff6-c2c49f2afcd0	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "83b9c348-765d-4b81-b3d0-bbeb695329d8", "timestamp": "2025-08-23T06:06:00.187Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 11:36:00.188105+05:30
b695bfa6-0927-4c09-8402-2bf3aaa06763	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "83b9c348-765d-4b81-b3d0-bbeb695329d8", "timestamp": "2025-08-23T06:18:34.883Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 11:48:34.884408+05:30
7bdb2e97-3789-4a25-935f-f1db2056abda	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "83b9c348-765d-4b81-b3d0-bbeb695329d8", "timestamp": "2025-08-23T06:30:06.933Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 12:00:06.933967+05:30
ef814fa7-a66f-4294-a67a-9b597ab07272	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "83b9c348-765d-4b81-b3d0-bbeb695329d8", "timestamp": "2025-08-23T06:30:16.071Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 12:00:16.071711+05:30
eee5e509-bad1-487c-a536-2c99e8a35743	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "83b9c348-765d-4b81-b3d0-bbeb695329d8", "timestamp": "2025-08-23T06:30:41.451Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 12:00:41.451942+05:30
81336e48-a40d-42ed-8308-e356de577615	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "83b9c348-765d-4b81-b3d0-bbeb695329d8", "timestamp": "2025-08-23T06:32:29.473Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 12:02:29.473275+05:30
3ee994c6-8bc3-47c3-8601-6187b2c34dbd	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "83b9c348-765d-4b81-b3d0-bbeb695329d8", "timestamp": "2025-08-23T06:33:06.155Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 12:03:06.15697+05:30
e3895867-a9da-46d7-b64f-550f37c92e0e	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "83b9c348-765d-4b81-b3d0-bbeb695329d8", "timestamp": "2025-08-23T06:55:57.714Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 12:25:57.715148+05:30
8ad401a5-5ebf-453b-a7a0-8db087dd9ba1	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "83b9c348-765d-4b81-b3d0-bbeb695329d8", "timestamp": "2025-08-23T07:12:18.377Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 12:42:18.377273+05:30
a8ac5afe-98fd-42a8-948c-a0c97cb54849	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "83b9c348-765d-4b81-b3d0-bbeb695329d8", "timestamp": "2025-08-23T07:12:18.596Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 12:42:18.596522+05:30
8e2ae35c-4db2-42a1-95b6-7d53f5f7f64a	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "83b9c348-765d-4b81-b3d0-bbeb695329d8", "timestamp": "2025-08-23T07:12:58.930Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 12:42:58.930419+05:30
27e4663a-744f-463d-bea8-6b3f7d6c2f3e	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "83b9c348-765d-4b81-b3d0-bbeb695329d8", "timestamp": "2025-08-23T07:12:59.132Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 12:42:59.132831+05:30
f4879876-a43f-40c8-b026-1dd2db6e708f	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "83b9c348-765d-4b81-b3d0-bbeb695329d8", "timestamp": "2025-08-23T07:13:31.698Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 12:43:31.698948+05:30
ae7e2d50-1b17-4fb1-8f5f-08622f1ad262	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "83b9c348-765d-4b81-b3d0-bbeb695329d8", "timestamp": "2025-08-23T07:14:24.764Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 12:44:24.765081+05:30
d4922c2d-a210-462e-9c50-19013f9b867f	550e8400-e29b-41d4-a716-446655440300	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "8e3d8b3d-a6ac-4db5-aec3-38e2b9b1c48d", "timestamp": "2025-08-23T12:12:23.762Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 17:42:23.763808+05:30
134d0442-9fb2-4ecb-8d37-be21953bff81	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-17T05:46:13.103Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-17 11:16:13.105262+05:30
73760053-0eeb-4d0b-9446-9a94cdee7487	550e8400-e29b-41d4-a716-446655440300	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "8e3d8b3d-a6ac-4db5-aec3-38e2b9b1c48d", "timestamp": "2025-08-23T12:46:15.149Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 18:16:15.149645+05:30
b875ad3e-5d0e-49ad-9b04-6bc416594286	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "ee251fa8-38e2-4c70-bc5e-5ff196a94439", "timestamp": "2025-08-23T12:52:32.420Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 18:22:32.420446+05:30
72415d31-7f19-48b9-bfc7-e8cc24de1aad	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "ee251fa8-38e2-4c70-bc5e-5ff196a94439", "timestamp": "2025-08-23T13:12:05.806Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 18:42:05.806977+05:30
3a30ab12-3152-4cae-9d3f-f73104b04d6b	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "ee251fa8-38e2-4c70-bc5e-5ff196a94439", "timestamp": "2025-08-23T14:59:46.365Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 20:29:46.365601+05:30
0412cd12-72bb-4ead-b243-80c435359c76	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "ee251fa8-38e2-4c70-bc5e-5ff196a94439", "timestamp": "2025-08-23T15:37:46.123Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 21:07:46.123543+05:30
24d1272a-0794-43c2-98e6-0e2afccc66fc	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "ee251fa8-38e2-4c70-bc5e-5ff196a94439", "timestamp": "2025-08-23T15:40:08.739Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 21:10:08.739774+05:30
a6d15639-2bf9-43fc-9f48-de57ead8dff6	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "ee251fa8-38e2-4c70-bc5e-5ff196a94439", "timestamp": "2025-08-23T15:48:24.871Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 21:18:24.871543+05:30
5d337f48-c187-4faf-aae4-16b6eb8ca144	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "ee251fa8-38e2-4c70-bc5e-5ff196a94439", "timestamp": "2025-08-23T16:03:12.399Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 21:33:12.399684+05:30
a989f59a-55c6-449c-9a36-56e0f2547a7b	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "ee251fa8-38e2-4c70-bc5e-5ff196a94439", "timestamp": "2025-08-23T16:03:12.594Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 21:33:12.594243+05:30
d3afcc84-1798-4b20-b709-b3b435844fbf	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "ee251fa8-38e2-4c70-bc5e-5ff196a94439", "timestamp": "2025-08-23T16:04:40.986Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 21:34:40.986764+05:30
fb842e1c-01f0-4c18-a028-c195a6fe1288	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "ee251fa8-38e2-4c70-bc5e-5ff196a94439", "timestamp": "2025-08-23T16:50:59.765Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 22:20:59.766282+05:30
141a3cd2-5dc6-4ea9-bb15-2c27cd72a0a0	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "ee251fa8-38e2-4c70-bc5e-5ff196a94439", "timestamp": "2025-08-23T17:51:01.727Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 23:21:01.727791+05:30
28bd153d-865f-49d8-8d41-11e1cc5c0516	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "ee251fa8-38e2-4c70-bc5e-5ff196a94439", "timestamp": "2025-08-23T18:04:40.153Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 23:34:40.153565+05:30
4a7a711d-403d-4e98-a2ec-42a2b59cbe03	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "ee251fa8-38e2-4c70-bc5e-5ff196a94439", "timestamp": "2025-08-23T18:17:15.311Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 23:47:15.312406+05:30
77b17edb-77a0-4073-8915-4a68eede088c	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "ee251fa8-38e2-4c70-bc5e-5ff196a94439", "timestamp": "2025-08-23T18:44:26.823Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 00:14:26.823674+05:30
f93cd2e5-2ae1-411f-9001-f492005f3bae	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "ee251fa8-38e2-4c70-bc5e-5ff196a94439", "timestamp": "2025-08-23T18:54:27.794Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 00:24:27.794528+05:30
f9650304-7963-40c9-9d62-03a1a2de0b6b	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "ee251fa8-38e2-4c70-bc5e-5ff196a94439", "timestamp": "2025-08-23T18:54:27.994Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 00:24:27.99465+05:30
2654bc5f-85fa-41bd-badc-c468186c71b2	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "ee251fa8-38e2-4c70-bc5e-5ff196a94439", "timestamp": "2025-08-23T19:06:08.220Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 00:36:08.22093+05:30
eb115d09-cbb0-42b2-b874-08f2d2c63d44	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "ee251fa8-38e2-4c70-bc5e-5ff196a94439", "timestamp": "2025-08-23T19:06:28.967Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 00:36:28.967862+05:30
d3df8341-44a4-458d-a8e8-67b202399480	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "ee251fa8-38e2-4c70-bc5e-5ff196a94439", "timestamp": "2025-08-23T19:08:21.185Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 00:38:21.185937+05:30
c4618b82-bba2-4b21-a770-76646050822f	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "ee251fa8-38e2-4c70-bc5e-5ff196a94439", "timestamp": "2025-08-23T19:24:40.473Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 00:54:40.473308+05:30
ffcbade1-bda1-49f8-8272-3dc3f7868717	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-08-23T19:24:44.545Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 00:54:44.546627+05:30
8ce12e9e-27c2-4f3c-90b7-191d0dd9106d	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "84fe05d5-6de7-425f-bd95-e0eb10c84238", "timestamp": "2025-08-23T20:24:59.537Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 01:54:59.537505+05:30
5df00439-cd62-4d2c-980d-764fcd71a7c7	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "84fe05d5-6de7-425f-bd95-e0eb10c84238", "timestamp": "2025-08-23T20:25:15.389Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 01:55:15.389772+05:30
6a3bdeec-9509-451d-9e9e-e752c72f4cee	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "84fe05d5-6de7-425f-bd95-e0eb10c84238", "timestamp": "2025-08-23T20:51:44.739Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 02:21:44.739439+05:30
1a811ec1-7b94-4b6e-810a-e5f39a7a24f8	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "07bcacb4-381c-4ad4-b022-ece95e94e90b", "timestamp": "2025-08-24T04:05:24.004Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 09:35:24.004703+05:30
7d71f076-2d11-4191-ba5f-f2113c3fcba6	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "07bcacb4-381c-4ad4-b022-ece95e94e90b", "timestamp": "2025-08-24T04:06:50.855Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 09:36:50.855652+05:30
b56e6825-0fe3-46cc-8f63-3fccc1017124	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "07bcacb4-381c-4ad4-b022-ece95e94e90b", "timestamp": "2025-08-24T04:07:34.288Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 09:37:34.289019+05:30
29404486-4572-41f4-a1cf-07044cb2652e	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "07bcacb4-381c-4ad4-b022-ece95e94e90b", "timestamp": "2025-08-24T04:08:07.258Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 09:38:07.258866+05:30
368912cd-3b1a-4325-a450-c8efc4b31441	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "07bcacb4-381c-4ad4-b022-ece95e94e90b", "timestamp": "2025-08-24T04:08:24.584Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 09:38:24.585256+05:30
75abb8bb-3de7-4f2a-b2c1-a0f68ba1020d	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "07bcacb4-381c-4ad4-b022-ece95e94e90b", "timestamp": "2025-08-24T04:09:15.238Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 09:39:15.238813+05:30
f6a26508-1e28-4812-b60c-05cfc4443a6a	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "07bcacb4-381c-4ad4-b022-ece95e94e90b", "timestamp": "2025-08-24T04:11:59.318Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 09:41:59.318295+05:30
3cdc6a55-68c6-4c58-9c93-58cd914aecc3	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "07bcacb4-381c-4ad4-b022-ece95e94e90b", "timestamp": "2025-08-24T04:32:52.484Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 10:02:52.484833+05:30
802414b6-229c-4beb-9c3d-8042013c86c8	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "1e342a88-6bf3-4bc4-ab01-6c34b058a979", "timestamp": "2025-08-24T05:00:55.993Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 10:30:55.994134+05:30
ed0ada23-107b-4f5c-9573-1cfe69b02146	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "1e342a88-6bf3-4bc4-ab01-6c34b058a979", "timestamp": "2025-08-24T05:05:29.973Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 10:35:29.973411+05:30
c5ea7424-5e34-4a44-8993-3273993159f7	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "1e342a88-6bf3-4bc4-ab01-6c34b058a979", "timestamp": "2025-08-24T05:05:52.037Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 10:35:52.037309+05:30
fa4feba5-a6f9-489a-9f25-22fe3ec79378	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "df76f48d-b34f-4a9e-831d-50668cfad05e", "timestamp": "2025-08-24T07:23:25.434Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 12:53:25.435454+05:30
a6a31528-3b56-4a93-b57f-73400d244dc5	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "df76f48d-b34f-4a9e-831d-50668cfad05e", "timestamp": "2025-08-24T07:24:55.530Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 12:54:55.530568+05:30
a284111f-4def-4bdb-8310-94de0de121b0	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "df76f48d-b34f-4a9e-831d-50668cfad05e", "timestamp": "2025-08-24T07:39:56.249Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 13:09:56.249925+05:30
ed33fd4b-fe3e-48bb-ab76-7039758f9c10	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "df76f48d-b34f-4a9e-831d-50668cfad05e", "timestamp": "2025-08-24T07:40:49.154Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 13:10:49.155703+05:30
015d8a3d-a270-4424-b621-b8d3ca832b6b	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "df76f48d-b34f-4a9e-831d-50668cfad05e", "timestamp": "2025-08-24T07:41:46.627Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 13:11:46.627537+05:30
74ffb83a-bad3-4dcb-977d-7bb826874234	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "df76f48d-b34f-4a9e-831d-50668cfad05e", "timestamp": "2025-08-24T07:54:25.626Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 13:24:25.627358+05:30
c3c3eaeb-0cb7-4aef-991a-f95927e29f82	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "df76f48d-b34f-4a9e-831d-50668cfad05e", "timestamp": "2025-08-24T07:56:07.391Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 13:26:07.391728+05:30
6a1f7cdb-c06e-44b1-90be-710e75dbf592	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-17T06:15:57.416Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-17 11:45:57.419829+05:30
d0d561b5-cb53-45e2-8dd8-2d964463744b	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "df76f48d-b34f-4a9e-831d-50668cfad05e", "timestamp": "2025-08-24T07:56:22.949Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 13:26:22.949796+05:30
5296ca75-b484-4c16-8452-3615c6e2d9c3	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "df76f48d-b34f-4a9e-831d-50668cfad05e", "timestamp": "2025-08-24T07:57:33.540Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 13:27:33.541081+05:30
67ecd8b2-690b-4fd9-af2f-b6cea3625d80	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "a3417188-fddf-4608-a800-7edf7ed41540", "timestamp": "2025-08-24T08:06:48.678Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 13:36:48.678407+05:30
e9ab40fd-b342-4382-90be-6bc76f123c94	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "a3417188-fddf-4608-a800-7edf7ed41540", "timestamp": "2025-08-24T08:07:10.021Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 13:37:10.021531+05:30
53ce9f35-6b2c-4c6a-a15d-ee416b417872	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "a3417188-fddf-4608-a800-7edf7ed41540", "timestamp": "2025-08-24T08:16:58.010Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 13:46:58.010487+05:30
4d75315c-39f5-4f82-bcf3-330274ee4264	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "a3417188-fddf-4608-a800-7edf7ed41540", "timestamp": "2025-08-24T08:20:27.522Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 13:50:27.522681+05:30
0204ecd1-c87d-4a53-830a-30aed870e771	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "a3417188-fddf-4608-a800-7edf7ed41540", "timestamp": "2025-08-24T08:29:10.071Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 13:59:10.072155+05:30
4daad1a0-5583-4bcd-a9fe-02bb177db961	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "a3417188-fddf-4608-a800-7edf7ed41540", "timestamp": "2025-08-24T08:29:42.391Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 13:59:42.391778+05:30
059f203d-5839-49be-b049-04fd8361371e	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "a3417188-fddf-4608-a800-7edf7ed41540", "timestamp": "2025-08-24T08:31:32.807Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 14:01:32.807637+05:30
fe652876-6f1e-4938-96de-bcfa322292dd	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "2fe12d74-42c4-4bbc-84c2-2c111271e18a", "timestamp": "2025-08-24T08:43:53.475Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 14:13:53.476298+05:30
4b44fce8-395a-4566-a0e3-3c58593f8ac1	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "2fe12d74-42c4-4bbc-84c2-2c111271e18a", "timestamp": "2025-08-24T09:02:33.615Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 14:32:33.615256+05:30
91de8a31-2e09-4915-b62b-895561c6b0b6	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "2fe12d74-42c4-4bbc-84c2-2c111271e18a", "timestamp": "2025-08-24T09:02:33.851Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 14:32:33.852101+05:30
d428ebda-ffc9-40a1-801c-1bfc8dd4bb7b	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "2fe12d74-42c4-4bbc-84c2-2c111271e18a", "timestamp": "2025-08-24T09:09:11.369Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 14:39:11.369712+05:30
c867020a-6466-4ba5-84d5-1d1a445538a3	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "2fe12d74-42c4-4bbc-84c2-2c111271e18a", "timestamp": "2025-08-24T09:11:45.179Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 14:41:45.179855+05:30
bf0d5949-d2cc-4550-a2e1-5c232b566447	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "2fa6d287-f4eb-49a1-a6bb-aaa82f93aaad", "timestamp": "2025-08-24T09:22:06.310Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 14:52:06.311243+05:30
0531c8cc-ffa7-4abe-917c-921518c5c0fe	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "2fa6d287-f4eb-49a1-a6bb-aaa82f93aaad", "timestamp": "2025-08-24T09:27:56.421Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 14:57:56.421416+05:30
dd602d7e-22a1-43f3-9624-91fd2f72bf41	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "2fe12d74-42c4-4bbc-84c2-2c111271e18a", "timestamp": "2025-08-24T09:28:04.347Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 14:58:04.347944+05:30
0c3210d6-63b5-4b84-b60c-576ca9b97083	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "2fa6d287-f4eb-49a1-a6bb-aaa82f93aaad", "timestamp": "2025-08-24T09:28:07.206Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 14:58:07.206537+05:30
0b3da705-f03c-4824-b2a4-ca89c2d54a6e	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "2fa6d287-f4eb-49a1-a6bb-aaa82f93aaad", "timestamp": "2025-08-24T09:34:16.461Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 15:04:16.462098+05:30
6a2518bd-4d30-4423-8a77-e0e91771ee00	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "2fa6d287-f4eb-49a1-a6bb-aaa82f93aaad", "timestamp": "2025-08-24T09:34:31.720Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 15:04:31.720727+05:30
dace037c-c07a-4e05-a376-1ed72915bb20	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "117e3d55-f0d7-495d-83d4-29a9b346f66b", "timestamp": "2025-08-24T09:38:00.079Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 15:08:00.079831+05:30
e4283fca-8111-405e-bb0f-095dda300549	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-17T06:23:53.758Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-17 11:53:53.761948+05:30
d430db3b-b7e1-4ef8-916e-776d16998250	550e8400-e29b-41d4-a716-446655440010	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "15fdca8b-5b85-4fc4-b19f-8477b7dd0119", "timestamp": "2025-08-24T09:59:15.737Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 15:29:15.738522+05:30
e012dd28-72e9-4f37-af78-b8278ff2f85b	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "2fe12d74-42c4-4bbc-84c2-2c111271e18a", "timestamp": "2025-08-24T10:01:04.034Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 15:31:04.034525+05:30
1f9a6ec0-35e2-43ea-9736-545bebf01f52	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "11574ea5-ce01-412c-a386-2ed6ba1a6b47", "timestamp": "2025-08-24T10:01:33.842Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 15:31:33.842959+05:30
42d177fa-ef0b-4c41-b6cf-67864a0af5b3	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "2fe12d74-42c4-4bbc-84c2-2c111271e18a", "timestamp": "2025-08-24T10:03:42.603Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 15:33:42.603481+05:30
3bd8bd83-4a7e-4297-843a-591de02ae242	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "2fe12d74-42c4-4bbc-84c2-2c111271e18a", "timestamp": "2025-08-24T10:10:39.647Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 15:40:39.649123+05:30
813ed2d9-54d2-48e3-aade-fa17c8768438	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "2fe12d74-42c4-4bbc-84c2-2c111271e18a", "timestamp": "2025-08-24T10:20:55.904Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 15:50:55.905301+05:30
354f0bc9-9b1b-48de-b2bf-1cd1491380dd	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "2fe12d74-42c4-4bbc-84c2-2c111271e18a", "timestamp": "2025-08-24T10:26:11.428Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 15:56:11.428902+05:30
bb6dbc65-d389-42c2-96b6-cfbae7bd8340	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "6a521eb4-d24c-4f77-862c-fb87b29eda42", "timestamp": "2025-08-24T10:26:33.860Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 15:56:33.860505+05:30
ef995880-7808-49c8-aa03-9fcdb8fc83a4	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "6a521eb4-d24c-4f77-862c-fb87b29eda42", "timestamp": "2025-08-24T10:28:07.468Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 15:58:07.468612+05:30
8c178e54-5628-4f1c-bb90-731b52bec33a	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "6a521eb4-d24c-4f77-862c-fb87b29eda42", "timestamp": "2025-08-24T10:28:26.525Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 15:58:26.526119+05:30
c34275c5-9c64-4c21-80f6-d5dedde25b08	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "6a521eb4-d24c-4f77-862c-fb87b29eda42", "timestamp": "2025-08-24T10:28:38.163Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 15:58:38.164922+05:30
e0aedb5f-1eda-43a7-b065-e2455a736fc0	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "6a521eb4-d24c-4f77-862c-fb87b29eda42", "timestamp": "2025-08-24T10:30:52.527Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 16:00:52.527783+05:30
1bcf11cb-0c43-4f29-9703-1bb9c76889ce	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "6a521eb4-d24c-4f77-862c-fb87b29eda42", "timestamp": "2025-08-24T10:50:39.063Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 16:20:39.063668+05:30
d00f936f-a6c5-4ce7-a740-374e248865e1	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "7309bc1a-ee0d-415d-8261-68bd5a73498e", "timestamp": "2025-08-24T10:57:20.597Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 16:27:20.598315+05:30
67679f4f-b122-42d4-83d7-72876ae2caf7	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "7309bc1a-ee0d-415d-8261-68bd5a73498e", "timestamp": "2025-08-24T11:07:49.419Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 16:37:49.419589+05:30
b3ea9a1c-47e0-4fef-a029-54ff3a3dd920	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "7309bc1a-ee0d-415d-8261-68bd5a73498e", "timestamp": "2025-08-24T11:07:52.406Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 16:37:52.406214+05:30
de6d18bc-bda2-42e4-afa1-9d9a2889853f	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "7309bc1a-ee0d-415d-8261-68bd5a73498e", "timestamp": "2025-08-24T11:08:03.146Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 16:38:03.146867+05:30
1033d761-fbca-4991-ba90-c9ae1ee2cfd2	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "7309bc1a-ee0d-415d-8261-68bd5a73498e", "timestamp": "2025-08-24T11:09:42.499Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 16:39:42.499658+05:30
2cf19820-80b5-4b87-9435-eb9b3269ffc0	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "7309bc1a-ee0d-415d-8261-68bd5a73498e", "timestamp": "2025-08-24T11:10:35.021Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 16:40:35.021825+05:30
0da89745-b316-4154-b510-823587ad72c1	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "7309bc1a-ee0d-415d-8261-68bd5a73498e", "timestamp": "2025-08-24T11:10:42.185Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 16:40:42.185763+05:30
26a5362c-87a6-4aa5-98e0-73e4edaee5e9	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "7309bc1a-ee0d-415d-8261-68bd5a73498e", "timestamp": "2025-08-24T11:11:09.599Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 16:41:09.599777+05:30
00bbdb6a-dc38-4e21-9bce-6b5096e0f07c	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-17T09:32:30.900Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-17 15:02:30.901715+05:30
125f9bdf-0d0e-4cd9-8bc4-68a63b91de64	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "7309bc1a-ee0d-415d-8261-68bd5a73498e", "timestamp": "2025-08-24T11:12:14.673Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 16:42:14.673875+05:30
ea9a2103-8c4c-4ae7-93fb-9a80a36ee38a	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "55b0b00c-050f-4cc1-8902-082621f2b325", "timestamp": "2025-08-24T13:12:35.813Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 18:42:35.813313+05:30
6539a2ee-972e-4fbd-9a58-121c4bcfdc9a	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "55b0b00c-050f-4cc1-8902-082621f2b325", "timestamp": "2025-08-24T13:16:04.342Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 18:46:04.34272+05:30
b0cb5f08-b1f8-4dd6-acc5-a9f30fc02be6	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "55b0b00c-050f-4cc1-8902-082621f2b325", "timestamp": "2025-08-24T13:26:45.960Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 18:56:45.960994+05:30
ffba785c-00f6-42e1-9732-cf454536998f	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "55b0b00c-050f-4cc1-8902-082621f2b325", "timestamp": "2025-08-24T13:28:08.442Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 18:58:08.443038+05:30
3319777e-664c-467a-9f3d-89a1c1cfc3c5	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "55b0b00c-050f-4cc1-8902-082621f2b325", "timestamp": "2025-08-24T13:31:16.863Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 19:01:16.863876+05:30
8064a916-3734-4812-aa50-c9d38a8eeb47	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "55b0b00c-050f-4cc1-8902-082621f2b325", "timestamp": "2025-08-24T13:31:26.774Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 19:01:26.774483+05:30
1a125e5b-da4d-4e8a-ac1b-b8df7d8f2c1a	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "55b0b00c-050f-4cc1-8902-082621f2b325", "timestamp": "2025-08-24T13:42:44.141Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 19:12:44.141848+05:30
4c0f6313-bd1a-4360-9089-513306952d73	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "55b0b00c-050f-4cc1-8902-082621f2b325", "timestamp": "2025-08-24T13:43:50.972Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 19:13:50.973149+05:30
7139d9a8-e843-4e21-beb2-65ce975eb80b	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "9444a944-c9b5-4658-be74-c6ba42234f25", "timestamp": "2025-08-24T14:10:07.792Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 19:40:07.792625+05:30
0e56b5bc-28db-4f80-8429-5df80cb0d645	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "064fe241-a42d-4929-86d8-a9bc1f06af6f", "timestamp": "2025-08-24T15:16:08.984Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 20:46:08.984872+05:30
1df89695-c2f4-4bfd-8d45-68ba01d03ea8	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "064fe241-a42d-4929-86d8-a9bc1f06af6f", "timestamp": "2025-08-24T15:23:48.282Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 20:53:48.282878+05:30
06d6eff4-718b-456f-a168-958a0c3a9e8f	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "064fe241-a42d-4929-86d8-a9bc1f06af6f", "timestamp": "2025-08-24T15:26:08.372Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 20:56:08.372184+05:30
af2a8017-a6a6-4b25-b5a5-647452864100	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "064fe241-a42d-4929-86d8-a9bc1f06af6f", "timestamp": "2025-08-24T15:26:30.362Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 20:56:30.363216+05:30
a6cf3473-54ca-4c4d-819f-0ff4bd6563e2	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "064fe241-a42d-4929-86d8-a9bc1f06af6f", "timestamp": "2025-08-24T15:30:01.340Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 21:00:01.340646+05:30
6601fb4b-4f3c-4250-81ba-8817dfe33a99	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "064fe241-a42d-4929-86d8-a9bc1f06af6f", "timestamp": "2025-08-24T15:31:06.945Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 21:01:06.945589+05:30
43a590e0-2e71-4b27-ad97-9502f92fa4be	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "064fe241-a42d-4929-86d8-a9bc1f06af6f", "timestamp": "2025-08-24T15:38:35.192Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 21:08:35.192491+05:30
3fec44dd-c5bb-4396-82c3-e3126bc91829	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "064fe241-a42d-4929-86d8-a9bc1f06af6f", "timestamp": "2025-08-24T15:38:43.842Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 21:08:43.842537+05:30
125c5c6b-1bb3-4934-8164-2da6f020629f	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "064fe241-a42d-4929-86d8-a9bc1f06af6f", "timestamp": "2025-08-24T15:39:17.894Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 21:09:17.894646+05:30
9fb659d9-dca4-4769-8854-461a35ab742a	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "064fe241-a42d-4929-86d8-a9bc1f06af6f", "timestamp": "2025-08-24T15:40:09.263Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 21:10:09.26373+05:30
5d06b0d1-4046-4b94-ba84-c0efb164d507	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "064fe241-a42d-4929-86d8-a9bc1f06af6f", "timestamp": "2025-08-24T15:40:17.586Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 21:10:17.586992+05:30
8850ae16-e9fc-4360-9bc5-a4515f815058	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-17T09:51:45.904Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-17 15:21:45.908179+05:30
24c25726-ced6-416b-9a18-c0c391039cff	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "0d2e0f87-8dca-4a66-899f-afb7cce5a8e1", "timestamp": "2025-08-24T15:55:28.250Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 21:25:28.251095+05:30
9e61cb8b-3aa8-4558-812b-6d606f3075f0	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "74b42ab0-2fe4-44d6-b1e0-7b7770473c27", "timestamp": "2025-08-24T16:00:29.199Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 21:30:29.199612+05:30
cbafe159-830b-4f43-a455-5ad0dc9a004c	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "74b42ab0-2fe4-44d6-b1e0-7b7770473c27", "timestamp": "2025-08-24T16:00:57.955Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 21:30:57.955884+05:30
3fe70b26-5262-437f-b758-5ea30964e181	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "f7b56342-ef88-4621-a1f4-ccacd8aa11ee", "timestamp": "2025-08-24T16:24:29.168Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 21:54:29.168622+05:30
d45d6ff9-00bf-4e31-b767-d9276bc3d0ce	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "f7b56342-ef88-4621-a1f4-ccacd8aa11ee", "timestamp": "2025-08-24T16:35:29.630Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 22:05:29.631029+05:30
2d874404-28f6-4b66-819f-63dc17dd63b7	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "f7b56342-ef88-4621-a1f4-ccacd8aa11ee", "timestamp": "2025-08-24T16:36:39.264Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 22:06:39.264491+05:30
651eb52c-e35a-422e-ae4f-e99a60e68a80	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "f7b56342-ef88-4621-a1f4-ccacd8aa11ee", "timestamp": "2025-08-24T16:36:43.087Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 22:06:43.087396+05:30
01d9eb49-498d-4ae5-8c9c-ff3b62e26141	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "f7b56342-ef88-4621-a1f4-ccacd8aa11ee", "timestamp": "2025-08-24T16:37:12.972Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 22:07:12.972333+05:30
753a1904-82b5-4388-bd64-f41d0218a6b6	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "e0f7f862-bdff-49f2-87b8-d23e547ff974", "timestamp": "2025-08-25T07:17:51.737Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-25 12:47:51.738933+05:30
ff0c9427-8673-4159-ba69-d5b4385f08ce	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "e0f7f862-bdff-49f2-87b8-d23e547ff974", "timestamp": "2025-08-25T07:18:29.798Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-25 12:48:29.79912+05:30
051ebdc2-28ce-40a6-9567-baa2cd1c9fd5	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "e56203bd-6212-4dc0-b98f-262afbe13535", "timestamp": "2025-08-25T11:39:29.683Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-25 17:09:29.683639+05:30
546e78db-6490-4ea6-ae1d-92243f1fbce3	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-08-25T20:11:03.232Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-26 01:41:03.233044+05:30
a20132c2-ba8c-4a90-8cc8-1ae5bc88ff28	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "3c4e5c45-2633-40ec-9697-84ccf388e476", "timestamp": "2025-08-25T21:12:08.262Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-26 02:42:08.262761+05:30
64a24851-cb79-4653-a5f6-43a77f8b5a69	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "243f5abf-710d-4149-914e-94e70db2f52d", "timestamp": "2025-08-26T06:22:37.427Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-26 11:52:37.427572+05:30
bb704a8f-4c38-41c4-beaf-7c9eef5e9b8d	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "243f5abf-710d-4149-914e-94e70db2f52d", "timestamp": "2025-08-26T06:33:24.943Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-26 12:03:24.943689+05:30
2453092e-015d-4d13-bfd6-061b4713683c	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "243f5abf-710d-4149-914e-94e70db2f52d", "timestamp": "2025-08-26T06:49:41.437Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-26 12:19:41.438584+05:30
c8f8c3e5-58a5-414b-8827-ca11fa207c23	1d5b1108-eb4c-4191-ae75-751e3610d519	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "0269da20-8d9d-493f-a61e-be2f42f1c9b1", "timestamp": "2025-08-27T18:43:02.089Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-28 00:13:02.090086+05:30
a333a4b8-4392-4f18-a168-878cc8dc9291	1d5b1108-eb4c-4191-ae75-751e3610d519	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "2166cd99-9fe3-4515-a3fc-f0f2b4534937", "timestamp": "2025-08-27T19:21:00.234Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-28 00:51:00.235363+05:30
c0129b8d-417a-4e46-9104-85715e342db8	1d5b1108-eb4c-4191-ae75-751e3610d519	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "6f11a223-8351-43eb-bcba-9c83100fefb2", "timestamp": "2025-08-27T19:43:30.222Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-28 01:13:30.222604+05:30
552f5870-7614-44c7-87e3-5b1e63eda712	1d5b1108-eb4c-4191-ae75-751e3610d519	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "6f11a223-8351-43eb-bcba-9c83100fefb2", "timestamp": "2025-08-28T05:08:53.951Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-28 10:38:53.952141+05:30
670e7e4d-c6ae-4ee8-9841-ef65e12e449d	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "3864f4a3-bd35-4e6a-a524-25e4dd2d6e84", "timestamp": "2025-08-28T18:59:27.154Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-29 00:29:27.155142+05:30
8758a4e3-01ad-4268-aed4-f0db6cbfda1c	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "7ef4fd40-a025-4dfa-8269-4db3389f20a6", "timestamp": "2025-08-28T19:29:25.959Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-29 00:59:25.960054+05:30
530a30ad-b26b-4184-b4b1-0b07a3127837	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "7ef4fd40-a025-4dfa-8269-4db3389f20a6", "timestamp": "2025-08-28T19:33:12.132Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-29 01:03:12.132493+05:30
cb2bd8ed-d18c-494c-8b11-78f2a359870b	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "7ef4fd40-a025-4dfa-8269-4db3389f20a6", "timestamp": "2025-08-28T19:40:50.331Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-29 01:10:50.33185+05:30
20375672-3a0a-4698-baf9-66f77c8f5cba	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "7ef4fd40-a025-4dfa-8269-4db3389f20a6", "timestamp": "2025-08-28T19:40:58.830Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-29 01:10:58.830669+05:30
4ec3f529-f605-412f-8ba6-102ce4cb1b52	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "7ef4fd40-a025-4dfa-8269-4db3389f20a6", "timestamp": "2025-08-28T19:46:56.581Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-29 01:16:56.582203+05:30
0f681491-2578-4c15-b9d7-4fc20bab7b60	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "7ef4fd40-a025-4dfa-8269-4db3389f20a6", "timestamp": "2025-08-28T19:53:08.822Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-29 01:23:08.822415+05:30
2b358342-44b1-422a-bf45-d06145e53914	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "7ef4fd40-a025-4dfa-8269-4db3389f20a6", "timestamp": "2025-08-28T19:54:23.165Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-29 01:24:23.166691+05:30
43df6dce-d19f-4293-8522-07c174db189e	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-08-28T20:42:58.858Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-29 02:12:58.862902+05:30
c6521e0b-ed1f-4df7-aa35-4ac6dc9cdbd8	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-08-28T21:01:21.153Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-29 02:31:21.154971+05:30
a14ba485-7b10-42c1-bfa2-7af106224312	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-08-28T21:01:47.784Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-29 02:31:47.788971+05:30
165440cb-93de-49a9-90c3-b340937db3a3	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-08-28T21:14:07.026Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-29 02:44:07.027184+05:30
2ea71525-f83a-46fe-a4a5-7d8bf213ebe3	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-08-29T05:51:05.384Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-29 11:21:05.389596+05:30
bb2c515a-235b-48ee-abc7-5ac286c13a05	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-08-29T05:58:23.373Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-29 11:28:23.3743+05:30
dd0d47db-400e-4bb3-8c31-243ca348dde7	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-16T16:13:02.011Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-16 21:43:02.017375+05:30
768e161d-d463-4061-b50d-fb710b9d2320	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-16T16:34:09.371Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.104.0 Chrome/138.0.7204.235 Electron/37.3.1 Safari/537.36	2025-09-16 22:04:09.373039+05:30
084cb290-2228-479e-ab66-a8a9a80a7ae3	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-16T16:34:55.454Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.104.0 Chrome/138.0.7204.235 Electron/37.3.1 Safari/537.36	2025-09-16 22:04:55.455155+05:30
b1e1b07d-47f8-47fe-93f1-f58b99aae52e	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-16T16:42:04.901Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.104.0 Chrome/138.0.7204.235 Electron/37.3.1 Safari/537.36	2025-09-16 22:12:04.902491+05:30
ebc888b9-4c9c-4240-acd5-069a5d8bc3f9	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-16T16:43:47.906Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.104.0 Chrome/138.0.7204.235 Electron/37.3.1 Safari/537.36	2025-09-16 22:13:47.906623+05:30
c324d17e-62fa-4dd6-9799-15579c975ec7	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-16T16:53:24.937Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-16 22:23:24.942344+05:30
df93801a-3646-419a-8885-07dc8141a679	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-16T16:58:01.597Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-16 22:28:01.598058+05:30
51ddbd06-fd2e-4091-9528-83ca1651e42e	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-16T16:58:01.867Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-16 22:28:01.871985+05:30
e62d9f4a-b336-4a2f-8432-1b3d61f16cec	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-16T17:04:04.639Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-16 22:34:04.644828+05:30
73790911-b1f1-48bd-97fc-fee5c9b5af53	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-16T17:04:40.231Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-16 22:34:40.238651+05:30
f9767d17-07c0-41ee-a457-8b87fcffcc7a	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-16T17:31:29.305Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-16 23:01:29.306043+05:30
d09aa240-de7b-4537-84c5-4829aec6e2c9	550e8400-e29b-41d4-a716-446655440020	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-16T17:51:30.535Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-16 23:21:30.536238+05:30
eece3271-be7d-4019-880c-e2c5761a7413	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-17T10:03:24.426Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-17 15:33:24.427294+05:30
ba8badbf-d1f5-4465-a711-5676074d8a98	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-17T10:08:45.683Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-17 15:38:45.684184+05:30
2fcdc27c-1418-417c-8adf-f52f6df45b44	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-17T11:32:32.172Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-17 17:02:32.172382+05:30
f030e54c-6946-4686-b0a8-f4c240f8c01b	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-17T11:32:44.846Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-17 17:02:44.847088+05:30
bb96f0a5-3d4d-41ae-8baa-837b376f42c9	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-17T15:02:56.525Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-17 20:32:56.525789+05:30
df72bbe3-acde-4334-8cee-f8ed3873e46c	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-17T16:09:30.765Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-17 21:39:30.766482+05:30
0aff9b92-a518-430a-8d14-5e6979a53038	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-17T16:17:54.490Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-17 21:47:54.491422+05:30
b143d9db-457a-4148-bdde-e52b955aeb94	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-17T16:22:47.516Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-17 21:52:47.517569+05:30
6401b2e5-c75d-43f7-99d3-8c6dc6bd6d0d	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-17T16:36:22.708Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-17 22:06:22.708892+05:30
43569fb6-a789-458e-a8fa-e25915aa03e8	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-17T16:39:55.068Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-17 22:09:55.069279+05:30
72f8d620-7d96-43f5-a549-abd4b2d72529	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-18T04:04:41.233Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 09:34:41.23393+05:30
5418034f-39f5-4726-b0d6-cd70175b7ecf	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-18T04:24:26.505Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 09:54:26.505496+05:30
53e37771-3f75-4f42-8df1-b1c28d850405	550e8400-e29b-41d4-a716-446655440000	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-18T04:41:57.978Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 10:11:57.979266+05:30
d41a74bd-db0e-4b6b-b6e8-c1ab9b24f06b	550e8400-e29b-41d4-a716-446655440000	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-18T04:45:07.688Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 10:15:07.68933+05:30
f0654fcb-e658-4dc2-a987-6f3c63200e42	550e8400-e29b-41d4-a716-446655440000	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-18T04:53:32.539Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 10:23:32.540789+05:30
87d77925-eb86-426f-b587-6ee12d5f3724	550e8400-e29b-41d4-a716-446655440000	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-18T04:54:00.101Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 10:24:00.101951+05:30
6c4656f1-2c23-469d-b1b3-f72f9e2cca74	550e8400-e29b-41d4-a716-446655440000	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-18T05:09:38.588Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 10:39:38.588955+05:30
9cd326da-1360-4e81-93ac-c01ac1fbe8b8	550e8400-e29b-41d4-a716-446655440000	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-18T06:07:14.108Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 11:37:14.108486+05:30
19f52b17-997e-4b6e-a28f-0e66fba0f8f0	550e8400-e29b-41d4-a716-446655440000	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-18T06:07:14.379Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 11:37:14.379165+05:30
3d124851-5424-49dc-88fe-fd2c8581a8ab	550e8400-e29b-41d4-a716-446655440000	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-18T06:15:38.448Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 11:45:38.449321+05:30
f417cac6-7f53-40f3-a957-62f5f73967f9	550e8400-e29b-41d4-a716-446655440000	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-18T06:15:56.048Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 11:45:56.04848+05:30
551f10be-66a5-4a1a-826f-9310213892c8	550e8400-e29b-41d4-a716-446655440000	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-18T06:16:05.130Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 11:46:05.130212+05:30
a5bb3e29-ea0c-4f29-8b63-2a4383636526	550e8400-e29b-41d4-a716-446655440000	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-18T06:16:18.069Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 11:46:18.070226+05:30
d461afd6-0314-447f-a9ef-077b4bdeadb8	550e8400-e29b-41d4-a716-446655440000	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-18T06:43:10.257Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 12:13:10.257846+05:30
da70d8d2-cca0-464e-8546-1d116e85660d	550e8400-e29b-41d4-a716-446655440000	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-18T06:43:51.254Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 12:13:51.254867+05:30
96890695-823c-466f-a809-bc53b8061167	550e8400-e29b-41d4-a716-446655440000	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-18T06:44:13.678Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 12:14:13.679162+05:30
a44590bc-4d6f-49fe-8ea5-73af74b045d6	550e8400-e29b-41d4-a716-446655440000	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-18T06:49:58.574Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 12:19:58.574919+05:30
3032a2d4-fa74-4393-990e-831014df0556	550e8400-e29b-41d4-a716-446655440000	login	auth	\N	\N	\N	{"endpoint": "/api/auth/check", "timestamp": "2025-09-18T06:58:09.495Z", "tokenRefreshed": false}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 12:28:09.495902+05:30
\.


--
-- TOC entry 4433 (class 0 OID 19649)
-- Dependencies: 271
-- Data for Name: carousel_slides; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.carousel_slides (id, page_type, page_reference_id, title, subtitle, description, image_url, button_text, button_link, display_order, is_active, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4406 (class 0 OID 18168)
-- Dependencies: 244
-- Data for Name: chat_attachments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_attachments (id, message_id, room_id, filename, original_filename, file_path, file_type, file_size, mime_type, encryption_key, created_at, user_id, file_id) FROM stdin;
\.


--
-- TOC entry 4407 (class 0 OID 18182)
-- Dependencies: 245
-- Data for Name: chat_invitations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_invitations (id, room_id, inviter_id, invitee_email, invitation_token, message, status, expires_at, created_at, accepted_at) FROM stdin;
\.


--
-- TOC entry 4405 (class 0 OID 18123)
-- Dependencies: 243
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_messages (id, room_id, user_id, message, message_type, file_url, created_at, reply_to_message_id, is_edited, reply_to, sender_id, content, is_encrypted, updated_at, attachments, message_images, reactions, thread_id, edited_at, edited_by, can_edit_until) FROM stdin;
a0789d34-6a64-4874-baaa-24ac43577531	550e8400-1000-41d4-a716-446655440002	\N	hey	text	\N	2025-08-21 00:52:32.440217+05:30	\N	f	\N	550e8400-e29b-41d4-a716-446655440020	hey	f	\N	[]	[]	{}	\N	\N	\N	\N
edbaf64d-d51e-4140-b4eb-233949f4ca9f	550e8400-1000-41d4-a716-446655440002	\N	😋	text	\N	2025-08-21 00:52:39.91869+05:30	\N	f	\N	550e8400-e29b-41d4-a716-446655440020	😋	f	\N	[]	[]	{}	\N	\N	\N	\N
8929a131-7dfc-4956-a237-a755cd4267e4	15dc37c8-f5fb-40c1-8529-dd2c9ccee52d	\N	hi	text	\N	2025-08-21 18:29:13.538973+05:30	\N	f	\N	550e8400-e29b-41d4-a716-446655440020	\N	f	\N	[]	[]	{}	\N	\N	\N	2025-08-21 20:29:13.538+05:30
ba4de82b-b491-49e0-a1f1-14092b928746	15dc37c8-f5fb-40c1-8529-dd2c9ccee52d	\N	hello	text	\N	2025-08-21 18:29:33.224555+05:30	8929a131-7dfc-4956-a237-a755cd4267e4	f	\N	550e8400-e29b-41d4-a716-446655440020	\N	f	\N	[]	[]	{}	\N	\N	\N	2025-08-21 20:29:33.224+05:30
3cf788dc-985f-4f69-a25d-95236a126e21	8ed523ff-8417-4ab8-adee-6e98f5e43cee	\N	hi	text	\N	2025-08-24 15:13:17.364573+05:30	\N	f	\N	550e8400-e29b-41d4-a716-446655440011	\N	f	\N	[]	[]	{}	\N	\N	\N	2025-08-24 17:13:17.363+05:30
98880f0f-f64b-4b5a-b26a-a8098a73f25f	069d71e7-821c-42f4-8717-7ab370052b99	\N	hi	text	\N	2025-08-24 20:47:48.295113+05:30	\N	f	\N	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	\N	f	\N	[]	[]	{}	\N	\N	\N	2025-08-24 22:47:48.294+05:30
20227221-10ce-4f5f-8dd5-75bfbc782067	069d71e7-821c-42f4-8717-7ab370052b99	\N	hi	text	\N	2025-08-24 20:47:57.462002+05:30	98880f0f-f64b-4b5a-b26a-a8098a73f25f	f	\N	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	\N	f	\N	[]	[]	{}	\N	\N	\N	2025-08-24 22:47:57.461+05:30
96f4d39e-19df-4537-b950-b0789d58bee1	550e8400-1000-41d4-a716-446655440002	\N	lol	text	\N	2025-08-29 11:33:46.527836+05:30	\N	f	\N	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	\N	f	\N	[]	[]	{}	\N	\N	\N	2025-08-29 13:33:46.527+05:30
b21ade61-231c-4105-aa1f-3fa0f179433d	550e8400-1000-41d4-a716-446655440002	\N	yo	text	\N	2025-09-17 21:02:54.284828+05:30	\N	f	\N	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	\N	f	\N	[]	[]	{}	\N	\N	\N	2025-09-17 23:02:54.284+05:30
\.


--
-- TOC entry 4404 (class 0 OID 18103)
-- Dependencies: 242
-- Data for Name: chat_room_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_room_members (id, chat_room_id, user_id, joined_at, role, user_email) FROM stdin;
\.


--
-- TOC entry 4403 (class 0 OID 18077)
-- Dependencies: 241
-- Data for Name: chat_rooms; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_rooms (id, name, description, club_id, type, created_by, members, created_at, updated_at, room_type, encryption_enabled, cover_image_url, room_images, room_settings, profile_picture_url, edited_at, edited_by) FROM stdin;
550e8400-1000-41d4-a716-446655440001	General Discussion	Open discussion for all members across clubs	\N	public	550e8400-e29b-41d4-a716-446655440000	{}	2025-07-27 13:47:32.966+05:30	2025-07-30 19:29:51.513+05:30	public	f	\N	[]	{}	\N	\N	\N
550e8400-1000-41d4-a716-446655440002	Announcements	Official announcements from administration	\N	public	550e8400-e29b-41d4-a716-446655440001	{}	2025-07-27 13:47:32.966+05:30	2025-07-30 19:29:51.513+05:30	public	f	\N	[]	{}	\N	\N	\N
550e8400-1001-41d4-a716-446655440001	ASCEND General	Main discussion room for ASCEND coding club	ascend	club	550e8400-e29b-41d4-a716-446655440010	{}	2025-07-27 13:47:32.966+05:30	2025-07-30 19:29:51.513+05:30	club	f	\N	[]	{}	\N	\N	\N
550e8400-1001-41d4-a716-446655440002	ASCEND Projects	Discussion about ongoing coding projects	ascend	club	550e8400-e29b-41d4-a716-446655440010	{}	2025-07-27 13:47:32.966+05:30	2025-07-30 19:29:51.513+05:30	club	f	\N	[]	{}	\N	\N	\N
550e8400-1002-41d4-a716-446655440001	ASTER General	Main discussion room for ASTER soft skills club	aster	club	550e8400-e29b-41d4-a716-446655440020	{}	2025-07-27 13:47:32.966+05:30	2025-07-30 19:29:51.513+05:30	club	f	\N	[]	{}	\N	\N	\N
550e8400-1002-41d4-a716-446655440002	ASTER Skills	Discussion about soft skill development	aster	club	550e8400-e29b-41d4-a716-446655440020	{}	2025-07-27 13:47:32.966+05:30	2025-07-30 19:29:51.513+05:30	club	f	\N	[]	{}	\N	\N	\N
550e8400-1003-41d4-a716-446655440001	ACHIEVERS General	Main discussion room for ACHIEVERS higher studies club	achievers	club	550e8400-e29b-41d4-a716-446655440030	{}	2025-07-27 13:47:32.966+05:30	2025-07-30 19:29:51.513+05:30	club	f	\N	[]	{}	\N	\N	\N
550e8400-1003-41d4-a716-446655440002	ACHIEVERS Studies	Discussion about higher studies and competitive exams	achievers	club	550e8400-e29b-41d4-a716-446655440030	{}	2025-07-27 13:47:32.966+05:30	2025-07-30 19:29:51.513+05:30	club	f	\N	[]	{}	\N	\N	\N
958e013e-4c75-49f1-bae2-9066a96b4b99	Aster room1	Aster room1	aster	club	550e8400-e29b-41d4-a716-446655440020	{}	2025-07-28 18:25:16.639+05:30	2025-07-30 19:29:51.513+05:30	club	f	\N	[]	{}	\N	\N	\N
15dc37c8-f5fb-40c1-8529-dd2c9ccee52d	Aster Public Room	Hi	aster	public	550e8400-e29b-41d4-a716-446655440020	{}	2025-07-28 18:26:05.359+05:30	2025-07-30 19:29:51.513+05:30	public	f	\N	[]	{}	\N	\N	\N
47dea162-774c-43c5-bdbc-7213b739127d	test2		aster	club	550e8400-e29b-41d4-a716-446655440020	{}	2025-07-28 18:26:45.039+05:30	2025-07-30 19:29:51.513+05:30	club	f	\N	[]	{}	\N	\N	\N
0211a3ff-ff6b-41fb-9e6b-d698b12d7926	ho		aster	public	550e8400-e29b-41d4-a716-446655440020	{}	2025-07-28 18:40:42.4+05:30	2025-07-30 19:29:51.513+05:30	public	f	\N	[]	{}	\N	\N	\N
5d7cd7dc-d8e2-4788-b7bf-d76cc9658768	test3		aster	public	550e8400-e29b-41d4-a716-446655440020	{}	2025-07-28 19:06:46.24+05:30	2025-07-30 19:29:51.513+05:30	public	f	\N	[]	{}	\N	\N	\N
8ed523ff-8417-4ab8-adee-6e98f5e43cee	Enhanced General Chat	Enhanced chat room with encryption and file sharing	ascend	public	550e8400-e29b-41d4-a716-446655440000	{}	2025-07-30 19:29:51.513+05:30	2025-07-30 19:29:51.513+05:30	public	f	\N	[]	{}	\N	\N	\N
2e01a2d0-2ab2-4f6a-9632-2ae379c4f289	Secure Private Room	Encrypted private room for sensitive discussions	ascend	public	550e8400-e29b-41d4-a716-446655440000	{}	2025-07-30 19:29:51.513+05:30	2025-07-30 19:29:51.513+05:30	private	t	\N	[]	{}	\N	\N	\N
8a01e809-0b45-4de1-b542-db5a11896554	Me	my room	aster	club	550e8400-e29b-41d4-a716-446655440020	{}	2025-07-28 18:25:30.139+05:30	2025-07-30 19:29:51.513+05:30	private	f	\N	[]	{}	\N	\N	\N
069d71e7-821c-42f4-8717-7ab370052b99	General Discussion	Open chat for all Zenith members	\N	public	550e8400-e29b-41d4-a716-446655440000	{}	2025-08-21 18:00:20.034544+05:30	2025-08-21 18:00:20.034544+05:30	public	f	\N	[]	{}	\N	\N	\N
e2e8632a-3678-42eb-a335-8e450c645234	Tech Talk	Discussions about technology and innovation	\N	public	550e8400-e29b-41d4-a716-446655440000	{}	2025-08-21 18:00:20.034544+05:30	2025-08-21 18:00:20.034544+05:30	public	f	\N	[]	{}	\N	\N	\N
550e8400-1004-41d4-a716-446655440002	ARTOVERT Growth	Discussion about overall development	artovert	club	550e8400-e29b-41d4-a716-446655440040	{}	2025-07-27 13:47:32.966+05:30	2025-07-30 19:29:51.513+05:30	club	f	\N	[]	{}	\N	\N	\N
550e8400-1004-41d4-a716-446655440001	ARTOVERT General	Main discussion room for ARTOVERT development club	artovert	club	550e8400-e29b-41d4-a716-446655440040	{}	2025-07-27 13:47:32.966+05:30	2025-07-30 19:29:51.513+05:30	club	f	\N	[]	{}	\N	\N	\N
\.


--
-- TOC entry 4408 (class 0 OID 18204)
-- Dependencies: 246
-- Data for Name: club_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.club_members (id, user_id, club_id, is_leader, joined_at, academic_year, role, is_current_term, display_order, bio, achievements, created_at, updated_at, hierarchy) FROM stdin;
1d37e75f-db56-4d71-be88-6b6eb6f032b8	4a526572-d81e-4634-94c2-2ea5ae5d75be	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
86d3742e-3aea-49e0-af50-7325d2a0924c	5bac2b3a-1822-4fcf-ad7d-5c984c951b82	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
b0242367-f4a3-496a-9b9b-07d862a09bf9	61ee5d21-3847-45fb-b8e7-b5f5579dbfee	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
86ecbf20-7e72-459f-bb44-e190f243a9ab	41b85180-78de-4135-8b1b-d525a4612121	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
a3b6601b-9452-4ab2-b7cb-47b3c41d5185	3220eb64-d5b0-4e74-a0d9-f5896194a989	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
4257253b-fd72-4f3b-a0d7-e5866fd67a2d	8d635cd3-34fd-4c04-8a13-425cef4aea07	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
0c1c15ee-8829-4a67-b014-f82fcdfc1091	d6b49037-0637-4453-bce7-b4e24bb3217b	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
40b73fd3-45fc-4d68-9a78-20a0753b204c	256b6d4b-24dc-41c6-82ed-3ebcb991e66f	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
9876d7e6-7400-45a2-91dd-5db8ef0c9d0b	0fa29d11-4834-47db-be7f-9d385bc5c0db	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
eec759bf-3f0d-4f62-8f80-5d845c394820	62f01148-4ee0-498f-9f0f-13cc5fd47b2f	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
d4cfcb56-fd6f-4c8e-92c7-df8c368473f5	ddcc4132-90e6-43b2-9a78-38a66502055f	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
ddd10129-a122-4aa8-ac54-0bbb6d0413df	9cc2a1df-712a-4c51-9b28-0e5c2e25c0a6	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
ec45cd82-731c-4fd2-a9a7-b70ada81864b	e94eeb58-38be-493b-b185-de604aa0566e	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
2c5b068a-ae11-404b-9173-a0233623ed59	6772e011-3e4a-4b0b-8e18-45b986942b9c	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
bb5bc65a-7972-49c4-bbad-acc8ee9e6c15	b5cd87ee-7913-410e-ba5e-84952bd5fe3e	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
5c897f04-5cb3-4d03-b8ea-a7355e91e1dc	5dc48f23-1a50-4da0-a265-37f4a9433a38	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
51c360da-0810-4acf-902e-e20cd6e90500	927d12b3-267a-4d40-8ed8-80f29761add7	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
daab48a3-30af-44bf-ad56-fc71d285b113	ade21a72-0d0e-43da-876b-ede62b9317bb	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
6842ff1d-0534-4123-9113-92567cb190df	caccf02e-1bd6-4c43-b3fc-952f32d82063	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
067eb56e-1224-4506-bf9c-58fbe64b725d	46b3f991-6149-4c70-a13f-b167fc33c57c	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
78984a35-e365-43de-86c1-46314216d94a	d9c73a2e-5fa7-4576-bec2-08e68f1e87fe	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
c7f865a0-bc92-494d-a3bc-c58fd74d3b62	10ad5a9c-ce80-4e9a-9105-837fea41a321	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
4784d6e0-98fc-4e58-802d-945090abb604	7956e013-49c1-4938-923e-03982507f939	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
d3e6b339-f36e-481c-ba21-a0a4747646df	bbb4f104-2989-4356-b199-a8f48f5e0e74	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
8d9cef8f-44fe-4a20-9f62-da68fa85fb5f	ed47dc24-65f7-4122-b3d2-10466fbed231	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
47c5266e-e76f-4538-a097-e6480b029a95	0f902ef2-afbf-4d25-b4bb-5fe8c66fc2c6	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
1f2b1180-318b-4267-845c-35b120c76355	fdc309c0-069b-49c4-bdd5-99da51b786ed	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
392d730e-f0eb-4470-b997-720fa81827c4	9829bc9c-9994-43bd-91ef-9f0712186b4e	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
d8137394-70ca-41e6-bd21-ce0af1962293	aabdd1dc-572e-40fd-9851-f06b8d50cf8e	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
0e6e9bc1-7b65-488b-881a-a4e67e6ba2f8	b3259e69-05e5-415e-a756-815321804f0b	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
afee5701-0afa-45b6-906f-64a8ac69f37d	f42cb37d-1508-4ed0-81db-9660aea4cc64	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
6993e747-ace1-41ed-8572-d1fdb821fb4c	6f5c3141-2a96-468c-9bf0-97a48f6d8744	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
085eeb58-daf3-492c-8d8c-46e044d87945	ca6ae40f-c07f-4d11-8fda-49f4b9623cff	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
238ec173-2341-4e7b-9500-d27bc8299f51	57fe9a1c-e120-48ae-8fbf-9d6637fcdec9	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
fc5e1594-483a-44cf-bbf5-6d65736ea965	05604503-802f-4e79-95c2-4ac3b61f4082	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
025274c9-3ce8-4386-85e4-15ea7ffd8a1f	bb080cee-f5f5-4db6-a019-7d19df1d7683	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
dd4b987b-6815-4526-afaa-fd6fca4ff0e1	133a61a7-a20d-465a-af20-26fd2544e1d0	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
b10f1024-7623-4680-9c42-fc73ce41ed37	f5a93605-4668-4c6a-93cc-b78f240b58c0	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
b1818c66-1a7a-4127-83a9-31db44917c8e	0a93b5e6-05ea-4730-a7bc-e04553d8e238	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
798be735-d654-4a99-881d-f6b8cfe468c6	d4ef9dd5-1950-4493-9f49-505700a39c40	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
47711a0a-eeaf-49c4-9185-76a4ab83af42	16f6398a-ebe3-43a8-934f-1b32cfe2e372	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
682d9a31-0044-4c35-afb0-b7ed91ed5c21	dd51c305-1fb7-4ccf-820b-341ca9050c44	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
4b96c0ec-a82b-4169-8767-ca07cbca8a86	8c803a8b-a64a-4bdc-8ec4-c6f3f800f6ca	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
c301770b-a48e-4f5e-88ff-0d250d8d20a2	c119840c-4834-4cdb-9ee6-5484ea721b7b	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
68ee5572-051b-40b3-a023-fc7ca071e3ea	dccdc2a1-502b-4bc7-80fb-6794c8760225	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
3675b89c-df08-4404-b429-061b77c3685c	cd34a14d-50bd-4385-816d-87d7dac34857	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
e301efa9-9848-4add-811c-c3d005d7410f	babd3186-3466-4bd6-acd2-7764236a0363	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
8bd0db0d-c7c6-4b6d-a486-908d34fbbd79	9a3c9858-3cae-4b70-a5a8-08226eedd98b	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
c169e016-f722-47c0-aabf-76432fbce832	550e8400-e29b-41d4-a716-446655440030	achievers	t	2025-07-27 13:47:32.966+05:30	2024-2025	coordinator	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	1
03f2446a-ab61-414b-b009-ea634b8625b7	b5244502-8d12-4f93-99fc-78fb2ce6bcbc	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
08dd4e6d-96b9-4889-9d9c-eb576c89791b	ea58727b-8c98-4cfe-ab9b-ef43e3622a27	ascend	f	2025-09-18 09:54:07.328594+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.328594+05:30	2025-09-18 09:54:07.328594+05:30	5
e3235f3e-3c1c-456a-8aa9-39dd03816d70	516e7b15-c702-4e1e-9b1b-d686967605f1	ascend	f	2025-09-18 09:54:07.351471+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.351471+05:30	2025-09-18 09:54:07.351471+05:30	5
b71904ba-ab96-4067-a615-4854eba6d427	5a3749b1-618a-4314-b6ab-74d534f568e2	aster	t	2025-08-26 00:07:44.018981+05:30	2025-2026	outreach	f	5	\N	\N	2025-08-26 00:07:44.018981+05:30	2025-08-26 00:07:44.018981+05:30	4
c68f2181-831a-43b1-ab2c-5b11f84548b7	550e8400-e29b-41d4-a716-446655440010	ascend	t	2025-07-27 13:47:32.966+05:30	2024-2025	coordinator	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	1
98d40c03-8166-482b-8405-fb4a50d1b158	550e8400-e29b-41d4-a716-446655440020	aster	t	2025-07-27 13:47:32.966+05:30	2024-2025	coordinator	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	1
aa5da3f4-bed3-4b9d-a30d-10ff6a5cc0c0	204a06d7-e042-4c19-8e97-b0f2d8ad1271	ascend	t	2025-08-26 00:07:44.018981+05:30	2025-2026	coordinator	f	1	\N	\N	2025-08-26 00:07:44.018981+05:30	2025-08-26 00:07:44.018981+05:30	1
9f2e504a-7cf1-4b90-9c60-b8ef4f98e635	bca6518e-d6ec-4489-9422-1898f5086ba4	achievers	t	2025-08-26 00:07:44.018981+05:30	2025-2026	coordinator	f	1	\N	\N	2025-08-26 00:07:44.018981+05:30	2025-08-26 00:07:44.018981+05:30	1
8bae3588-6a84-4343-8c73-53ca422b3f7f	7df9bc12-44d8-456c-bf9e-4aa833aec4cd	ascend	f	2025-09-18 09:54:07.351471+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.351471+05:30	2025-09-18 09:54:07.351471+05:30	5
c3a9d26e-3e5a-4d89-b371-3066f66e5127	5d112916-498f-4c55-8c73-fc204b734656	ascend	f	2025-09-18 09:54:07.351471+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.351471+05:30	2025-09-18 09:54:07.351471+05:30	5
9c89884d-a2f5-40db-b6e7-6cf487d36a86	b4b0c30c-2b09-49a8-b70f-b6b3dce0b9e2	ascend	f	2025-09-18 09:54:07.351471+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.351471+05:30	2025-09-18 09:54:07.351471+05:30	5
a76ec5ce-1500-4f79-983a-7616c5e00bc8	dd6a1e30-27a8-4086-9f33-f9061f2c9dce	ascend	f	2025-09-18 09:54:07.351471+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.351471+05:30	2025-09-18 09:54:07.351471+05:30	5
2eebdb7e-7077-4c95-8da2-75fc475fdda3	8ec03e7b-8d4b-4a05-9beb-fd806ce6565c	ascend	f	2025-09-18 09:54:07.351471+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.351471+05:30	2025-09-18 09:54:07.351471+05:30	5
a05f8990-c0c7-428c-9c70-b705c3df1a25	fbbcd147-595f-4eef-b976-366acef8ff26	ascend	f	2025-09-18 09:54:07.351471+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.351471+05:30	2025-09-18 09:54:07.351471+05:30	5
3438c1cf-8323-47ff-97b4-a85137c7c99f	63316bd1-57f9-463b-9ede-4e4a3d9f6ebc	ascend	f	2025-09-18 09:54:07.351471+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.351471+05:30	2025-09-18 09:54:07.351471+05:30	5
f1f7b874-5787-4e52-9bc4-52f02130f5ac	e86bfe25-fc93-43ff-843b-881a1e325a34	ascend	f	2025-09-18 09:54:07.351471+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.351471+05:30	2025-09-18 09:54:07.351471+05:30	5
a7788ebc-aa43-4714-80b8-7e5ca44eb48f	38d1c541-568b-4633-a90f-098df52a24fc	ascend	f	2025-09-18 09:54:07.351471+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.351471+05:30	2025-09-18 09:54:07.351471+05:30	5
2e89c627-02d2-474f-ba26-736fdf220e53	9a5938eb-3111-47fe-a0db-b0f22b7b910f	ascend	f	2025-09-18 09:54:07.351471+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.351471+05:30	2025-09-18 09:54:07.351471+05:30	5
98521f80-1a92-485e-9cc9-259f0173ea57	bd382b69-c21e-4663-8429-ff3d18c86ed8	ascend	f	2025-09-18 09:54:07.351471+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.351471+05:30	2025-09-18 09:54:07.351471+05:30	5
5ec5b902-2c31-42c6-80dd-ae9b267e5fab	e036f3f6-9138-48ed-b765-7f235cd26ce9	ascend	f	2025-09-18 09:54:07.351471+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.351471+05:30	2025-09-18 09:54:07.351471+05:30	5
77075f32-4e51-4915-9e10-66357c54840b	c1cabec8-a494-4d1c-a8e6-f4f7367e32f0	ascend	f	2025-09-18 09:54:07.351471+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.351471+05:30	2025-09-18 09:54:07.351471+05:30	5
668fb10b-1070-4df4-846f-2bcef4df4077	c4e85bd7-fa6b-43a2-9468-e8ff6bffa769	ascend	f	2025-09-18 09:54:07.351471+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.351471+05:30	2025-09-18 09:54:07.351471+05:30	5
3829f867-d375-4a47-82bf-90d46bad0f04	d52f91db-d5be-400a-9f73-2c21de928a70	ascend	f	2025-09-18 09:54:07.351471+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.351471+05:30	2025-09-18 09:54:07.351471+05:30	5
ce2908f6-3793-40c9-bc4e-f12e70afd6d8	4bc988fd-22cc-4519-89f6-a1986d540987	ascend	f	2025-09-18 09:54:07.351471+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.351471+05:30	2025-09-18 09:54:07.351471+05:30	5
a08e9bf3-f3d4-442c-b7e1-1985ed5c544e	17aa0235-9867-440a-8d6f-a82d1db8b11c	ascend	f	2025-09-18 09:54:07.351471+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.351471+05:30	2025-09-18 09:54:07.351471+05:30	5
a5cb8461-684a-4113-834e-f470878fb83c	4512afd3-6f27-49f0-a37d-b5f05d5aef6f	ascend	f	2025-09-18 09:54:07.351471+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.351471+05:30	2025-09-18 09:54:07.351471+05:30	5
443c5f2d-7221-4079-8d2d-6c7b12852ad0	88820c0a-9bb1-4aa9-9398-8a1b3dd523d9	ascend	f	2025-09-18 09:54:07.351471+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.351471+05:30	2025-09-18 09:54:07.351471+05:30	5
a04970cd-ea3d-43c2-959a-c24aeb59e194	0d481d32-9eaa-4f82-a570-0d6b23dd92a4	ascend	f	2025-09-18 09:54:07.351471+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.351471+05:30	2025-09-18 09:54:07.351471+05:30	5
908f0757-9498-4766-8255-cca4ffdd4cae	948524bd-b789-420c-9131-c50d5c4dd800	ascend	f	2025-09-18 09:54:07.351471+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.351471+05:30	2025-09-18 09:54:07.351471+05:30	5
4e7be8b8-afef-4e7e-a32c-5ea819becbcf	0bd5466a-1c45-41cd-b2d7-d7b86362d7e9	ascend	f	2025-09-18 09:54:07.351471+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.351471+05:30	2025-09-18 09:54:07.351471+05:30	5
99d98968-bfd5-41ca-8c5d-5bb34b625fcc	1ad19731-56d7-43f4-82f6-59c01d073270	ascend	f	2025-09-18 09:54:07.351471+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.351471+05:30	2025-09-18 09:54:07.351471+05:30	5
e641b3d0-c1fe-4af6-bfca-086988f3eaa2	a6cfa220-8502-464a-ab5d-ba4504e83ed9	ascend	f	2025-09-18 09:54:07.351471+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.351471+05:30	2025-09-18 09:54:07.351471+05:30	5
c20d8370-8740-4ce1-bcf1-6f0f536abf5f	e9b5e78d-e516-47c8-a5aa-501a6c34527a	ascend	f	2025-09-18 09:54:07.351471+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.351471+05:30	2025-09-18 09:54:07.351471+05:30	5
085bbc3d-ac41-4b58-b857-351c6456526a	969afff3-53d6-4b16-abeb-55235a93f793	ascend	f	2025-09-18 09:54:07.351471+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.351471+05:30	2025-09-18 09:54:07.351471+05:30	5
99fd1b27-02ad-4e4a-9267-6bba600484a2	0f202db3-6443-49f0-a9c8-e8fdd79bde5b	ascend	f	2025-09-18 09:54:07.351471+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.351471+05:30	2025-09-18 09:54:07.351471+05:30	5
fa8c24d7-0db1-4b2f-8212-c4fe9b43da3a	258f881a-71e5-4771-9185-c38c2a2f8c0f	ascend	f	2025-09-18 09:54:07.351471+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.351471+05:30	2025-09-18 09:54:07.351471+05:30	5
3b2a48a5-5c6b-4f22-bb89-aa7d68c3843f	5ddbc684-0c5e-4ed4-b6dd-6267708ccb4f	ascend	f	2025-09-18 09:54:07.351471+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.351471+05:30	2025-09-18 09:54:07.351471+05:30	5
5fc6cc07-2117-4dea-89fc-5fdb988d2a0f	aa87dff3-2675-4615-bb63-adf657a71dbe	ascend	f	2025-09-18 09:54:07.351471+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.351471+05:30	2025-09-18 09:54:07.351471+05:30	5
ca46a336-3618-45ad-9ab7-c1ca01e0ca7e	4f1b4c11-f53c-4049-9106-19ff7d460d76	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
87c0c6e8-2986-4699-8444-d37d7cefad85	345cca51-12d4-4f99-b21e-573c0bab2d17	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
f17a24dc-58e1-4fc8-96f7-5e30a5c4f36f	c96d90a9-60b5-4344-8173-e34895981bde	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
9da25b78-3cd1-41f4-9eae-fda213a83d82	8b8e18b7-96f8-486e-8e0d-e6c4d8a44fc6	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
364f971a-1166-4dea-b894-14544462a67d	af0b9378-b328-4a3f-855e-5b32cd442a5e	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
0aa86c65-1b2e-4fec-bce9-bed54faf778a	f1afb4ed-be0f-4d69-9ea3-52238d7b61ed	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
3d043512-5543-424a-ad39-babba0063a47	b9f1d273-57c1-4ba4-9411-5495254ff797	artovert	t	2025-08-26 00:07:44.018981+05:30	2025-2026	coordinator	f	1	\N	\N	2025-08-26 00:07:44.018981+05:30	2025-08-26 00:07:44.018981+05:30	1
4257a772-3c77-448a-809f-a8133a5de07f	e75ebfdc-b1e8-440c-a987-c77306ab8348	artovert	t	2025-08-26 00:32:03.021727+05:30	2024-2025	coordinator	t	1	\N	\N	2025-08-26 00:32:03.021727+05:30	2025-08-26 00:32:03.021727+05:30	1
b7959420-3983-4e6d-a500-f3d0818a33b9	8397062d-0b15-4115-9ee3-3e2f4bef0e36	ascend	t	2025-08-26 00:07:44.018981+05:30	2025-2026	co_coordinator	f	2	\N	\N	2025-08-26 00:07:44.018981+05:30	2025-08-26 00:07:44.018981+05:30	2
6fe2d942-482f-451b-bbcf-20de32acf5a0	85831284-34d0-4724-90c2-26e6204c1428	ascend	t	2025-08-26 00:07:44.018981+05:30	2025-2026	co_coordinator	f	3	\N	\N	2025-08-26 00:07:44.018981+05:30	2025-08-26 00:07:44.018981+05:30	2
cb919904-9bed-4c86-bc86-3347b098284b	59c443c7-2e5e-41ec-96bb-0b33ca557948	aster	t	2025-08-26 00:31:45.019056+05:30	2024-2025	co_coordinator	t	2	\N	\N	2025-08-26 00:31:45.019056+05:30	2025-08-26 00:31:45.019056+05:30	2
8af3d66d-a5fb-49c3-b3b1-41d98f110305	19124f5e-a896-4728-bb75-701f616c7716	artovert	t	2025-08-26 00:07:44.018981+05:30	2025-2026	co_coordinator	f	2	\N	\N	2025-08-26 00:07:44.018981+05:30	2025-08-26 00:07:44.018981+05:30	2
1a41e114-3386-490e-82c9-5f7b588a0fb6	550e8400-e29b-41d4-a716-446655440011	ascend	t	2025-07-27 13:47:32.966+05:30	2024-2025	co_coordinator	t	2	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	2
3adc0d0a-dd00-47f6-910b-808955749a83	a758760c-468e-4185-b84c-374ec2168a4a	ascend	t	2025-08-26 00:42:58.87397+05:30	2024-2025	co_coordinator	t	3	\N	\N	2025-08-26 00:42:58.87397+05:30	2025-08-26 00:42:58.87397+05:30	2
0fde462c-4c3a-440e-a5bf-00153ed52c6e	4045af03-9a2e-4f61-818d-d71b5dc36728	aster	t	2025-08-26 00:07:44.018981+05:30	2025-2026	documentation_incharge	f	4	\N	\N	2025-08-26 00:07:44.018981+05:30	2025-08-26 00:07:44.018981+05:30	2
744808e3-f2b5-4bba-9e61-3471cec2ae05	c088cdf3-11ff-408d-b95a-1f50bb794c27	artovert	t	2025-08-26 00:32:03.021727+05:30	2024-2025	co_coordinator	t	2	\N	\N	2025-08-26 00:32:03.021727+05:30	2025-08-26 00:32:03.021727+05:30	2
41722107-e05d-42fd-9ac2-a78a4ebce117	27b07006-e253-4fdb-a0b7-32c4ecc00550	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
15f87f48-10a4-4342-ac2e-08fd625682cf	43cdce4b-f241-4620-8b56-0b7f19dfae02	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
5ef6dd0d-94bf-4d06-961b-595efbd5d621	4045af03-9a2e-4f61-818d-d71b5dc36728	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
bc15e1e6-d68b-45aa-833b-1f414624a5ba	49417a0e-0f43-45fb-a5a6-cb47b5582d68	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
52dd6980-922c-4b86-9adf-e6f6689f1a17	2c363200-f236-45f5-921e-30e422c0da55	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
7ab5bff6-b705-44d4-bb1c-6033212460cc	5b91c7ef-dd6e-4171-98fd-26e71ba7ae37	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
1d90badb-e311-46e3-81c2-4d149fcb0c13	99c8e1ed-033d-4168-b100-561f0f787f0a	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
7c222b80-3d5c-49a6-a65c-5a77bd968746	d57f7718-1b5f-4889-97a3-76a96a238540	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
e882843d-cab8-4bb7-b402-43208aa6fe93	3b8ea21c-bd1d-4aae-881c-31e206f27fa4	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
e5d5a74b-6abc-4210-8064-c0bc925e91be	222d6cce-5115-47ec-8741-53f80b1f982d	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
7a329ca3-be70-43f9-be31-e6ff0567fd51	bc3ed184-936a-4a5b-a729-603f224d2d92	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
2336a175-a27b-40a1-b212-bf1f12f4493f	550e8400-e29b-41d4-a716-446655440021	aster	t	2025-07-27 13:47:32.966+05:30	2024-2025	co_coordinator	t	2	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	2
c70b73b9-e2cb-4e4b-97e7-14d61252009a	550e8400-e29b-41d4-a716-446655440031	achievers	t	2025-07-27 13:47:32.966+05:30	2024-2025	co_coordinator	t	2	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	2
34626e18-aeb2-4294-83aa-af1db1bb48d8	8eb864a5-a99b-4d3b-94f9-4619ed66c5e3	achievers	t	2025-08-26 00:43:27.766481+05:30	2024-2025	co_coordinator	t	3	\N	\N	2025-08-26 00:43:27.766481+05:30	2025-08-26 00:43:27.766481+05:30	2
566b28d7-4ee5-4d03-ae9e-249d24c02f89	550e8400-e29b-41d4-a716-446655440012	ascend	f	2025-07-27 13:47:32.966+05:30	2024-2025	secretary	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	3
d0bd6ec7-2461-41f7-b74e-12fab5a67eee	550e8400-e29b-41d4-a716-446655440032	achievers	f	2025-07-27 13:47:32.966+05:30	2024-2025	secretary	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	3
3f91f7c5-dc9c-4134-9838-400748716aed	70672185-25b9-41b5-bae0-e74ea1a26db9	artovert	t	2025-08-26 00:07:44.018981+05:30	2025-2026	secretary	f	3	\N	\N	2025-08-26 00:07:44.018981+05:30	2025-08-26 00:07:44.018981+05:30	3
86c4cbdf-da59-469b-af12-f1a7abd5094d	febf3dd5-655c-4e18-86a9-2abbf245cb16	artovert	t	2025-08-26 00:32:03.021727+05:30	2024-2025	secretary	t	3	\N	\N	2025-08-26 00:32:03.021727+05:30	2025-08-26 00:32:03.021727+05:30	3
a37e855f-4b9c-4c32-9212-9be8056d14fc	086ebbaa-f6dd-4ce4-a836-246833f9573c	ascend	t	2025-08-26 00:07:44.018981+05:30	2025-2026	mentor	f	4	\N	\N	2025-08-26 00:07:44.018981+05:30	2025-08-26 00:07:44.018981+05:30	5
c9d835c6-a28f-4df8-b981-0aa4f14aa727	550e8400-e29b-41d4-a716-446655440000	ascend	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
976ac0c8-1ce0-43e6-ac21-c646bb97118f	550e8400-e29b-41d4-a716-446655440023	aster	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
d1bb3bfc-5b9e-499d-b757-d54dbbbbd9af	550e8400-e29b-41d4-a716-446655440033	achievers	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
679c044c-6c4f-4a5b-96de-cb44514eab8d	550e8400-e29b-41d4-a716-446655440302	achievers	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
bcce043d-76ba-4941-93f7-8aa23a685458	550e8400-e29b-41d4-a716-446655440013	ascend	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
43265b7e-d07f-48e0-a7c1-7369679763aa	cc0b35da-a560-416e-9366-00680dead616	ascend	f	2025-08-07 01:12:15.546+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
2a2e5665-d234-4c0b-8d54-704b4cf2accf	1d5b1108-eb4c-4191-ae75-751e3610d519	ascend	f	2025-08-07 01:25:30.145+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
9cc2ac12-58e1-4713-9007-84771e65c877	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	ascend	f	2025-08-24 16:47:13.14983+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
d19582df-6caa-4f00-b17f-2fbf1fd3a073	550e8400-e29b-41d4-a716-446655440402	artovert	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
012def7f-daed-4a12-b696-c48c78ba4db4	550e8400-e29b-41d4-a716-446655440043	artovert	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
1ea7d73b-56f9-483a-82fc-4d7dfaa91ee7	550e8400-e29b-41d4-a716-446655440100	ascend	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
e1284108-8d0a-499f-8653-b7606dca4c56	550e8400-e29b-41d4-a716-446655440101	ascend	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
c72cb708-34a1-4a1a-aae6-366f6fea8bc5	550e8400-e29b-41d4-a716-446655440102	ascend	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
99d80051-89bf-42fe-899d-0cd8376fa114	550e8400-e29b-41d4-a716-446655440200	aster	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
28517767-7e48-47bb-bafa-84443a080aa9	550e8400-e29b-41d4-a716-446655440201	aster	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
01ad6cf0-dd35-4ec2-9671-cf677b73f33f	550e8400-e29b-41d4-a716-446655440202	aster	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
7d2d3242-c84e-4ce1-8a7d-a3cdcd9dc0f3	550e8400-e29b-41d4-a716-446655440300	achievers	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
45bdfdd0-b5ba-4c71-b9a3-ca9d79171909	550e8400-e29b-41d4-a716-446655440301	achievers	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
35c233b6-e6e0-4c92-9a1b-819778d85ea4	550e8400-e29b-41d4-a716-446655440400	artovert	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
f89be9aa-0a07-4e14-84e7-796c65c8ad6e	550e8400-e29b-41d4-a716-446655440401	artovert	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
642e00db-89f2-4891-aae6-7bae4bb239db	6390f8d9-cb13-4e71-b183-05ef511eca27	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
a40f13b9-d239-46c9-8eb8-a5b73cd26cb9	dfff0dd7-a46f-48d1-9383-43354cadae5d	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
cf8927ac-2c95-4873-8c29-70eed56816a7	2e1967b7-3996-4e17-9f07-98719fec9395	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
9c62b939-5896-444e-81c2-2deddaac2c74	92e14451-1c2f-44cc-a2bf-6dc01d6f065e	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
e82427a2-e5ba-468d-a52f-da2292d9fa68	272d5a56-b416-406c-803b-47d851843bb7	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
b3d31d52-69c7-449e-86e8-4fa4c4fcb178	74c281cc-ef5b-4777-93b8-6e8bf18fafe8	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
42d29536-6084-436a-8cb8-31b1a8f7f2ab	da9f3e59-cbd1-4ea8-bb78-3ce6778355ae	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
69761297-808e-4339-a319-f372fcf5e52a	e2115245-68b0-4784-8f4a-3fb6be8c47c1	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
5aa72e49-8f0d-4494-93e0-071440c9a008	f793aced-67ea-4245-98bf-69d86c74d042	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
6c09e8db-baea-489a-8a78-72f712c17905	af142fab-4ebc-4e45-9d6e-c6c17eda1f9d	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
0bb1f5b8-96f1-4504-bdcf-68aacf35b71d	79af793e-5d26-4f6d-9e53-66bbe0608925	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
90161359-19b9-418d-8533-583dc9b503e7	ecba650c-0e82-4a85-81c8-9a46c5444cc4	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
fde400f6-20d4-454f-8a66-b6427127a36e	9f80f1d7-d873-45f0-bdf2-e9352e1abf11	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
c38a53b6-6745-4842-b3ae-2d2277691cc7	5b41f31a-49ce-407c-a59b-b1b277d08a0a	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
f2593505-74a1-4e1d-aa88-0ee35946e397	747be3ea-88ed-4ac3-a6a3-bd69028c307b	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
c25e0d61-4c80-4cb2-8c0f-b8481fc8265d	44a99bf6-b72c-45a4-9916-068bb79c4e8d	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
f0818aa6-7b2d-4434-b941-eb2c0b14e71b	8eb5432b-f272-4745-abb5-29d0e6ddffc5	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
3c6ceb6a-5674-4197-bed0-9a6f2dfd00d8	9048a0e5-4e56-4a30-bbaf-53a02b93f316	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
38364728-82f3-4756-aef7-55d6c5bd95de	739d8de7-e9fc-441d-a96e-ad37421098da	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
94ef3719-7ad2-41e5-83c4-88cee72198fc	7d668d6b-f685-4911-a305-047d7aa56b28	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
f2674254-749f-4be6-9020-66a097a0552d	baa97680-8d21-4a55-80ae-64528c842921	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
ef06152e-e1bd-4ffd-b245-a7778b0a0c71	1364b212-79f4-424c-9a02-bf30949cf209	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
d79a3b53-866e-42bd-bee0-d865242de199	00ce99e7-fb36-40f6-b4eb-5641dd55a34f	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
255ee137-090a-469d-8a2a-e3af2545adb5	741d6125-35f5-4ac6-9b92-0a943051dafc	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
95fc2d12-d378-45ad-8759-5b2069ef5139	e624fa3f-bb9f-4da6-b569-c5a22904b389	aster	t	2025-08-26 00:07:44.018981+05:30	2025-2026	secretary	f	4	\N	\N	2025-08-26 00:07:44.018981+05:30	2025-08-26 00:07:44.018981+05:30	5
fc2f3776-6f7a-4c34-9ee5-a791e5369522	e624fa3f-bb9f-4da6-b569-c6a22904b389	aster	t	2025-08-26 00:07:44.018981+05:30	2024-2025	secretary	f	4	\N	\N	2025-08-26 00:07:44.018981+05:30	2025-08-26 00:07:44.018981+05:30	3
4296a189-f8d5-45c7-86dd-dd8adb686462	e29a1043-e3e8-45ec-9e09-a8da48d2bb1b	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
b2a3dc18-fffb-4261-8e0f-88684c582b08	10c8cccc-ec4f-4e6b-87b5-6249996e0454	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
87808f6b-85ac-4999-a1e8-e85ff81f4022	618b2f5b-a891-4acb-9e0f-4de13a7a854e	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
102b9f3b-d9e3-4596-801f-60b6b52cfda3	1e6ee6a2-5f08-47e6-964a-9b107164bab5	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
4320bde7-e720-48ca-9a3a-df36a54801f2	953a6590-9470-4ac2-83a4-81f802dc5602	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
d59392ca-bec5-4bb2-835a-3d0d35d032d1	8da1a61b-848b-48ab-a09f-4aeaad47476d	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
faad5d27-34b6-46ae-9d2f-61e6d8467ad1	e1e32e12-f57f-410d-a56e-4dcd0c3526ed	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
5e7157f6-4b66-41e6-ae9c-3d25ce90c50b	63db6ecf-4be2-47e6-a99f-a00d0bb22b63	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
b1e62cf8-1f9c-41ab-9bce-c01298047fbf	43c9973d-6179-4bef-a0a9-8d6da6b7c4e2	aster	f	2025-09-18 09:54:07.367069+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.367069+05:30	2025-09-18 09:54:07.367069+05:30	5
3b68c018-5fd2-4d50-aefd-0b00953c1c38	6a52f0fb-65e4-4dea-9adb-6e6ac69a7620	aster	f	2025-09-18 09:54:07.38479+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.38479+05:30	2025-09-18 09:54:07.38479+05:30	5
21f8f727-3aba-4e1e-9729-73f1b37848a6	71c3fcbc-dfbc-47a6-9e63-74e85ad7d488	aster	f	2025-09-18 09:54:07.38479+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.38479+05:30	2025-09-18 09:54:07.38479+05:30	5
a636f319-7fd5-49b8-8aa0-1529e9569d26	d0f7a591-91fe-45e0-82eb-eef9413f7292	aster	f	2025-09-18 09:54:07.38479+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.38479+05:30	2025-09-18 09:54:07.38479+05:30	5
42e2bcd2-34d6-4c05-913f-0e43a4e17350	b18312b8-7028-4741-8ba7-58f913e6900b	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
850592ed-da74-471f-a395-be8725be67f5	baa5e01a-03f2-4f5b-bb02-9ac1bee12a89	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
ee82a49c-8d85-44cf-a109-96f2cc72f166	8aaa38fc-21a0-4fd4-a756-492dcb0cf9fe	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
c28abf49-10ef-48bd-8216-8b5658b9bfcf	4155a5f3-f02e-4dbf-aa53-a3668bac3951	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
ea2bfd65-59a0-46bd-b27e-13ddf56d870b	c4b413ee-4abe-452a-bd1b-61216e1f507e	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
2e1947a9-d018-4f4d-9874-62ffa4072ee8	1296b68e-ee4e-495a-8813-4277e7c0b4bb	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
904ea735-5c0b-4e3e-90c6-f51e48f8fa14	d07c1a56-6d7c-40ea-8534-fec7565d31e7	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
defcfac8-7c53-46ea-ba5e-d8e9fc1481aa	588e7c5d-3fdf-4c3f-b498-9455c6c9956d	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
90bc5371-936a-475d-a286-62b1ddc5e7c5	55254256-01ce-4d77-bf11-369466c4a024	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
41270245-5f0d-4437-a4d1-605c9a20c9d4	333586c1-3015-4219-ad23-4e4cf2264e7f	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
1f3ea22f-3030-49e5-9178-969a5dc49d6e	fdd26cf3-97fc-4cd4-872f-15c51dd89ec6	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
aa00abc5-8144-43b3-a258-600c08592e4d	a0c14c4b-530b-42df-b589-cc04f1a1a468	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
ee30242e-3098-44ad-987c-04356f966670	abb6dab7-468b-4224-9c07-0c0fb0e7ec68	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
e0f5ab5d-d1a4-4d4d-a00d-4604bd099b1c	a5b745da-eeb7-4ded-95fa-5036e03d3125	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
1bf3279f-854b-46be-9356-62d09dec07dd	93cb9411-e541-420f-954b-2e35740fb479	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
81068933-b8cb-4077-9180-ffa5f6e53e47	e83382d5-f7c2-4900-bd22-44603b4294f1	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
0e735512-e59f-492e-bcc0-a36b2ecb7a1e	1196a455-a390-4cae-821b-5a0cdb299bb2	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
c859531a-3ea4-45be-b324-db3a1da50683	efe3b959-e009-44a4-88f9-7be30194cdb0	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
b0cda591-e165-4db0-a5f7-b3789a57d9c0	d4b64602-ff9c-4009-82e6-deba3a87de52	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
55f6a414-f83f-47ab-87e8-4f046cea59c6	52c57813-3d17-43db-ad28-11881129965b	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
44ea375d-f06e-4846-aa3a-add20909423a	17a7d81f-d156-4701-86c9-b8938cd12568	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
26bec8f3-70c4-4193-96b8-872a6770cdf2	ba93ceb7-b456-4d81-a2a4-75391ecee51a	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
df713db5-0a3d-4abf-9732-27b697ce40d6	1e5f88d6-ebd4-4ec2-ba4e-6261b1626bfe	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
810883b3-241d-4b6e-8163-3b65d8a72369	cf5934f8-e041-4dbd-bda1-c7a4532ee468	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
3bc0ae01-44b6-4d4f-b7f4-355110bc99b3	c3a2589e-dff1-40c3-a59e-ef29cf4c42df	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
b3e51296-3ce0-4035-8f54-b18b5e720c06	883831a7-c437-4fe4-9774-88db0103a5d1	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
9f964387-f68c-4a68-9880-c488f2597d31	6e2de18f-0fe9-469b-a8a7-8643812030c1	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
4092e6aa-7ece-4107-924a-c9efd580fcdc	7da89033-5a11-4148-b1dc-16435f17b069	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
128643a6-9f30-4f5f-bd51-e8bdef724d1e	d7274c11-d1d6-4df3-8468-188bd2e5dcbc	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
1c3e2a39-fe89-4fb8-96f8-8d1510576a5c	f64d0be6-ffad-49ac-a8b2-b50d43f42dd3	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
dacf45e4-a35c-46d6-9569-48d1ed5b60e6	aa548ac7-913a-47db-91bf-a3d3046754ca	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
43702530-4117-4500-92b3-1ebfcbe80437	6435a57e-e910-4104-a163-b49943024b77	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
137325ce-21c9-46d8-b0ea-728e35d3f373	f34ba402-f733-4977-832d-c3cdc54284ae	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
ee5e4c9b-c211-4820-b75e-0c701a37fdb6	3d5ad263-47a6-46b8-a886-a7a9c3d2ad1c	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
a4385f0e-73e3-4088-ad2b-c0a09b55cd15	06036f36-593e-4850-b36c-cc1d2354b78d	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
19fdd035-00dd-468d-a89d-f69cf874553b	15671ce3-a7fc-42a4-95a9-12ea19f90072	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
eb0f1785-f17c-4e2b-9771-d48418bdb399	cf73c4fb-4ae1-4c9c-8e0c-88fc291b0d0d	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
540ab295-d545-44ff-9d1b-b1f0e75eb779	14c2825e-09bf-4451-a465-c95ae4284a6a	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
59a7d101-8ac7-4c9d-bbbe-2e103d5042a8	2446753e-56f6-4051-9ac5-43cc1bc88e81	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
550c14ab-51c0-4772-aeaf-739e34a30116	7b927dfb-7e4a-40b3-b9d6-f0690d5939b3	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
2145271a-e213-4b20-848c-a52fd1b8f61e	07190594-c37f-4ac0-bcfa-cb68ed30d242	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
3b77da34-5047-43c6-9cd5-90803ab07674	4c71d5d7-a700-4efe-9704-5d907e44a49f	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
67359b92-833f-48b1-9b18-d829fadafc51	4636a0ae-4ae1-4e50-9dc4-20f1f6304096	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
277e0abb-0965-4356-9a03-390075b768fd	4921379b-1277-497c-8659-47e4156a5774	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
2c18b59e-36e4-42cb-96cb-6483077bb563	e711111e-b1b6-4a2d-8b25-a028853c901a	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
36142c00-8acc-4d0e-87ba-14f5cdcf8c0b	0a4a5eb1-afa7-4285-9fef-3b57b937103d	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
f7561be2-10d2-447e-ae2b-0be2f7bf279b	dbe6f91c-7526-44ea-bdfb-d38d083530f6	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
1309b169-9d47-4ec6-9155-e5faf63d8a0f	066bd297-28e7-4157-b4e2-25e64bd3834c	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
c22703f8-a1e1-4c37-b43e-5c41580c7677	2a170eb4-eef2-4936-bd8f-8ef6fed7499d	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
c4bf32a0-5a77-48ce-a077-06ebe7af9d1b	2300b5d3-beda-4fee-912c-3b6674025dc2	achievers	f	2025-09-18 09:54:07.386618+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.386618+05:30	2025-09-18 09:54:07.386618+05:30	5
770e32af-e63c-49e1-8935-be6cedb5a194	3671347e-912b-49bf-897a-bc97e7f31916	achievers	f	2025-09-18 09:54:07.406578+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.406578+05:30	2025-09-18 09:54:07.406578+05:30	5
e25207d7-b863-48a7-8f33-f6620cfc16a2	3f925245-2286-4eae-bb5a-c3bf53c556df	achievers	f	2025-09-18 09:54:07.406578+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.406578+05:30	2025-09-18 09:54:07.406578+05:30	5
95b76f24-314d-4a24-bbc1-d28495b360f1	96c936f6-ff6e-4c92-808f-fbf95767b527	achievers	f	2025-09-18 09:54:07.406578+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.406578+05:30	2025-09-18 09:54:07.406578+05:30	5
f0195ee4-9cba-46c0-975a-47e58b46dddb	fcea31b5-b267-45e7-a65b-760c59071eb5	achievers	f	2025-09-18 09:54:07.406578+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.406578+05:30	2025-09-18 09:54:07.406578+05:30	5
6945877d-8ac2-4562-b607-13c85c8d0b5f	b9fefb31-2996-4e4b-854e-6173dffdcce3	achievers	f	2025-09-18 09:54:07.406578+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.406578+05:30	2025-09-18 09:54:07.406578+05:30	5
7493c34f-e123-49d7-afb2-95cc50b1a7f9	2aed1d75-95a1-49de-abd7-3f3e972b96b9	achievers	f	2025-09-18 09:54:07.406578+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.406578+05:30	2025-09-18 09:54:07.406578+05:30	5
987cf8eb-4fb1-449d-9085-59bdd3e36f20	3c0310f4-0e98-4a8b-823e-32a128b1188e	achievers	f	2025-09-18 09:54:07.406578+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.406578+05:30	2025-09-18 09:54:07.406578+05:30	5
45e0e3f8-04c5-4853-a2c1-3437d13ee402	d542af11-6ee7-4957-b7fa-159aa92d4032	achievers	f	2025-09-18 09:54:07.406578+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.406578+05:30	2025-09-18 09:54:07.406578+05:30	5
53b356e8-c092-4ff8-b57d-b350bb519f20	06f6aac9-cfe1-411b-8dd9-5cb7b53623b4	achievers	f	2025-09-18 09:54:07.406578+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.406578+05:30	2025-09-18 09:54:07.406578+05:30	5
4b91493f-d38f-46b0-a657-9a3bc838279a	b6ea4ca7-00f7-41ef-8ce3-b7d6c67e1b92	achievers	f	2025-09-18 09:54:07.406578+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.406578+05:30	2025-09-18 09:54:07.406578+05:30	5
b9f63cb7-eb02-4872-8a10-6ca18f67fef2	2cb44d7b-1b38-41ee-8327-71d0b012aaa8	achievers	f	2025-09-18 09:54:07.406578+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.406578+05:30	2025-09-18 09:54:07.406578+05:30	5
f3210188-d136-4fa3-a173-50820b897788	3dfb448a-f5c3-4002-bb33-1d104fd20ee3	achievers	f	2025-09-18 09:54:07.406578+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.406578+05:30	2025-09-18 09:54:07.406578+05:30	5
5a8f249d-2c45-4a54-8829-7bccceec8007	f985359b-f604-40a2-ae66-11e673ae8cc5	achievers	f	2025-09-18 09:54:07.406578+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.406578+05:30	2025-09-18 09:54:07.406578+05:30	5
a8745c68-4747-4784-87cc-fbc09534822f	dab3aee6-6af4-4873-af15-37cadc6cf86d	achievers	f	2025-09-18 09:54:07.406578+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.406578+05:30	2025-09-18 09:54:07.406578+05:30	5
21faf0d6-3373-455f-993b-5db397b43dec	42926f16-66a7-4773-bc41-e7f45a8ac247	achievers	f	2025-09-18 09:54:07.406578+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.406578+05:30	2025-09-18 09:54:07.406578+05:30	5
69c0751b-7317-4274-8f1c-593097de521b	fdaf03b4-1497-425a-9146-3a76f1029ed4	achievers	f	2025-09-18 09:54:07.406578+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.406578+05:30	2025-09-18 09:54:07.406578+05:30	5
90c5465f-9fc0-4c16-b023-dffe9476bc40	f7de5f20-0c01-4718-8f43-e0a7458b90f1	achievers	f	2025-09-18 09:54:07.406578+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.406578+05:30	2025-09-18 09:54:07.406578+05:30	5
9193d5aa-6245-4593-bb56-8dcc112e8df2	a73c5134-712b-46c8-bd70-c6867092de3e	achievers	f	2025-09-18 09:54:07.406578+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.406578+05:30	2025-09-18 09:54:07.406578+05:30	5
13296954-9a04-4a5a-8185-ffd6f540e818	db079ff1-55e6-4f53-bd93-f942beccb239	achievers	f	2025-09-18 09:54:07.406578+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.406578+05:30	2025-09-18 09:54:07.406578+05:30	5
ccf774de-c5cc-4106-b911-7592906f09e1	c5f7f24a-2ed9-41d6-9186-ae92590ad41d	achievers	f	2025-09-18 09:54:07.406578+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.406578+05:30	2025-09-18 09:54:07.406578+05:30	5
43a1ff40-4d28-46a8-ab74-1ad1888bc037	ea39f055-7cf4-4837-b82f-8a36d6c8f7a6	achievers	f	2025-09-18 09:54:07.406578+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.406578+05:30	2025-09-18 09:54:07.406578+05:30	5
ab7dbce8-63d8-4d6a-bc48-205dbfba80d5	1de62976-1c2e-4a1c-96bd-bb8ff8a9306a	achievers	f	2025-09-18 09:54:07.406578+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.406578+05:30	2025-09-18 09:54:07.406578+05:30	5
76b37ea0-ecdf-4f83-aecb-e36269fffbee	f6ff25db-9d05-4145-b0bf-eb0a9f403119	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
a814d079-2c76-4d48-b1bb-47379f54ec0e	6b552eb4-a4eb-41dd-8db1-0d80843b68ef	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
21d358fe-f634-4a2e-805e-c0e1fc24718f	e3e040e6-2b37-467b-aa92-4c4987ec74f7	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
de8691c6-9262-4db3-9677-eca6fbe7192a	465356b6-39dd-44cb-91c8-b29c9a04f4b5	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
52565741-dd44-4cda-a47d-a899f15af018	fe92388c-92c7-422b-b223-35966f52e805	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
4455e4e9-9720-438c-b8ff-656b773f1477	717269a6-7bb1-4d2f-826d-606f6e12e05a	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
1029aad5-13e9-4026-a53a-4cea555d1acc	234f4ab1-3cc5-45ae-b57b-f508cae2230e	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
8960040f-8058-495f-aea2-36d1c39ca5ca	4f98318c-d90a-45cc-88b4-2e4c29404669	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
19de754e-307a-4166-bf3a-11c62ab7e662	5fd73003-f42f-4262-9e8d-a654843c7aba	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
e5590db5-5a8a-46c4-9a9a-a7d6ff648f26	88cb2af1-1193-4283-8f5f-3b1513d41999	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
cacc723c-11e4-44b3-ad04-1074aaa30eb6	3c0ceb61-764b-45a7-88de-4405d04a681d	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
f0b4fe93-0dff-48ce-8617-f06ed0e13197	de385e06-4718-4f3d-8aa5-cefd7133b79f	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
0e672196-94ec-411c-a894-12dae2c4310f	58afc09b-40d8-4774-a9e4-d0dbaf3a320f	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
a6091cf2-d29f-46bf-88db-96f6d7fdf28c	e86b44bd-b5fd-4b57-9b52-11aa0bc693b1	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
6e09f858-6085-40ba-92ae-794c81f71d5e	3903c13a-e086-4a28-9336-11a5e2af9ef7	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
106a08e3-6a43-4005-b199-1d03bbe94da6	482a6cfa-8497-449a-bdde-c2d898a9e215	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
a795710b-2341-4659-989d-e61e5236131a	0ea91a60-6a08-437f-a089-4b33dbba9f8c	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
b92fd563-458c-4841-ae59-e6fb9fdafcef	c23999a3-5baa-4cdf-9b82-2a314c20f6b9	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
6f08954d-8500-4a5a-bb70-b3e24f9e5971	abb68ef2-2088-4ab8-be02-da525934eb58	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
87a02b41-7bf1-47ef-935a-389656cd1f7f	b494b968-3d04-434e-914c-c83a998df7d8	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
c7f60b98-4934-4048-81b0-471a81ca66ec	7a7cf0db-2270-41d5-9eff-7ce114b2c9f7	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
4f8920b6-74c7-4b0f-9049-5700a85c7b1b	96ed8413-d286-494c-9193-94c5df18c332	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
72152493-5044-4f47-b00a-4ff9a292416d	bfd29cec-50f9-4f35-8c6e-ed8470556fe7	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
6de2d114-ba63-4a49-8c6d-d8ed2ad1d00e	490a5350-2cce-4765-995a-fa1f0d8c61d0	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
ce6495f6-793c-4dc5-aeec-0654e3c1cf8f	08f4f5d4-d28f-403c-8225-15576e2fb692	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
4553f89e-7e03-4d35-8a89-5a4e4e4fec3d	4112c950-6b4a-4a39-ae53-58734ba0675b	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
6518894e-9603-4882-af77-19f96c0e93be	9ef27827-5b57-4194-84b7-d44d4fb1da57	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
bef6234d-a92e-48bd-8c2e-aa3fb07ff3a2	8fc2a9dd-3565-42d5-a65b-3f948ce046d4	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
69499a3f-9cfc-4c5b-ac96-dcdca5bb71d7	fe427f69-106a-4ebb-8415-c92965084246	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
a8432e5f-7db8-4562-8618-75de6dbfe28e	af5a33e1-43cb-4e32-b120-4c53bba19b1e	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
4f8c5ded-8167-499b-b050-a09cfc898594	a1129a33-cad2-49ea-aece-910e1b9fa9f0	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
832f1cde-5cf4-44e6-a60f-6bf47de87857	7bd30579-8548-4fa6-a451-d738af86c264	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
7e133265-262f-4825-8129-21634802dcfc	5fa319e5-cdcc-4ac5-b90a-54a78ef99efc	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
5b22c6a3-1003-48c3-96f0-1caae824325a	1eda73be-2c3d-4a14-8e90-cd05278d45ec	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
b6615a2e-99e6-4304-8e29-770c118ef7e9	6c504779-5a21-41bc-8130-7b5357830cb4	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	core_member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
a24d32a2-bde2-4bb7-8976-e389b7cbf853	dbb737b9-c4a1-4f95-b4cf-c0110d261a2b	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
e244c59b-abaf-4eb4-9a2d-617b949b14e8	3e6a0b6b-cdc8-4078-a7fc-0dbb57129ac6	artovert	f	2025-09-18 09:54:07.419025+05:30	2024-2025	active_member	t	0	\N	\N	2025-09-18 09:54:07.419025+05:30	2025-09-18 09:54:07.419025+05:30	5
417ea4e7-fee2-406d-8e45-753cc905f1a9	8203d590-1c95-472d-a9a6-643d696a04e9	ascend	t	2025-08-26 00:31:16.883099+05:30	2024-2025	outreach	t	4	\N	\N	2025-08-26 00:31:16.883099+05:30	2025-08-26 00:31:16.883099+05:30	4
6b2c296e-2805-4ff5-90ba-0e061382a889	8fcc0b11-a2d9-4463-a83c-c1a1370325a6	achievers	t	2025-08-26 00:31:32.769558+05:30	2024-2025	mentor	t	4	\N	\N	2025-08-26 00:31:32.769558+05:30	2025-08-26 00:31:32.769558+05:30	4
1f8d455a-4e7a-4192-a91c-8f2929ec9c54	516a1eee-d8f9-4283-8cfb-740c0387ca8c	aster	t	2025-08-26 00:31:45.019056+05:30	2024-2025	outreach	t	5	\N	\N	2025-08-26 00:31:45.019056+05:30	2025-08-26 00:31:45.019056+05:30	4
3f0ea428-8b4f-4a6f-86eb-e16266d658d1	5a3749b1-618a-4314-b6ab-74d534f568e2	artovert	t	2025-08-26 00:32:03.021727+05:30	2024-2025	event_incharge	t	4	\N	\N	2025-08-26 00:32:03.021727+05:30	2025-08-26 00:32:03.021727+05:30	4
d64c1ac3-7e03-4430-8f5a-52785df03d91	466f3cb4-18bb-485e-827a-e5290cedd969	artovert	t	2025-08-26 00:32:03.021727+05:30	2024-2025	event_incharge	t	5	\N	\N	2025-08-26 00:32:03.021727+05:30	2025-08-26 00:32:03.021727+05:30	4
f281ebf9-ddd7-4a3d-b3da-960bc6f052a6	5aaf2cd5-eac6-4303-8c0c-d60e56576dc8	ascend	t	2025-09-18 13:06:48.462373+05:30	2024-2025	technical_guide	t	0	Guides technical projects and mentors students in programming and development.	{"Led 5+ technical workshops","Mentored 20+ students","Developed club website"}	2025-09-18 13:06:48.462373+05:30	2025-09-18 13:06:48.462373+05:30	4
2a74e72a-71de-442b-8aeb-8b430416d249	516a1eee-d8f9-4283-8cfb-740c0387ca8c	aster	t	2025-08-26 00:07:44.018981+05:30	2025-2026	co_coordinator	f	2	\N	\N	2025-08-26 00:07:44.018981+05:30	2025-08-26 00:07:44.018981+05:30	2
0ab0f672-506e-4595-8522-1fe14becb03c	1ac23e35-54f9-4e34-8ff3-bfff79885d88	aster	t	2025-08-26 00:07:44.018981+05:30	2025-2026	coordinator	f	1	\N	\N	2025-08-26 00:07:44.018981+05:30	2025-08-26 00:07:44.018981+05:30	1
\.


--
-- TOC entry 4440 (class 0 OID 20078)
-- Dependencies: 279
-- Data for Name: club_members_backup; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.club_members_backup (id, user_id, club_id, is_leader, joined_at, academic_year, role, is_current_term, display_order, bio, achievements, created_at, updated_at, hierarchy) FROM stdin;
c169e016-f722-47c0-aabf-76432fbce832	550e8400-e29b-41d4-a716-446655440030	achievers	t	2025-07-27 13:47:32.966+05:30	2024-2025	coordinator	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	1
c68f2181-831a-43b1-ab2c-5b11f84548b7	550e8400-e29b-41d4-a716-446655440010	ascend	t	2025-07-27 13:47:32.966+05:30	2024-2025	coordinator	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	1
98d40c03-8166-482b-8405-fb4a50d1b158	550e8400-e29b-41d4-a716-446655440020	aster	t	2025-07-27 13:47:32.966+05:30	2024-2025	coordinator	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	1
aa5da3f4-bed3-4b9d-a30d-10ff6a5cc0c0	204a06d7-e042-4c19-8e97-b0f2d8ad1271	ascend	t	2025-08-26 00:07:44.018981+05:30	2025-2026	coordinator	f	1	\N	\N	2025-08-26 00:07:44.018981+05:30	2025-08-26 00:07:44.018981+05:30	1
0ab0f672-506e-4595-8522-1fe14becb03c	9e494d57-59b3-48d0-a140-f131099a0a11	aster	t	2025-08-26 00:07:44.018981+05:30	2025-2026	coordinator	f	1	\N	\N	2025-08-26 00:07:44.018981+05:30	2025-08-26 00:07:44.018981+05:30	1
9f2e504a-7cf1-4b90-9c60-b8ef4f98e635	bca6518e-d6ec-4489-9422-1898f5086ba4	achievers	t	2025-08-26 00:07:44.018981+05:30	2025-2026	coordinator	f	1	\N	\N	2025-08-26 00:07:44.018981+05:30	2025-08-26 00:07:44.018981+05:30	1
b71904ba-ab96-4067-a615-4854eba6d427	ec962745-fe2f-4079-b859-7d86bf711c20	aster	t	2025-08-26 00:07:44.018981+05:30	2025-2026	media	f	5	\N	\N	2025-08-26 00:07:44.018981+05:30	2025-08-26 00:07:44.018981+05:30	4
3d043512-5543-424a-ad39-babba0063a47	b9f1d273-57c1-4ba4-9411-5495254ff797	artovert	t	2025-08-26 00:07:44.018981+05:30	2025-2026	coordinator	f	1	\N	\N	2025-08-26 00:07:44.018981+05:30	2025-08-26 00:07:44.018981+05:30	1
4257a772-3c77-448a-809f-a8133a5de07f	e75ebfdc-b1e8-440c-a987-c77306ab8348	artovert	t	2025-08-26 00:32:03.021727+05:30	2024-2025	coordinator	t	1	\N	\N	2025-08-26 00:32:03.021727+05:30	2025-08-26 00:32:03.021727+05:30	1
b7959420-3983-4e6d-a500-f3d0818a33b9	8397062d-0b15-4115-9ee3-3e2f4bef0e36	ascend	t	2025-08-26 00:07:44.018981+05:30	2025-2026	co_coordinator	f	2	\N	\N	2025-08-26 00:07:44.018981+05:30	2025-08-26 00:07:44.018981+05:30	2
6fe2d942-482f-451b-bbcf-20de32acf5a0	85831284-34d0-4724-90c2-26e6204c1428	ascend	t	2025-08-26 00:07:44.018981+05:30	2025-2026	co_coordinator	f	3	\N	\N	2025-08-26 00:07:44.018981+05:30	2025-08-26 00:07:44.018981+05:30	2
2a74e72a-71de-442b-8aeb-8b430416d249	1ac23e35-54f9-4e34-8ff3-bfff79885d88	aster	t	2025-08-26 00:07:44.018981+05:30	2025-2026	co_coordinator	f	2	\N	\N	2025-08-26 00:07:44.018981+05:30	2025-08-26 00:07:44.018981+05:30	2
0fde462c-4c3a-440e-a5bf-00153ed52c6e	6e11229a-a444-4e8b-8b56-e8b6536302d5	aster	t	2025-08-26 00:07:44.018981+05:30	2025-2026	co_coordinator	f	3	\N	\N	2025-08-26 00:07:44.018981+05:30	2025-08-26 00:07:44.018981+05:30	2
8af3d66d-a5fb-49c3-b3b1-41d98f110305	19124f5e-a896-4728-bb75-701f616c7716	artovert	t	2025-08-26 00:07:44.018981+05:30	2025-2026	co_coordinator	f	2	\N	\N	2025-08-26 00:07:44.018981+05:30	2025-08-26 00:07:44.018981+05:30	2
1a41e114-3386-490e-82c9-5f7b588a0fb6	550e8400-e29b-41d4-a716-446655440011	ascend	t	2025-07-27 13:47:32.966+05:30	2024-2025	co_coordinator	t	2	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	2
3adc0d0a-dd00-47f6-910b-808955749a83	a758760c-468e-4185-b84c-374ec2168a4a	ascend	t	2025-08-26 00:42:58.87397+05:30	2024-2025	co_coordinator	t	3	\N	\N	2025-08-26 00:42:58.87397+05:30	2025-08-26 00:42:58.87397+05:30	2
cb919904-9bed-4c86-bc86-3347b098284b	59c443c7-2e5e-41ec-96bb-0b33ca557948	aster	t	2025-08-26 00:31:45.019056+05:30	2024-2025	co_coordinator	t	3	\N	\N	2025-08-26 00:31:45.019056+05:30	2025-08-26 00:31:45.019056+05:30	2
744808e3-f2b5-4bba-9e61-3471cec2ae05	c088cdf3-11ff-408d-b95a-1f50bb794c27	artovert	t	2025-08-26 00:32:03.021727+05:30	2024-2025	co_coordinator	t	2	\N	\N	2025-08-26 00:32:03.021727+05:30	2025-08-26 00:32:03.021727+05:30	2
2336a175-a27b-40a1-b212-bf1f12f4493f	550e8400-e29b-41d4-a716-446655440021	aster	t	2025-07-27 13:47:32.966+05:30	2024-2025	co_coordinator	t	2	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	2
c70b73b9-e2cb-4e4b-97e7-14d61252009a	550e8400-e29b-41d4-a716-446655440031	achievers	t	2025-07-27 13:47:32.966+05:30	2024-2025	co_coordinator	t	2	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	2
34626e18-aeb2-4294-83aa-af1db1bb48d8	8eb864a5-a99b-4d3b-94f9-4619ed66c5e3	achievers	t	2025-08-26 00:43:27.766481+05:30	2024-2025	co_coordinator	t	3	\N	\N	2025-08-26 00:43:27.766481+05:30	2025-08-26 00:43:27.766481+05:30	2
566b28d7-4ee5-4d03-ae9e-249d24c02f89	550e8400-e29b-41d4-a716-446655440012	ascend	f	2025-07-27 13:47:32.966+05:30	2024-2025	secretary	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	3
5176b96a-97ee-461e-b6f7-a93278e5b618	550e8400-e29b-41d4-a716-446655440022	aster	f	2025-07-27 13:47:32.966+05:30	2024-2025	secretary	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	3
d0bd6ec7-2461-41f7-b74e-12fab5a67eee	550e8400-e29b-41d4-a716-446655440032	achievers	f	2025-07-27 13:47:32.966+05:30	2024-2025	secretary	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	3
fc2f3776-6f7a-4c34-9ee5-a791e5369522	63fd6cb0-d546-448b-9fdc-5cb407f61d6a	aster	t	2025-08-26 00:07:44.018981+05:30	2025-2026	secretary	f	4	\N	\N	2025-08-26 00:07:44.018981+05:30	2025-08-26 00:07:44.018981+05:30	3
3f91f7c5-dc9c-4134-9838-400748716aed	70672185-25b9-41b5-bae0-e74ea1a26db9	artovert	t	2025-08-26 00:07:44.018981+05:30	2025-2026	secretary	f	3	\N	\N	2025-08-26 00:07:44.018981+05:30	2025-08-26 00:07:44.018981+05:30	3
86c4cbdf-da59-469b-af12-f1a7abd5094d	febf3dd5-655c-4e18-86a9-2abbf245cb16	artovert	t	2025-08-26 00:32:03.021727+05:30	2024-2025	secretary	t	3	\N	\N	2025-08-26 00:32:03.021727+05:30	2025-08-26 00:32:03.021727+05:30	3
a37e855f-4b9c-4c32-9212-9be8056d14fc	086ebbaa-f6dd-4ce4-a836-246833f9573c	ascend	t	2025-08-26 00:07:44.018981+05:30	2025-2026	mentor	f	4	\N	\N	2025-08-26 00:07:44.018981+05:30	2025-08-26 00:07:44.018981+05:30	5
95fc2d12-d378-45ad-8759-5b2069ef5139	e624fa3f-bb9f-4da6-b569-c6a22904b389	artovert	t	2025-08-26 00:07:44.018981+05:30	2025-2026	outreach	f	4	\N	\N	2025-08-26 00:07:44.018981+05:30	2025-08-26 00:07:44.018981+05:30	5
417ea4e7-fee2-406d-8e45-753cc905f1a9	8203d590-1c95-472d-a9a6-643d696a04e9	ascend	t	2025-08-26 00:31:16.883099+05:30	2024-2025	outreach	t	4	\N	\N	2025-08-26 00:31:16.883099+05:30	2025-08-26 00:31:16.883099+05:30	5
6b2c296e-2805-4ff5-90ba-0e061382a889	8fcc0b11-a2d9-4463-a83c-c1a1370325a6	achievers	t	2025-08-26 00:31:32.769558+05:30	2024-2025	mentor	t	4	\N	\N	2025-08-26 00:31:32.769558+05:30	2025-08-26 00:31:32.769558+05:30	5
1f8d455a-4e7a-4192-a91c-8f2929ec9c54	516a1eee-d8f9-4283-8cfb-740c0387ca8c	aster	t	2025-08-26 00:31:45.019056+05:30	2024-2025	outreach	t	5	\N	\N	2025-08-26 00:31:45.019056+05:30	2025-08-26 00:31:45.019056+05:30	5
3f0ea428-8b4f-4a6f-86eb-e16266d658d1	5a3749b1-618a-4314-b6ab-74d534f568e2	artovert	t	2025-08-26 00:32:03.021727+05:30	2024-2025	event_incharge	t	4	\N	\N	2025-08-26 00:32:03.021727+05:30	2025-08-26 00:32:03.021727+05:30	5
d64c1ac3-7e03-4430-8f5a-52785df03d91	466f3cb4-18bb-485e-827a-e5290cedd969	artovert	t	2025-08-26 00:32:03.021727+05:30	2024-2025	event_incharge	t	5	\N	\N	2025-08-26 00:32:03.021727+05:30	2025-08-26 00:32:03.021727+05:30	5
c9d835c6-a28f-4df8-b981-0aa4f14aa727	550e8400-e29b-41d4-a716-446655440000	ascend	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
976ac0c8-1ce0-43e6-ac21-c646bb97118f	550e8400-e29b-41d4-a716-446655440023	aster	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
d1bb3bfc-5b9e-499d-b757-d54dbbbbd9af	550e8400-e29b-41d4-a716-446655440033	achievers	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
679c044c-6c4f-4a5b-96de-cb44514eab8d	550e8400-e29b-41d4-a716-446655440302	achievers	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
bcce043d-76ba-4941-93f7-8aa23a685458	550e8400-e29b-41d4-a716-446655440013	ascend	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
43265b7e-d07f-48e0-a7c1-7369679763aa	cc0b35da-a560-416e-9366-00680dead616	ascend	f	2025-08-07 01:12:15.546+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
2a2e5665-d234-4c0b-8d54-704b4cf2accf	1d5b1108-eb4c-4191-ae75-751e3610d519	ascend	f	2025-08-07 01:25:30.145+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
9cc2ac12-58e1-4713-9007-84771e65c877	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	ascend	f	2025-08-24 16:47:13.14983+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
d19582df-6caa-4f00-b17f-2fbf1fd3a073	550e8400-e29b-41d4-a716-446655440402	artovert	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
012def7f-daed-4a12-b696-c48c78ba4db4	550e8400-e29b-41d4-a716-446655440043	artovert	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
1ea7d73b-56f9-483a-82fc-4d7dfaa91ee7	550e8400-e29b-41d4-a716-446655440100	ascend	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
e1284108-8d0a-499f-8653-b7606dca4c56	550e8400-e29b-41d4-a716-446655440101	ascend	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
c72cb708-34a1-4a1a-aae6-366f6fea8bc5	550e8400-e29b-41d4-a716-446655440102	ascend	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
99d80051-89bf-42fe-899d-0cd8376fa114	550e8400-e29b-41d4-a716-446655440200	aster	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
28517767-7e48-47bb-bafa-84443a080aa9	550e8400-e29b-41d4-a716-446655440201	aster	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
01ad6cf0-dd35-4ec2-9671-cf677b73f33f	550e8400-e29b-41d4-a716-446655440202	aster	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
7d2d3242-c84e-4ce1-8a7d-a3cdcd9dc0f3	550e8400-e29b-41d4-a716-446655440300	achievers	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
45bdfdd0-b5ba-4c71-b9a3-ca9d79171909	550e8400-e29b-41d4-a716-446655440301	achievers	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
35c233b6-e6e0-4c92-9a1b-819778d85ea4	550e8400-e29b-41d4-a716-446655440400	artovert	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
f89be9aa-0a07-4e14-84e7-796c65c8ad6e	550e8400-e29b-41d4-a716-446655440401	artovert	f	2025-07-27 13:47:32.966+05:30	2024-2025	member	t	0	\N	\N	2025-08-25 22:43:53.290648+05:30	2025-08-25 22:43:53.290648+05:30	\N
\.


--
-- TOC entry 4409 (class 0 OID 18212)
-- Dependencies: 247
-- Data for Name: club_statistics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.club_statistics (id, club_id, member_count, event_count, assignment_count, comment_count, total_engagement, average_engagement, last_updated) FROM stdin;
\.


--
-- TOC entry 4378 (class 0 OID 17481)
-- Dependencies: 216
-- Data for Name: clubs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clubs (id, name, type, description, long_description, icon, color, coordinator_id, co_coordinator_id, secretary_id, media_id, guidelines, meeting_schedule, created_at, updated_at, logo_url, banner_image_url, club_images, member_count) FROM stdin;
ascend	ASCEND	Technical	A coding club focused on programming and technology	ASCEND is the premier coding club fostering programming skills, software development, and technological innovation. We organize hackathons, coding workshops, and technical seminars to help students master programming languages and development frameworks.	Code	blue	550e8400-e29b-41d4-a716-446655440010	550e8400-e29b-41d4-a716-446655440011	550e8400-e29b-41d4-a716-446655440012	550e8400-e29b-41d4-a716-446655440013	Focus on coding excellence and software development	{}	2025-07-27 13:47:32.966+05:30	2025-09-18 09:54:07.365279+05:30	\N	\N	[]	98
aster	ASTER	Soft Skills	A club focused on developing interpersonal and communication skills	ASTER is dedicated to enhancing soft skills including communication, leadership, teamwork, and professional development. We organize workshops, seminars, and activities to help students develop essential workplace skills.	Users	green	550e8400-e29b-41d4-a716-446655440020	550e8400-e29b-41d4-a716-446655440021	550e8400-e29b-41d4-a716-446655440022	550e8400-e29b-41d4-a716-446655440023	Develop essential soft skills for professional success	{}	2025-07-27 13:47:32.966+05:30	2025-09-18 09:54:07.385994+05:30	\N	\N	[]	67
achievers	ACHIEVERS	Higher Studies	A club supporting students pursuing higher education and academic excellence	ACHIEVERS supports students in their academic journey towards higher studies including competitive exams, research opportunities, and advanced academic pursuits. We provide guidance, resources, and mentorship for academic excellence.	GraduationCap	purple	550e8400-e29b-41d4-a716-446655440030	550e8400-e29b-41d4-a716-446655440031	550e8400-e29b-41d4-a716-446655440032	550e8400-e29b-41d4-a716-446655440033	Support academic excellence and higher education goals	{}	2025-07-27 13:47:32.966+05:30	2025-09-18 09:54:07.418283+05:30	\N	\N	[]	82
artovert	ARTOVERT	Overall Development	A comprehensive club focusing on holistic student development	ARTOVERT promotes overall personality development combining technical skills, soft skills, academic excellence, and personal growth. We organize diverse activities to ensure well-rounded development of students across all areas.	Target	orange	550e8400-e29b-41d4-a716-446655440040	550e8400-e29b-41d4-a716-446655440041	550e8400-e29b-41d4-a716-446655440042	550e8400-e29b-41d4-a716-446655440043	Foster complete personality and skill development	{}	2025-07-27 13:47:32.966+05:30	2025-09-18 09:54:07.431779+05:30	\N	\N	[]	50
\.


--
-- TOC entry 4392 (class 0 OID 17822)
-- Dependencies: 230
-- Data for Name: code_results; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.code_results (id, response_id, test_case_index, passed, stdout, stderr, execution_time, memory_used, created_at) FROM stdin;
\.


--
-- TOC entry 4393 (class 0 OID 17836)
-- Dependencies: 231
-- Data for Name: coding_submissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.coding_submissions (id, question_response_id, language, code, is_final, execution_result, created_at) FROM stdin;
\.


--
-- TOC entry 4438 (class 0 OID 19758)
-- Dependencies: 276
-- Data for Name: comment_likes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.comment_likes (id, comment_id, user_id, created_at) FROM stdin;
\.


--
-- TOC entry 4423 (class 0 OID 19052)
-- Dependencies: 261
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.comments (id, post_id, author_id, content, parent_id, likes_count, created_at, updated_at) FROM stdin;
c6cb6351-a125-491b-a4fa-c74ea8c80147	3bc000fa-d086-4977-9cb3-08105ada3771	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	nice	\N	0	2025-08-24 19:01:38.717994+05:30	2025-08-24 19:01:38.717994+05:30
\.


--
-- TOC entry 4381 (class 0 OID 17540)
-- Dependencies: 219
-- Data for Name: committee_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.committee_members (id, committee_id, role_id, user_id, status, joined_at, term_start, term_end, achievements, created_at, updated_at, academic_year, is_current_term) FROM stdin;
efdde746-50c9-48a0-86a1-3d991d813b6b	9e2a45e8-88e0-4998-bbc1-1ab68cf9f989	bd8838dc-d4db-4bf9-a483-fc970b01d35a	8694ff1f-1d1e-4a7b-8ecb-eebda2c937d3	active	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30	2026-08-20 11:30:17.917+05:30	\N	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30	2024-2025	t
8663ee16-2776-46f5-91fb-567490ead94f	9e2a45e8-88e0-4998-bbc1-1ab68cf9f989	61066b5a-6b0c-411a-83fd-ea3fa81893b5	241f4f32-458e-410e-b2f2-6dcfda992455	active	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30	2026-08-20 11:30:17.917+05:30	\N	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30	2024-2025	t
d8102f60-2815-4571-8806-e4979624b577	9e2a45e8-88e0-4998-bbc1-1ab68cf9f989	60880bea-c878-4fe6-9388-8b4384ad2a59	53cbed56-2bc7-4faf-bd6e-5f953de4dfa5	active	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30	2026-08-20 11:30:17.917+05:30	\N	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30	2024-2025	t
9b0fe363-33c3-44be-9151-ac6c3813a55e	9e2a45e8-88e0-4998-bbc1-1ab68cf9f989	885e95e5-f639-43d9-b5a0-c1fa555e0b24	7c36ecbe-44d3-40df-8b8b-886e5385e839	active	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30	2026-08-20 11:30:17.917+05:30	\N	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30	2024-2025	t
68ae4f2b-8b6c-40f6-be82-36ae77bf252b	9e2a45e8-88e0-4998-bbc1-1ab68cf9f989	e74c3e2f-3bdf-40e5-9bc2-a2ca07d81b1e	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	active	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30	2026-08-20 11:30:17.917+05:30	\N	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30	2024-2025	t
43fe11fe-8263-44bb-8190-5ec39dc7ee7b	9e2a45e8-88e0-4998-bbc1-1ab68cf9f989	728861c2-df1f-47b2-81b4-d892b4ee819e	9755eab9-39cb-443b-9cca-853d727afe40	active	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30	2026-08-20 11:30:17.917+05:30	\N	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30	2024-2025	t
00b4d23d-dbc8-4f7a-9529-0a7226113ff9	8f28c85b-1315-4583-923a-a827f9507a00	f90bd115-48a4-4c90-9ef3-74b5778eb82b	571ebb33-aeb5-4861-87a0-0c442bae3a6b	active	2025-08-26 00:07:15.030006+05:30	\N	\N	\N	2025-08-26 00:07:15.030006+05:30	2025-08-26 00:07:15.030006+05:30	2025-2026	f
cc9e4479-4041-4854-b1a8-94b2fbade733	8f28c85b-1315-4583-923a-a827f9507a00	f0e6549c-bb74-4a24-955d-c9666db048e1	e624fa3f-bb9f-4da6-b569-c6a22904b389	active	2025-08-26 00:07:15.030006+05:30	\N	\N	\N	2025-08-26 00:07:15.030006+05:30	2025-08-26 00:07:15.030006+05:30	2025-2026	f
739ae2e5-1ef8-46e9-a0fb-ec42ec0f47b9	8f28c85b-1315-4583-923a-a827f9507a00	8aee812a-b63e-403c-a7fc-d77e050a9138	70672185-25b9-41b5-bae0-e74ea1a26db9	active	2025-08-26 00:07:15.030006+05:30	\N	\N	\N	2025-08-26 00:07:15.030006+05:30	2025-08-26 00:07:15.030006+05:30	2025-2026	f
b00b60f9-5b57-494d-98b2-f59c0d748b59	8f28c85b-1315-4583-923a-a827f9507a00	873c1f32-b4c4-44bd-9b0c-bf36b6da7e5c	b9f1d273-57c1-4ba4-9411-5495254ff797	active	2025-08-26 00:07:15.030006+05:30	\N	\N	\N	2025-08-26 00:07:15.030006+05:30	2025-08-26 00:07:15.030006+05:30	2025-2026	f
ce7a1b5a-8ad1-488d-982e-19f1d702064e	8f28c85b-1315-4583-923a-a827f9507a00	32708d72-6fea-4c91-93d8-49072a1f481a	6e11229a-a444-4e8b-8b56-e8b6536302d5	active	2025-08-26 00:07:15.030006+05:30	\N	\N	\N	2025-08-26 00:07:15.030006+05:30	2025-08-26 00:07:15.030006+05:30	2025-2026	f
f51f7eeb-3c94-48a7-b685-b7c02cfc05c9	8f28c85b-1315-4583-923a-a827f9507a00	3ee58ca5-3647-48cf-b377-be6edd5755f9	19124f5e-a896-4728-bb75-701f616c7716	active	2025-08-26 00:07:15.030006+05:30	\N	\N	\N	2025-08-26 00:07:15.030006+05:30	2025-08-26 00:07:15.030006+05:30	2025-2026	f
7e52fd52-7be7-41db-be8b-d1f4e1c95ae0	8f28c85b-1315-4583-923a-a827f9507a00	b52c4c16-3d76-4a3b-ae5d-407d26cac92f	63fd6cb0-d546-448b-9fdc-5cb407f61d6a	active	2025-08-26 00:07:15.030006+05:30	\N	\N	\N	2025-08-26 00:07:15.030006+05:30	2025-08-26 00:07:15.030006+05:30	2025-2026	f
4e7177c9-c257-4128-b0ad-24f2822f82f9	8f28c85b-1315-4583-923a-a827f9507a00	0d4b2b0e-c286-4c07-9648-c519775a3257	ec962745-fe2f-4079-b859-7d86bf711c20	active	2025-08-26 00:07:15.030006+05:30	\N	\N	\N	2025-08-26 00:07:15.030006+05:30	2025-08-26 00:07:15.030006+05:30	2025-2026	f
b6a934ca-acfa-4e32-977f-1ec63a47fab1	8f28c85b-1315-4583-923a-a827f9507a00	f90bd115-48a4-4c90-9ef3-74b5778eb82b	8694ff1f-1d1e-4a7b-8ecb-eebda2c937d3	active	2025-08-26 00:28:26.122083+05:30	\N	\N	\N	2025-08-26 00:28:26.122083+05:30	2025-08-26 00:28:26.122083+05:30	2024-2025	t
a114fff7-5948-4ec8-ab93-5e4e2abe226e	8f28c85b-1315-4583-923a-a827f9507a00	f0e6549c-bb74-4a24-955d-c9666db048e1	241f4f32-458e-410e-b2f2-6dcfda992455	active	2025-08-26 00:28:26.122083+05:30	\N	\N	\N	2025-08-26 00:28:26.122083+05:30	2025-08-26 00:28:26.122083+05:30	2024-2025	t
9ec672a6-3266-4d89-898d-eb081a66f4bd	8f28c85b-1315-4583-923a-a827f9507a00	8aee812a-b63e-403c-a7fc-d77e050a9138	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	active	2025-08-26 00:28:26.122083+05:30	\N	\N	\N	2025-08-26 00:28:26.122083+05:30	2025-08-26 00:28:26.122083+05:30	2024-2025	t
089142f0-ba95-4c53-b0dc-09d9861c9578	8f28c85b-1315-4583-923a-a827f9507a00	a3c8888c-77ae-4b5f-9cd2-cdff1afbe4e3	17254128-6271-484c-bec9-756ff7f7a043	active	2025-08-26 00:29:14.012676+05:30	\N	\N	\N	2025-08-26 00:29:14.012676+05:30	2025-08-26 00:29:14.012676+05:30	2024-2025	t
19e6ee8f-e218-4c3b-a496-ee2cb497a3b9	8f28c85b-1315-4583-923a-a827f9507a00	32708d72-6fea-4c91-93d8-49072a1f481a	1351d77c-38fe-4dd3-84bd-7d9aff156a82	active	2025-08-26 00:29:14.012676+05:30	\N	\N	\N	2025-08-26 00:29:14.012676+05:30	2025-08-26 00:29:14.012676+05:30	2024-2025	t
09b60f9b-234f-48ce-aa24-ad8fc28e7f54	8f28c85b-1315-4583-923a-a827f9507a00	b52c4c16-3d76-4a3b-ae5d-407d26cac92f	924ede2a-5fd4-4e9d-9a28-95438e5b4898	active	2025-08-26 00:29:14.012676+05:30	\N	\N	\N	2025-08-26 00:29:14.012676+05:30	2025-08-26 00:29:14.012676+05:30	2024-2025	t
528a0248-052d-450e-92c0-9cc135b1b307	8f28c85b-1315-4583-923a-a827f9507a00	a3c8888c-77ae-4b5f-9cd2-cdff1afbe4e3	550e8400-e29b-41d4-a716-446655440012	active	2025-08-26 00:07:15.030006+05:30	\N	\N	\N	2025-08-26 00:07:15.030006+05:30	2025-09-18 12:34:15.323917+05:30	2025-2026	f
\.


--
-- TOC entry 4441 (class 0 OID 20083)
-- Dependencies: 280
-- Data for Name: committee_members_backup; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.committee_members_backup (id, committee_id, role_id, user_id, status, joined_at, term_start, term_end, achievements, created_at, updated_at, academic_year, is_current_term) FROM stdin;
efdde746-50c9-48a0-86a1-3d991d813b6b	9e2a45e8-88e0-4998-bbc1-1ab68cf9f989	bd8838dc-d4db-4bf9-a483-fc970b01d35a	8694ff1f-1d1e-4a7b-8ecb-eebda2c937d3	active	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30	2026-08-20 11:30:17.917+05:30	\N	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30	2024-2025	t
8663ee16-2776-46f5-91fb-567490ead94f	9e2a45e8-88e0-4998-bbc1-1ab68cf9f989	61066b5a-6b0c-411a-83fd-ea3fa81893b5	241f4f32-458e-410e-b2f2-6dcfda992455	active	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30	2026-08-20 11:30:17.917+05:30	\N	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30	2024-2025	t
d8102f60-2815-4571-8806-e4979624b577	9e2a45e8-88e0-4998-bbc1-1ab68cf9f989	60880bea-c878-4fe6-9388-8b4384ad2a59	53cbed56-2bc7-4faf-bd6e-5f953de4dfa5	active	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30	2026-08-20 11:30:17.917+05:30	\N	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30	2024-2025	t
9b0fe363-33c3-44be-9151-ac6c3813a55e	9e2a45e8-88e0-4998-bbc1-1ab68cf9f989	885e95e5-f639-43d9-b5a0-c1fa555e0b24	7c36ecbe-44d3-40df-8b8b-886e5385e839	active	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30	2026-08-20 11:30:17.917+05:30	\N	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30	2024-2025	t
68ae4f2b-8b6c-40f6-be82-36ae77bf252b	9e2a45e8-88e0-4998-bbc1-1ab68cf9f989	e74c3e2f-3bdf-40e5-9bc2-a2ca07d81b1e	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	active	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30	2026-08-20 11:30:17.917+05:30	\N	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30	2024-2025	t
43fe11fe-8263-44bb-8190-5ec39dc7ee7b	9e2a45e8-88e0-4998-bbc1-1ab68cf9f989	728861c2-df1f-47b2-81b4-d892b4ee819e	9755eab9-39cb-443b-9cca-853d727afe40	active	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30	2026-08-20 11:30:17.917+05:30	\N	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30	2024-2025	t
00b4d23d-dbc8-4f7a-9529-0a7226113ff9	8f28c85b-1315-4583-923a-a827f9507a00	f90bd115-48a4-4c90-9ef3-74b5778eb82b	571ebb33-aeb5-4861-87a0-0c442bae3a6b	active	2025-08-26 00:07:15.030006+05:30	\N	\N	\N	2025-08-26 00:07:15.030006+05:30	2025-08-26 00:07:15.030006+05:30	2025-2026	f
cc9e4479-4041-4854-b1a8-94b2fbade733	8f28c85b-1315-4583-923a-a827f9507a00	f0e6549c-bb74-4a24-955d-c9666db048e1	e624fa3f-bb9f-4da6-b569-c6a22904b389	active	2025-08-26 00:07:15.030006+05:30	\N	\N	\N	2025-08-26 00:07:15.030006+05:30	2025-08-26 00:07:15.030006+05:30	2025-2026	f
739ae2e5-1ef8-46e9-a0fb-ec42ec0f47b9	8f28c85b-1315-4583-923a-a827f9507a00	8aee812a-b63e-403c-a7fc-d77e050a9138	70672185-25b9-41b5-bae0-e74ea1a26db9	active	2025-08-26 00:07:15.030006+05:30	\N	\N	\N	2025-08-26 00:07:15.030006+05:30	2025-08-26 00:07:15.030006+05:30	2025-2026	f
528a0248-052d-450e-92c0-9cc135b1b307	8f28c85b-1315-4583-923a-a827f9507a00	a3c8888c-77ae-4b5f-9cd2-cdff1afbe4e3	bca6518e-d6ec-4489-9422-1898f5086ba4	active	2025-08-26 00:07:15.030006+05:30	\N	\N	\N	2025-08-26 00:07:15.030006+05:30	2025-08-26 00:07:15.030006+05:30	2025-2026	f
b00b60f9-5b57-494d-98b2-f59c0d748b59	8f28c85b-1315-4583-923a-a827f9507a00	873c1f32-b4c4-44bd-9b0c-bf36b6da7e5c	b9f1d273-57c1-4ba4-9411-5495254ff797	active	2025-08-26 00:07:15.030006+05:30	\N	\N	\N	2025-08-26 00:07:15.030006+05:30	2025-08-26 00:07:15.030006+05:30	2025-2026	f
ce7a1b5a-8ad1-488d-982e-19f1d702064e	8f28c85b-1315-4583-923a-a827f9507a00	32708d72-6fea-4c91-93d8-49072a1f481a	6e11229a-a444-4e8b-8b56-e8b6536302d5	active	2025-08-26 00:07:15.030006+05:30	\N	\N	\N	2025-08-26 00:07:15.030006+05:30	2025-08-26 00:07:15.030006+05:30	2025-2026	f
f51f7eeb-3c94-48a7-b685-b7c02cfc05c9	8f28c85b-1315-4583-923a-a827f9507a00	3ee58ca5-3647-48cf-b377-be6edd5755f9	19124f5e-a896-4728-bb75-701f616c7716	active	2025-08-26 00:07:15.030006+05:30	\N	\N	\N	2025-08-26 00:07:15.030006+05:30	2025-08-26 00:07:15.030006+05:30	2025-2026	f
7e52fd52-7be7-41db-be8b-d1f4e1c95ae0	8f28c85b-1315-4583-923a-a827f9507a00	b52c4c16-3d76-4a3b-ae5d-407d26cac92f	63fd6cb0-d546-448b-9fdc-5cb407f61d6a	active	2025-08-26 00:07:15.030006+05:30	\N	\N	\N	2025-08-26 00:07:15.030006+05:30	2025-08-26 00:07:15.030006+05:30	2025-2026	f
4e7177c9-c257-4128-b0ad-24f2822f82f9	8f28c85b-1315-4583-923a-a827f9507a00	0d4b2b0e-c286-4c07-9648-c519775a3257	ec962745-fe2f-4079-b859-7d86bf711c20	active	2025-08-26 00:07:15.030006+05:30	\N	\N	\N	2025-08-26 00:07:15.030006+05:30	2025-08-26 00:07:15.030006+05:30	2025-2026	f
b6a934ca-acfa-4e32-977f-1ec63a47fab1	8f28c85b-1315-4583-923a-a827f9507a00	f90bd115-48a4-4c90-9ef3-74b5778eb82b	8694ff1f-1d1e-4a7b-8ecb-eebda2c937d3	active	2025-08-26 00:28:26.122083+05:30	\N	\N	\N	2025-08-26 00:28:26.122083+05:30	2025-08-26 00:28:26.122083+05:30	2024-2025	t
a114fff7-5948-4ec8-ab93-5e4e2abe226e	8f28c85b-1315-4583-923a-a827f9507a00	f0e6549c-bb74-4a24-955d-c9666db048e1	241f4f32-458e-410e-b2f2-6dcfda992455	active	2025-08-26 00:28:26.122083+05:30	\N	\N	\N	2025-08-26 00:28:26.122083+05:30	2025-08-26 00:28:26.122083+05:30	2024-2025	t
9ec672a6-3266-4d89-898d-eb081a66f4bd	8f28c85b-1315-4583-923a-a827f9507a00	8aee812a-b63e-403c-a7fc-d77e050a9138	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	active	2025-08-26 00:28:26.122083+05:30	\N	\N	\N	2025-08-26 00:28:26.122083+05:30	2025-08-26 00:28:26.122083+05:30	2024-2025	t
089142f0-ba95-4c53-b0dc-09d9861c9578	8f28c85b-1315-4583-923a-a827f9507a00	a3c8888c-77ae-4b5f-9cd2-cdff1afbe4e3	17254128-6271-484c-bec9-756ff7f7a043	active	2025-08-26 00:29:14.012676+05:30	\N	\N	\N	2025-08-26 00:29:14.012676+05:30	2025-08-26 00:29:14.012676+05:30	2024-2025	t
19e6ee8f-e218-4c3b-a496-ee2cb497a3b9	8f28c85b-1315-4583-923a-a827f9507a00	32708d72-6fea-4c91-93d8-49072a1f481a	1351d77c-38fe-4dd3-84bd-7d9aff156a82	active	2025-08-26 00:29:14.012676+05:30	\N	\N	\N	2025-08-26 00:29:14.012676+05:30	2025-08-26 00:29:14.012676+05:30	2024-2025	t
09b60f9b-234f-48ce-aa24-ad8fc28e7f54	8f28c85b-1315-4583-923a-a827f9507a00	b52c4c16-3d76-4a3b-ae5d-407d26cac92f	924ede2a-5fd4-4e9d-9a28-95438e5b4898	active	2025-08-26 00:29:14.012676+05:30	\N	\N	\N	2025-08-26 00:29:14.012676+05:30	2025-08-26 00:29:14.012676+05:30	2024-2025	t
\.


--
-- TOC entry 4380 (class 0 OID 17523)
-- Dependencies: 218
-- Data for Name: committee_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.committee_roles (id, committee_id, name, description, hierarchy, permissions, created_at, updated_at, can_create_projects, can_manage_events, can_approve_content, can_manage_members, role_color, role_icon, is_privileged) FROM stdin;
f90bd115-48a4-4c90-9ef3-74b5778eb82b	8f28c85b-1315-4583-923a-a827f9507a00	President	Overall leadership and strategic direction	1	{MANAGE_ALL,APPROVE_EVENTS,MANAGE_MEMBERS,APPROVE_BUDGETS,SYSTEM_ADMIN}	2025-08-13 23:54:14.189+05:30	2025-09-18 12:34:15.323917+05:30	f	f	f	f	#3b82f6	user	t
f0e6549c-bb74-4a24-955d-c9666db048e1	8f28c85b-1315-4583-923a-a827f9507a00	Vice President	Support president and lead special initiatives	2	{MANAGE_EVENTS,MANAGE_MEMBERS,APPROVE_CONTENT,COORDINATE_ACTIVITIES}	2025-08-13 23:54:14.264+05:30	2025-09-18 12:34:15.323917+05:30	f	f	f	f	#3b82f6	user	t
8aee812a-b63e-403c-a7fc-d77e050a9138	8f28c85b-1315-4583-923a-a827f9507a00	Innovation Head	Lead technical initiatives and innovation projects	3	{MANAGE_TECH_EVENTS,APPROVE_PROJECTS,COORDINATE_WORKSHOPS,MANAGE_RESOURCES}	2025-08-13 23:54:14.309+05:30	2025-09-18 12:34:15.323917+05:30	f	f	f	f	#3b82f6	user	t
32708d72-6fea-4c91-93d8-49072a1f481a	8f28c85b-1315-4583-923a-a827f9507a00	Treasurer	Manage finances and budget planning	4	{MANAGE_FINANCES,TRACK_BUDGETS,APPROVE_EXPENSES,MAINTAIN_ACCOUNTS}	2025-08-13 23:54:14.509+05:30	2025-09-18 12:34:15.323917+05:30	f	f	f	f	#3b82f6	user	t
a3c8888c-77ae-4b5f-9cd2-cdff1afbe4e3	8f28c85b-1315-4583-923a-a827f9507a00	Secretary	Maintain records and manage communications	5	{MANAGE_COMMUNICATIONS,MAINTAIN_RECORDS,SCHEDULE_MEETINGS,COORDINATE_LOGISTICS}	2025-08-13 23:54:14.369+05:30	2025-09-18 12:34:15.323917+05:30	f	f	f	f	#3b82f6	user	t
b52c4c16-3d76-4a3b-ae5d-407d26cac92f	8f28c85b-1315-4583-923a-a827f9507a00	Media Head	Lead social media and content creation initiatives	6	{MANAGE_SOCIAL_MEDIA,CREATE_CONTENT,MANAGE_PUBLICITY,COORDINATE_MEDIA}	2025-08-13 23:54:14.469+05:30	2025-09-18 12:34:15.323917+05:30	f	f	f	f	#3b82f6	user	t
873c1f32-b4c4-44bd-9b0c-bf36b6da7e5c	8f28c85b-1315-4583-923a-a827f9507a00	Joint Secretary	Assistant secretary for documentation and communications	8	{ASSIST_COMMUNICATIONS,MAINTAIN_RECORDS,COORDINATE_MEETINGS}	2025-08-26 00:05:51.041175+05:30	2025-09-18 12:34:15.323917+05:30	f	f	f	f	#10b981	file-text	t
3ee58ca5-3647-48cf-b377-be6edd5755f9	8f28c85b-1315-4583-923a-a827f9507a00	Joint Treasurer	Assistant treasurer for financial management	9	{ASSIST_FINANCES,TRACK_EXPENSES,MAINTAIN_RECORDS}	2025-08-26 00:05:51.041175+05:30	2025-09-18 12:34:15.323917+05:30	f	f	f	f	#f59e0b	dollar-sign	t
0d4b2b0e-c286-4c07-9648-c519775a3257	8f28c85b-1315-4583-923a-a827f9507a00	Outreach Head	Lead external relations and partnerships	10	{MANAGE_PARTNERSHIPS,COORDINATE_OUTREACH,MANAGE_PUBLICITY,ORGANIZE_COLLABORATIONS}	2025-08-26 00:05:51.041175+05:30	2025-09-18 12:34:15.323917+05:30	f	f	f	f	#8b5cf6	external-link	t
\.


--
-- TOC entry 4377 (class 0 OID 17467)
-- Dependencies: 215
-- Data for Name: committees; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.committees (id, name, description, hierarchy_level, is_active, created_at, updated_at) FROM stdin;
8f28c85b-1315-4583-923a-a827f9507a00	Zenith Main Committee	The main student committee for Zenith organization	1	t	2025-08-13 23:52:53.549+05:30	2025-08-13 23:52:53.549+05:30
9e2a45e8-88e0-4998-bbc1-1ab68cf9f989	Student Executive Committee	The main student executive committee responsible for overall governance and leadership	1	t	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30
\.


--
-- TOC entry 4436 (class 0 OID 19709)
-- Dependencies: 274
-- Data for Name: content_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.content_permissions (id, user_id, page_type, page_reference_id, permission_type, granted_by, created_at) FROM stdin;
c77996d8-f86d-44a4-9071-2e38bb97c128	550e8400-e29b-41d4-a716-446655440000	landing	\N	admin	550e8400-e29b-41d4-a716-446655440000	2025-08-24 12:28:51.052969+05:30
b9f052b6-6d60-49bf-a15b-76b788aabde1	550e8400-e29b-41d4-a716-446655440001	landing	\N	admin	550e8400-e29b-41d4-a716-446655440001	2025-08-24 12:28:51.052969+05:30
aae61912-59a5-4e75-93b7-aa79887b1f99	550e8400-e29b-41d4-a716-446655440042	landing	\N	admin	550e8400-e29b-41d4-a716-446655440042	2025-08-24 12:28:51.052969+05:30
ccb8474b-79f9-4601-a4fc-3875c69938a5	550e8400-e29b-41d4-a716-446655440012	landing	\N	admin	550e8400-e29b-41d4-a716-446655440012	2025-08-24 12:28:51.052969+05:30
f8d5a71d-dad4-4a52-8380-3b8a1fb6b883	550e8400-e29b-41d4-a716-446655440022	landing	\N	admin	550e8400-e29b-41d4-a716-446655440022	2025-08-24 12:28:51.052969+05:30
78f26f0d-cbcf-4aca-b6e6-d5fcf5b38941	550e8400-e29b-41d4-a716-446655440032	landing	\N	admin	550e8400-e29b-41d4-a716-446655440032	2025-08-24 12:28:51.052969+05:30
5118fd6d-1a57-43e7-8f41-248c4b20cdfc	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	landing	\N	admin	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	2025-08-24 12:28:51.052969+05:30
cf1d4148-910d-4909-934b-758ef94474c4	8694ff1f-1d1e-4a7b-8ecb-eebda2c937d3	landing	\N	admin	8694ff1f-1d1e-4a7b-8ecb-eebda2c937d3	2025-08-24 12:28:51.052969+05:30
e4df01d4-176a-4631-bbe9-c4dbbe0975cc	241f4f32-458e-410e-b2f2-6dcfda992455	landing	\N	admin	241f4f32-458e-410e-b2f2-6dcfda992455	2025-08-24 12:28:51.052969+05:30
a4cb2606-084f-475b-bf0c-ac64351a50a0	7c36ecbe-44d3-40df-8b8b-886e5385e839	landing	\N	admin	7c36ecbe-44d3-40df-8b8b-886e5385e839	2025-08-24 12:28:51.052969+05:30
b503b9ee-d1d5-43e8-8751-50bb3bdd0f44	550e8400-e29b-41d4-a716-446655440021	club_home	aster	admin	550e8400-e29b-41d4-a716-446655440021	2025-08-24 12:28:51.059243+05:30
15ec78dd-d8b4-400d-b425-1d307f54a922	550e8400-e29b-41d4-a716-446655440030	club_home	achievers	admin	550e8400-e29b-41d4-a716-446655440030	2025-08-24 12:28:51.059243+05:30
31994e60-1fb1-488f-a7b0-d7cd2c727ff9	550e8400-e29b-41d4-a716-446655440031	club_home	achievers	admin	550e8400-e29b-41d4-a716-446655440031	2025-08-24 12:28:51.059243+05:30
368e78de-1382-432a-bd95-5f0ebec0998f	550e8400-e29b-41d4-a716-446655440011	club_home	ascend	admin	550e8400-e29b-41d4-a716-446655440011	2025-08-24 12:28:51.059243+05:30
0f350f15-e5b9-48a9-8453-cdb0028cf13a	550e8400-e29b-41d4-a716-446655440010	club_home	ascend	admin	550e8400-e29b-41d4-a716-446655440010	2025-08-24 12:28:51.059243+05:30
cbf8fbaa-0d08-4d45-a1b7-103f6e6320d8	550e8400-e29b-41d4-a716-446655440020	club_home	aster	admin	550e8400-e29b-41d4-a716-446655440020	2025-08-24 12:28:51.059243+05:30
416c3fca-3009-416b-bf52-311f29211b2b	550e8400-e29b-41d4-a716-446655440040	club_home	artovert	admin	550e8400-e29b-41d4-a716-446655440040	2025-08-24 12:28:51.059243+05:30
a815aa7e-e212-472a-9fee-819bec720e3a	550e8400-e29b-41d4-a716-446655440041	club_home	artovert	admin	550e8400-e29b-41d4-a716-446655440041	2025-08-24 12:28:51.059243+05:30
\.


--
-- TOC entry 4399 (class 0 OID 17997)
-- Dependencies: 237
-- Data for Name: discussion_replies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.discussion_replies (id, discussion_id, author_id, content, parent_id, likes_count, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4398 (class 0 OID 17971)
-- Dependencies: 236
-- Data for Name: discussions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.discussions (id, title, description, author_id, club_id, tags, is_locked, is_pinned, views_count, replies_count, last_activity, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4411 (class 0 OID 18245)
-- Dependencies: 249
-- Data for Name: email_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_logs (id, recipient, subject, content_preview, status, message_id, category, related_id, created_at, sent_at, email_service, error_message, updated_at) FROM stdin;
\.


--
-- TOC entry 4437 (class 0 OID 19741)
-- Dependencies: 275
-- Data for Name: email_otps; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_otps (id, email, otp, type, expires_at, created_at) FROM stdin;
5c243870-c046-4208-9739-be44b8f5736b	anubuntu14@gmail.com	352576	verification	2025-08-24 17:07:50.51+05:30	2025-08-24 16:52:50.510826+05:30
01dbcc23-abc5-47d6-985d-ca56b2dae451	ascend.co-coordinator@zenith.com	725466	verification	2025-08-24 20:57:59.863+05:30	2025-08-24 20:42:59.863818+05:30
d094269d-528e-4bdf-984d-8bf287dfb42b	ascend.coordinator@zenith.com	880453	verification	2025-09-10 11:42:40.902+05:30	2025-09-10 11:27:40.903405+05:30
531761be-50ba-42ae-900e-509d0f548621	admin@zenith.com	275274	verification	2025-09-16 22:27:14.516+05:30	2025-09-16 22:12:14.517067+05:30
1016ec8d-6639-48a1-934c-426010f7ddd1	aster.coordinator@zenith.com	331045	verification	2025-09-16 22:32:16.145+05:30	2025-09-16 22:17:16.14638+05:30
\.


--
-- TOC entry 4401 (class 0 OID 18046)
-- Dependencies: 239
-- Data for Name: event_attendees; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.event_attendees (id, event_id, user_id, registered_at, attendance_status) FROM stdin;
a1000001-1111-2222-3333-444444444444	e1000001-1111-2222-3333-444444444444	550e8400-e29b-41d4-a716-446655440020	2025-08-21 13:55:47.999635+05:30	registered
a1000002-1111-2222-3333-444444444444	e1000002-1111-2222-3333-444444444444	550e8400-e29b-41d4-a716-446655440020	2025-08-21 13:55:47.999635+05:30	registered
a1000003-1111-2222-3333-444444444444	e2000001-1111-2222-3333-444444444444	550e8400-e29b-41d4-a716-446655440020	2025-08-21 13:55:47.999635+05:30	registered
\.


--
-- TOC entry 4402 (class 0 OID 18066)
-- Dependencies: 240
-- Data for Name: event_registrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.event_registrations (id, event_id, user_id, status, registration_data, registered_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4400 (class 0 OID 18023)
-- Dependencies: 238
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.events (id, title, description, club_id, created_by, event_date, event_time, location, max_attendees, status, image_url, created_at, updated_at, event_images, banner_image_url, gallery_images) FROM stdin;
550e8400-3001-41d4-a716-446655440001	Coding Summit 2025	Annual coding summit featuring industry leaders and programming challenges	ascend	550e8400-e29b-41d4-a716-446655440010	2025-08-10	09:00:00	Main Auditorium	200	upcoming	\N	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	[]	\N	[]
550e8400-3001-41d4-a716-446655440002	Hackathon Weekend	48-hour coding marathon to build innovative solutions	ascend	550e8400-e29b-41d4-a716-446655440010	2025-08-17	18:00:00	Computer Lab Block A	50	upcoming	\N	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	[]	\N	[]
550e8400-3002-41d4-a716-446655440001	Communication Skills Workshop	Interactive workshop on effective communication and presentation	aster	550e8400-e29b-41d4-a716-446655440020	2025-08-13	10:00:00	Seminar Hall	100	upcoming	\N	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	[]	\N	[]
550e8400-3002-41d4-a716-446655440002	Leadership Development Session	Leadership training with industry professionals	aster	550e8400-e29b-41d4-a716-446655440020	2025-08-07	17:00:00	Conference Room B	60	upcoming	\N	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	[]	\N	[]
550e8400-3003-41d4-a716-446655440001	Higher Studies Fair	Information fair about higher education opportunities	achievers	550e8400-e29b-41d4-a716-446655440030	2025-08-15	16:00:00	Exhibition Hall	300	upcoming	\N	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	[]	\N	[]
550e8400-3003-41d4-a716-446655440002	Research Methodology Workshop	Workshop on research techniques and academic writing	achievers	550e8400-e29b-41d4-a716-446655440030	2025-08-05	19:00:00	Library Auditorium	120	upcoming	\N	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	[]	\N	[]
550e8400-3004-41d4-a716-446655440001	Holistic Development Fair	Showcase of comprehensive skill development activities	artovert	550e8400-e29b-41d4-a716-446655440040	2025-08-20	14:00:00	Main Campus	400	upcoming	\N	2025-07-27 13:47:32.966+05:30	2025-08-25 18:04:57.007481+05:30	[]	\N	[]
550e8400-3004-41d4-a716-446655440002	Cross-Club Collaboration Meet	Inter-club collaboration and networking event	artovert	550e8400-e29b-41d4-a716-446655440040	2025-08-03	16:30:00	Community Center	150	upcoming	\N	2025-07-27 13:47:32.966+05:30	2025-08-25 18:04:57.007481+05:30	[]	\N	[]
3058b90b-3b02-45ac-bf76-e942611e2ae6	Problem Solving Based on Aptitude	Workshop focused on developing problem-solving skills and aptitude testing techniques for competitive exams and placements.	ascend	\N	2024-12-15	14:15:00	Computer Lab Block A	80	past	\N	2025-08-26 10:19:44.001602+05:30	2025-08-26 10:19:44.001602+05:30	[]	\N	[]
48119122-f9d4-441c-9093-a54d86e5057c	GitHub Profile Creation and Importance Session	Session to guide students in creating professional GitHub profiles and understanding the importance of GitHub in technical careers.	ascend	\N	2025-02-13	12:15:00	BF08	40	past	\N	2025-08-26 10:19:44.001602+05:30	2025-08-26 10:19:44.001602+05:30	[]	\N	[]
b1e2aec6-95c1-4425-9882-4f1801fb6e55	C++ Programming Session	Comprehensive session covering C++ fundamentals, loops, conditionals, and competitive programming techniques.	ascend	\N	2025-04-12	17:00:00	Online	30	past	\N	2025-08-26 10:19:44.001602+05:30	2025-08-26 10:19:44.001602+05:30	[]	\N	[]
2b747088-2329-49bb-ad6f-af30c02c1151	IoT Made Easy Workshop	Hands-on workshop introducing Internet of Things concepts, sensor integration, and practical IoT project development.	ascend	\N	2025-05-15	10:00:00	Electronics Lab	25	past	\N	2025-08-26 10:19:44.001602+05:30	2025-08-26 10:19:44.001602+05:30	[]	\N	[]
4917e71d-4585-4779-9d26-d00950c585ae	Coding Summit 2025	Annual coding summit featuring industry experts, workshops on emerging technologies, and competitive programming contests.	ascend	\N	2025-08-10	09:00:00	Main Auditorium	200	upcoming	\N	2025-08-26 10:19:44.001602+05:30	2025-08-26 10:19:44.001602+05:30	[]	\N	[]
d386c85a-01a8-4fea-b45e-f2bad317a073	Hackathon Weekend	Two-day coding hackathon where participants build innovative solutions to real-world problems using latest technologies.	ascend	\N	2025-08-17	10:00:00	Computer Lab Block A	50	upcoming	\N	2025-08-26 10:19:44.001602+05:30	2025-08-26 10:19:44.001602+05:30	[]	\N	[]
adf8f416-5282-4508-b1d0-c2abf7980527	Women Empowerment and Career Insights	Comprehensive session on women empowerment, career guidance, and leadership development for female students.	aster	\N	2025-03-07	12:00:00	BF-04 & BF-05	60	past	\N	2025-08-26 10:19:44.012531+05:30	2025-08-26 10:19:44.012531+05:30	[]	\N	[]
0900ece1-4a39-42d6-9497-86e89cb232db	Leadership Development Session	Interactive workshop focusing on leadership skills, team management, and effective communication for student leaders.	aster	\N	2025-08-07	14:00:00	Conference Room B	60	upcoming	\N	2025-08-26 10:19:44.012531+05:30	2025-08-26 10:19:44.012531+05:30	[]	\N	[]
b560c2a4-e115-4706-953a-76ec5a3d9160	Communication Skills Workshop	Practical workshop on effective communication, public speaking, and presentation skills for personal and professional development.	aster	\N	2025-08-13	15:30:00	Seminar Hall	100	upcoming	\N	2025-08-26 10:19:44.012531+05:30	2025-08-26 10:19:44.012531+05:30	[]	\N	[]
df7a63c0-6b32-48a5-a53b-0bd35c6e0c71	GRE Preparation Strategy Session	Comprehensive workshop on GRE preparation strategies, tips, and techniques for students planning higher education abroad.	achievers	\N	2025-02-10	11:00:00	Library Auditorium	100	past	\N	2025-08-26 10:19:44.014444+05:30	2025-08-26 10:19:44.014444+05:30	[]	\N	[]
6506222f-f5ee-4aba-8797-f5904d3d524e	Research Methodology Workshop	Detailed session on research methodologies, paper writing, and academic research techniques for undergraduate students.	achievers	\N	2025-08-05	14:30:00	Library Auditorium	120	upcoming	\N	2025-08-26 10:19:44.014444+05:30	2025-08-26 10:19:44.014444+05:30	[]	\N	[]
9a5e68fa-01d0-483b-8157-2a5574f55e09	Higher Studies Fair	Information fair featuring universities, scholarship opportunities, and guidance for students planning higher education.	achievers	\N	2025-08-15	10:00:00	Exhibition Hall	300	upcoming	\N	2025-08-26 10:19:44.014444+05:30	2025-08-26 10:19:44.014444+05:30	[]	\N	[]
3992050a-2ed2-4bdf-999d-2e1d50d8c645	Holistic Development Workshop	Workshop focusing on overall personality development, creative thinking, and artistic expression for students.	artovert	\N	2025-03-05	13:00:00	Community Center	150	past	\N	2025-08-26 10:19:44.01582+05:30	2025-08-26 10:19:44.01582+05:30	[]	\N	[]
407d84ab-d357-4e36-92e6-057db4b70a4b	Cross-Club Collaboration Meet	Inter-club collaboration meeting to plan joint events and cultural activities for the upcoming semester.	artovert	\N	2025-08-03	16:00:00	Community Center	150	upcoming	\N	2025-08-26 10:19:44.01582+05:30	2025-08-26 10:19:44.01582+05:30	[]	\N	[]
f34cf579-8684-4bc1-9b5c-04bdea69dabe	Holistic Development Fair	Cultural fair showcasing student talents, art exhibitions, and interactive sessions on creativity and personal growth.	artovert	\N	2025-08-20	09:30:00	Main Campus	400	upcoming	\N	2025-08-26 10:19:44.01582+05:30	2025-08-26 10:19:44.01582+05:30	[]	\N	[]
92656c6e-b896-49be-b5ee-5c89909d364d	AI & Machine Learning Workshop	Comprehensive workshop on artificial intelligence, machine learning algorithms, and practical implementations using Python and TensorFlow.	ascend	\N	2025-09-15	10:00:00	Computer Lab Block A	60	upcoming	\N	2025-08-26 10:35:45.773682+05:30	2025-08-26 10:35:45.773682+05:30	[]	\N	[]
bd001cfa-1d02-4bc5-83eb-483667268857	Full Stack Development Bootcamp	Intensive bootcamp covering modern web development with React, Node.js, databases, and deployment strategies.	ascend	\N	2025-10-08	09:30:00	Main Auditorium	100	upcoming	\N	2025-08-26 10:35:45.773682+05:30	2025-08-26 10:35:45.773682+05:30	[]	\N	[]
e13b4e60-9dfa-476e-ae0a-327add0a1e32	Mental Health Awareness Campaign	Community outreach program focused on mental health awareness, stress management, and peer support systems.	aster	\N	2025-09-12	14:30:00	Student Plaza	200	upcoming	\N	2025-08-26 10:35:45.790587+05:30	2025-08-26 10:35:45.790587+05:30	[]	\N	[]
7d58fb15-6ee7-4adf-b8ce-573556ef64ff	Volunteer Drive for Community Service	Organizing volunteers for local community service projects including teaching underprivileged children and environmental cleanup.	aster	\N	2025-10-05	11:00:00	Community Center	80	upcoming	\N	2025-08-26 10:35:45.790587+05:30	2025-08-26 10:35:45.790587+05:30	[]	\N	[]
1a57b0e7-5a6c-47c1-af3b-332a9dc3949f	GATE Preparation Masterclass	Comprehensive preparation session for GATE exam covering key topics, solving strategies, and mock tests.	achievers	\N	2025-09-20	10:30:00	Library Auditorium	150	upcoming	\N	2025-08-26 10:35:45.791544+05:30	2025-08-26 10:35:45.791544+05:30	[]	\N	[]
ea7ee402-81db-42dd-8bfb-0e188f0a3600	International Scholarship Fair	Information session featuring international universities, scholarship opportunities, and application guidance for global education.	achievers	\N	2025-10-12	15:00:00	Exhibition Hall	250	upcoming	\N	2025-08-26 10:35:45.791544+05:30	2025-08-26 10:35:45.791544+05:30	[]	\N	[]
706692ae-de93-42d4-b77f-bdbdd04bf797	Cultural Fest - Kaleidoscope 2025	Annual cultural festival featuring dance, music, drama performances, art exhibitions, and creative competitions.	artovert	\N	2025-09-25	16:00:00	Main Campus Grounds	500	upcoming	\N	2025-08-26 10:35:45.792236+05:30	2025-08-26 10:35:45.792236+05:30	[]	\N	[]
486d3dc5-898b-4cb1-9c84-4c6ccfc69f96	Creative Writing & Poetry Workshop	Interactive workshop on creative writing, poetry composition, storytelling techniques, and literary expression.	artovert	\N	2025-10-18	13:30:00	Literature Hall	75	upcoming	\N	2025-08-26 10:35:45.792236+05:30	2025-08-26 10:35:45.792236+05:30	[]	\N	[]
\.


--
-- TOC entry 4435 (class 0 OID 19686)
-- Dependencies: 273
-- Data for Name: featured_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.featured_events (id, event_id, page_type, page_reference_id, custom_title, custom_description, custom_image_url, display_order, is_active, featured_until, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4422 (class 0 OID 19033)
-- Dependencies: 260
-- Data for Name: likes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.likes (id, post_id, user_id, created_at, comment_id) FROM stdin;
2b5b1bcd-653d-4f33-948c-bf38bcb13e64	3bc000fa-d086-4977-9cb3-08105ada3771	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	2025-08-24 20:45:52.419621+05:30	\N
ad0dade1-98a7-40e2-95d0-03ebc170808e	\N	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	2025-08-24 20:45:59.276092+05:30	c6cb6351-a125-491b-a4fa-c74ea8c80147
\.


--
-- TOC entry 4394 (class 0 OID 17852)
-- Dependencies: 232
-- Data for Name: media_files; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.media_files (id, filename, original_filename, file_size, mime_type, file_url, thumbnail_url, alt_text, description, uploaded_by, upload_context, upload_reference_id, is_public, metadata, created_at, updated_at) FROM stdin;
a19b9671-407d-4f77-8dc2-d0fc8a342a88	profiles/avatars/black pallotti_1756021695713_e8b026230f1a2a47.png	black pallotti.png	37153	image/png	/uploads/profiles/avatars/black pallotti_1756021695713_e8b026230f1a2a47.png	/uploads/profiles/avatars/black pallotti_1756021695713_e8b026230f1a2a47.png	\N	\N	550e8400-e29b-41d4-a716-446655440020	profiles	\N	t	{"type": "avatar", "userId": "550e8400-e29b-41d4-a716-446655440020"}	2025-08-24 13:18:15.713+05:30	2025-08-24 13:18:15.713+05:30
cfc5feed-9381-4054-9950-39fc9a04ee73	profiles/avatars/zenith-logo_1756021719703_68ee879f0d3e41bf.svg	zenith-logo.svg	755088	image/svg+xml	/uploads/profiles/avatars/zenith-logo_1756021719703_68ee879f0d3e41bf.svg	/uploads/profiles/avatars/zenith-logo_1756021719703_68ee879f0d3e41bf.svg	\N	\N	550e8400-e29b-41d4-a716-446655440020	profiles	\N	t	{"type": "avatar", "userId": "550e8400-e29b-41d4-a716-446655440020"}	2025-08-24 13:18:39.707+05:30	2025-08-24 13:18:39.707+05:30
34c60ceb-5117-465e-8f54-95270f2424ce	profiles/avatars/cd dep_1756022080753_48371a1403067f5c.png	cd dep.png	23676	image/png	/uploads/profiles/avatars/cd dep_1756022080753_48371a1403067f5c.png	/uploads/profiles/avatars/cd dep_1756022080753_48371a1403067f5c.png	\N	\N	550e8400-e29b-41d4-a716-446655440020	profiles	\N	t	{"type": "avatar", "userId": "550e8400-e29b-41d4-a716-446655440020"}	2025-08-24 13:24:40.754+05:30	2025-08-24 13:24:40.754+05:30
87b6edb0-8ab9-400a-b2c5-676bb2f5255b	profiles/avatars/Screenshot from 2025-08-24 13-48-12_1756024176742_333e05fb871c9932.png	Screenshot from 2025-08-24 13-48-12.png	312523	image/png	/uploads/profiles/avatars/Screenshot from 2025-08-24 13-48-12_1756024176742_333e05fb871c9932.png	/uploads/profiles/avatars/Screenshot from 2025-08-24 13-48-12_1756024176742_333e05fb871c9932.png	\N	\N	550e8400-e29b-41d4-a716-446655440020	profiles	\N	t	{"type": "avatar", "userId": "550e8400-e29b-41d4-a716-446655440020"}	2025-08-24 13:59:36.744+05:30	2025-08-24 13:59:36.744+05:30
7136ce9a-960c-43d7-a185-48491d929398	profiles/avatars/artovert_1756320177286_94b1ffde9005eda8.svg	artovert.svg	189212	image/svg+xml	/uploads/profiles/avatars/artovert_1756320177286_94b1ffde9005eda8.svg	/uploads/profiles/avatars/artovert_1756320177286_94b1ffde9005eda8.svg	\N	\N	1d5b1108-eb4c-4191-ae75-751e3610d519	profiles	\N	t	{"type": "avatar", "userId": "1d5b1108-eb4c-4191-ae75-751e3610d519"}	2025-08-28 00:12:57.288+05:30	2025-08-28 00:12:57.288+05:30
1f884e40-8ed9-446c-ae8d-f0634f6cad54	profiles/avatars/atharva_1756359728798_eb3fedded2aa1bf4.png	atharva.png	501380	image/png	/uploads/profiles/avatars/atharva_1756359728798_eb3fedded2aa1bf4.png	/uploads/profiles/avatars/atharva_1756359728798_eb3fedded2aa1bf4.png	\N	\N	1d5b1108-eb4c-4191-ae75-751e3610d519	profiles	\N	t	{"type": "avatar", "userId": "1d5b1108-eb4c-4191-ae75-751e3610d519"}	2025-08-28 11:12:08.801+05:30	2025-08-28 11:12:08.801+05:30
\.


--
-- TOC entry 4420 (class 0 OID 18374)
-- Dependencies: 258
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.messages (id, chat_room_id, user_id, content, attachment_url, created_at) FROM stdin;
\.


--
-- TOC entry 4429 (class 0 OID 19566)
-- Dependencies: 267
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.migrations (name, applied_at) FROM stdin;
comprehensive_media_system	2025-08-24 12:11:05.27565+05:30
fix_chat_attachments_structure	2025-08-24 12:12:19.362659+05:30
\.


--
-- TOC entry 4410 (class 0 OID 18232)
-- Dependencies: 248
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, type, title, message, link, read, delivery_method, created_at, sent_by, club_id, email_sent, email_sent_at, related_id, metadata) FROM stdin;
1	550e8400-e29b-41d4-a716-446655440020	event_join	New event attendee	A user has joined your event "Communication Skills Workshop"	\N	f	in-app	2025-08-12 16:02:02.904+05:30	\N	\N	f	\N	550e8400-3002-41d4-a716-446655440001	{}
2	550e8400-e29b-41d4-a716-446655440020	event_leave	Event attendee left	A user has left your event "Communication Skills Workshop"	\N	f	in-app	2025-08-12 16:02:08.482+05:30	\N	\N	f	\N	550e8400-3002-41d4-a716-446655440001	{}
3	550e8400-e29b-41d4-a716-446655440010	event_join	New event attendee	A user has joined your event "Hackathon Weekend"	\N	f	in-app	2025-08-12 16:02:12.771+05:30	\N	\N	f	\N	550e8400-3001-41d4-a716-446655440002	{}
4	550e8400-e29b-41d4-a716-446655440040	event_join	New event attendee	A user has joined your event "Holistic Development Fair"	\N	f	in-app	2025-08-12 16:02:14.885+05:30	\N	\N	f	\N	550e8400-3004-41d4-a716-446655440001	{}
5	550e8400-e29b-41d4-a716-446655440020	event_join	New event attendee	A user has joined your event "Communication Skills Workshop"	\N	f	in-app	2025-08-12 16:47:16.331+05:30	\N	\N	f	\N	550e8400-3002-41d4-a716-446655440001	{}
6	550e8400-e29b-41d4-a716-446655440020	event_leave	Event attendee left	A user has left your event "Communication Skills Workshop"	\N	f	in-app	2025-08-12 16:47:34.01+05:30	\N	\N	f	\N	550e8400-3002-41d4-a716-446655440001	{}
\.


--
-- TOC entry 4432 (class 0 OID 19629)
-- Dependencies: 270
-- Data for Name: page_content; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.page_content (id, page_type, page_reference_id, content_type, title, subtitle, description, image_url, link_url, metadata, display_order, is_active, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4431 (class 0 OID 19590)
-- Dependencies: 269
-- Data for Name: post_attachments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.post_attachments (id, post_id, media_file_id, file_name, file_type, file_size, attachment_type, uploaded_at, created_at) FROM stdin;
\.


--
-- TOC entry 4421 (class 0 OID 18994)
-- Dependencies: 259
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.posts (id, title, content, author_id, club_id, category, post_type, tags, excerpt, reading_time_minutes, featured_image_url, post_images, content_blocks, meta_description, slug, status, is_featured, is_pinned, view_count, likes_count, published_at, created_at, updated_at, edited_by, search_vector) FROM stdin;
550e8400-4001-41d4-a716-446655440001	Getting Started with React Hooks	React Hooks have revolutionized how we write React components. In this comprehensive guide, I'll share best practices for using useState, useEffect, and custom hooks in your projects. Learn how to manage state effectively and create reusable logic.	550e8400-e29b-41d4-a716-446655440100	ascend	tutorial	blog	{react,javascript,frontend,hooks}	\N	0	\N	[]	[]	\N	\N	draft	f	f	0	2	\N	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	'best':22 'compon':14 'comprehens':17 'creat':41 'custom':29 'effect':39 'frontend':46 'get':1 'guid':18 'hook':5,7,30,47 'javascript':45 'learn':34 'll':20 'logic':43 'manag':37 'practic':23 'project':33 'react':4,6,13,44 'reusabl':42 'revolution':9 'share':21 'start':2 'state':38 'use':25 'useeffect':27 'usest':26 'write':12
550e8400-4002-41d4-a716-446655440001	Effective Communication in Teams	Communication is the cornerstone of successful teamwork. Here are essential techniques for clear, respectful, and productive communication in professional environments, including active listening and conflict resolution strategies.	550e8400-e29b-41d4-a716-446655440200	aster	discussion	blog	{communication,teamwork,soft-skills,leadership}	\N	0	\N	[]	[]	\N	\N	draft	f	f	0	1	\N	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	'activ':26 'clear':17 'communic':2,5,21,32 'conflict':29 'cornerston':8 'effect':1 'environ':24 'essenti':14 'includ':25 'leadership':37 'listen':27 'product':20 'profession':23 'resolut':30 'respect':18 'skill':36 'soft':35 'soft-skil':34 'strategi':31 'success':10 'team':4 'teamwork':11,33 'techniqu':15
550e8400-4003-41d4-a716-446655440001	PhD Application Tips	Preparing for PhD applications? Here's a comprehensive guide covering research proposal writing, finding supervisors, application timelines, and interview preparation to help you succeed in your higher studies journey.	550e8400-e29b-41d4-a716-446655440300	achievers	tutorial	blog	{phd,higher-studies,research,academic}	\N	0	\N	[]	[]	\N	\N	draft	f	f	0	1	\N	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	'academ':38 'applic':2,7,19 'comprehens':11 'cover':13 'find':17 'guid':12 'help':25 'higher':30,35 'higher-studi':34 'interview':22 'journey':32 'phd':1,6,33 'prepar':4,23 'propos':15 'research':14,37 'studi':31,36 'succeed':27 'supervisor':18 'timelin':20 'tip':3 'write':16
0aa4697c-e3de-4097-a7ba-c72d7ab2777c	The Future of Artificial Intelligence in Education	# The Future of Artificial Intelligence in Education\n\n## Introduction\nArtificial Intelligence is revolutionizing how we learn and teach. From personalized learning experiences to automated grading systems, AI is reshaping the educational landscape.\n\n## Key Applications\n\n### 1. Personalized Learning\nAI algorithms can analyze student performance data to create customized learning paths that adapt to individual learning styles and pace.\n\n### 2. Intelligent Tutoring Systems\n```python\n# Example of an AI-powered learning system\nclass IntelligentTutor:\n    def __init__(self, student_profile):\n        self.student = student_profile\n        self.learning_path = self.generate_path()\n    \n    def adapt_content(self, performance_data):\n        # Adjust difficulty based on student performance\n        if performance_data.accuracy < 0.7:\n            self.reduce_difficulty()\n        elif performance_data.accuracy > 0.9:\n            self.increase_difficulty()\n```\n\n### 3. Automated Assessment\nAI can provide instant feedback on assignments and help identify areas where students need additional support.\n\n## Conclusion\nAs we move forward, the integration of AI in education must be thoughtful and ethical, ensuring that technology enhances rather than replaces human connection in learning.	550e8400-e29b-41d4-a716-446655440020	cs	blog	blog	{artificial-intelligence,education,machine-learning,technology}	Exploring how artificial intelligence is transforming education with personalized learning, intelligent tutoring systems, and automated assessment tools.	0	\N	[]	[]	\N	future-of-ai-in-education	published	f	f	0	0	\N	2025-08-19 14:04:10.987798+05:30	2025-08-19 14:04:10.987798+05:30	\N	'0.7':105 '0.9':110 '1':41 '2':64 '3':113 'adapt':57,92 'addit':130 'adjust':97 'ai':33,44,73,116,140 'ai-pow':72 'algorithm':45 'analyz':47 'applic':40 'area':126 'artifici':4,11,16,161,177 'artificial-intellig':176 'assess':115,174 'assign':122 'autom':30,114,173 'base':99 'class':77 'conclus':132 'connect':156 'content':93 'creat':52 'custom':53 'data':50,96 'def':79,91 'difficulti':98,107,112 'educ':7,14,37,142,165,179 'elif':108 'enhanc':151 'ensur':148 'ethic':147 'exampl':69 'experi':28 'explor':159 'feedback':120 'forward':136 'futur':2,9 'grade':31 'help':124 'human':155 'identifi':125 'individu':59 'init':80 'instant':119 'integr':138 'intellig':5,12,17,65,162,169,178 'intelligenttutor':78 'introduct':15 'key':39 'landscap':38 'learn':22,27,43,54,60,75,158,168,182 'machin':181 'machine-learn':180 'move':135 'must':143 'need':129 'pace':63 'path':55,88,90 'perform':49,95,102 'performance_data.accuracy':104,109 'person':26,42,167 'power':74 'profil':83,86 'provid':118 'python':68 'rather':152 'replac':154 'reshap':35 'revolution':19 'self':81,94 'self.generate':89 'self.increase':111 'self.learning':87 'self.reduce':106 'self.student':84 'student':48,82,85,101,128 'style':61 'support':131 'system':32,67,76,171 'teach':24 'technolog':150,183 'thought':145 'tool':175 'transform':164 'tutor':66,170
b96d8a44-35bd-43c8-a98b-5365f7f65a61	Building Your First Arduino Robot: A Complete Guide	# Building Your First Arduino Robot: A Complete Guide\n\nWelcome to the exciting world of robotics! In this comprehensive guide, we will walk you through creating your very first Arduino-based robot.\n\n## What You Need\n\n### Hardware Components\n- Arduino Uno microcontroller\n- Ultrasonic sensor (HC-SR04)\n- Servo motors (2x)\n- Wheels and chassis\n- Breadboard and jumper wires\n- 9V battery pack\n\n## Step-by-Step Assembly\n\n### 1. Setting Up the Chassis\nStart by assembling your robot frame. Most beginner kits come with pre-cut acrylic or plastic pieces.\n\n### 2. Wiring the Arduino\n```cpp\n// Basic robot control code\n#include <Servo.h>\n\nServo leftWheel;\nServo rightWheel;\n\nconst int trigPin = 9;\nconst int echoPin = 10;\n\nvoid setup() {\n  leftWheel.attach(6);\n  rightWheel.attach(5);\n  pinMode(trigPin, OUTPUT);\n  pinMode(echoPin, INPUT);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  long distance = getDistance();\n  \n  if (distance > 20) {\n    moveForward();\n  } else {\n    turnRight();\n    delay(500);\n  }\n}\n```\n\n## Next Steps\nOnce you have mastered the basics:\n1. Add LED indicators for different states\n2. Implement line-following capabilities\n3. Add Bluetooth control via smartphone app\n\nHappy building! 🤖	550e8400-e29b-41d4-a716-446655440020	robotics	blog	blog	{arduino,robotics,diy,programming,electronics}	Learn to build your first Arduino robot with this step-by-step guide covering hardware assembly, programming, and troubleshooting tips.	0	\N	[]	[]	\N	building-first-arduino-robot-guide	published	f	f	0	0	\N	2025-08-16 14:04:10.987798+05:30	2025-08-16 14:04:10.987798+05:30	\N	'1':72,152 '10':116 '2':95,159 '20':138 '2x':56 '3':165 '5':122 '500':143 '6':120 '9':112 '9600':130 '9v':64 'acryl':91 'add':153,166 'app':171 'arduino':4,12,38,46,98,179,195 'arduino-bas':37 'assembl':71,79,190 'base':39 'basic':100,151 'batteri':65 'beginn':84 'bluetooth':167 'breadboard':60 'build':1,9,173,176 'capabl':164 'chassi':59,76 'code':103 'come':86 'complet':7,15 'compon':45 'comprehens':26 'const':109,113 'control':102,168 'cover':188 'cpp':99 'creat':33 'cut':90 'delay':142 'differ':157 'distanc':134,137 'diy':197 'echopin':115,127 'electron':199 'els':140 'excit':20 'first':3,11,36,178 'follow':163 'frame':82 'getdist':135 'guid':8,16,27,187 'happi':172 'hardwar':44,189 'hc':52 'hc-sr04':51 'implement':160 'includ':104 'indic':155 'input':128 'int':110,114 'jumper':62 'kit':85 'learn':174 'led':154 'leftwheel':106 'leftwheel.attach':119 'line':162 'line-follow':161 'long':133 'loop':132 'master':149 'microcontrol':48 'motor':55 'moveforward':139 'need':43 'next':144 'output':125 'pack':66 'piec':94 'pinmod':123,126 'plastic':93 'pre':89 'pre-cut':88 'program':191,198 'rightwheel':108 'rightwheel.attach':121 'robot':5,13,23,40,81,101,180,196 'sensor':50 'serial.begin':129 'servo':54,105,107 'set':73 'setup':118 'smartphon':170 'sr04':53 'start':77 'state':158 'step':68,70,145,184,186 'step-by-step':67,183 'tip':194 'trigpin':111,124 'troubleshoot':193 'turnright':141 'ultrason':49 'uno':47 'via':169 'void':117,131 'walk':30 'welcom':17 'wheel':57 'wire':63,96 'world':21
2012b548-dc72-4f0f-9adc-767b69dd3f92	The Art of Method Acting: Techniques for Authentic Performance	# The Art of Method Acting: Techniques for Authentic Performance\n\nMethod acting has revolutionized modern theater and film, creating some of the most memorable and emotionally powerful performances in entertainment history.\n\n## What is Method Acting?\n\nMethod acting is an approach to acting that encourages actors to use their **personal experiences** and emotions to create authentic characters.\n\n## Core Techniques\n\n### 1. Emotional Memory\nActors draw upon their own past experiences to connect with their character emotional state.\n\n### 2. Sense Memory\nThis involves recreating physical sensations and environmental conditions through imagination and muscle memory.\n\n### 3. Substitution\nWhen an actor cannot relate to their character situation, they substitute it with a similar experience from their own life.\n\n## Famous Method Actors\n\n- **Marlon Brando** - Revolutionized film acting with his naturalistic approach\n- **Daniel Day-Lewis** - Known for staying in character throughout entire film productions\n- **Meryl Streep** - Masters accents and mannerisms through intensive preparation\n\n## Tips for Beginning Method Actors\n\n1. **Start small** - Begin with simple emotional exercises\n2. **Keep a journal** - Document your emotional and physical observations\n3. **Work with partners** - Practice scene work and improvisations\n4. **Take care of yourself** - Do not let character work overwhelm your personal life\n\nJoin us for our **Acting Masterclass** on August 30th at 6:00 PM in the Theater Hall!	550e8400-e29b-41d4-a716-446655440020	drama	blog	blog	{method-acting,theater,performance,acting-techniques,emotion}	Explore the fundamentals of method acting, from emotional memory to sense substitution, with practical exercises and insights from legendary performers.	0	\N	[]	[]	\N	art-of-method-acting-techniques	published	f	f	0	0	\N	2025-08-18 14:04:10.987798+05:30	2025-08-18 14:04:10.987798+05:30	\N	'00':213 '1':67,161 '2':84,169 '3':100,179 '30th':210 '4':188 '6':212 'accent':150 'act':5,14,20,43,45,50,129,206,224,241,245 'acting-techniqu':244 'actor':53,70,104,124,160 'approach':48,133 'art':2,11 'august':209 'authent':8,17,63 'begin':158,164 'brando':126 'cannot':105 'care':190 'charact':64,81,109,142,196 'condit':94 'connect':78 'core':65 'creat':27,62 'daniel':134 'day':136 'day-lewi':135 'document':173 'draw':71 'emot':34,60,68,82,167,175,226,247 'encourag':52 'entertain':38 'entir':144 'environment':93 'exercis':168,233 'experi':58,76,117 'explor':219 'famous':122 'film':26,128,145 'fundament':221 'hall':218 'histori':39 'imagin':96 'improvis':187 'insight':235 'intens':154 'involv':88 'join':202 'journal':172 'keep':170 'known':138 'legendari':237 'let':195 'lewi':137 'life':121,201 'manner':152 'marlon':125 'master':149 'masterclass':207 'memor':32 'memori':69,86,99,227 'meryl':147 'method':4,13,19,42,44,123,159,223,240 'method-act':239 'modern':23 'muscl':98 'naturalist':132 'observ':178 'overwhelm':198 'partner':182 'past':75 'perform':9,18,36,238,243 'person':57,200 'physic':90,177 'pm':214 'power':35 'practic':183,232 'prepar':155 'product':146 'recreat':89 'relat':106 'revolution':22,127 'scene':184 'sens':85,229 'sensat':91 'similar':116 'simpl':166 'situat':110 'small':163 'start':162 'state':83 'stay':140 'streep':148 'substitut':101,112,230 'take':189 'techniqu':6,15,66,246 'theater':24,217,242 'throughout':143 'tip':156 'upon':72 'us':203 'use':55 'work':180,185,197
876734eb-f439-46ca-ae21-d4bd11e612dd	Jazz Improvisation: Finding Your Voice Through Musical Freedom	# Jazz Improvisation: Finding Your Voice Through Musical Freedom\n\nJazz improvisation is the **heart and soul** of jazz music - the magical moment when musicians create spontaneous melodies, harmonies, and rhythms that have never existed before and may never exist again.\n\n## The Essence of Jazz Improvisation\n\nImprovisation in jazz is like having a **musical conversation**. Each musician contributes their unique voice while listening and responding to others, creating a collaborative masterpiece in real-time.\n\n## Fundamental Elements\n\n### 1. Scales and Modes\nUnderstanding the building blocks of jazz harmony:\n\n- **Major and Minor Scales**\n- **Blues Scale** - The foundation of jazz expression\n- **Dorian Mode** - Perfect for minor key improvisation\n- **Mixolydian Mode** - Essential for dominant chord solos\n\n### 2. Chord Progressions\nMaster these essential progressions:\n\n```\nii-V-I Progression:\nDm7 - G7 - CMaj7\n\nJazz Standard Turnaround:\nCMaj7 - A7 - Dm7 - G7\n```\n\n## Great Jazz Improvisers\n\n### 🎺 **Miles Davis**\n*"Do not fear mistakes. There are none."*\n\nRevolutionary trumpeter who constantly reinvented jazz through different periods: bebop, cool jazz, fusion.\n\n### 🎷 **John Coltrane**\nMaster of extended improvisation and spiritual expression through music.\n\n## Practice Strategies\n\n### Daily Routine\n1. **Warm-up** with scales (15 minutes)\n2. **Chord progression practice** (20 minutes)\n3. **Transcription work** (15 minutes)\n4. **Free improvisation** (10 minutes)\n\nJoin our **Jazz Night** on September 1st at 8:00 PM at Music Hall!	550e8400-e29b-41d4-a716-446655440020	music	blog	blog	{jazz,improvisation,music-theory,performance,creativity}	Discover the art of jazz improvisation with techniques, tips, and insights from legendary musicians to help you develop your unique musical voice.	0	\N	[]	[]	\N	jazz-improvisation-finding-your-voice	published	f	f	0	0	\N	2025-08-20 14:04:10.987798+05:30	2025-08-20 14:04:10.987798+05:30	\N	'00':215 '1':84,182 '10':204 '15':188,199 '1st':212 '2':120,190 '20':194 '3':196 '4':201 '8':214 'a7':139 'art':222 'bebop':163 'block':91 'blue':99 'build':90 'chord':118,121,191 'cmaj7':134,138 'collabor':76 'coltran':168 'constant':157 'contribut':64 'convers':61 'cool':164 'creat':32,74 'creativ':248 'daili':180 'davi':146 'develop':237 'differ':161 'discov':220 'dm7':132,140 'domin':117 'dorian':106 'element':83 'essenc':49 'essenti':115,125 'exist':41,46 'express':105,175 'extend':171 'fear':149 'find':3,11 'foundat':102 'free':202 'freedom':8,16 'fundament':82 'fusion':166 'g7':133,141 'great':142 'hall':219 'harmoni':35,94 'heart':21 'help':235 'ii':128 'ii-v-i':127 'improvis':2,10,18,52,53,112,144,172,203,225,243 'insight':230 'jazz':1,9,17,25,51,55,93,104,135,143,159,165,208,224,242 'john':167 'join':206 'key':111 'legendari':232 'like':57 'listen':69 'magic':28 'major':95 'master':123,169 'masterpiec':77 'may':44 'melodi':34 'mile':145 'minor':97,110 'minut':189,195,200,205 'mistak':150 'mixolydian':113 'mode':87,107,114 'moment':29 'music':7,15,26,60,177,218,240,245 'music-theori':244 'musician':31,63,233 'never':40,45 'night':209 'none':153 'other':73 'perfect':108 'perform':247 'period':162 'pm':216 'practic':178,193 'progress':122,126,131,192 'real':80 'real-tim':79 'reinvent':158 'respond':71 'revolutionari':154 'rhythm':37 'routin':181 'scale':85,98,100,187 'septemb':211 'solo':119 'soul':23 'spiritu':174 'spontan':33 'standard':136 'strategi':179 'techniqu':227 'theori':246 'time':81 'tip':228 'transcript':197 'trumpet':155 'turnaround':137 'understand':88 'uniqu':66,239 'v':129 'voic':5,13,67,241 'warm':184 'warm-up':183 'work':198
19996dd7-d767-4332-9a23-0d889a7d9b1c	Digital Art vs Traditional Art: Bridging Two Worlds	# Digital Art vs Traditional Art: Bridging Two Worlds\n\nThe art world has undergone a **revolutionary transformation** with the advent of digital tools. Rather than replacing traditional methods, digital art has opened new avenues for creative expression while honoring time-tested techniques.\n\n## The Evolution of Artistic Expression\n\n### Traditional Art: The Foundation\nTraditional art forms have been humanity primary means of visual expression for **thousands of years**:\n\n- **Painting** - Oil, watercolor, acrylic on canvas\n- **Drawing** - Pencil, charcoal, ink on paper  \n- **Sculpture** - Clay, marble, bronze, wood\n- **Printmaking** - Etching, lithography, screen printing\n\n### Digital Art: The New Frontier\nDigital art emerged in the late 20th century and has exploded in popularity:\n\n- **Digital Painting** - Using tablets and styluses\n- **3D Modeling** - Creating three-dimensional objects\n- **Photo Manipulation** - Transforming photographs\n- **Motion Graphics** - Animated visual content\n\n## Popular Digital Art Software\n\n### Professional Tools\n- **Adobe Photoshop** - Industry standard for digital painting and photo editing\n- **Procreate** - iPad app beloved by digital artists\n- **Clip Studio Paint** - Excellent for illustration and comics\n- **Blender** - Free 3D modeling and animation software\n\n### Skills That Transfer\n- **Composition** - Rule of thirds, balance, focal points\n- **Color theory** - Harmony, temperature, value\n- **Drawing fundamentals** - Proportion, perspective, anatomy\n- **Creative thinking** - Concept development, storytelling\n\n## Conclusion\n\nThe future of art lies not in choosing between traditional and digital, but in **understanding and appreciating both**. Each medium offers unique strengths, and the most versatile artists often work fluidly between both worlds.\n\nJoin our **Digital Art Workshop** on August 27, 2025 at 3:30 PM in the Art Studio!	550e8400-e29b-41d4-a716-446655440020	art	blog	blog	{digital-art,traditional-art,creativity,technology,artistic-expression}	Exploring the relationship between traditional and digital art, comparing their strengths, and discovering how modern artists bridge both worlds.	0	\N	[]	[]	\N	digital-art-vs-traditional-art-bridging-worlds	published	f	f	0	0	\N	2025-08-17 14:04:10.987798+05:30	2025-08-17 14:04:10.987798+05:30	\N	'2025':243 '20th':108 '27':242 '3':245 '30':246 '3d':121,170 'acryl':78 'adob':143 'advent':27 'anatomi':194 'anim':134,173 'app':155 'appreci':217 'art':2,5,10,13,18,37,57,61,98,103,139,204,238,250,259,273,276 'artist':54,159,228,267,280 'artistic-express':279 'august':241 'avenu':41 'balanc':182 'belov':156 'blender':168 'bridg':6,14,268 'bronz':90 'canva':80 'centuri':109 'charcoal':83 'choos':208 'clay':88 'clip':160 'color':185 'comic':167 'compar':260 'composit':178 'concept':197 'conclus':200 'content':136 'creat':123 'creativ':43,195,277 'develop':198 'digit':1,9,29,36,97,102,115,138,148,158,212,237,258,272 'digital-art':271 'dimension':126 'discov':264 'draw':81,190 'edit':152 'emerg':104 'etch':93 'evolut':52 'excel':163 'explod':112 'explor':252 'express':44,55,70,281 'fluid':231 'focal':183 'form':62 'foundat':59 'free':169 'frontier':101 'fundament':191 'futur':202 'graphic':133 'harmoni':187 'honor':46 'human':65 'illustr':165 'industri':145 'ink':84 'ipad':154 'join':235 'late':107 'lie':205 'lithographi':94 'manipul':129 'marbl':89 'mean':67 'medium':220 'method':35 'model':122,171 'modern':266 'motion':132 'new':40,100 'object':127 'offer':221 'often':229 'oil':76 'open':39 'paint':75,116,149,162 'paper':86 'pencil':82 'perspect':193 'photo':128,151 'photograph':131 'photoshop':144 'pm':247 'point':184 'popular':114,137 'primari':66 'print':96 'printmak':92 'procreat':153 'profession':141 'proport':192 'rather':31 'relationship':254 'replac':33 'revolutionari':23 'rule':179 'screen':95 'sculptur':87 'skill':175 'softwar':140,174 'standard':146 'storytel':199 'strength':223,262 'studio':161,251 'stylus':120 'tablet':118 'techniqu':50 'technolog':278 'temperatur':188 'test':49 'theori':186 'think':196 'third':181 'thousand':72 'three':125 'three-dimension':124 'time':48 'time-test':47 'tool':30,142 'tradit':4,12,34,56,60,210,256,275 'traditional-art':274 'transfer':177 'transform':24,130 'two':7,15 'undergon':21 'understand':215 'uniqu':222 'use':117 'valu':189 'versatil':227 'visual':69,135 'vs':3,11 'watercolor':77 'wood':91 'work':230 'workshop':239 'world':8,16,19,234,270 'year':74
9c2e0737-d2ad-4ba7-b077-683e275f0ff4	The Science of Athletic Performance: Training Mind and Body	# The Science of Athletic Performance: Training Mind and Body\n\nModern athletics has evolved far beyond simple physical training. Today elite athletes understand that **peak performance** requires a holistic approach that integrates physical conditioning, mental preparation, nutrition science, and recovery strategies.\n\n## The Foundation: Physical Training\n\n### Strength and Conditioning\nProper strength training forms the backbone of athletic performance:\n\n#### **Progressive Overload**\nGradually increasing training demands to stimulate adaptation and growth.\n\n#### **Specificity Principle**  \nTraining movements and energy systems specific to your sport.\n\n#### **Recovery and Adaptation**\nUnderstanding that growth happens during rest, not just during training.\n\n### Training Periodization\n```\nMacrocycle (Annual Plan)\n├── Preparation Phase (Base Building)\n├── Competition Phase (Peak Performance)\n└── Transition Phase (Active Recovery)\n\nMicrocycle (Weekly Plan)\n├── High Intensity Days\n├── Moderate Intensity Days\n└── Recovery Days\n```\n\n## The Mental Game\n\n### Sports Psychology Fundamentals\n\n#### **Goal Setting**\n- **SMART Goals**: Specific, Measurable, Achievable, Relevant, Time-bound\n- **Process vs Outcome**: Focus on controllable actions rather than results\n- **Progressive Targets**: Building confidence through incremental achievements\n\n#### **Visualization Techniques**\nElite athletes spend significant time mentally rehearsing their performance.\n\n## Nutrition: Fueling Performance\n\n### Macronutrients for Athletes\n\n#### **Carbohydrates** - The Primary Fuel\n- **Pre-Exercise**: 1-4g per kg body weight, 1-4 hours before\n- **During Exercise**: 30-60g per hour for sessions > 60 minutes\n- **Post-Exercise**: 1.5g per kg body weight within 30 minutes\n\n#### **Proteins** - Building and Repair\n- **Daily Intake**: 1.2-2.0g per kg body weight\n- **Post-Workout**: 20-25g within 2 hours\n\n## Upcoming Events\n\n### 🏀 **Basketball Tournament**\n**Date:** September 10, 2025 at 4:00 PM  \n**Location:** Basketball Court  \n\n### 💪 **Fitness Challenge**  \n**Date:** August 29, 2025 at 8:00 AM  \n**Location:** Sports Complex\n\nRemember: **every expert was once a beginner**. Start where you are, use what you have, and do what you can.	550e8400-e29b-41d4-a716-446655440020	sports	blog	blog	{athletics,sports-science,training,nutrition,performance}	Discover the science behind peak athletic performance, covering physical training, mental preparation, nutrition, recovery, and injury prevention.	0	\N	[]	[]	\N	science-of-athletic-performance-training	published	f	f	0	0	\N	2025-08-15 14:04:10.987798+05:30	2025-08-15 14:04:10.987798+05:30	\N	'-2.0':228 '-25':238 '-4':188,195 '-60':201 '00':253,266 '1':187,194 '1.2':227 '1.5':212 '10':249 '2':241 '20':237 '2025':250,263 '29':262 '30':200,219 '4':252 '60':207 '8':265 'achiev':141,162 'action':152 'activ':116 'adapt':74,90 'annual':104 'approach':38 'athlet':4,13,20,30,64,166,179,296,308 'august':261 'backbon':62 'base':108 'basketbal':245,256 'beginn':277 'behind':294 'beyond':24 'bodi':9,18,192,216,232 'bound':145 'build':109,158,222 'carbohydr':180 'challeng':259 'competit':110 'complex':270 'condit':42,56 'confid':159 'control':151 'court':257 'cover':298 'daili':225 'date':247,260 'day':123,126,128 'demand':71 'discov':291 'elit':29,165 'energi':82 'event':244 'everi':272 'evolv':22 'exercis':186,199,211 'expert':273 'far':23 'fit':258 'focus':149 'form':60 'foundat':51 'fuel':175,183 'fundament':134 'g':189,202,213,229,239 'game':131 'goal':135,138 'gradual':68 'growth':76,93 'happen':94 'high':121 'holist':37 'hour':196,204,242 'increas':69 'increment':161 'injuri':306 'intak':226 'integr':40 'intens':122,125 'kg':191,215,231 'locat':255,268 'macrocycl':103 'macronutri':177 'measur':140 'mental':43,130,170,301 'microcycl':118 'mind':7,16 'minut':208,220 'moder':124 'modern':19 'movement':80 'nutrit':45,174,303,313 'outcom':148 'overload':67 'peak':33,112,295 'per':190,203,214,230 'perform':5,14,34,65,113,173,176,297,314 'period':102 'phase':107,111,115 'physic':26,41,52,299 'plan':105,120 'pm':254 'post':210,235 'post-exercis':209 'post-workout':234 'pre':185 'pre-exercis':184 'prepar':44,106,302 'prevent':307 'primari':182 'principl':78 'process':146 'progress':66,156 'proper':57 'protein':221 'psycholog':133 'rather':153 'recoveri':48,88,117,127,304 'rehears':171 'relev':142 'rememb':271 'repair':224 'requir':35 'rest':96 'result':155 'scienc':2,11,46,293,311 'septemb':248 'session':206 'set':136 'signific':168 'simpl':25 'smart':137 'specif':77,84,139 'spend':167 'sport':87,132,269,310 'sports-scienc':309 'start':278 'stimul':73 'strategi':49 'strength':54,58 'system':83 'target':157 'techniqu':164 'time':144,169 'time-bound':143 'today':28 'tournament':246 'train':6,15,27,53,59,70,79,100,101,300,312 'transit':114 'understand':31,91 'upcom':243 'use':282 'visual':163 'vs':147 'week':119 'weight':193,217,233 'within':218,240 'workout':236
550e8400-4004-41d4-a716-446655440001	Balancing Technical and Soft Skills	In today's competitive world, success requires both technical expertise and soft skills. Learn how to develop a balanced skill set that makes you stand out in any field while maintaining personal growth and well-being.	550e8400-e29b-41d4-a716-446655440400	artovert	discussion	blog	{balance,development,skills,growth}	\N	0	\N	[]	[]	\N	\N	draft	f	f	0	1	\N	2025-07-27 13:47:32.966+05:30	2025-08-25 18:04:57.007481+05:30	\N	'balanc':1,24,43 'competit':9 'develop':22,44 'expertis':15 'field':34 'growth':38,46 'learn':19 'maintain':36 'make':28 'person':37 'requir':12 'set':26 'skill':5,18,25,45 'soft':4,17 'stand':30 'success':11 'technic':2,14 'today':7 'well':41 'well-b':40 'world':10
3bc000fa-d086-4977-9cb3-08105ada3771	Arduino	## Unleash Your Inner Maker: Getting Started with Arduino\n\nWelcome, ASCENDers!  This post is for anyone curious about the amazing world of Arduino – a fantastic platform for bringing your coding projects to life. Whether you're a complete beginner or have some programming experience, Arduino offers a rewarding and accessible path to hardware interaction.\n\n**What is Arduino?**\n\nArduino isn't just a piece of hardware; it's a complete ecosystem. At its core, it's a microcontroller board – a tiny, programmable computer – that can be used to control a vast array of electronic components. Think LEDs, motors, sensors, and much more!  What sets Arduino apart is its ease of use.  Its intuitive programming language (based on C++) and large, supportive community make it perfect for learning and experimentation.\n\n**Why Learn Arduino?**\n\n* **Hands-on learning:**  Forget abstract concepts; Arduino lets you *see* your code in action.  You'll build projects, troubleshoot problems, and develop practical skills applicable to various fields.\n* **Creative freedom:** The possibilities are virtually endless.  Build robots, automate home appliances, create interactive art installations – the only limit is your imagination!\n* **Boost your resume:**  Demonstrating proficiency in Arduino showcases your problem-solving abilities, your understanding of embedded systems, and your dedication to learning.  Employers across various industries value these skills.\n* **Join a vibrant community:**  The Arduino community is massive and supportive.  You'll find countless tutorials, projects, and forums to help you every step of the way.\n\n\n**Getting Started: Your First Arduino Project**\n\nLet's build a simple project: blinking an LED!  This seemingly basic project will introduce you to the fundamental concepts of Arduino programming.\n\n**You'll need:**\n\n* An Arduino Uno (or similar board)\n* A LED\n* A 220-ohm resistor (crucial to prevent damage to the LED)\n* Jumper wires\n* A breadboard (optional, but highly recommended)\n\n**Steps:**\n\n1. **Download the Arduino IDE:**  Head to [https://www.arduino.cc/en/Main/Software](https://www.arduino.cc/en/Main/Software) and download the software for your operating system.\n2. **Connect the components:**  Connect the longer leg (positive anode) of the LED to digital pin 13 on your Arduino board through the 220-ohm resistor.  Connect the shorter leg (negative cathode) to ground (GND) on the Arduino board. A breadboard simplifies this process.\n3. **Write the code:** Copy and paste the following code into the Arduino IDE:\n\n```c++\nvoid setup() {\n  pinMode(13, OUTPUT); // Set pin 13 as an output\n}\n\nvoid loop() {\n  digitalWrite(13, HIGH); // Turn LED ON\n  delay(1000);          // Wait for 1 second\n  digitalWrite(13, LOW);  // Turn LED OFF\n  delay(1000);          // Wait for 1 second\n}\n```\n\n4. **Upload the code:** Connect your Arduino to your computer via USB and upload the code.  Your LED should now blink!\n\n**Next Steps:**\n\nThis is just the beginning!  Explore different sensors, motors, and libraries to expand your projects.  Consider these resources:\n\n* **Official Arduino website:** [https://www.arduino.cc/](https://www.arduino.cc/)\n* **Instructables:** A great source of project ideas and tutorials.\n* **YouTube:**  Search for "Arduino projects for beginners" for countless video tutorials.\n\nDon't be afraid to experiment, make mistakes, and learn from them.  The Arduino community is here to support you on your journey. Happy making, ASCENDers!\n	550e8400-e29b-41d4-a716-446655440020	ascend	blog	blog	{}	 Unleash Your Inner Maker: Getting Started with Arduino\n\nWelcome, ASCENDers!  This post is for anyone curious about the amazing world of Arduino – a fantastic platform for bringing your coding proje...	0	\N	[]	[]	\N	arduino	published	f	f	36	0	\N	2025-08-24 16:37:20.818237+05:30	2025-08-29 11:23:59.670791+05:30	\N	'/](https://www.arduino.cc/)':460 '/en/main/software](https://www.arduino.cc/en/main/software)':309 '1':300,400,412 '1000':397,409 '13':334,380,384,391,403 '2':318 '220':281,341 '3':362 '4':414 'abil':195 'abstract':137 'access':50 'across':207 'action':146 'afraid':484 'amaz':20,525 'anod':327 'anyon':16,521 'apart':105 'applianc':172 'applic':157 'arduino':1,9,23,45,57,58,104,131,139,189,218,244,267,273,303,337,355,374,420,456,473,494,514,528 'array':91 'art':175 'ascend':11,506,516 'autom':170 'base':115 'basic':257 'begin':441 'beginn':39,476 'blink':252,434 'board':78,277,338,356 'boost':183 'breadboard':294,358 'bring':28,533 'build':149,168,248 'c':117,376 'cathod':349 'code':30,144,365,371,417,429,535 'communiti':121,216,219,495 'complet':38,69 'compon':94,321 'comput':82,423 'concept':138,265 'connect':319,322,344,418 'consid':452 'control':88 'copi':366 'core':73 'countless':227,478 'creat':173 'creativ':161 'crucial':284 'curious':17,522 'damag':287 'dedic':203 'delay':396,408 'demonstr':186 'develop':154 'differ':443 'digit':332 'digitalwrit':390,402 'download':301,311 'eas':108 'ecosystem':70 'electron':93 'embed':199 'employ':206 'endless':167 'everi':235 'expand':449 'experi':44,486 'experiment':128 'explor':442 'fantast':25,530 'field':160 'find':226 'first':243 'follow':370 'forget':136 'forum':231 'freedom':162 'fundament':264 'get':6,240,511 'gnd':352 'great':463 'ground':351 'hand':133 'hands-on':132 'happi':504 'hardwar':53,65 'head':305 'help':233 'high':297,392 'home':171 'ide':304,375 'idea':467 'imagin':182 'industri':209 'inner':4,509 'instal':176 'instruct':461 'interact':54,174 'introduc':260 'intuit':112 'isn':59 'join':213 'journey':503 'jumper':291 'languag':114 'larg':119 'learn':126,130,135,205,490 'led':96,254,279,290,330,394,406,431 'leg':325,347 'let':140,246 'librari':447 'life':33 'limit':179 'll':148,225,270 'longer':324 'loop':389 'low':404 'make':122,487,505 'maker':5,510 'massiv':221 'microcontrol':77 'mistak':488 'motor':97,445 'much':100 'need':271 'negat':348 'next':435 'offer':46 'offici':455 'ohm':282,342 'oper':316 'option':295 'output':381,387 'past':368 'path':51 'perfect':124 'piec':63 'pin':333,383 'pinmod':379 'platform':26,531 'posit':326 'possibl':164 'post':13,518 'practic':155 'prevent':286 'problem':152,193 'problem-solv':192 'process':361 'profici':187 'program':43,113,268 'programm':81 'proje':536 'project':31,150,229,245,251,258,451,466,474 're':36 'recommend':298 'resistor':283,343 'resourc':454 'resum':185 'reward':48 'robot':169 'search':471 'second':401,413 'see':142 'seem':256 'sensor':98,444 'set':103,382 'setup':378 'shorter':346 'showcas':190 'similar':276 'simpl':250 'simplifi':359 'skill':156,212 'softwar':313 'solv':194 'sourc':464 'start':7,241,512 'step':236,299,436 'support':120,223,499 'system':200,317 'think':95 'tini':80 'troubleshoot':151 'turn':393,405 'tutori':228,469,480 'understand':197 'unleash':2,507 'uno':274 'upload':415,427 'usb':425 'use':86,110 'valu':210 'various':159,208 'vast':90 'via':424 'vibrant':215 'video':479 'virtual':166 'void':377,388 'wait':398,410 'way':239 'websit':457 'welcom':10,515 'whether':34 'wire':292 'world':21,526 'write':363 'www.arduino.cc':308,459 'www.arduino.cc/](https://www.arduino.cc/)':458 'www.arduino.cc/en/main/software](https://www.arduino.cc/en/main/software)':307 'youtub':470
\.


--
-- TOC entry 4396 (class 0 OID 17890)
-- Dependencies: 234
-- Data for Name: proctoring_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proctoring_sessions (id, assignment_id, user_id, session_start, session_end, camera_enabled, microphone_enabled, face_verified, violations, screenshots, system_info, session_data) FROM stdin;
\.


--
-- TOC entry 4427 (class 0 OID 19173)
-- Dependencies: 265
-- Data for Name: project_invitations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.project_invitations (id, project_id, inviter_id, email, role, invitation_token, project_password, status, message, expires_at, sent_at, accepted_at, created_at, project_key, access_key) FROM stdin;
\.


--
-- TOC entry 4425 (class 0 OID 19107)
-- Dependencies: 263
-- Data for Name: project_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.project_members (id, project_id, user_id, role, status, joined_at, invited_by, created_at) FROM stdin;
b86ebb6d-8610-49ee-992c-9f033cd329b0	12413e7f-8ff1-47f7-b6d6-91558835948c	550e8400-e29b-41d4-a716-446655440020	admin	active	2025-08-23 21:08:20.408168+05:30	550e8400-e29b-41d4-a716-446655440020	2025-08-23 21:08:20.408168+05:30
5bfef142-f9f7-4cea-8bcc-03aef906c0b2	411bad76-ae50-436b-bf00-0f841b4f682f	550e8400-e29b-41d4-a716-446655440020	admin	active	2025-08-23 21:18:53.037679+05:30	550e8400-e29b-41d4-a716-446655440020	2025-08-23 21:18:53.037679+05:30
734eb3a3-2d39-4580-a839-36ac9adf5630	41ad1a02-02a7-4b65-a464-0cb72a13b355	550e8400-e29b-41d4-a716-446655440020	admin	active	2025-08-24 09:34:06.150689+05:30	550e8400-e29b-41d4-a716-446655440020	2025-08-24 09:34:06.150689+05:30
\.


--
-- TOC entry 4424 (class 0 OID 19078)
-- Dependencies: 262
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.projects (id, name, description, club_id, created_by, project_key, project_type, priority, status, start_date, target_end_date, actual_end_date, access_password, is_public, progress_percentage, total_tasks, completed_tasks, created_at, updated_at) FROM stdin;
411bad76-ae50-436b-bf00-0f841b4f682f	Nagpur2	teat	ascend	550e8400-e29b-41d4-a716-446655440020	NAGPU642	innovation	medium	planning	\N	2025-08-29	\N	NAGPRADHFEC3	t	0	0	0	2025-08-23 21:18:53.035843+05:30	2025-08-23 21:18:53.035843+05:30
41ad1a02-02a7-4b65-a464-0cb72a13b355	testDelpoy	hi	aster	550e8400-e29b-41d4-a716-446655440020	TE93DA47	innovation	critical	planning	\N	2025-08-29	\N	TE6690768B2FD1	f	33.3	9	3	2025-08-24 09:34:06.14803+05:30	2025-08-29 01:14:28.269555+05:30
12413e7f-8ff1-47f7-b6d6-91558835948c	Nagpur	test	ascend	550e8400-e29b-41d4-a716-446655440020	NAGPU046	innovation	medium	planning	\N	2025-08-28	\N	NAGPRADH9298	f	100.0	1	1	2025-08-23 21:08:20.405678+05:30	2025-08-24 02:21:50.191196+05:30
\.


--
-- TOC entry 4419 (class 0 OID 18366)
-- Dependencies: 257
-- Data for Name: query_cache; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.query_cache (cache_key, cache_value, last_updated, expires_at) FROM stdin;
\.


--
-- TOC entry 4395 (class 0 OID 17869)
-- Dependencies: 233
-- Data for Name: question_media; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.question_media (id, question_id, media_file_id, media_type, display_order, is_primary, caption, created_at) FROM stdin;
\.


--
-- TOC entry 4390 (class 0 OID 17784)
-- Dependencies: 228
-- Data for Name: question_options; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.question_options (id, question_id, option_text, is_correct, ordering, created_at) FROM stdin;
\.


--
-- TOC entry 4391 (class 0 OID 17800)
-- Dependencies: 229
-- Data for Name: question_responses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.question_responses (id, submission_id, question_id, selected_options, code_answer, essay_answer, is_correct, score, time_spent, feedback, created_at, updated_at, selected_language, last_auto_save, attempt_history) FROM stdin;
\.


--
-- TOC entry 4414 (class 0 OID 18296)
-- Dependencies: 252
-- Data for Name: security_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.security_events (id, user_id, event_type, ip_address, device_info, event_data, created_at) FROM stdin;
\.


--
-- TOC entry 4412 (class 0 OID 18258)
-- Dependencies: 250
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (id, user_id, token, expires_at, created_at, last_active_at, user_agent, ip_address, device_info, is_trusted, requires_2fa, has_completed_2fa) FROM stdin;
245bf36c-286b-4d63-b112-79fd444e6a21	550e8400-e29b-41d4-a716-446655440020	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjAiLCJpYXQiOjE3NTU3MTYxNDAsImV4cCI6MTc1NTgwMjU0MCwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.IgqapyLfoUiqgWvlS57tPLuC2KnS_FKbztbz-ToI-W8	2025-08-22 00:25:40.391+05:30	2025-08-21 00:25:40.396768+05:30	2025-08-21 00:25:40.396768+05:30	\N	\N	{}	f	t	f
bb191d33-6c2b-4c29-80c7-0e61f13f77d1	550e8400-e29b-41d4-a716-446655440020	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjAiLCJpYXQiOjE3NTU3MTY3MjAsImV4cCI6MTc1NTgwMzEyMCwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.OrbgT67cedAaH8f7trYkteirdKafVxGGL9-siT0ww0s	2025-08-22 00:35:20.021+05:30	2025-08-21 00:35:20.026265+05:30	2025-08-21 00:35:20.026265+05:30	\N	\N	{}	f	t	f
eb7b848c-cc67-4089-869b-a4e3f5cc9280	550e8400-e29b-41d4-a716-446655440020	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjAiLCJpYXQiOjE3NTU3OTk0NzksImV4cCI6MTc1NTg4NTg3OSwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.pKKUh42yFb8YIDMzmIoB19qjXwJEsTsZZ90ZrtRXgug	2025-08-22 23:34:39.105+05:30	2025-08-21 23:34:39.10674+05:30	2025-08-21 23:34:39.10674+05:30	\N	\N	{}	f	t	f
6c05eb68-9879-4b6a-8182-a824320271b5	550e8400-e29b-41d4-a716-446655440020	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjAiLCJpYXQiOjE3NTU4MDIxMDMsImV4cCI6MTc1NTg4ODUwMywiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.ymbG8tVPCLS1eFp76xe0F-DVDc2l9j7Hsm4IaQygHbo	2025-08-23 00:18:23.589+05:30	2025-08-22 00:18:23.594321+05:30	2025-08-22 00:18:23.594321+05:30	\N	\N	{}	f	t	f
e9c762ea-9363-417f-9311-4a49e71ca9a4	550e8400-e29b-41d4-a716-446655440020	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjAiLCJpYXQiOjE3NTU4MDI2ODIsImV4cCI6MTc1NTg4OTA4MiwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.E9t9sNg-PGuGjZj6D8aW36uMHWTb54yTpG1kwRJUksw	2025-08-23 00:28:02.067+05:30	2025-08-22 00:28:02.069277+05:30	2025-08-22 00:28:02.069277+05:30	\N	\N	{}	f	t	f
051b882c-51e1-4d3b-96b0-d64e5e924edd	550e8400-e29b-41d4-a716-446655440020	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjAiLCJpYXQiOjE3NTU4NTkxMDIsImV4cCI6MTc1NTk0NTUwMiwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.4sUWZGTJ3XSN8CqMcYAvCX9z2W6XOzFHioHzP62Xx9g	2025-08-23 16:08:22.569+05:30	2025-08-22 16:08:22.57104+05:30	2025-08-22 16:08:22.57104+05:30	\N	\N	{}	f	t	f
dfb67aca-0bc8-4666-b58f-0fe50cb3591d	550e8400-e29b-41d4-a716-446655440020	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjAiLCJpYXQiOjE3NTU4OTc3MzksImV4cCI6MTc1NTk4NDEzOSwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.QzsViFay5no7DWRCufJ20pu7vnj3Eq_YPfd5byHMJa4	2025-08-24 02:52:19.356+05:30	2025-08-23 02:52:19.358884+05:30	2025-08-23 02:52:19.358884+05:30	\N	\N	{}	f	t	f
57c0e273-e448-44a6-819c-3a97b180eac1	550e8400-e29b-41d4-a716-446655440020	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjAiLCJpYXQiOjE3NTU5MjUwOTIsImV4cCI6MTc1NjAxMTQ5MiwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.vCdrWcYw38sON0U9ohlGrL2wjHUTxhby--F7tJMozsA	2025-08-24 10:28:12.37+05:30	2025-08-23 10:28:12.373319+05:30	2025-08-23 10:28:12.373319+05:30	\N	\N	{}	f	t	f
83b9c348-765d-4b81-b3d0-bbeb695329d8	550e8400-e29b-41d4-a716-446655440020	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjAiLCJpYXQiOjE3NTU5MjYzNjcsImV4cCI6MTc1NjAxMjc2NywiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.F4E9VXu6Er6_ia9MI3PaW4DsBxfZBVs138Ac59Tg04Q	2025-08-24 10:49:27.61+05:30	2025-08-23 10:49:27.612932+05:30	2025-08-23 10:49:27.612932+05:30	\N	\N	{}	f	t	f
618fed00-09a6-4c82-bf85-ca04ff511257	550e8400-e29b-41d4-a716-446655440020	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjAiLCJpYXQiOjE3NTU5MzU4ODgsImV4cCI6MTc1NjAyMjI4OCwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.A6noKAANmbCZIF8-cLPTB5CAEebJV-6po-yRD5SOXxU	2025-08-24 13:28:08.329+05:30	2025-08-23 13:28:08.332235+05:30	2025-08-23 13:28:08.332235+05:30	\N	\N	{}	f	t	f
a62aa82b-3b79-42ec-8afe-95359fd23cea	550e8400-e29b-41d4-a716-446655440020	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjAiLCJpYXQiOjE3NTU5NDE5MjcsImV4cCI6MTc1NjAyODMyNywiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.PNdEAl7eUCfYgZRk0F0IqexEZPoWZFF0YHNm8LK1m2Q	2025-08-24 15:08:47.627+05:30	2025-08-23 15:08:47.629849+05:30	2025-08-23 15:08:47.629849+05:30	\N	\N	{}	f	t	f
414b6260-038e-4b1c-8da8-bb4740365d1c	550e8400-e29b-41d4-a716-446655440020	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjAiLCJpYXQiOjE3NTU5NDE5NzIsImV4cCI6MTc1NjAyODM3MiwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.Bmote3LTTmGDuBuY6FjdzaTxaZzYPwCPTz68E9T3xZc	2025-08-24 15:09:32.086+05:30	2025-08-23 15:09:32.088389+05:30	2025-08-23 15:09:32.088389+05:30	\N	\N	{}	f	t	f
6d745ee2-44ab-4f17-ac61-81fe222e992d	550e8400-e29b-41d4-a716-446655440300	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAzMDAiLCJpYXQiOjE3NTU5NDc2MTAsImV4cCI6MTc1NjAzNDAxMCwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.YcwEQ7vOgDujwnCL-zoAotwqgSWFM00C-nhdqFcnTwE	2025-08-24 16:43:30.9+05:30	2025-08-23 16:43:30.902987+05:30	2025-08-23 16:43:30.902987+05:30	\N	\N	{}	f	t	f
06f672da-7ebf-420f-85ce-e66c00b40d1c	550e8400-e29b-41d4-a716-446655440300	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAzMDAiLCJpYXQiOjE3NTU5NTA1OTAsImV4cCI6MTc1NjAzNjk5MCwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.ZoO5bBn5rajwOXSPpcVwZ65PkliSNI5MoQVEi_oaNpY	2025-08-24 17:33:10.071+05:30	2025-08-23 17:33:10.073851+05:30	2025-08-23 17:33:10.073851+05:30	\N	\N	{}	f	t	f
ec15943d-48a9-4b4e-8812-0670b04c7392	550e8400-e29b-41d4-a716-446655440300	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAzMDAiLCJpYXQiOjE3NTU5NTEwNDksImV4cCI6MTc1NjAzNzQ0OSwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.Mn6sr6zoAhPkeXPU3y7sEiaJclFL0aV7gF7O_SPZZPQ	2025-08-24 17:40:49.355+05:30	2025-08-23 17:40:49.357738+05:30	2025-08-23 17:40:49.357738+05:30	\N	\N	{}	f	t	f
8e3d8b3d-a6ac-4db5-aec3-38e2b9b1c48d	550e8400-e29b-41d4-a716-446655440300	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAzMDAiLCJpYXQiOjE3NTU5NTExMDEsImV4cCI6MTc1NjAzNzUwMSwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.fmeEudEx0tZzrYyzZChBfyQ1GI2CBdkhIswdHSaatsQ	2025-08-24 17:41:41.875+05:30	2025-08-23 17:41:41.877748+05:30	2025-08-23 17:41:41.877748+05:30	\N	\N	{}	f	t	f
264905a6-3c17-4327-9ca5-9fbe49fa1860	550e8400-e29b-41d4-a716-446655440020	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjAiLCJpYXQiOjE3NTU5NTMxNDcsImV4cCI6MTc1NjAzOTU0NywiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.ikWog9jNUPgJ82OmOFFOyrAh8tpKpJrWNs8QwgsARLk	2025-08-24 18:15:47.722+05:30	2025-08-23 18:15:47.724247+05:30	2025-08-23 18:15:47.724247+05:30	\N	\N	{}	f	t	f
ee251fa8-38e2-4c70-bc5e-5ff196a94439	550e8400-e29b-41d4-a716-446655440020	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjAiLCJpYXQiOjE3NTU5NTMyMTAsImV4cCI6MTc1NjAzOTYxMCwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.SmeMygC4X3mRbHvFHFBxQD9kSaMf2403xQygt3Kt4DA	2025-08-24 18:16:50.899+05:30	2025-08-23 18:16:50.900847+05:30	2025-08-23 18:16:50.900847+05:30	\N	\N	{}	f	t	f
4e253170-24d9-4f0b-88b2-98f9ce6596cf	550e8400-e29b-41d4-a716-446655440020	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjAiLCJpYXQiOjE3NTU5ODA1ODUsImV4cCI6MTc1NjA2Njk4NSwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.Lm85NBLsgpJ75WSf34bp00PpCcMMmWC57r0ASghtEwY	2025-08-25 01:53:05.716+05:30	2025-08-24 01:53:05.718933+05:30	2025-08-24 01:53:05.718933+05:30	\N	\N	{}	f	t	f
84fe05d5-6de7-425f-bd95-e0eb10c84238	550e8400-e29b-41d4-a716-446655440020	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjAiLCJpYXQiOjE3NTU5ODA2NDgsImV4cCI6MTc1NjA2NzA0OCwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.oO5P26wIK-m5T1uwG_fPebW7u09thnmb_tqUO6vHCgY	2025-08-25 01:54:08.278+05:30	2025-08-24 01:54:08.280689+05:30	2025-08-24 01:54:08.280689+05:30	\N	\N	{}	f	t	f
2fa6d287-f4eb-49a1-a6bb-aaa82f93aaad	550e8400-e29b-41d4-a716-446655440020	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjAiLCJpYXQiOjE3NTU5ODI2MjQsImV4cCI6MTc1NjA2OTAyNCwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.2mVfhQ4I2N-4U-ejJknPfyP6G6akdOQYKzhRlJLnj18	2025-08-25 02:27:04.971+05:30	2025-08-24 02:27:04.97346+05:30	2025-08-24 02:27:04.97346+05:30	\N	\N	{}	f	t	f
07bcacb4-381c-4ad4-b022-ece95e94e90b	550e8400-e29b-41d4-a716-446655440020	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjAiLCJpYXQiOjE3NTYwMDgxNTIsImV4cCI6MTc1NjA5NDU1MiwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.fYr2PZzosCpPgyc-tCgis06fiEbbNiPGkOKWPPzIgrI	2025-08-25 09:32:32.313+05:30	2025-08-24 09:32:32.315751+05:30	2025-08-24 09:32:32.315751+05:30	\N	\N	{}	f	t	f
1e342a88-6bf3-4bc4-ab01-6c34b058a979	550e8400-e29b-41d4-a716-446655440020	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjAiLCJpYXQiOjE3NTYwMTA3MzksImV4cCI6MTc1NjA5NzEzOSwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.wqre0hETJJnPq0ilL8bXS1wf6NKIWSQgz9m3OJBuh0I	2025-08-25 10:15:39.698+05:30	2025-08-24 10:15:39.70093+05:30	2025-08-24 10:15:39.70093+05:30	\N	\N	{}	f	t	f
4dfd87f6-679d-497c-b879-1fc82eee6149	550e8400-e29b-41d4-a716-446655440020	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjAiLCJpYXQiOjE3NTYwMTIwMjcsImV4cCI6MTc1NjA5ODQyNywiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.kQqJnCi98pKaTuW_LC1ZjkwqjRDZYhmWxMOfFno2ycM	2025-08-25 10:37:07.913+05:30	2025-08-24 10:37:07.91519+05:30	2025-08-24 10:37:07.91519+05:30	\N	\N	{}	f	t	f
ad5d3519-5af8-476a-8177-1c4f0f29bc36	550e8400-e29b-41d4-a716-446655440102	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAxMDIiLCJpYXQiOjE3NTYwMTIyNjMsImV4cCI6MTc1NjA5ODY2MywiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.imp0Rwv2d3DLEirtDIQ6ByyRSy3EM61IRNPYvsFpCcY	2025-08-25 10:41:03.067+05:30	2025-08-24 10:41:03.069033+05:30	2025-08-24 10:41:03.069033+05:30	\N	\N	{}	f	t	f
df76f48d-b34f-4a9e-831d-50668cfad05e	550e8400-e29b-41d4-a716-446655440020	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjAiLCJpYXQiOjE3NTYwMTI2OTEsImV4cCI6MTc1NjA5OTA5MSwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.F-pD4QqMJ_MOQBYbdkj9U-K-Y84SbWeZ6tBXeFtv55g	2025-08-25 10:48:11.24+05:30	2025-08-24 10:48:11.241202+05:30	2025-08-24 10:48:11.241202+05:30	\N	\N	{}	f	t	f
a3417188-fddf-4608-a800-7edf7ed41540	550e8400-e29b-41d4-a716-446655440020	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjAiLCJpYXQiOjE3NTYwMjIyNzYsImV4cCI6MTc1NjEwODY3NiwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.r0Y3kEPGDVIKvQQihG30DrZ6hNS5JT8s3ZvRXQsuxPY	2025-08-25 13:27:56.68+05:30	2025-08-24 13:27:56.682116+05:30	2025-08-24 13:27:56.682116+05:30	\N	\N	{}	f	t	f
2fe12d74-42c4-4bbc-84c2-2c111271e18a	550e8400-e29b-41d4-a716-446655440020	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjAiLCJpYXQiOjE3NTYwMjQ5ODQsImV4cCI6MTc1NjExMTM4NCwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.aV6KV-I0XExQtI3wXC4bs9ChsUwchISZttVHC-kjdUo	2025-08-25 14:13:04.882+05:30	2025-08-24 14:13:04.884689+05:30	2025-08-24 14:13:04.884689+05:30	\N	\N	{}	f	t	f
117e3d55-f0d7-495d-83d4-29a9b346f66b	550e8400-e29b-41d4-a716-446655440020	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjAiLCJpYXQiOjE3NTYwMjgxNzYsImV4cCI6MTc1NjExNDU3NiwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.9cRU7T9v3CzrpOsly-X0PArLzswH750bL_FNuvdKmRs	2025-08-25 15:06:16.63+05:30	2025-08-24 15:06:16.632688+05:30	2025-08-24 15:06:16.632688+05:30	\N	\N	{}	f	t	f
1072b326-1af0-40b2-a7cc-b39444041f6e	550e8400-e29b-41d4-a716-446655440020	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjAiLCJpYXQiOjE3NTYwMjgyOTcsImV4cCI6MTc1NjExNDY5NywiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.YJlRpG94rXF7GuDFggKivpgy6qiXHhi2-ntBDsC1jIA	2025-08-25 15:08:17.525+05:30	2025-08-24 15:08:17.527117+05:30	2025-08-24 15:08:17.527117+05:30	\N	\N	{}	f	t	f
198a0b5e-de06-49eb-bb66-ccff42755457	550e8400-e29b-41d4-a716-446655440010	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMTAiLCJpYXQiOjE3NTYwMjgzNjYsImV4cCI6MTc1NjExNDc2NiwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.iUR_HWDFwDNdCuvZNP71ULUFrjkAjrAE3jBR-13Sp3E	2025-08-25 15:09:26.598+05:30	2025-08-24 15:09:26.600104+05:30	2025-08-24 15:09:26.600104+05:30	\N	\N	{}	f	t	f
ea738286-ced2-47ce-98dd-69c8b88629c9	550e8400-e29b-41d4-a716-446655440011	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMTEiLCJpYXQiOjE3NTYwMjg0MDIsImV4cCI6MTc1NjExNDgwMiwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.ErOXTlGCmXRCuH2JXQuem5oZueJPLUL4S2B4cVsZpfY	2025-08-25 15:10:02.507+05:30	2025-08-24 15:10:02.508855+05:30	2025-08-24 15:10:02.508855+05:30	\N	\N	{}	f	t	f
15fdca8b-5b85-4fc4-b19f-8477b7dd0119	550e8400-e29b-41d4-a716-446655440010	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMTAiLCJpYXQiOjE3NTYwMjg2MjYsImV4cCI6MTc1NjExNTAyNiwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.BZkRAvLCPwvSu5754IyN-1VpqOVNa7mJz4VXuMyuw_U	2025-08-25 15:13:46.415+05:30	2025-08-24 15:13:46.416976+05:30	2025-08-24 15:13:46.416976+05:30	\N	\N	{}	f	t	f
11574ea5-ce01-412c-a386-2ed6ba1a6b47	550e8400-e29b-41d4-a716-446655440020	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjAiLCJpYXQiOjE3NTYwMjk1ODcsImV4cCI6MTc1NjExNTk4NywiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.Kdc6UHP8KS4NyzZBrO1ZaD8YlK77OlalxXAvveWlB8Q	2025-08-25 15:29:47.046+05:30	2025-08-24 15:29:47.047304+05:30	2025-08-24 15:29:47.047304+05:30	\N	\N	{}	f	t	f
6a521eb4-d24c-4f77-862c-fb87b29eda42	550e8400-e29b-41d4-a716-446655440020	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjAiLCJpYXQiOjE3NTYwMzExODIsImV4cCI6MTc1NjExNzU4MiwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.WH1srwvBgjujPQyzRRCjH10cU1t9h-NQcmyxx6-5-oE	2025-08-25 15:56:22.763+05:30	2025-08-24 15:56:22.765712+05:30	2025-08-24 15:56:22.765712+05:30	\N	\N	{}	f	t	f
66e2aad9-a143-4d28-abed-514055d46a7b	550e8400-e29b-41d4-a716-446655440020	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjAiLCJpYXQiOjE3NTYwMzI3MzQsImV4cCI6MTc1NjExOTEzNCwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.JTuKPhpqXwoHwfxoEv4TmYcHFo1EMahAOK93oWM48w8	2025-08-25 16:22:14.003+05:30	2025-08-24 16:22:14.00585+05:30	2025-08-24 16:22:14.00585+05:30	\N	\N	{}	f	t	f
f7ae1468-b26e-4936-adaa-64d8bb48e6f3	550e8400-e29b-41d4-a716-446655440020	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjAiLCJpYXQiOjE3NTYwMzI3NTAsImV4cCI6MTc1NjExOTE1MCwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.K9pRKSxAyRiwvOSJZ-VAgB8C1SuGtgmo2KV9qYrLAuU	2025-08-25 16:22:30.666+05:30	2025-08-24 16:22:30.667704+05:30	2025-08-24 16:22:30.667704+05:30	\N	\N	{}	f	t	f
7309bc1a-ee0d-415d-8261-68bd5a73498e	550e8400-e29b-41d4-a716-446655440020	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjAiLCJpYXQiOjE3NTYwMzI4MjcsImV4cCI6MTc1NjExOTIyNywiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.MyQSG-LiKC3bgR-1pne5xK5Gr_93XAjosMtvwPdjsew	2025-08-25 16:23:47.595+05:30	2025-08-24 16:23:47.596894+05:30	2025-08-24 16:23:47.596894+05:30	\N	\N	{}	f	t	f
0c7c3419-265a-4c98-ae95-c787bbb298a2	550e8400-e29b-41d4-a716-446655440020	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjAiLCJpYXQiOjE3NTYwNDA4MDYsImV4cCI6MTc1NjEyNzIwNiwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.8R6dEph8hKcENyR4MWuiC-APNs7V1cgS-sQzKgpp2JU	2025-08-25 18:36:46.126+05:30	2025-08-24 18:36:46.128287+05:30	2025-08-24 18:36:46.128287+05:30	\N	\N	{}	f	t	f
77b85759-c0b6-4966-ba2b-b688dffcad2a	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMmI1YzZhNy03OTA0LTRkMDItYmQxZi1kYjlmZmRhN2E0ZWIiLCJpYXQiOjE3NTYwNDA4NzgsImV4cCI6MTc1NjEyNzI3OCwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.doCRojlHDhET5fahFCiC-I_93dbcECpu_U-XG43-M60	2025-08-25 18:37:58.832+05:30	2025-08-24 18:37:58.833355+05:30	2025-08-24 18:37:58.833355+05:30	\N	\N	{}	f	t	f
55b0b00c-050f-4cc1-8902-082621f2b325	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMmI1YzZhNy03OTA0LTRkMDItYmQxZi1kYjlmZmRhN2E0ZWIiLCJpYXQiOjE3NTYwNDA5NzksImV4cCI6MTc1NjEyNzM3OSwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.Atyx9aKVCps3MvO4N9lek5_CsoE7JB1WMPnADM1NAp4	2025-08-25 18:39:39.047+05:30	2025-08-24 18:39:39.048637+05:30	2025-08-24 18:39:39.048637+05:30	\N	\N	{}	f	t	f
9444a944-c9b5-4658-be74-c6ba42234f25	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMmI1YzZhNy03OTA0LTRkMDItYmQxZi1kYjlmZmRhN2E0ZWIiLCJpYXQiOjE3NTYwNDM2NTYsImV4cCI6MTc1NjEzMDA1NiwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.roJMy1lNc_PEN5UOvBT8jy9RQzMDDibyPqxlXV4TXmE	2025-08-25 19:24:16.207+05:30	2025-08-24 19:24:16.20972+05:30	2025-08-24 19:24:16.20972+05:30	\N	\N	{}	f	t	f
d81aa8db-f93e-4451-af7c-60cebcf5250c	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMmI1YzZhNy03OTA0LTRkMDItYmQxZi1kYjlmZmRhN2E0ZWIiLCJpYXQiOjE3NTYwNDQ3OTUsImV4cCI6MTc1NjEzMTE5NSwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.jXgh1YEjyQrAy8rSBEyviUoYqtDVvbX5rZqVgVMFuLs	2025-08-25 19:43:15.965+05:30	2025-08-24 19:43:15.967404+05:30	2025-08-24 19:43:15.967404+05:30	\N	\N	{}	f	t	f
5fec4e7b-914c-4876-9385-63eb1b2a5777	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMmI1YzZhNy03OTA0LTRkMDItYmQxZi1kYjlmZmRhN2E0ZWIiLCJpYXQiOjE3NTYwNDU4ODEsImV4cCI6MTc1NjEzMjI4MSwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.95DNKBrL-bX0tuOcgx4Odk-wFws9i7PpRTSQIMBLf5Q	2025-08-25 20:01:21.101+05:30	2025-08-24 20:01:21.103169+05:30	2025-08-24 20:01:21.103169+05:30	\N	\N	{}	f	t	f
99d49be2-ad63-42d6-a247-0820edfdc717	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	99d49be2-ad63-42d6-a247-0820edfdc717	2025-09-18 16:58:52.491+05:30	2025-09-17 16:58:52.491+05:30	2025-09-17 17:02:44.835048+05:30	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	::1	{}	f	t	f
e0f7f862-bdff-49f2-87b8-d23e547ff974	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMmI1YzZhNy03OTA0LTRkMDItYmQxZi1kYjlmZmRhN2E0ZWIiLCJpYXQiOjE3NTYwNDYwMzgsImV4cCI6MTc1NjEzMjQzOCwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.NxYhdU_0S5aacU8li8G73BY63TeQQNhAfMeRwo-x9MM	2025-08-25 20:03:58.469+05:30	2025-08-24 20:03:58.471491+05:30	2025-08-24 20:03:58.471491+05:30	\N	\N	{}	f	t	f
8c84b613-1e23-4fd9-9a18-48f97dadee21	550e8400-e29b-41d4-a716-446655440020	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjAiLCJpYXQiOjE3NTYwNDY2MDMsImV4cCI6MTc1NjEzMzAwMywiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.I8ymeCkfyYgchVI9JAi-sW6T9WajryCS-lP9ILYXzSA	2025-08-25 20:13:23.118+05:30	2025-08-24 20:13:23.120855+05:30	2025-08-24 20:13:23.120855+05:30	\N	\N	{}	f	t	f
ee54e910-8d52-46e1-b17d-a37cf1a054da	550e8400-e29b-41d4-a716-446655440011	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMTEiLCJpYXQiOjE3NTYwNDgzNzksImV4cCI6MTc1NjEzNDc3OSwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.7FOMxuiU3jOIcQtoVohBgIGE-301gmcQVoWCMXgU4SM	2025-08-25 20:42:59.858+05:30	2025-08-24 20:42:59.861069+05:30	2025-08-24 20:42:59.861069+05:30	\N	\N	{}	f	t	f
064fe241-a42d-4929-86d8-a9bc1f06af6f	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMmI1YzZhNy03OTA0LTRkMDItYmQxZi1kYjlmZmRhN2E0ZWIiLCJpYXQiOjE3NTYwNDg0ODIsImV4cCI6MTc1NjEzNDg4MiwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.IwjTHNgBfzNGl1KIr1mLGPC7cx1w7XSdYkh5hNRrIP8	2025-08-25 20:44:42.366+05:30	2025-08-24 20:44:42.367905+05:30	2025-08-24 20:44:42.367905+05:30	\N	\N	{}	f	t	f
0d2e0f87-8dca-4a66-899f-afb7cce5a8e1	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMmI1YzZhNy03OTA0LTRkMDItYmQxZi1kYjlmZmRhN2E0ZWIiLCJpYXQiOjE3NTYwNTA0MjEsImV4cCI6MTc1NjEzNjgyMSwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.Gn55uq3KK594_auNgMKm31kQ6Ov7Xgm0g39aZ3JEQn4	2025-08-25 21:17:01.351+05:30	2025-08-24 21:17:01.353077+05:30	2025-08-24 21:17:01.353077+05:30	\N	\N	{}	f	t	f
74b42ab0-2fe4-44d6-b1e0-7b7770473c27	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMmI1YzZhNy03OTA0LTRkMDItYmQxZi1kYjlmZmRhN2E0ZWIiLCJpYXQiOjE3NTYwNTExODMsImV4cCI6MTc1NjEzNzU4MywiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.blaAykxyn_mOBUVGzf7VtQ_Y0r2e0RjbdWBguXnu06s	2025-08-25 21:29:43.568+05:30	2025-08-24 21:29:43.570699+05:30	2025-08-24 21:29:43.570699+05:30	\N	\N	{}	f	t	f
09332dc5-5fa9-404f-9da9-d305ccb47cbe	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMmI1YzZhNy03OTA0LTRkMDItYmQxZi1kYjlmZmRhN2E0ZWIiLCJpYXQiOjE3NTYwNTI1MzEsImV4cCI6MTc1NjEzODkzMSwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.lc9xT6z5exwghvbjGbtdyMHRY0HG76ergnAah7LTMHA	2025-08-25 21:52:11.978+05:30	2025-08-24 21:52:11.981351+05:30	2025-08-24 21:52:11.981351+05:30	\N	\N	{}	f	t	f
f7b56342-ef88-4621-a1f4-ccacd8aa11ee	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMmI1YzZhNy03OTA0LTRkMDItYmQxZi1kYjlmZmRhN2E0ZWIiLCJpYXQiOjE3NTYwNTI1OTcsImV4cCI6MTc1NjEzODk5NywiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.wwczwjo6rYr2-aVa5inaz-QAZiP1HBA-EpOotmVbnzM	2025-08-25 21:53:17.235+05:30	2025-08-24 21:53:17.238257+05:30	2025-08-24 21:53:17.238257+05:30	\N	\N	{}	f	t	f
eb37de57-4cf3-48c0-a89e-c296901713db	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMmI1YzZhNy03OTA0LTRkMDItYmQxZi1kYjlmZmRhN2E0ZWIiLCJpYXQiOjE3NTYxMDY0MTIsImV4cCI6MTc1NjE5MjgxMiwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.WxUthGcliN_vAlFpQXE0INtRa3gmBNlLs152OY_kdbQ	2025-08-26 12:50:12.102+05:30	2025-08-25 12:50:12.104327+05:30	2025-08-25 12:50:12.104327+05:30	\N	\N	{}	f	t	f
e56203bd-6212-4dc0-b98f-262afbe13535	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMmI1YzZhNy03OTA0LTRkMDItYmQxZi1kYjlmZmRhN2E0ZWIiLCJpYXQiOjE3NTYxMDc1NTEsImV4cCI6MTc1NjE5Mzk1MSwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.Z7IZbwJ_uoQbx6teE4eoGDi6iejB1EnjcABeK51ehhw	2025-08-26 13:09:11.89+05:30	2025-08-25 13:09:11.892588+05:30	2025-08-25 13:09:11.892588+05:30	\N	\N	{}	f	t	f
3c4e5c45-2633-40ec-9697-84ccf388e476	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMmI1YzZhNy03OTA0LTRkMDItYmQxZi1kYjlmZmRhN2E0ZWIiLCJpYXQiOjE3NTYxNTU0MTcsImV4cCI6MTc1NjI0MTgxNywiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.P-JAB50ESRXTFWmIVHCNgIHS96A7ds4DU_PpDYKkZgk	2025-08-27 02:26:57.176+05:30	2025-08-26 02:26:57.179018+05:30	2025-08-26 02:26:57.179018+05:30	\N	\N	{}	f	t	f
243f5abf-710d-4149-914e-94e70db2f52d	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMmI1YzZhNy03OTA0LTRkMDItYmQxZi1kYjlmZmRhN2E0ZWIiLCJpYXQiOjE3NTYxODU1ODQsImV4cCI6MTc1NjI3MTk4NCwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.LwFrr0n9pHnTBNhCspHRf4PV6cgPYfsUyoHOCnl0nnU	2025-08-27 10:49:44.702+05:30	2025-08-26 10:49:44.708517+05:30	2025-08-26 10:49:44.708517+05:30	\N	\N	{}	f	t	f
6d2b895f-c56d-479c-8330-5a4588c8795d	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	zenith_1756191023669_84z3se6tohi	2025-08-27 12:20:23.669+05:30	2025-08-26 12:20:23.670283+05:30	2025-08-26 12:20:23.670283+05:30	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	::1	{}	f	t	f
01ed419d-a354-43a4-a8cd-7ee149c0afc8	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMmI1YzZhNy03OTA0LTRkMDItYmQxZi1kYjlmZmRhN2E0ZWIiLCJpYXQiOjE3NTYxOTEwNTcsImV4cCI6MTc1NjI3NzQ1NywiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.a42Zw30DxB6lH2pz76ySgHg6sDiv7df3_Juv8OHKNJw	2025-08-27 12:20:57.28+05:30	2025-08-26 12:20:57.281829+05:30	2025-08-26 12:20:57.281829+05:30	\N	\N	{}	f	t	f
008281a6-9784-40d2-bbc1-176b84642c3c	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	zenith_1756191070567_f7jez9l9kd	2025-09-02 12:21:10.567+05:30	2025-08-26 12:21:10.567515+05:30	2025-08-26 12:21:10.567515+05:30	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	::1	{}	f	t	f
64cf6f2f-4280-45b4-b041-ad539aa0ad84	1d5b1108-eb4c-4191-ae75-751e3610d519	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxZDViMTEwOC1lYjRjLTQxOTEtYWU3NS03NTFlMzYxMGQ1MTkiLCJpYXQiOjE3NTYzMjAwOTksImV4cCI6MTc1NjQwNjQ5OSwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.DK5Axiqwmjpkki0U6kJkwZixyir9cDnLEcw252yTCRA	2025-08-29 00:11:39.748+05:30	2025-08-28 00:11:39.751213+05:30	2025-08-28 00:11:39.751213+05:30	\N	\N	{}	f	t	f
0269da20-8d9d-493f-a61e-be2f42f1c9b1	1d5b1108-eb4c-4191-ae75-751e3610d519	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxZDViMTEwOC1lYjRjLTQxOTEtYWU3NS03NTFlMzYxMGQ1MTkiLCJpYXQiOjE3NTYzMjAxMzgsImV4cCI6MTc1NjQwNjUzOCwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.7iZdG3S-6_3QJQXJCdNoSKS0i129OwD3753fcnyyUzg	2025-08-29 00:12:18.119+05:30	2025-08-28 00:12:18.120539+05:30	2025-08-28 00:12:18.120539+05:30	\N	\N	{}	f	t	f
2166cd99-9fe3-4515-a3fc-f0f2b4534937	1d5b1108-eb4c-4191-ae75-751e3610d519	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxZDViMTEwOC1lYjRjLTQxOTEtYWU3NS03NTFlMzYxMGQ1MTkiLCJpYXQiOjE3NTYzMjAyMjcsImV4cCI6MTc1NjQwNjYyNywiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.FcpyHdPjPXQ6WPKX4fJBTbdCIa68z1c2D81BDqUd_9k	2025-08-29 00:13:47.838+05:30	2025-08-28 00:13:47.840472+05:30	2025-08-28 00:13:47.840472+05:30	\N	\N	{}	f	t	f
6f11a223-8351-43eb-bcba-9c83100fefb2	1d5b1108-eb4c-4191-ae75-751e3610d519	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxZDViMTEwOC1lYjRjLTQxOTEtYWU3NS03NTFlMzYxMGQ1MTkiLCJpYXQiOjE3NTYzMjI4OTcsImV4cCI6MTc1NjQwOTI5NywiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.Dj98rkzwOzUHPLoUYxYQdNufiB0-3ZTj-wQ8Tq0jRks	2025-08-29 00:58:17.874+05:30	2025-08-28 00:58:17.876706+05:30	2025-08-28 00:58:17.876706+05:30	\N	\N	{}	f	t	f
887767fc-fd45-42e9-b81d-6562e82a2c97	e4a347e9-92ea-4d76-8cb0-c59918f0f58c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlNGEzNDdlOS05MmVhLTRkNzYtOGNiMC1jNTk5MThmMGY1OGMiLCJub25jZSI6ImJjYTM3OWJjNGZlZTAxZTAwYThmMmJmNjQ4NzQ0ZTk5IiwiaWF0IjoxNzU2MzYzMTY0LCJqdGkiOiI0ZWU1ODJiNS0yMDllLTRmOTItYTNlOS00M2Y2ZTNiNmViZjMiLCJleHAiOjE3NTY0NDk1NjQsImF1ZCI6Inplbml0aC11c2VycyIsImlzcyI6Inplbml0aC1hdXRoIn0.4wEld-cJvgaVVFarwiN5lC5dm-hfKGGqvT1k_LUDwn4	2025-08-29 12:09:24.258+05:30	2025-08-28 12:09:24.260683+05:30	2025-08-28 12:09:24.260683+05:30	\N	\N	{}	f	t	f
9385a833-ba77-4244-934c-1b320ddb15be	1d5b1108-eb4c-4191-ae75-751e3610d519	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxZDViMTEwOC1lYjRjLTQxOTEtYWU3NS03NTFlMzYxMGQ1MTkiLCJub25jZSI6IjE2MWM0NzVjZjM2MTUxZDZlNjhiYjFkODk2ODM3ZjEzIiwiaWF0IjoxNzU2MzY2MDY2LCJqdGkiOiI5MjY1NWQ5OS04MmU5LTQzMWYtYjMxOS01NjMyMDUwZDNkMWQiLCJleHAiOjE3NTY0NTI0NjYsImF1ZCI6Inplbml0aC11c2VycyIsImlzcyI6Inplbml0aC1hdXRoIn0.dUXOuwat9ZHDJ-Nkg_bn8ilmvUQ3gGNp87W90b4qYco	2025-08-29 12:57:46.606+05:30	2025-08-28 12:57:46.608828+05:30	2025-08-28 12:57:46.608828+05:30	\N	\N	{}	f	t	f
935b90df-0fa0-44e6-b6e3-710d1d18cf20	e4a347e9-92ea-4d76-8cb0-c59918f0f58c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlNGEzNDdlOS05MmVhLTRkNzYtOGNiMC1jNTk5MThmMGY1OGMiLCJub25jZSI6IjAxOWNjNTE3MWUzNWQzYzQ2OTZhNTljMTZiNmMxOGU3IiwiaWF0IjoxNzU2MzY2MTEyLCJqdGkiOiJjYjM4ZjAwYi1lMzBhLTRmNDQtYWM4Yi0yMGRmZGRhOWQyNjkiLCJleHAiOjE3NTY0NTI1MTIsImF1ZCI6Inplbml0aC11c2VycyIsImlzcyI6Inplbml0aC1hdXRoIn0.ls7NIBsGCgTomUTyJM74iGY11hP2EEPOTSHQ8q0snqE	2025-08-29 12:58:32.43+05:30	2025-08-28 12:58:32.431602+05:30	2025-08-28 12:58:32.431602+05:30	\N	\N	{}	f	t	f
18a1e5d1-adaa-4fc4-a63c-4f4f10006caa	1d5b1108-eb4c-4191-ae75-751e3610d519	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxZDViMTEwOC1lYjRjLTQxOTEtYWU3NS03NTFlMzYxMGQ1MTkiLCJub25jZSI6ImY3OWUzMzRmYzMwODhhNzRhMTUxMDRiNzE5Yjg2OTIxIiwiaWF0IjoxNzU2MzY2MTMzLCJqdGkiOiIyYWVhMDY3Yi03YWZlLTRmYjktYjhmNS03ZjdhMWU0MzFkMWIiLCJleHAiOjE3NTY0NTI1MzMsImF1ZCI6Inplbml0aC11c2VycyIsImlzcyI6Inplbml0aC1hdXRoIn0.gIcKfcVWfAkCCej8BM08AA3cD2KnqimFt2jDhSngTow	2025-08-29 12:58:53.749+05:30	2025-08-28 12:58:53.750863+05:30	2025-08-28 12:58:53.750863+05:30	\N	\N	{}	f	t	f
4a9a5aeb-6154-465d-ba6b-f3c74fbe97d2	e4a347e9-92ea-4d76-8cb0-c59918f0f58c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlNGEzNDdlOS05MmVhLTRkNzYtOGNiMC1jNTk5MThmMGY1OGMiLCJub25jZSI6IjFkZDljZWMwMjczZGEyOWNiYjcwZWVmMWI5MjhiM2EwIiwiaWF0IjoxNzU2MzY2MjcwLCJqdGkiOiJiNDczNWJjYy0xYWM1LTQ0NDktODZhMC01OWJkYjgxZTZlNmEiLCJleHAiOjE3NTY0NTI2NzAsImF1ZCI6Inplbml0aC11c2VycyIsImlzcyI6Inplbml0aC1hdXRoIn0.83cfR1FxlPmlfC0JDFcqxZ--pOmBLrTRHYshAOoUKVg	2025-08-29 13:01:10.111+05:30	2025-08-28 13:01:10.113162+05:30	2025-08-28 13:01:10.113162+05:30	\N	\N	{}	f	t	f
a4024044-7e7b-44b4-929e-ea28910dcccb	e4a347e9-92ea-4d76-8cb0-c59918f0f58c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlNGEzNDdlOS05MmVhLTRkNzYtOGNiMC1jNTk5MThmMGY1OGMiLCJub25jZSI6IjZhMjNmZjhiZDU3MjFhOTJlY2YwODYyOTY2Mjg5N2VlIiwiaWF0IjoxNzU2MzY3NTc5LCJqdGkiOiIxOTZiMzM2MC1lZjg5LTQyNTktYjdkNi1iNjA2MzIxMTc3MzUiLCJleHAiOjE3NTY0NTM5NzksImF1ZCI6Inplbml0aC11c2VycyIsImlzcyI6Inplbml0aC1hdXRoIn0.OJKdP6nHEOuAjQ8fDQPkx3lteUu9tnVADtGvrkUkYYM	2025-08-29 13:22:59.942+05:30	2025-08-28 13:22:59.944014+05:30	2025-08-28 13:22:59.944014+05:30	\N	\N	{}	f	t	f
471da3e1-6a5c-47cd-b749-86371f95b8bd	e4a347e9-92ea-4d76-8cb0-c59918f0f58c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlNGEzNDdlOS05MmVhLTRkNzYtOGNiMC1jNTk5MThmMGY1OGMiLCJub25jZSI6ImI4YjdkNGI1ZGUyYTkxNzI3MGRiNjI5NjI3MzM4M2M5IiwiaWF0IjoxNzU2MzY3NjEwLCJqdGkiOiIzNmI3MTIzOS1lYjE1LTRkNDUtYmFiMS0xN2Q5OTIwMmE1YTciLCJleHAiOjE3NTY0NTQwMTAsImF1ZCI6Inplbml0aC11c2VycyIsImlzcyI6Inplbml0aC1hdXRoIn0.NMlDcs16lmW83hQ-NGY0cZv16RzkbsMZbyxUwPoixqE	2025-08-29 13:23:30.105+05:30	2025-08-28 13:23:30.106147+05:30	2025-08-28 13:23:30.106147+05:30	\N	\N	{}	f	t	f
6afe2a20-4ecc-4be4-b85c-935e9d3e6665	e4a347e9-92ea-4d76-8cb0-c59918f0f58c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlNGEzNDdlOS05MmVhLTRkNzYtOGNiMC1jNTk5MThmMGY1OGMiLCJub25jZSI6ImRlMGRmYTNiNzE4MjI1YmZlMTUzMmQ3YWU1MTQ3OGEzIiwiaWF0IjoxNzU2MzY3NjI3LCJqdGkiOiI1ZjMwNDc3My0yZTNjLTQxMjItYWQ2NC00Yzk2OWY1NGIyMTkiLCJleHAiOjE3NTY0NTQwMjcsImF1ZCI6Inplbml0aC11c2VycyIsImlzcyI6Inplbml0aC1hdXRoIn0.DdJF4wCWHglwRmjhsl3_fROWx4N0u69eCs3gkXUqQ9I	2025-08-29 13:23:47.619+05:30	2025-08-28 13:23:47.620575+05:30	2025-08-28 13:23:47.620575+05:30	\N	\N	{}	f	t	f
24ce488b-3ec5-4951-8e94-df8610837dca	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyMWE5NWVmYS1jY2ZhLTRjNGMtYWY3Zi01MGNmYTBhMzUwNTMiLCJpYXQiOjE3NTY0MDczMjUsImV4cCI6MTc1NjQ5MzcyNSwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.FXF3ZgEYQ3x1UJl5W8CwL4te37gTNO5tLIR7yD9Czjo	2025-08-30 00:25:25.286+05:30	2025-08-29 00:25:25.288166+05:30	2025-08-29 00:25:25.288166+05:30	\N	\N	{}	f	t	f
3864f4a3-bd35-4e6a-a524-25e4dd2d6e84	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyMWE5NWVmYS1jY2ZhLTRjNGMtYWY3Zi01MGNmYTBhMzUwNTMiLCJpYXQiOjE3NTY0MDczNTMsImV4cCI6MTc1NjQ5Mzc1MywiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.HV8WMO4OazVHAxijzjMaf_GJ1PYoDUt5ClttLEbV4TU	2025-08-30 00:25:53.575+05:30	2025-08-29 00:25:53.576741+05:30	2025-08-29 00:25:53.576741+05:30	\N	\N	{}	f	t	f
7ef4fd40-a025-4dfa-8269-4db3389f20a6	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyMWE5NWVmYS1jY2ZhLTRjNGMtYWY3Zi01MGNmYTBhMzUwNTMiLCJpYXQiOjE3NTY0MDc4NjAsImV4cCI6MTc1NjQ5NDI2MCwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.xWdGvV5Um2oCyZ6AjTjSPc03TN78C3rCV8ivoEIfnLU	2025-08-30 00:34:20.053+05:30	2025-08-29 00:34:20.055529+05:30	2025-08-29 00:34:20.055529+05:30	\N	\N	{}	f	t	f
8784f36b-2d85-48cb-a915-2828b9385c18	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyMWE5NWVmYS1jY2ZhLTRjNGMtYWY3Zi01MGNmYTBhMzUwNTMiLCJpYXQiOjE3NTY0MTE3MDQsImV4cCI6MTc1NjQ5ODEwNCwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.wBDy2yu-1BgR-asx1m9g3prr12zNK8u65ImZWbj4lhU	2025-08-30 01:38:24.724+05:30	2025-08-29 01:38:24.727245+05:30	2025-08-29 01:38:24.727245+05:30	\N	\N	{}	f	t	f
bca6f826-1603-48df-9b5b-70c924fd910b	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	bca6f826-1603-48df-9b5b-70c924fd910b	2025-08-30 02:02:44.075+05:30	2025-08-29 02:02:44.076+05:30	2025-08-29 02:02:44.076+05:30	\N	\N	{}	f	t	f
d736be50-cec9-4758-85cb-9e28a9db137d	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	d736be50-cec9-4758-85cb-9e28a9db137d	2025-09-28 02:02:54.759+05:30	2025-08-29 02:02:54.759+05:30	2025-08-29 02:02:54.759+05:30	\N	\N	{}	f	t	f
5fd1464e-43fa-444c-a4d3-4733280307f8	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	5fd1464e-43fa-444c-a4d3-4733280307f8	2025-09-28 02:02:54.759+05:30	2025-08-29 02:02:54.759+05:30	2025-08-29 02:02:54.759+05:30	\N	\N	{}	f	t	f
e064da43-b1b0-4080-ba9b-91281087747b	550e8400-e29b-41d4-a716-446655440010	e064da43-b1b0-4080-ba9b-91281087747b	2025-09-11 11:27:40.88+05:30	2025-09-10 11:27:40.88+05:30	2025-09-10 11:27:40.88+05:30	\N	\N	{}	f	t	f
722e5e34-359a-4937-b16b-26da100219cc	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	722e5e34-359a-4937-b16b-26da100219cc	2025-09-11 11:28:04.855+05:30	2025-09-10 11:28:04.855+05:30	2025-09-10 11:28:04.855+05:30	\N	\N	{}	f	t	f
8738d1db-dc47-45cc-b1a2-966210ea4654	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	8738d1db-dc47-45cc-b1a2-966210ea4654	2025-09-17 21:27:30.168+05:30	2025-09-16 21:27:30.169+05:30	2025-09-16 21:27:30.169+05:30	\N	\N	{}	f	t	f
fd95ef5a-1a77-4384-bf1e-cf422ccc3652	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	fd95ef5a-1a77-4384-bf1e-cf422ccc3652	2025-09-17 21:52:43.682+05:30	2025-09-16 21:52:43.682+05:30	2025-09-16 21:52:43.682+05:30	\N	\N	{}	f	t	f
1e8cd01a-965b-4c54-9473-2b930db63778	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	1e8cd01a-965b-4c54-9473-2b930db63778	2025-09-17 21:52:59.983+05:30	2025-09-16 21:52:59.983+05:30	2025-09-16 21:52:59.983+05:30	\N	\N	{}	f	t	f
8f6085c0-8ba5-4835-971e-9250502782ae	1fab52fa-9bb2-4ea4-8cc4-4d9450a7349f	8f6085c0-8ba5-4835-971e-9250502782ae	2025-10-16 21:58:21.598+05:30	2025-09-16 21:58:21.598+05:30	2025-09-16 21:58:21.598+05:30	\N	\N	{}	f	t	f
8584dbe9-5cb8-4bba-9825-7258ad1769b7	1fab52fa-9bb2-4ea4-8cc4-4d9450a7349f	8584dbe9-5cb8-4bba-9825-7258ad1769b7	2025-10-16 22:02:11.362+05:30	2025-09-16 22:02:11.362+05:30	2025-09-16 22:02:11.362+05:30	\N	\N	{}	f	t	f
e5ca23f8-c7e1-4e9f-97f3-d9cb4ec644b0	1fab52fa-9bb2-4ea4-8cc4-4d9450a7349f	e5ca23f8-c7e1-4e9f-97f3-d9cb4ec644b0	2025-10-16 22:02:57.528+05:30	2025-09-16 22:02:57.528+05:30	2025-09-16 22:02:57.528+05:30	\N	\N	{}	f	t	f
ad462d46-16c4-4fd1-b8aa-1a879de07946	1fab52fa-9bb2-4ea4-8cc4-4d9450a7349f	ad462d46-16c4-4fd1-b8aa-1a879de07946	2025-10-16 22:03:46.355+05:30	2025-09-16 22:03:46.355+05:30	2025-09-16 22:03:46.355+05:30	\N	\N	{}	f	t	f
cb587d42-90f3-4608-a25d-21e2dc118d7a	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	cb587d42-90f3-4608-a25d-21e2dc118d7a	2025-09-17 22:06:48.056+05:30	2025-09-16 22:06:48.056+05:30	2025-09-16 22:06:48.056+05:30	\N	\N	{}	f	t	f
f0baf202-9fd6-4adf-8a51-ca54e009f149	550e8400-e29b-41d4-a716-446655440000	f0baf202-9fd6-4adf-8a51-ca54e009f149	2025-10-16 22:07:09.69+05:30	2025-09-16 22:07:09.69+05:30	2025-09-16 22:07:09.69+05:30	\N	\N	{}	f	t	f
aa15377d-ab52-48d7-8344-ebcc91d16028	550e8400-e29b-41d4-a716-446655440000	aa15377d-ab52-48d7-8344-ebcc91d16028	2025-09-17 22:12:14.51+05:30	2025-09-16 22:12:14.51+05:30	2025-09-16 22:12:14.51+05:30	\N	\N	{}	f	t	f
20faea29-d565-402a-b8d6-3c320405e978	550e8400-e29b-41d4-a716-446655440000	20faea29-d565-402a-b8d6-3c320405e978	2025-09-17 22:12:50.661+05:30	2025-09-16 22:12:50.661+05:30	2025-09-16 22:12:50.661+05:30	\N	\N	{}	f	t	f
ffbb65ae-919e-4f89-b0b8-19b538b6d5dc	550e8400-e29b-41d4-a716-446655440000	ffbb65ae-919e-4f89-b0b8-19b538b6d5dc	2025-09-17 22:13:27.63+05:30	2025-09-16 22:13:27.63+05:30	2025-09-16 22:13:27.63+05:30	\N	\N	{}	f	t	f
6dd82376-61da-43cd-8636-8707d59ed5ae	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	6dd82376-61da-43cd-8636-8707d59ed5ae	2025-09-17 22:16:08.924+05:30	2025-09-16 22:16:08.924+05:30	2025-09-16 22:16:08.924+05:30	\N	\N	{}	f	t	f
e52cf2c7-9370-4ffa-a073-7d22b702ba0c	550e8400-e29b-41d4-a716-446655440020	e52cf2c7-9370-4ffa-a073-7d22b702ba0c	2025-09-17 22:17:16.14+05:30	2025-09-16 22:17:16.14+05:30	2025-09-16 22:17:16.14+05:30	\N	\N	{}	f	t	f
e952e746-4de1-4ac6-b7f8-b3b37ee13165	550e8400-e29b-41d4-a716-446655440020	e952e746-4de1-4ac6-b7f8-b3b37ee13165	2025-09-17 22:18:22.716+05:30	2025-09-16 22:18:22.716+05:30	2025-09-16 22:18:22.716+05:30	\N	\N	{}	f	t	f
11b851cf-b022-46fa-b9f7-0fa6e9028507	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	11b851cf-b022-46fa-b9f7-0fa6e9028507	2025-09-17 23:55:02.577+05:30	2025-09-16 23:55:02.578+05:30	2025-09-16 23:55:02.578+05:30	\N	\N	{}	f	t	f
94117071-64db-4b76-b1ae-bce2597c79d9	550e8400-e29b-41d4-a716-446655440020	94117071-64db-4b76-b1ae-bce2597c79d9	2025-09-17 23:57:48.699+05:30	2025-09-16 23:57:48.699+05:30	2025-09-16 23:57:48.699+05:30	\N	\N	{}	f	t	f
4d2517ec-971c-4e8d-bbd0-afaee63be83a	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	4d2517ec-971c-4e8d-bbd0-afaee63be83a	2025-09-17 23:59:13.355+05:30	2025-09-16 23:59:13.355+05:30	2025-09-16 23:59:13.355+05:30	\N	\N	{}	f	t	f
ba6c8c73-a351-4f4f-b681-6eda4394d5b3	550e8400-e29b-41d4-a716-446655440020	ba6c8c73-a351-4f4f-b681-6eda4394d5b3	2025-09-18 00:23:29.9+05:30	2025-09-17 00:23:29.9+05:30	2025-09-17 00:23:29.9+05:30	\N	\N	{}	f	t	f
59856087-9a0f-46fe-a13f-daa1d348c777	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	59856087-9a0f-46fe-a13f-daa1d348c777	2025-09-18 00:27:09.832+05:30	2025-09-17 00:27:09.832+05:30	2025-09-17 00:27:09.832+05:30	\N	\N	{}	f	t	f
5296eb1e-b406-4d36-a6b9-3931e570e4ef	550e8400-e29b-41d4-a716-446655440020	5296eb1e-b406-4d36-a6b9-3931e570e4ef	2025-09-18 11:16:39.743+05:30	2025-09-17 11:16:39.743+05:30	2025-09-17 11:16:39.743+05:30	\N	\N	{}	f	t	f
b06bf8f0-0906-4742-bfcf-3d4d7ca06c2e	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	b06bf8f0-0906-4742-bfcf-3d4d7ca06c2e	2025-09-18 11:54:37.709+05:30	2025-09-17 11:54:37.709+05:30	2025-09-17 11:54:37.709+05:30	\N	\N	{}	f	t	f
f7c80290-4d92-40e1-b804-111c280a54ec	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	f7c80290-4d92-40e1-b804-111c280a54ec	2025-09-18 12:46:20.415+05:30	2025-09-17 12:46:20.416+05:30	2025-09-17 20:32:56.523886+05:30	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	::1	{}	f	t	f
0693e1a3-9059-4eca-bd11-8bc62901e8e8	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	0693e1a3-9059-4eca-bd11-8bc62901e8e8	2025-09-18 21:02:11.152+05:30	2025-09-17 21:02:11.152+05:30	2025-09-18 09:54:26.504316+05:30	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	::1	{}	f	t	f
dbb8e6a3-15cb-4ebf-b411-140f5066e718	550e8400-e29b-41d4-a716-446655440000	dbb8e6a3-15cb-4ebf-b411-140f5066e718	2025-09-19 10:05:56.713+05:30	2025-09-18 10:05:56.713+05:30	2025-09-18 10:39:38.587219+05:30	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	::1	{}	f	t	f
8222163e-8b97-4098-9156-9e79a031b239	550e8400-e29b-41d4-a716-446655440000	8222163e-8b97-4098-9156-9e79a031b239	2025-09-19 11:15:09.578+05:30	2025-09-18 11:15:09.578+05:30	2025-09-18 12:28:09.495101+05:30	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	::1	{}	f	t	f
\.


--
-- TOC entry 4430 (class 0 OID 19572)
-- Dependencies: 268
-- Data for Name: submission_attachments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.submission_attachments (id, submission_id, media_file_id, file_name, file_type, file_size, uploaded_at, created_at) FROM stdin;
\.


--
-- TOC entry 4418 (class 0 OID 18350)
-- Dependencies: 256
-- Data for Name: system_statistics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_statistics (id, active_users_count, total_users_count, total_clubs_count, total_events_count, total_assignments_count, total_comments_count, daily_active_users, weekly_active_users, monthly_active_users, "timestamp") FROM stdin;
\.


--
-- TOC entry 4428 (class 0 OID 19546)
-- Dependencies: 266
-- Data for Name: task_activity; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_activity (id, task_id, user_id, action, field_changed, old_value, new_value, comment, created_at) FROM stdin;
b08a0eba-31b4-4af4-8ac4-2163de5d1e7a	199bf0e2-7d8e-4968-b769-cf6e8a21619b	550e8400-e29b-41d4-a716-446655440020	created	\N	\N	\N	Created task: first	2025-08-24 01:54:45.570071+05:30
268fa723-82a3-48c1-b099-fd5f34204520	199bf0e2-7d8e-4968-b769-cf6e8a21619b	550e8400-e29b-41d4-a716-446655440020	status_changed	status	todo	in_progress	\N	2025-08-24 01:55:10.640085+05:30
a47b7ce4-9435-407b-803c-09628bb1c003	199bf0e2-7d8e-4968-b769-cf6e8a21619b	550e8400-e29b-41d4-a716-446655440020	status_changed	status	in_progress	in_review	\N	2025-08-24 01:56:06.584662+05:30
3e227075-b2b0-47a4-b253-8adac14eb8a0	199bf0e2-7d8e-4968-b769-cf6e8a21619b	550e8400-e29b-41d4-a716-446655440020	status_changed	status	in_review	in_progress	\N	2025-08-24 02:02:36.815961+05:30
b833bd47-8fa6-47c8-b6fe-78a8bb6f2411	199bf0e2-7d8e-4968-b769-cf6e8a21619b	550e8400-e29b-41d4-a716-446655440020	status_changed	status	in_progress	todo	\N	2025-08-24 02:02:39.848013+05:30
f88d6c52-6fe8-43fc-a63d-df0c9ee043ac	199bf0e2-7d8e-4968-b769-cf6e8a21619b	550e8400-e29b-41d4-a716-446655440020	status_changed	status	todo	in_progress	\N	2025-08-24 02:03:01.39246+05:30
0979951c-4408-4ee7-8c38-e1f5cf106bd7	199bf0e2-7d8e-4968-b769-cf6e8a21619b	550e8400-e29b-41d4-a716-446655440020	status_changed	status	in_progress	done	\N	2025-08-24 02:03:10.659166+05:30
458be13d-9e77-469a-a567-9e456686bee8	199bf0e2-7d8e-4968-b769-cf6e8a21619b	550e8400-e29b-41d4-a716-446655440020	status_changed	status	done	in_review	\N	2025-08-24 02:21:49.405798+05:30
e9fc48a7-af00-4de5-839b-33e136a7198a	199bf0e2-7d8e-4968-b769-cf6e8a21619b	550e8400-e29b-41d4-a716-446655440020	status_changed	status	in_review	done	\N	2025-08-24 02:21:50.195237+05:30
a5eb7265-2130-439e-ac2c-6aeefd402f4d	96808225-b8ac-4a08-b995-1fa2523b9dc6	550e8400-e29b-41d4-a716-446655440020	created	\N	\N	\N	Created task: task 1	2025-08-24 09:35:18.086823+05:30
3979b5f6-26fb-4d23-bec5-bb9a700b3e1a	96808225-b8ac-4a08-b995-1fa2523b9dc6	550e8400-e29b-41d4-a716-446655440020	status_changed	status	todo	in_progress	\N	2025-08-24 09:35:27.403987+05:30
b5c33434-f111-409f-a743-ed7e7b464c0f	96808225-b8ac-4a08-b995-1fa2523b9dc6	550e8400-e29b-41d4-a716-446655440020	status_changed	status	in_progress	in_review	\N	2025-08-24 09:35:28.614947+05:30
e0b92ba4-d31c-412e-a966-550f29d73b13	96808225-b8ac-4a08-b995-1fa2523b9dc6	550e8400-e29b-41d4-a716-446655440020	status_changed	status	in_review	done	\N	2025-08-24 09:35:30.388445+05:30
11a69a26-d4b6-4e63-a587-aa0d8d536013	96808225-b8ac-4a08-b995-1fa2523b9dc6	550e8400-e29b-41d4-a716-446655440020	status_changed	status	done	in_progress	\N	2025-08-24 09:35:31.806809+05:30
fff321ee-7cef-4710-ac5f-8c804afda82e	96808225-b8ac-4a08-b995-1fa2523b9dc6	550e8400-e29b-41d4-a716-446655440020	status_changed	status	in_progress	todo	\N	2025-08-24 09:36:23.351463+05:30
d8879512-4b10-426d-96ee-19b29894fe75	a874db74-a981-49de-8066-7c13280d5dda	550e8400-e29b-41d4-a716-446655440020	created	\N	\N	\N	Created task: task 2	2025-08-24 09:36:46.939658+05:30
20d50643-04a8-48e0-b9c0-52eca53cce17	180990cd-b534-4216-953a-153fa52e3030	550e8400-e29b-41d4-a716-446655440020	created	\N	\N	\N	Created task: task3	2025-08-24 09:37:30.634328+05:30
0ab6bc74-455b-47ec-8b49-e6f830dfb569	e89dbb9b-c9b1-4da4-b012-731344cb7ff3	550e8400-e29b-41d4-a716-446655440020	created	\N	\N	\N	Created task: dafkj	2025-08-24 09:37:47.213045+05:30
50872538-17c8-4fad-ac23-9cd5908146de	80811692-3145-4557-8d74-a151d2d0e7a5	550e8400-e29b-41d4-a716-446655440020	created	\N	\N	\N	Created task: htaa	2025-08-24 09:38:04.626055+05:30
7c49850d-3ae9-4b23-93e3-dcee164d497c	6df975a8-f72b-42d7-b732-5d6de3a9b89c	550e8400-e29b-41d4-a716-446655440020	created	\N	\N	\N	Created task: ifsgd	2025-08-24 09:38:21.690136+05:30
f07dcbf4-9b9a-406c-8be1-94e1ac9b281a	e89dbb9b-c9b1-4da4-b012-731344cb7ff3	550e8400-e29b-41d4-a716-446655440020	status_changed	status	todo	in_progress	\N	2025-08-24 09:38:30.950838+05:30
32a4458a-4805-400c-809c-0bec01bbec4f	6df975a8-f72b-42d7-b732-5d6de3a9b89c	550e8400-e29b-41d4-a716-446655440020	status_changed	status	todo	in_review	\N	2025-08-24 09:38:35.534388+05:30
e7e8e76c-886b-426a-95db-7c02604fb5d3	6df975a8-f72b-42d7-b732-5d6de3a9b89c	550e8400-e29b-41d4-a716-446655440020	status_changed	status	in_review	done	\N	2025-08-24 09:39:10.971323+05:30
110beec1-1db0-4a3c-ab92-4b4fdc2eb8f7	e89dbb9b-c9b1-4da4-b012-731344cb7ff3	550e8400-e29b-41d4-a716-446655440020	status_changed	status	in_progress	todo	\N	2025-08-24 10:03:29.009743+05:30
6bae534a-3378-484a-b5a2-3bb24e8a695b	6df975a8-f72b-42d7-b732-5d6de3a9b89c	550e8400-e29b-41d4-a716-446655440020	status_changed	status	done	todo	\N	2025-08-24 10:03:33.603027+05:30
62f40757-0db2-4424-9f5d-4249551f0bac	80811692-3145-4557-8d74-a151d2d0e7a5	550e8400-e29b-41d4-a716-446655440020	status_changed	status	todo	in_progress	\N	2025-08-24 10:03:36.961284+05:30
db1012fc-fdf0-4e85-a618-2309781ba26f	180990cd-b534-4216-953a-153fa52e3030	550e8400-e29b-41d4-a716-446655440020	status_changed	status	todo	done	\N	2025-08-24 10:03:38.366157+05:30
6eba30e7-1ff6-4443-bbff-2b67bc57ff3e	80811692-3145-4557-8d74-a151d2d0e7a5	550e8400-e29b-41d4-a716-446655440020	status_changed	status	in_progress	todo	\N	2025-08-24 10:03:41.646325+05:30
896860b1-7ef7-4256-a13d-7019ff05cd43	e89dbb9b-c9b1-4da4-b012-731344cb7ff3	550e8400-e29b-41d4-a716-446655440020	status_changed	status	todo	in_progress	\N	2025-08-24 10:03:45.204736+05:30
c44752c3-869c-46bc-88e0-d3c9979b4dc7	89390ffc-7681-4380-9adf-2396d41c3f38	550e8400-e29b-41d4-a716-446655440020	created	\N	\N	\N	Created task: 0	2025-08-24 10:06:32.320279+05:30
176450ab-a907-4437-8a87-8e581299bb0e	6df975a8-f72b-42d7-b732-5d6de3a9b89c	550e8400-e29b-41d4-a716-446655440020	status_changed	status	todo	in_progress	\N	2025-08-24 10:06:37.149694+05:30
94394abf-e587-4824-99b2-5de4a4e4db56	a874db74-a981-49de-8066-7c13280d5dda	550e8400-e29b-41d4-a716-446655440020	status_changed	status	todo	in_review	\N	2025-08-24 10:06:38.149933+05:30
4cc4acf4-b845-4cb3-bd97-f0245a5c2348	96808225-b8ac-4a08-b995-1fa2523b9dc6	550e8400-e29b-41d4-a716-446655440020	status_changed	status	todo	in_progress	\N	2025-08-24 10:06:39.915652+05:30
04c58ebd-2f6e-4675-94c3-0bdabf043771	d52f1cc7-db95-42ae-a514-3307b7d4c7cf	550e8400-e29b-41d4-a716-446655440020	created	\N	\N	\N	Created task: new	2025-08-24 10:06:47.783892+05:30
aac902e3-563c-4f2e-a025-c27c60437154	a874db74-a981-49de-8066-7c13280d5dda	550e8400-e29b-41d4-a716-446655440020	status_changed	status	in_review	done	\N	2025-08-24 10:07:54.456544+05:30
1be1ac92-a89b-418d-80f6-9dd744b6cd26	6df975a8-f72b-42d7-b732-5d6de3a9b89c	550e8400-e29b-41d4-a716-446655440020	status_changed	status	in_progress	done	\N	2025-08-24 10:07:56.627887+05:30
8b737477-5f95-4447-8a1d-5e7cc9a20d87	96808225-b8ac-4a08-b995-1fa2523b9dc6	550e8400-e29b-41d4-a716-446655440020	status_changed	status	in_progress	todo	\N	2025-08-24 10:16:02.805893+05:30
b885468e-c2e7-4834-86f6-ae5b2b716b57	e89dbb9b-c9b1-4da4-b012-731344cb7ff3	550e8400-e29b-41d4-a716-446655440020	status_changed	status	in_progress	todo	\N	2025-08-24 10:16:03.703655+05:30
93b1882d-bd29-4b02-ae12-98bc4c3a8256	a874db74-a981-49de-8066-7c13280d5dda	550e8400-e29b-41d4-a716-446655440020	status_changed	status	done	todo	\N	2025-08-24 10:16:06.896168+05:30
0ed1065d-e612-49b6-97d1-f13ba0a20ac8	80811692-3145-4557-8d74-a151d2d0e7a5	550e8400-e29b-41d4-a716-446655440020	status_changed	status	todo	in_progress	\N	2025-08-24 10:16:08.91112+05:30
5869ea3f-9fef-4f39-956d-a2135d5e1810	e89dbb9b-c9b1-4da4-b012-731344cb7ff3	550e8400-e29b-41d4-a716-446655440020	status_changed	status	todo	in_progress	\N	2025-08-24 10:16:11.139576+05:30
038fc45f-b000-4e4a-a7e3-6781de7c0883	66575c54-e22b-46f4-a63f-80915f562b68	550e8400-e29b-41d4-a716-446655440020	created	\N	\N	\N	Created task: ui	2025-08-24 10:16:32.166553+05:30
95002161-8d95-4e40-a867-295f92712b0d	89390ffc-7681-4380-9adf-2396d41c3f38	550e8400-e29b-41d4-a716-446655440020	status_changed	status	todo	in_review	\N	2025-08-24 10:16:38.712694+05:30
2e001eac-0705-4ccd-b2e7-09d179c86df0	89390ffc-7681-4380-9adf-2396d41c3f38	550e8400-e29b-41d4-a716-446655440020	status_changed	status	in_review	done	\N	2025-08-24 10:16:43.859407+05:30
56ef69b3-1957-43a6-ac2b-5907b4817265	e89dbb9b-c9b1-4da4-b012-731344cb7ff3	550e8400-e29b-41d4-a716-446655440020	status_changed	status	in_progress	in_review	\N	2025-08-24 10:16:44.94022+05:30
05307cbd-24ed-4fcf-8489-5d6c34880693	a874db74-a981-49de-8066-7c13280d5dda	550e8400-e29b-41d4-a716-446655440020	status_changed	status	todo	in_progress	\N	2025-08-24 10:16:46.969004+05:30
6e21c9f5-f817-4a4b-94ad-abb10e908853	d52f1cc7-db95-42ae-a514-3307b7d4c7cf	550e8400-e29b-41d4-a716-446655440020	status_changed	status	todo	in_review	\N	2025-08-24 10:16:48.022757+05:30
f5be33de-b9fb-4e1d-82c8-2b59fc47ebeb	80811692-3145-4557-8d74-a151d2d0e7a5	550e8400-e29b-41d4-a716-446655440020	status_changed	status	in_progress	todo	\N	2025-08-24 10:31:00.460065+05:30
d9586b4a-313c-4e1d-9c9a-7321e444770d	a874db74-a981-49de-8066-7c13280d5dda	550e8400-e29b-41d4-a716-446655440020	status_changed	status	in_progress	todo	\N	2025-08-24 10:31:01.580259+05:30
046120a1-0ec3-434b-b612-db538437a2f6	e89dbb9b-c9b1-4da4-b012-731344cb7ff3	550e8400-e29b-41d4-a716-446655440020	status_changed	status	in_review	todo	\N	2025-08-24 10:31:03.138156+05:30
ae815a24-cdce-4137-9e66-203b1047f085	66575c54-e22b-46f4-a63f-80915f562b68	550e8400-e29b-41d4-a716-446655440020	status_changed	status	todo	in_progress	\N	2025-08-24 10:31:06.23785+05:30
3d1c36b9-6703-4b5a-b540-526d034a3e9a	e89dbb9b-c9b1-4da4-b012-731344cb7ff3	550e8400-e29b-41d4-a716-446655440020	status_changed	status	todo	in_review	\N	2025-08-24 10:31:08.286082+05:30
76591eef-983b-49d8-8102-bcbf0b4eeeed	a874db74-a981-49de-8066-7c13280d5dda	550e8400-e29b-41d4-a716-446655440020	status_changed	status	todo	in_progress	\N	2025-08-24 10:31:09.415839+05:30
c7451d59-b5e7-4e5f-90b3-4154886fdc29	a874db74-a981-49de-8066-7c13280d5dda	550e8400-e29b-41d4-a716-446655440020	status_changed	status	in_progress	done	\N	2025-08-24 10:31:12.764587+05:30
27f721ef-daa2-49ce-8dc2-7f84eeb05fed	180990cd-b534-4216-953a-153fa52e3030	550e8400-e29b-41d4-a716-446655440020	status_changed	status	done	in_progress	\N	2025-08-24 10:31:14.625174+05:30
351d4c54-fe16-4fe6-80f4-f00c5b0bee12	a874db74-a981-49de-8066-7c13280d5dda	550e8400-e29b-41d4-a716-446655440020	status_changed	status	done	in_review	\N	2025-08-24 10:31:30.664425+05:30
adc8bc7c-845c-482b-9928-1d7808524ea1	a874db74-a981-49de-8066-7c13280d5dda	550e8400-e29b-41d4-a716-446655440020	status_changed	status	in_review	in_progress	\N	2025-08-24 10:31:33.218359+05:30
f7255f54-18df-416b-b25b-1bde1338b13a	a874db74-a981-49de-8066-7c13280d5dda	550e8400-e29b-41d4-a716-446655440020	status_changed	status	in_progress	in_review	\N	2025-08-24 10:31:34.504842+05:30
bd97e33d-80c7-4e19-8ef6-60babb9b8f65	a874db74-a981-49de-8066-7c13280d5dda	550e8400-e29b-41d4-a716-446655440020	status_changed	status	in_review	done	\N	2025-08-24 10:31:35.850317+05:30
06a8cdd9-80d5-425d-bd55-bbe22101d84a	6df975a8-f72b-42d7-b732-5d6de3a9b89c	550e8400-e29b-41d4-a716-446655440020	status_changed	status	done	in_review	\N	2025-08-24 10:31:38.539188+05:30
bd9a8a8f-0c90-4103-9b42-086f21826cc9	a874db74-a981-49de-8066-7c13280d5dda	550e8400-e29b-41d4-a716-446655440020	status_changed	status	done	in_progress	\N	2025-08-24 10:31:42.745889+05:30
4d9e768d-8972-4381-a504-3dcc3f32a3e6	6df975a8-f72b-42d7-b732-5d6de3a9b89c	550e8400-e29b-41d4-a716-446655440020	status_changed	status	in_review	done	\N	2025-08-24 10:31:46.172993+05:30
ae051f2d-297f-4a11-9113-ccd0b596a2e5	6df975a8-f72b-42d7-b732-5d6de3a9b89c	550e8400-e29b-41d4-a716-446655440020	status_changed	status	done	in_review	\N	2025-08-24 10:31:52.887475+05:30
a3a38968-1174-425d-9d9a-369e38203046	6df975a8-f72b-42d7-b732-5d6de3a9b89c	550e8400-e29b-41d4-a716-446655440020	status_changed	status	in_review	done	\N	2025-08-24 10:31:54.084587+05:30
276405f6-5b48-4d7b-b94b-2e019258451f	180990cd-b534-4216-953a-153fa52e3030	550e8400-e29b-41d4-a716-446655440020	status_changed	status	in_progress	in_review	\N	2025-08-24 10:31:56.156408+05:30
2d840b4e-bc94-4513-9f27-cd152e19c18a	6df975a8-f72b-42d7-b732-5d6de3a9b89c	550e8400-e29b-41d4-a716-446655440020	status_changed	status	done	in_progress	\N	2025-08-24 10:32:26.967291+05:30
ef583b84-7881-45cb-b01d-00e6bb73928c	a874db74-a981-49de-8066-7c13280d5dda	550e8400-e29b-41d4-a716-446655440020	status_changed	status	in_progress	todo	\N	2025-08-24 10:37:22.328929+05:30
a37cac7c-a1b7-43e8-bb14-0b181d070f4c	6df975a8-f72b-42d7-b732-5d6de3a9b89c	550e8400-e29b-41d4-a716-446655440020	status_changed	status	in_progress	todo	\N	2025-08-24 10:37:23.281383+05:30
2b442244-13b0-4fe1-8fff-06cf5c3d8d34	80811692-3145-4557-8d74-a151d2d0e7a5	550e8400-e29b-41d4-a716-446655440020	status_changed	status	todo	in_progress	\N	2025-08-24 10:37:25.080697+05:30
d2740f6b-4306-4e66-98c3-06d5933b09f5	6df975a8-f72b-42d7-b732-5d6de3a9b89c	550e8400-e29b-41d4-a716-446655440020	status_changed	status	todo	in_progress	\N	2025-08-24 10:37:26.703158+05:30
235d8ff4-165c-43d8-8b28-395d89c97aaf	e89dbb9b-c9b1-4da4-b012-731344cb7ff3	550e8400-e29b-41d4-a716-446655440020	status_changed	status	in_review	done	\N	2025-08-24 10:37:38.261936+05:30
d60f2d79-ab90-4b0d-8f47-1ed03963cbd4	180990cd-b534-4216-953a-153fa52e3030	550e8400-e29b-41d4-a716-446655440020	status_changed	status	in_review	done	\N	2025-08-24 10:38:48.618343+05:30
3a9ba43c-686e-4a5a-bdbb-f3970af89ad2	a874db74-a981-49de-8066-7c13280d5dda	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	status_changed	status	todo	in_review	\N	2025-08-29 01:13:41.688628+05:30
2a3842dc-22ef-4e03-844e-1c895e5945ea	a874db74-a981-49de-8066-7c13280d5dda	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	status_changed	status	in_review	done	\N	2025-08-29 01:14:00.979071+05:30
a60247c5-ce73-424f-9209-4b27c49c0ccc	a874db74-a981-49de-8066-7c13280d5dda	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	status_changed	status	done	in_review	\N	2025-08-29 01:14:02.447712+05:30
f839b517-12de-4c5f-a919-509c83b65f3a	6df975a8-f72b-42d7-b732-5d6de3a9b89c	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	status_changed	status	in_progress	todo	\N	2025-08-29 01:14:28.272817+05:30
\.


--
-- TOC entry 4426 (class 0 OID 19136)
-- Dependencies: 264
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tasks (id, project_id, title, description, task_key, task_type, priority, status, assignee_id, reporter_id, parent_task_id, story_points, time_spent_hours, due_date, completed_date, is_completed, created_at, updated_at) FROM stdin;
80811692-3145-4557-8d74-a151d2d0e7a5	41ad1a02-02a7-4b65-a464-0cb72a13b355	htaa	ef	TE93DA47-5	task	medium	in_progress	\N	550e8400-e29b-41d4-a716-446655440020	\N	\N	0	2025-08-27 00:00:00+05:30	\N	f	2025-08-24 09:38:04.623443+05:30	2025-08-24 10:37:25.076507+05:30
e89dbb9b-c9b1-4da4-b012-731344cb7ff3	41ad1a02-02a7-4b65-a464-0cb72a13b355	dafkj	adsf	TE93DA47-4	task	medium	done	\N	550e8400-e29b-41d4-a716-446655440020	\N	\N	0	2025-08-28 00:00:00+05:30	\N	f	2025-08-24 09:37:47.209637+05:30	2025-08-24 10:37:38.260207+05:30
180990cd-b534-4216-953a-153fa52e3030	41ad1a02-02a7-4b65-a464-0cb72a13b355	task3	ji	TE93DA47-3	task	medium	done	\N	550e8400-e29b-41d4-a716-446655440020	\N	\N	0	2025-08-26 00:00:00+05:30	\N	f	2025-08-24 09:37:30.610104+05:30	2025-08-24 10:38:48.616006+05:30
199bf0e2-7d8e-4968-b769-cf6e8a21619b	12413e7f-8ff1-47f7-b6d6-91558835948c	first	test	NAGPU046-1	task	medium	done	550e8400-e29b-41d4-a716-446655440020	550e8400-e29b-41d4-a716-446655440020	\N	\N	0	2025-08-29 00:00:00+05:30	\N	f	2025-08-24 01:54:45.534999+05:30	2025-08-24 02:21:50.179887+05:30
a874db74-a981-49de-8066-7c13280d5dda	41ad1a02-02a7-4b65-a464-0cb72a13b355	task 2	2	TE93DA47-2	task	medium	in_review	550e8400-e29b-41d4-a716-446655440020	550e8400-e29b-41d4-a716-446655440020	\N	\N	0	2025-08-26 00:00:00+05:30	\N	f	2025-08-24 09:36:46.923063+05:30	2025-08-29 01:14:02.432726+05:30
6df975a8-f72b-42d7-b732-5d6de3a9b89c	41ad1a02-02a7-4b65-a464-0cb72a13b355	ifsgd	regt	TE93DA47-6	task	medium	todo	\N	550e8400-e29b-41d4-a716-446655440020	\N	\N	0	\N	\N	f	2025-08-24 09:38:21.673498+05:30	2025-08-29 01:14:28.255849+05:30
96808225-b8ac-4a08-b995-1fa2523b9dc6	41ad1a02-02a7-4b65-a464-0cb72a13b355	task 1	des	TE93DA47-1	task	medium	todo	550e8400-e29b-41d4-a716-446655440020	550e8400-e29b-41d4-a716-446655440020	\N	\N	0	2025-08-31 00:00:00+05:30	\N	f	2025-08-24 09:35:18.066214+05:30	2025-08-24 10:16:02.789926+05:30
89390ffc-7681-4380-9adf-2396d41c3f38	41ad1a02-02a7-4b65-a464-0cb72a13b355	0	0	TE93DA47-7	task	medium	done	\N	550e8400-e29b-41d4-a716-446655440020	\N	\N	0	\N	\N	f	2025-08-24 10:06:32.317337+05:30	2025-08-24 10:16:43.857952+05:30
d52f1cc7-db95-42ae-a514-3307b7d4c7cf	41ad1a02-02a7-4b65-a464-0cb72a13b355	new	new	TE93DA47-8	task	medium	in_review	\N	550e8400-e29b-41d4-a716-446655440020	\N	\N	0	\N	\N	f	2025-08-24 10:06:47.769485+05:30	2025-08-24 10:16:48.008982+05:30
66575c54-e22b-46f4-a63f-80915f562b68	41ad1a02-02a7-4b65-a464-0cb72a13b355	ui	ae	TE93DA47-9	task	medium	in_progress	\N	550e8400-e29b-41d4-a716-446655440020	\N	\N	0	\N	\N	f	2025-08-24 10:16:32.152132+05:30	2025-08-24 10:31:06.223981+05:30
\.


--
-- TOC entry 4434 (class 0 OID 19667)
-- Dependencies: 272
-- Data for Name: team_cards; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.team_cards (id, page_type, page_reference_id, member_name, member_role, member_email, member_phone, avatar_url, bio, social_links, display_order, is_active, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4413 (class 0 OID 18279)
-- Dependencies: 251
-- Data for Name: trusted_devices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trusted_devices (id, user_id, device_identifier, device_name, device_type, browser, os, ip_address, last_used, created_at, expires_at, trust_level) FROM stdin;
3c69f262-4c9d-4c62-acae-f85c4c2e64d9	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	device_1756191070569_xczi3zyw6	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	::1	2025-08-26 12:21:10.570023+05:30	2025-08-26 12:21:10.570023+05:30	2025-09-25 12:21:10.570023+05:30	login_only
\.


--
-- TOC entry 4416 (class 0 OID 18327)
-- Dependencies: 254
-- Data for Name: user_activities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_activities (id, user_id, action, target_type, target_id, target_name, details, created_at) FROM stdin;
1	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	joined	club	ascend	ASCEND	{"message": "Atharva Naitam joined the club"}	2025-08-29 01:10:49.856217+05:30
\.


--
-- TOC entry 4417 (class 0 OID 18341)
-- Dependencies: 255
-- Data for Name: user_badges; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_badges (id, user_id, badge_name, badge_description, badge_icon, earned_at) FROM stdin;
\.


--
-- TOC entry 4379 (class 0 OID 17493)
-- Dependencies: 217
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password_hash, name, username, avatar, role, club_id, bio, social_links, preferences, created_at, updated_at, profile_image_url, profile_images, verification_photo_url, phone_number, date_of_birth, address, emergency_contact, phone, location, website, github, linkedin, twitter, email_verified, email_verification_token, email_verification_token_expires_at, password_reset_token, password_reset_token_expires_at, oauth_provider, oauth_id, oauth_data, has_password, totp_secret, totp_temp_secret, totp_temp_secret_created_at, totp_enabled, totp_enabled_at, totp_recovery_codes, notification_preferences, email_otp_enabled, email_otp_verified, email_otp_secret, email_otp_backup_codes, email_otp_last_used, email_otp_created_at, email_otp, email_otp_expires_at, last_activity) FROM stdin;
1ac23e35-54f9-4e34-8ff3-bfff79885d88	kencherian16@gmail.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Ken Cherian	\N	\N	coordinator	\N	\N	{}	{}	2025-08-26 00:06:34.686581+05:30	2025-09-18 13:46:26.839824+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=riya	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:06:34.686581+05:30
4045af03-9a2e-4f61-818d-d71b5dc36728	ojasmitakumbhare27@gmail.com	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Ojasmita Kumbhare	aarush.shah.chem.grad	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:59:29.799782+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
204a06d7-e042-4c19-8e97-b0f2d8ad1271	rochansawasthi@gmail.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Rochan Awasthi	\N	\N	coordinator	\N	\N	{}	{}	2025-08-26 00:06:34.686581+05:30	2025-09-18 14:03:55.283539+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=dev	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:06:34.686581+05:30
19124f5e-a896-4728-bb75-701f616c7716	guptaharsh1969@gmail.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Harsh Gupta	\N	\N	treasurer	\N	\N	{}	{}	2025-08-26 00:06:34.686581+05:30	2025-09-18 12:38:02.320354+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=rohan	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:06:34.686581+05:30
086ebbaa-f6dd-4ce4-a836-246833f9573c	aditi.jain2025@example.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Aditi Jain	\N	\N	student	\N	\N	{}	{}	2025-08-26 00:06:34.686581+05:30	2025-09-16 15:43:45.251418+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=aditi	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:06:34.686581+05:30
571ebb33-aeb5-4861-87a0-0c442bae3a6b	sayalibambal218@gmail.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Sayali Bambal	\N	\N	president	\N	\N	{}	{}	2025-08-26 00:06:34.686581+05:30	2025-09-18 12:25:36.638947+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=rahul	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:06:34.686581+05:30
6e11229a-a444-4e8b-8b56-e8b6536302d5	chatapmitali@gmail.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Mitali Chatap	\N	\N	treasurer	\N	\N	{}	{}	2025-08-26 00:06:34.686581+05:30	2025-09-18 12:28:44.741085+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=sneha	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:06:34.686581+05:30
8397062d-0b15-4115-9ee3-3e2f4bef0e36	lonkarparth2004@gmail.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Parth Lonkar	\N	\N	co_coordinator	\N	\N	{}	{}	2025-08-26 00:06:34.686581+05:30	2025-09-18 14:05:45.220277+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=isha	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:06:34.686581+05:30
9e494d57-59b3-48d0-a140-f131099a0a11	harsh.pandey2025@example.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Harsh Pandey	\N	\N	coordinator	\N	\N	{}	{}	2025-08-26 00:06:34.686581+05:30	2025-09-17 00:11:12.088316+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=harsh	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:06:34.686581+05:30
bca6518e-d6ec-4489-9422-1898f5086ba4	anita.gupta2025@example.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Anita Gupta	\N	\N	coordinator	\N	\N	{}	{}	2025-08-26 00:06:34.686581+05:30	2025-09-17 00:11:12.088316+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=anita	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:06:34.686581+05:30
1351d77c-38fe-4dd3-84bd-7d9aff156a82	yagneshwar.chaudhari@zenith.edu	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Yogeshvar Chaudhari	\N	https://qpulpytptbwwumicyzwr.supabase.co/storage/v1/object/public/avatars/profile_7c36ecbe-44d3-40df-8b8b-886e5385e839_1755673151393_Screenshot%202025-08-20%20120444.png	treasurer	\N	\N	{}	{}	2025-08-26 00:28:40.87628+05:30	2025-09-17 00:11:12.088316+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:28:40.87628+05:30
17254128-6271-484c-bec9-756ff7f7a043	mansavi.giradkar@zenith.edu	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Mansavi Giradkar	\N	https://qpulpytptbwwumicyzwr.supabase.co/storage/v1/object/public/avatars/profile_53cbed56-2bc7-4faf-bd6e-5f953de4dfa5_1755673094883_Screenshot%202025-08-20%20120312.png	secretary_committee	\N	\N	{}	{}	2025-08-26 00:28:40.87628+05:30	2025-09-17 00:11:12.088316+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:28:40.87628+05:30
924ede2a-5fd4-4e9d-9a28-95438e5b4898	kaivalya.pund@zenith.edu	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Kaiwalya Pund	\N	https://qpulpytptbwwumicyzwr.supabase.co/storage/v1/object/public/avatars/profile_9755eab9-39cb-443b-9cca-853d727afe40_1755672871466_Screenshot%202025-08-20%20120548.png	media_head	\N	\N	{}	{}	2025-08-26 00:28:40.87628+05:30	2025-09-17 00:11:12.088316+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:28:40.87628+05:30
85831284-34d0-4724-90c2-26e6204c1428	nikhil.verma2025@example.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Nikhil Verma	\N	\N	co_coordinator	\N	\N	{}	{}	2025-08-26 00:06:34.686581+05:30	2025-09-17 00:11:12.088316+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=nikhil	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:06:34.686581+05:30
b9f1d273-57c1-4ba4-9411-5495254ff797	ruchikathosar06@gmail.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Ruchika Thosar	\N	\N	secretary	\N	\N	{}	{}	2025-08-26 00:06:34.686581+05:30	2025-09-18 12:37:41.034577+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=karan	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:06:34.686581+05:30
4a526572-d81e-4634-94c2-2ea5ae5d75be	rohit.singh.cse.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Rohit Singh	rohit.singh.cse.2023	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
550e8400-e29b-41d4-a716-446655440001	superadmin@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Super Admin	superadmin	\N	admin	\N	Super administrator overseeing all clubs	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440023	aster.media@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	ASTER Media Head	aster_media	\N	media	aster	Media coordinator for ASTER club	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440033	achievers.media@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	ACHIEVERS Media Head	achievers_media	\N	media	achievers	Media coordinator for ACHIEVERS club	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440100	student1.ascend@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Alice Johnson	alice_j	\N	student	ascend	Computer Science student passionate about coding	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440101	student2.ascend@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Bob Smith	bob_s	\N	student	ascend	Software Engineering student interested in web development	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440102	student3.ascend@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Charlie Brown	charlie_b	\N	student	ascend	Data Science student exploring machine learning	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440200	student1.aster@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Frank Miller	frank_m	\N	student	aster	Communication student focusing on interpersonal skills	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440201	student2.aster@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Grace Lee	grace_l	\N	student	aster	Leadership development and team building enthusiast	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440202	student3.aster@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Henry Wilson	henry_w	\N	student	aster	Public speaking and presentation skills specialist	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440300	student1.achievers@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Karen White	karen_w	\N	student	achievers	Preparing for competitive exams and higher studies	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440301	student2.achievers@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Liam Garcia	liam_g	\N	student	achievers	Research and academic excellence focused	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440302	student3.achievers@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Maya Patel	maya_p	\N	student	achievers	Graduate school preparation and academic mentorship	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
febf3dd5-655c-4e18-86a9-2abbf245cb16	vedant.wardhana@zenith.edu	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Vedanti Wandhare	\N	\N	secretary	\N	\N	{}	{}	2025-08-26 00:30:57.789111+05:30	2025-09-17 00:11:12.088316+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=vedant	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:30:57.789111+05:30
550e8400-e29b-41d4-a716-446655440000	admin@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Admin User	admin	\N	admin	ascend	System administrator with full access	{}	{}	2025-07-27 13:47:32.966+05:30	2025-09-18 10:05:50.570032+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
ec962745-fe2f-4079-b859-7d86bf711c20	radhatadas11@gmail.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Radha Tadas	\N	\N	outreach_coordinator	\N	\N	{}	{}	2025-08-26 00:06:34.686581+05:30	2025-09-18 12:39:47.779566+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=arjun	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:06:34.686581+05:30
e75ebfdc-b1e8-440c-a987-c77306ab8348	tejasri.rinait@zenith.edu	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Tejasi Rinait	\N	\N	coordinator	\N	\N	{}	{}	2025-08-26 00:30:57.789111+05:30	2025-09-17 00:11:12.088316+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=tejasri	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:30:57.789111+05:30
c088cdf3-11ff-408d-b95a-1f50bb794c27	sanjeed.kabarle@zenith.edu	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Sanved Kabade	\N	\N	co_coordinator	\N	\N	{}	{}	2025-08-26 00:30:57.789111+05:30	2025-09-17 00:11:12.088316+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=sanjeed	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:30:57.789111+05:30
8fcc0b11-a2d9-4463-a83c-c1a1370325a6	madhura.shende@zenith.edu	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Madhura Shende	\N	\N	student	achievers	\N	{}	{}	2025-08-26 00:30:57.789111+05:30	2025-09-18 13:22:18.235846+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=madhura	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:30:57.789111+05:30
8203d590-1c95-472d-a9a6-643d696a04e9	aditya.yelne2005@gmail.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Aditya Yelne	\N	\N	student	ascend	\N	{}	{}	2025-08-26 00:30:57.789111+05:30	2025-09-18 13:28:42.450306+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=aditya	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:30:57.789111+05:30
550e8400-e29b-41d4-a716-446655440010	atharva.bhedework@gmail.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Atharva Bhede	ascend_coord	https://qpulpytptbwwumicyzwr.supabase.co/storage/v1/object/public/avatars/profile_550e8400-e29b-41d4-a716-446655440010_1755680000670_Screenshot%202025-08-20%20141027.png	coordinator	ascend	Lead coordinator for ASCEND coding club	{}	{}	2025-07-27 13:47:32.966+05:30	2025-09-18 13:29:56.441381+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	AYAVENLPN5SQOVK4	\N	\N	t	2025-08-09 04:50:10.737	["620F2163", "8FD17E98", "BD8320DB", "452B43BA", "A2C610DB", "F12116B6", "4FC378F0", "E1DC2D47", "C682A95A", "BB09D2C7"]	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440013	ascend.media@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Aditya Yelne 	ascend_media	\N	media	ascend	Media coordinator for ASCEND club	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-08 22:11:44.008+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440022	aster.secretary@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Sahil Shrivastava 	aster_secretary	\N	secretary	aster	Secretary managing ASTER documentation	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-08 22:13:26.458+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440032	achievers.secretary@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Mayur Aglawe 	achievers_secretary	\N	secretary	achievers	Secretary managing ACHIEVERS documentation	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-08 22:16:19.5+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
cc0b35da-a560-416e-9366-00680dead616	test.api.manual@example.com	$2b$12$kTGtfsK6x1YSTPLP8HVX2Og5DyKMmwsQY3SOJ1ckIgBHhaIIrcKr6	Manual Test User	\N	\N	student	ascend	\N	{}	{}	2025-08-07 01:12:15.546+05:30	2025-08-07 01:12:15.546+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440011	ayushkshirsagar08@gmail.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Ayush Kshirsagar	ascend_co_coord	https://qpulpytptbwwumicyzwr.supabase.co/storage/v1/object/public/avatars/profile_550e8400-e29b-41d4-a716-446655440011_1755328377221_ayushphoto.jpg	co_coordinator	ascend	Co-coordinator supporting ASCEND activities	{}	{}	2025-07-27 13:47:32.966+05:30	2025-09-18 13:30:31.062864+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440031	aayushiasole04@gmail.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Aayushi Asole	achievers_co_coord	\N	co_coordinator	achievers	Co-coordinator supporting ACHIEVERS activities	{}	{}	2025-07-27 13:47:32.966+05:30	2025-09-18 13:30:53.55936+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440030	paritoshmagare.4@gmail.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Paritosh Magare	achievers_coord	\N	coordinator	achievers	Lead coordinator for ACHIEVERS higher studies club	{}	{}	2025-07-27 13:47:32.966+05:30	2025-09-18 13:31:13.441504+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440021	garhiudapure16@gmail.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Gargi Udapure 	aster_co_coord	\N	co_coordinator	aster	Co-coordinator supporting ASTER activities	{}	{}	2025-07-27 13:47:32.966+05:30	2025-09-18 13:32:05.832489+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440400	student1.artovert@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Oliver Davis	oliver_d	\N	student	artovert	Holistic development and all-round skill building	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-25 18:04:57.007481+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
1d5b1108-eb4c-4191-ae75-751e3610d519	ayushkshirsagar28@gmail.com	$2b$12$wSqDv2ll3YykTou..zdoouw0Yxwh3fon.Z936KB1bKdp9rXD/KZky	Ayush Kshirsagar	\N	\N	student	ascend	tech 	{}	{}	2025-08-07 01:25:30.145+05:30	2025-08-28 11:12:08.805108+05:30	/uploads/profiles/avatars/atharva_1756359728798_eb3fedded2aa1bf4.png	[]	\N	\N	\N	\N	{}	7249360170	Nagpur	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440012	krishnatelang22@gmail.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Mohit Telang	ascend_secretary	\N	secretary	ascend	Secretary managing ASCEND documentation	{}	{}	2025-07-27 13:47:32.966+05:30	2025-09-18 12:34:50.252657+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
59c443c7-2e5e-41ec-96bb-0b33ca557948	shubham.kaut@zenith.edu	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Sharawari Raut	\N	\N	co_coordinator	\N	\N	{}	{}	2025-08-26 00:30:57.789111+05:30	2025-09-17 00:11:12.088316+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=shubham	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:30:57.789111+05:30
21a95efa-ccfa-4c4c-af7f-50cfa0a35053	naitamatharva14@gmail.com	$2b$12$H657HWHhjgIErR7Jjbg1rewgKsxIHUYNWhXwbn6tPQkYEedyFLf4y	Atharva Naitam	\N	https://qpulpytptbwwumicyzwr.supabase.co/storage/v1/object/public/avatars/profile_21a95efa-ccfa-4c4c-af7f-50cfa0a35053_1755672934344_Screenshot%202025-08-20%20120530.png	innovation_head	ascend	\N	{}	{}	2025-08-20 11:30:17.917+05:30	2025-09-17 00:11:12.088316+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-20 11:30:17.917+05:30
7c36ecbe-44d3-40df-8b8b-886e5385e839	yogeshvar.chaudhari@zenith.edu	$2b$12$XbcEa4LED/o71VjyMDgIKOuVoOyOqCZG4AMVxVGt4nQZf13Cv3wcy	Yogeshvar Chaudhari	\N	https://qpulpytptbwwumicyzwr.supabase.co/storage/v1/object/public/avatars/profile_7c36ecbe-44d3-40df-8b8b-886e5385e839_1755673151393_Screenshot%202025-08-20%20120444.png	treasurer	\N	\N	{}	{}	2025-08-20 11:30:17.917+05:30	2025-09-17 00:11:12.088316+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-20 11:30:17.917+05:30
a758760c-468e-4185-b84c-374ec2168a4a	udaybhoyar796@gmail.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Uday Bhoyar	\N	\N	co_coordinator	\N	\N	{}	{}	2025-08-26 00:42:07.684881+05:30	2025-09-18 13:26:47.40337+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=uday	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:42:07.684881+05:30
8694ff1f-1d1e-4a7b-8ecb-eebda2c937d3	siddhabhattiyash@gmail.com	$2b$12$XbcEa4LED/o71VjyMDgIKOuVoOyOqCZG4AMVxVGt4nQZf13Cv3wcy	Yash Siddhabhatti	\N	https://qpulpytptbwwumicyzwr.supabase.co/storage/v1/object/public/avatars/profile_8694ff1f-1d1e-4a7b-8ecb-eebda2c937d3_1755672985159_yashprofle.png	president	\N	\N	{}	{}	2025-08-20 11:30:17.917+05:30	2025-09-18 13:32:25.795272+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-20 11:30:17.917+05:30
550e8400-e29b-41d4-a716-446655440401	student2.artovert@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Sophie Chen	sophie_c	\N	student	artovert	Balanced development across technical and soft skills	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-25 18:04:57.007481+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
8eb864a5-a99b-4d3b-94f9-4619ed66c5e3	shreya.borde@example.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Shreya Borde	\N	\N	co_coordinator	\N	\N	{}	{}	2025-08-26 00:42:07.684881+05:30	2025-09-17 00:11:12.088316+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=shreya	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:42:07.684881+05:30
550e8400-e29b-41d4-a716-446655440020	aster.coordinator@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Radhika Salodkar	\N	\N	coordinator	aster	Lead coordinator for ASTER soft skills club	{}	{}	2025-07-27 13:47:32.966+05:30	2025-09-16 22:18:14.314061+05:30	/uploads/profiles/avatars/Screenshot from 2025-08-24 13-48-12_1756024176742_333e05fb871c9932.png	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	t	PE4ECHCYOMZSUGTR	LBKWOCKQIF3BSTCU	2025-08-16 08:27:25.065	f	\N	["F757E466", "3EE85BF7", "43A22EEB", "D7478D0E", "6EA60825", "A10652FA", "C086BBAE", "6799C08A", "CC3C4FA8", "946F6CCB"]	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
241f4f32-458e-410e-b2f2-6dcfda992455	sarthak.thote@zenith.edu	$2b$12$XbcEa4LED/o71VjyMDgIKOuVoOyOqCZG4AMVxVGt4nQZf13Cv3wcy	Sarthak Thote	\N	https://qpulpytptbwwumicyzwr.supabase.co/storage/v1/object/public/avatars/profile_241f4f32-458e-410e-b2f2-6dcfda992455_1755673025315_screen1.png	vice_president	\N	\N	{}	{}	2025-08-20 11:30:17.917+05:30	2025-09-17 00:11:12.088316+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-20 11:30:17.917+05:30
550e8400-e29b-41d4-a716-446655440402	student3.artovert@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	David Park	david_p	\N	student	artovert	Complete personality development enthusiast	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-25 18:04:57.007481+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440040	artovert.coordinator@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	ARTOVERT Coordinator	artovert_coord	\N	coordinator	artovert	Lead coordinator for ARTOVERT development club	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-25 18:04:57.007481+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440041	artovert.co-coordinator@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	ARTOVERT Co-Coordinator	artovert_co_coord	\N	co_coordinator	artovert	Co-coordinator supporting ARTOVERT activities	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-25 18:04:57.007481+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440042	artovert.secretary@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	ARTOVERT Secretary	artovert_secretary	\N	secretary	artovert	Secretary managing ARTOVERT documentation	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-25 18:04:57.007481+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440043	artovert.media@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	ARTOVERT Media Head	artovert_media	\N	media	artovert	Media coordinator for ARTOVERT club	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-25 18:04:57.007481+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
53cbed56-2bc7-4faf-bd6e-5f953de4dfa5	manasvi.giradkar@zenith.edu	$2b$12$XbcEa4LED/o71VjyMDgIKOuVoOyOqCZG4AMVxVGt4nQZf13Cv3wcy	Manasvi Giradkar	\N	https://qpulpytptbwwumicyzwr.supabase.co/storage/v1/object/public/avatars/profile_53cbed56-2bc7-4faf-bd6e-5f953de4dfa5_1755673094883_Screenshot%202025-08-20%20120312.png	secretary_committee	\N	\N	{}	{}	2025-08-20 11:30:17.917+05:30	2025-09-17 00:11:12.088316+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-20 11:30:17.917+05:30
9755eab9-39cb-443b-9cca-853d727afe40	kaiwalya.pund@zenith.edu	$2b$12$XbcEa4LED/o71VjyMDgIKOuVoOyOqCZG4AMVxVGt4nQZf13Cv3wcy	Kaiwalya Pund	\N	https://qpulpytptbwwumicyzwr.supabase.co/storage/v1/object/public/avatars/profile_9755eab9-39cb-443b-9cca-853d727afe40_1755672871466_Screenshot%202025-08-20%20120548.png	media_head	\N	\N	{}	{}	2025-08-20 11:30:17.917+05:30	2025-09-17 00:11:12.088316+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-20 11:30:17.917+05:30
e624fa3f-bb9f-4da6-b569-c6a22904b389	sahilshri0405@gmail.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Sahil Shrivastava	\N	\N	vice_president	\N	\N	{}	{}	2025-08-26 00:06:34.686581+05:30	2025-09-18 12:25:19.957551+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=priya	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:06:34.686581+05:30
5bac2b3a-1822-4fcf-ad7d-5c984c951b82	avni.bhatia.csbs.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Avni Bhatia	avni.bhatia.csbs.grad	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
61ee5d21-3847-45fb-b8e7-b5f5579dbfee	rohit.sharma.mech.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Rohit Sharma	rohit.sharma.mech.2024	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
41b85180-78de-4135-8b1b-d525a4612121	sunita.srinivas.eee.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Sunita Srinivas	sunita.srinivas.eee.grad	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
3220eb64-d5b0-4e74-a0d9-f5896194a989	nita.mehta.it.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Nita Mehta	nita.mehta.it.2023	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
8d635cd3-34fd-4c04-8a13-425cef4aea07	sunita.jain.cse.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Sunita Jain	sunita.jain.cse.grad	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
d6b49037-0637-4453-bce7-b4e24bb3217b	nisha.bansal.mech.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Nisha Bansal	nisha.bansal.mech.grad	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
256b6d4b-24dc-41c6-82ed-3ebcb991e66f	suresh.jain.cse.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Suresh Jain	suresh.jain.cse.2024	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
0fa29d11-4834-47db-be7f-9d385bc5c0db	savita.kapoor.it.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Savita Kapoor	savita.kapoor.it.2022	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
62f01148-4ee0-498f-9f0f-13cc5fd47b2f	lalit.varma.csbs.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Lalit Varma	lalit.varma.csbs.2022	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
ddcc4132-90e6-43b2-9a78-38a66502055f	ayaan.bose.ece.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Ayaan Bose	ayaan.bose.ece.2022	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
9cc2a1df-712a-4c51-9b28-0e5c2e25c0a6	jignesh.murthy.csbs.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Jignesh Murthy	jignesh.murthy.csbs.2023	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
e94eeb58-38be-493b-b185-de604aa0566e	sneha.sethi.chem.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Sneha Sethi	sneha.sethi.chem.2023	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
6772e011-3e4a-4b0b-8e18-45b986942b9c	ishika.vyas.csbs.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Ishika Vyas	ishika.vyas.csbs.2024	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
b5cd87ee-7913-410e-ba5e-84952bd5fe3e	lata.verma.it.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Lata Verma	lata.verma.it.2024	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
5dc48f23-1a50-4da0-a265-37f4a9433a38	ishika.krishnan.mech.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Ishika Krishnan	ishika.krishnan.mech.grad	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
927d12b3-267a-4d40-8ed8-80f29761add7	radha.vyas.civil.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Radha Vyas	radha.vyas.civil.grad	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
ade21a72-0d0e-43da-876b-ede62b9317bb	nita.iyer.ece.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Nita Iyer	nita.iyer.ece.grad	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
caccf02e-1bd6-4c43-b3fc-952f32d82063	prisha.dutta.mech.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Prisha Dutta	prisha.dutta.mech.2023	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
46b3f991-6149-4c70-a13f-b167fc33c57c	ganesh.raman.ece.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Ganesh Raman	ganesh.raman.ece.grad	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
d9c73a2e-5fa7-4576-bec2-08e68f1e87fe	ganesh.reddy.eee.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Ganesh Reddy	ganesh.reddy.eee.2024	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
10ad5a9c-ce80-4e9a-9105-837fea41a321	aditya.gupta.mech.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Aditya Gupta	aditya.gupta.mech.2024	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
7956e013-49c1-4938-923e-03982507f939	sachin.raju.eee.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Sachin Raju	sachin.raju.eee.grad	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
bbb4f104-2989-4356-b199-a8f48f5e0e74	mamta.bansal.eee.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Mamta Bansal	mamta.bansal.eee.2022	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
ed47dc24-65f7-4122-b3d2-10466fbed231	neha.sheth.it.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Neha Sheth	neha.sheth.it.2023	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
0f902ef2-afbf-4d25-b4bb-5fe8c66fc2c6	rita.varma.aids.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Rita Varma	rita.varma.aids.grad	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
fdc309c0-069b-49c4-bdd5-99da51b786ed	rekha.iyer.csbs.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Rekha Iyer	rekha.iyer.csbs.2024	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
9829bc9c-9994-43bd-91ef-9f0712186b4e	nita.desai.chem.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Nita Desai	nita.desai.chem.2024	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
aabdd1dc-572e-40fd-9851-f06b8d50cf8e	megha.pandya.mech.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Megha Pandya	megha.pandya.mech.2022	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
b3259e69-05e5-415e-a756-815321804f0b	yash.pandya.civil.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Yash Pandya	yash.pandya.civil.grad	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
f42cb37d-1508-4ed0-81db-9660aea4cc64	vivaan.shah.aids.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Vivaan Shah	vivaan.shah.aids.2024	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
6f5c3141-2a96-468c-9bf0-97a48f6d8744	pihu.chatterjee.ece.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Pihu Chatterjee	pihu.chatterjee.ece.2022	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
ca6ae40f-c07f-4d11-8fda-49f4b9623cff	usha.pillai.aids.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Usha Pillai	usha.pillai.aids.2022	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
57fe9a1c-e120-48ae-8fbf-9d6637fcdec9	mohit.jain.aids.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Mohit Jain	mohit.jain.aids.2024	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
05604503-802f-4e79-95c2-4ac3b61f4082	ganesh.shah.csbs.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Ganesh Shah	ganesh.shah.csbs.2023	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
bb080cee-f5f5-4db6-a019-7d19df1d7683	lata.menon.aids.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Lata Menon	lata.menon.aids.2022	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
133a61a7-a20d-465a-af20-26fd2544e1d0	rohit.chopra.chem.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Rohit Chopra	rohit.chopra.chem.2024	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
f5a93605-4668-4c6a-93cc-b78f240b58c0	nita.sharma.it.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Nita Sharma	nita.sharma.it.2022	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
0a93b5e6-05ea-4730-a7bc-e04553d8e238	hitesh.bansal.eee.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Hitesh Bansal	hitesh.bansal.eee.2023	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
d4ef9dd5-1950-4493-9f49-505700a39c40	aarav.tandon.csbs.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Aarav Tandon	aarav.tandon.csbs.2024	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
16f6398a-ebe3-43a8-934f-1b32cfe2e372	krishna.sethi.mech.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Krishna Sethi	krishna.sethi.mech.2024	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
dd51c305-1fb7-4ccf-820b-341ca9050c44	pihu.singh.it.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Pihu Singh	pihu.singh.it.grad	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
8c803a8b-a64a-4bdc-8ec4-c6f3f800f6ca	arya.shah.it.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Arya Shah	arya.shah.it.2024	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
c119840c-4834-4cdb-9ee6-5484ea721b7b	mohit.goyal.it.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Mohit Goyal	mohit.goyal.it.2022	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
dccdc2a1-502b-4bc7-80fb-6794c8760225	rita.bhat.chem.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Rita Bhat	rita.bhat.chem.2023	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
cd34a14d-50bd-4385-816d-87d7dac34857	arya.reddy.it.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Arya Reddy	arya.reddy.it.2023	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
babd3186-3466-4bd6-acd2-7764236a0363	nikhil.khanna.eee.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Nikhil Khanna	nikhil.khanna.eee.2023	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
9a3c9858-3cae-4b70-a5a8-08226eedd98b	ira.khanna.it.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Ira Khanna	ira.khanna.it.grad	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
b5244502-8d12-4f93-99fc-78fb2ce6bcbc	prisha.krishna.eee.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Prisha Krishna	prisha.krishna.eee.2024	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
ea58727b-8c98-4cfe-ab9b-ef43e3622a27	rudra.shah.ece.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Rudra Shah	rudra.shah.ece.2022	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.328594+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.328594+05:30
516e7b15-c702-4e1e-9b1b-d686967605f1	arya.sheth.csbs.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Arya Sheth	arya.sheth.csbs.grad	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.351471+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.351471+05:30
7df9bc12-44d8-456c-bf9e-4aa833aec4cd	yash.gupta.mech.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Yash Gupta	yash.gupta.mech.2024	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.351471+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.351471+05:30
5d112916-498f-4c55-8c73-fc204b734656	prisha.krishnan.civil.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Prisha Krishnan	prisha.krishnan.civil.2024	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.351471+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.351471+05:30
b4b0c30c-2b09-49a8-b70f-b6b3dce0b9e2	anika.krishna.aids.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Anika Krishna	anika.krishna.aids.2022	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.351471+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.351471+05:30
dd6a1e30-27a8-4086-9f33-f9061f2c9dce	arjun.das.ece.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Arjun Das	arjun.das.ece.2022	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.351471+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.351471+05:30
8ec03e7b-8d4b-4a05-9beb-fd806ce6565c	anika.sheth.civil.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Anika Sheth	anika.sheth.civil.2024	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.351471+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.351471+05:30
fbbcd147-595f-4eef-b976-366acef8ff26	sneha.sharma.civil.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Sneha Sharma	sneha.sharma.civil.2023	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.351471+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.351471+05:30
63316bd1-57f9-463b-9ede-4e4a3d9f6ebc	riya.desai.it.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Riya Desai	riya.desai.it.2023	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.351471+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.351471+05:30
e86bfe25-fc93-43ff-843b-881a1e325a34	arya.reddy.aids.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Arya Reddy	arya.reddy.aids.2023	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.351471+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.351471+05:30
38d1c541-568b-4633-a90f-098df52a24fc	nisha.rao.mech.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Nisha Rao	nisha.rao.mech.2024	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.351471+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.351471+05:30
9a5938eb-3111-47fe-a0db-b0f22b7b910f	megha.naidu.mech.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Megha Naidu	megha.naidu.mech.2022	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.351471+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.351471+05:30
bd382b69-c21e-4663-8429-ff3d18c86ed8	kavya.prasad.it.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Kavya Prasad	kavya.prasad.it.2022	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.351471+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.351471+05:30
e036f3f6-9138-48ed-b765-7f235cd26ce9	sara.raju.civil.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Sara Raju	sara.raju.civil.2024	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.351471+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.351471+05:30
c1cabec8-a494-4d1c-a8e6-f4f7367e32f0	nisha.goyal.ece.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Nisha Goyal	nisha.goyal.ece.2024	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.351471+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.351471+05:30
c4e85bd7-fa6b-43a2-9468-e8ff6bffa769	diya.khanna.civil.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Diya Khanna	diya.khanna.civil.grad	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.351471+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.351471+05:30
d52f91db-d5be-400a-9f73-2c21de928a70	avni.reddy.cse.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Avni Reddy	avni.reddy.cse.2024	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.351471+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.351471+05:30
4bc988fd-22cc-4519-89f6-a1986d540987	avni.bhatia.cse.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Avni Bhatia	avni.bhatia.cse.2022	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.351471+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.351471+05:30
17aa0235-9867-440a-8d6f-a82d1db8b11c	rajesh.singh.csbs.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Rajesh Singh	rajesh.singh.csbs.grad	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.351471+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.351471+05:30
4512afd3-6f27-49f0-a37d-b5f05d5aef6f	priya.reddy.civil.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Priya Reddy	priya.reddy.civil.2023	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.351471+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.351471+05:30
88820c0a-9bb1-4aa9-9398-8a1b3dd523d9	ananya.krishna.eee.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Ananya Krishna	ananya.krishna.eee.2022	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.351471+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.351471+05:30
0d481d32-9eaa-4f82-a570-0d6b23dd92a4	lata.krishnan.chem.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Lata Krishnan	lata.krishnan.chem.2022	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.351471+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.351471+05:30
948524bd-b789-420c-9131-c50d5c4dd800	lata.mehta.aids.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Lata Mehta	lata.mehta.aids.2022	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.351471+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.351471+05:30
0bd5466a-1c45-41cd-b2d7-d7b86362d7e9	aarav.sheth.ece.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Aarav Sheth	aarav.sheth.ece.2023	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.351471+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.351471+05:30
1ad19731-56d7-43f4-82f6-59c01d073270	mahesh.venkat.aids.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Mahesh Venkat	mahesh.venkat.aids.2023	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.351471+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.351471+05:30
a6cfa220-8502-464a-ab5d-ba4504e83ed9	navya.chatterjee.chem.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Navya Chatterjee	navya.chatterjee.chem.2022	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.351471+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.351471+05:30
e9b5e78d-e516-47c8-a5aa-501a6c34527a	sudha.malhotra.it.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Sudha Malhotra	sudha.malhotra.it.2022	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.351471+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.351471+05:30
969afff3-53d6-4b16-abeb-55235a93f793	ira.sen.ece.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Ira Sen	ira.sen.ece.grad	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.351471+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.351471+05:30
0f202db3-6443-49f0-a9c8-e8fdd79bde5b	rajesh.chopra.cse.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Rajesh Chopra	rajesh.chopra.cse.2022	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.351471+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.351471+05:30
258f881a-71e5-4771-9185-c38c2a2f8c0f	sara.modi.civil.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Sara Modi	sara.modi.civil.grad	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.351471+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.351471+05:30
5ddbc684-0c5e-4ed4-b6dd-6267708ccb4f	nikhil.banerjee.cse.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Nikhil Banerjee	nikhil.banerjee.cse.grad	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.351471+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.351471+05:30
aa87dff3-2675-4615-bb63-adf657a71dbe	dhruv.reddy.mech.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Dhruv Reddy	dhruv.reddy.mech.2022	\N	student	ascend	\N	{}	{}	2025-09-18 09:54:07.351471+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.351471+05:30
4f1b4c11-f53c-4049-9106-19ff7d460d76	ramesh.srinivas.aids.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Ramesh Srinivas	ramesh.srinivas.aids.2023	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
345cca51-12d4-4f99-b21e-573c0bab2d17	hitesh.sundaram.aids.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Hitesh Sundaram	hitesh.sundaram.aids.2024	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
c96d90a9-60b5-4344-8173-e34895981bde	krishna.sharma.ece.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Krishna Sharma	krishna.sharma.ece.2022	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
8b8e18b7-96f8-486e-8e0d-e6c4d8a44fc6	sunita.goel.mech.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Sunita Goel	sunita.goel.mech.grad	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
af0b9378-b328-4a3f-855e-5b32cd442a5e	aarush.raju.civil.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Aarush Raju	aarush.raju.civil.2022	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
f1afb4ed-be0f-4d69-9ea3-52238d7b61ed	mamta.sharma.mech.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Mamta Sharma	mamta.sharma.mech.2023	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
27b07006-e253-4fdb-a0b7-32c4ecc00550	savita.das.cse.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Savita Das	savita.das.cse.2024	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
43cdce4b-f241-4620-8b56-0b7f19dfae02	avni.krishnan.chem.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Avni Krishnan	avni.krishnan.chem.2023	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
49417a0e-0f43-45fb-a5a6-cb47b5582d68	suresh.prasad.chem.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Suresh Prasad	suresh.prasad.chem.2024	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
2c363200-f236-45f5-921e-30e422c0da55	tara.roy.chem.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Tara Roy	tara.roy.chem.2022	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
5b91c7ef-dd6e-4171-98fd-26e71ba7ae37	nikhil.sethi.civil.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Nikhil Sethi	nikhil.sethi.civil.2023	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
99c8e1ed-033d-4168-b100-561f0f787f0a	navya.rao.chem.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Navya Rao	navya.rao.chem.grad	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
d57f7718-1b5f-4889-97a3-76a96a238540	rohit.dutta.civil.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Rohit Dutta	rohit.dutta.civil.2024	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
3b8ea21c-bd1d-4aae-881c-31e206f27fa4	mamta.goyal.ece.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Mamta Goyal	mamta.goyal.ece.2022	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
222d6cce-5115-47ec-8741-53f80b1f982d	ajit.naidu.chem.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Ajit Naidu	ajit.naidu.chem.2024	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
bc3ed184-936a-4a5b-a729-603f224d2d92	prisha.gupta.csbs.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Prisha Gupta	prisha.gupta.csbs.2022	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
6390f8d9-cb13-4e71-b183-05ef511eca27	lalit.joshi.ece.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Lalit Joshi	lalit.joshi.ece.grad	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
dfff0dd7-a46f-48d1-9383-43354cadae5d	aryan.ghosh.ece.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Aryan Ghosh	aryan.ghosh.ece.grad	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
2e1967b7-3996-4e17-9f07-98719fec9395	savita.krishna.cse.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Savita Krishna	savita.krishna.cse.grad	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
92e14451-1c2f-44cc-a2bf-6dc01d6f065e	aarush.roy.ece.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Aarush Roy	aarush.roy.ece.grad	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
272d5a56-b416-406c-803b-47d851843bb7	arya.sheth.ece.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Arya Sheth	arya.sheth.ece.grad	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
74c281cc-ef5b-4777-93b8-6e8bf18fafe8	dinesh.raman.aids.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Dinesh Raman	dinesh.raman.aids.2022	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
da9f3e59-cbd1-4ea8-bb78-3ce6778355ae	hitesh.sarkar.aids.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Hitesh Sarkar	hitesh.sarkar.aids.2024	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
e2115245-68b0-4784-8f4a-3fb6be8c47c1	lalit.sundaram.civil.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Lalit Sundaram	lalit.sundaram.civil.2023	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
f793aced-67ea-4245-98bf-69d86c74d042	mamta.banerjee.cse.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Mamta Banerjee	mamta.banerjee.cse.2024	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
af142fab-4ebc-4e45-9d6e-c6c17eda1f9d	ira.sarkar.eee.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Ira Sarkar	ira.sarkar.eee.2024	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
79af793e-5d26-4f6d-9e53-66bbe0608925	usha.murthy.cse.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Usha Murthy	usha.murthy.cse.2024	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
ecba650c-0e82-4a85-81c8-9a46c5444cc4	tara.pandya.eee.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Tara Pandya	tara.pandya.eee.2024	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
9f80f1d7-d873-45f0-bdf2-e9352e1abf11	nisha.goel.eee.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Nisha Goel	nisha.goel.eee.2023	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
5b41f31a-49ce-407c-a59b-b1b277d08a0a	mukesh.vyas.mech.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Mukesh Vyas	mukesh.vyas.mech.2024	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
747be3ea-88ed-4ac3-a6a3-bd69028c307b	sara.khanna.mech.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Sara Khanna	sara.khanna.mech.grad	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
44a99bf6-b72c-45a4-9916-068bb79c4e8d	sara.verma.mech.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Sara Verma	sara.verma.mech.grad	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
8eb5432b-f272-4745-abb5-29d0e6ddffc5	dinesh.jain.eee.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Dinesh Jain	dinesh.jain.eee.2023	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
9048a0e5-4e56-4a30-bbaf-53a02b93f316	shaurya.murthy.mech.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Shaurya Murthy	shaurya.murthy.mech.2022	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
739d8de7-e9fc-441d-a96e-ad37421098da	rudra.joshi.it.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Rudra Joshi	rudra.joshi.it.2024	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
7d668d6b-f685-4911-a305-047d7aa56b28	sudha.naidu.aids.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Sudha Naidu	sudha.naidu.aids.grad	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
baa97680-8d21-4a55-80ae-64528c842921	megha.patel.ece.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Megha Patel	megha.patel.ece.2024	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
1364b212-79f4-424c-9a02-bf30949cf209	mohit.shah.eee.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Mohit Shah	mohit.shah.eee.2023	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
00ce99e7-fb36-40f6-b4eb-5641dd55a34f	nisha.goel.chem.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Nisha Goel	nisha.goel.chem.2022	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
741d6125-35f5-4ac6-9b92-0a943051dafc	aarav.shah.ece.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Aarav Shah	aarav.shah.ece.grad	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
e29a1043-e3e8-45ec-9e09-a8da48d2bb1b	anvi.joshi.ece.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Anvi Joshi	anvi.joshi.ece.grad	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
10c8cccc-ec4f-4e6b-87b5-6249996e0454	usha.thakkar.cse.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Usha Thakkar	usha.thakkar.cse.grad	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
618b2f5b-a891-4acb-9e0f-4de13a7a854e	geeta.jain.chem.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Geeta Jain	geeta.jain.chem.2022	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
1e6ee6a2-5f08-47e6-964a-9b107164bab5	vedant.menon.csbs.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Vedant Menon	vedant.menon.csbs.2023	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
953a6590-9470-4ac2-83a4-81f802dc5602	ira.raman.eee.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Ira Raman	ira.raman.eee.2024	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
8da1a61b-848b-48ab-a09f-4aeaad47476d	nisha.chopra.aids.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Nisha Chopra	nisha.chopra.aids.2024	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
e1e32e12-f57f-410d-a56e-4dcd0c3526ed	savita.khanna.ece.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Savita Khanna	savita.khanna.ece.2023	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
63db6ecf-4be2-47e6-a99f-a00d0bb22b63	pihu.menon.chem.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Pihu Menon	pihu.menon.chem.2023	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
43c9973d-6179-4bef-a0a9-8d6da6b7c4e2	mahesh.bose.csbs.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Mahesh Bose	mahesh.bose.csbs.grad	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.367069+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.367069+05:30
6a52f0fb-65e4-4dea-9adb-6e6ac69a7620	lata.krishna.chem.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Lata Krishna	lata.krishna.chem.grad	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.38479+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.38479+05:30
71c3fcbc-dfbc-47a6-9e63-74e85ad7d488	tara.bhat.cse.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Tara Bhat	tara.bhat.cse.2024	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.38479+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.38479+05:30
d0f7a591-91fe-45e0-82eb-eef9413f7292	krishna.pillai.aids.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Krishna Pillai	krishna.pillai.aids.2024	\N	student	aster	\N	{}	{}	2025-09-18 09:54:07.38479+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.38479+05:30
b18312b8-7028-4741-8ba7-58f913e6900b	ira.venkat.ece.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Ira Venkat	ira.venkat.ece.2024	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
baa5e01a-03f2-4f5b-bb02-9ac1bee12a89	savita.verma.ece.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Savita Verma	savita.verma.ece.grad	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
8aaa38fc-21a0-4fd4-a756-492dcb0cf9fe	usha.goyal.civil.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Usha Goyal	usha.goyal.civil.2024	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
4155a5f3-f02e-4dbf-aa53-a3668bac3951	mohit.bhatia.mech.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Mohit Bhatia	mohit.bhatia.mech.grad	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
c4b413ee-4abe-452a-bd1b-61216e1f507e	aarav.joshi.mech.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Aarav Joshi	aarav.joshi.mech.2023	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
1296b68e-ee4e-495a-8813-4277e7c0b4bb	myra.sundaram.chem.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Myra Sundaram	myra.sundaram.chem.2022	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
d07c1a56-6d7c-40ea-8534-fec7565d31e7	vedant.thakkar.aids.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Vedant Thakkar	vedant.thakkar.aids.2024	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
588e7c5d-3fdf-4c3f-b498-9455c6c9956d	sachin.raju.mech.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Sachin Raju	sachin.raju.mech.2023	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
55254256-01ce-4d77-bf11-369466c4a024	kiara.sarkar.cse.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Kiara Sarkar	kiara.sarkar.cse.2023	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
333586c1-3015-4219-ad23-4e4cf2264e7f	usha.murthy.civil.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Usha Murthy	usha.murthy.civil.2023	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
fdd26cf3-97fc-4cd4-872f-15c51dd89ec6	aarav.chandra.ece.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Aarav Chandra	aarav.chandra.ece.grad	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
a0c14c4b-530b-42df-b589-cc04f1a1a468	sachin.raman.ece.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Sachin Raman	sachin.raman.ece.2023	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
abb6dab7-468b-4224-9c07-0c0fb0e7ec68	dhruv.krishnan.it.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Dhruv Krishnan	dhruv.krishnan.it.2023	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
a5b745da-eeb7-4ded-95fa-5036e03d3125	ayaan.desai.aids.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Ayaan Desai	ayaan.desai.aids.2023	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
93cb9411-e541-420f-954b-2e35740fb479	ramesh.venkat.civil.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Ramesh Venkat	ramesh.venkat.civil.2024	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
e83382d5-f7c2-4900-bd22-44603b4294f1	geeta.sethi.chem.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Geeta Sethi	geeta.sethi.chem.2024	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
1196a455-a390-4cae-821b-5a0cdb299bb2	lata.menon.eee.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Lata Menon	lata.menon.eee.grad	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
efe3b959-e009-44a4-88f9-7be30194cdb0	kiara.patel.mech.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Kiara Patel	kiara.patel.mech.2022	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
d4b64602-ff9c-4009-82e6-deba3a87de52	riya.naidu.civil.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Riya Naidu	riya.naidu.civil.2022	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
52c57813-3d17-43db-ad28-11881129965b	aditya.desai.eee.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Aditya Desai	aditya.desai.eee.2024	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
17a7d81f-d156-4701-86c9-b8938cd12568	neha.verma.it.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Neha Verma	neha.verma.it.2024	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
ba93ceb7-b456-4d81-a2a4-75391ecee51a	sneha.mehta.chem.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Sneha Mehta	sneha.mehta.chem.grad	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
1e5f88d6-ebd4-4ec2-ba4e-6261b1626bfe	priya.kumar.cse.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Priya Kumar	priya.kumar.cse.grad	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
cf5934f8-e041-4dbd-bda1-c7a4532ee468	jignesh.krishnan.csbs.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Jignesh Krishnan	jignesh.krishnan.csbs.2024	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
c3a2589e-dff1-40c3-a59e-ef29cf4c42df	seeta.bhatia.civil.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Seeta Bhatia	seeta.bhatia.civil.2023	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
883831a7-c437-4fe4-9774-88db0103a5d1	varun.chopra.cse.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Varun Chopra	varun.chopra.cse.2022	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
6e2de18f-0fe9-469b-a8a7-8643812030c1	atharv.sheth.aids.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Atharv Sheth	atharv.sheth.aids.2024	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
7da89033-5a11-4148-b1dc-16435f17b069	naresh.bose.mech.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Naresh Bose	naresh.bose.mech.2022	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
d7274c11-d1d6-4df3-8468-188bd2e5dcbc	anika.chopra.it.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Anika Chopra	anika.chopra.it.2024	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
f64d0be6-ffad-49ac-a8b2-b50d43f42dd3	riya.mukherjee.it.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Riya Mukherjee	riya.mukherjee.it.2022	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
aa548ac7-913a-47db-91bf-a3d3046754ca	vivaan.chatterjee.csbs.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Vivaan Chatterjee	vivaan.chatterjee.csbs.2024	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
6435a57e-e910-4104-a163-b49943024b77	radha.sundaram.aids.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Radha Sundaram	radha.sundaram.aids.2023	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
f34ba402-f733-4977-832d-c3cdc54284ae	hitesh.singhal.chem.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Hitesh Singhal	hitesh.singhal.chem.2023	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
3d5ad263-47a6-46b8-a886-a7a9c3d2ad1c	nisha.prasad.aids.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Nisha Prasad	nisha.prasad.aids.grad	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
06036f36-593e-4850-b36c-cc1d2354b78d	rekha.ghosh.ece.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Rekha Ghosh	rekha.ghosh.ece.2022	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
15671ce3-a7fc-42a4-95a9-12ea19f90072	ishika.sharma.civil.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Ishika Sharma	ishika.sharma.civil.2023	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
cf73c4fb-4ae1-4c9c-8e0c-88fc291b0d0d	tara.agarwal.aids.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Tara Agarwal	tara.agarwal.aids.2024	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
14c2825e-09bf-4451-a465-c95ae4284a6a	riya.singh.chem.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Riya Singh	riya.singh.chem.2024	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
2446753e-56f6-4051-9ac5-43cc1bc88e81	aditya.kumar.civil.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Aditya Kumar	aditya.kumar.civil.2023	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
7b927dfb-7e4a-40b3-b9d6-f0690d5939b3	riya.nair.chem.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Riya Nair	riya.nair.chem.2022	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
07190594-c37f-4ac0-bcfa-cb68ed30d242	vihaan.kumar.chem.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Vihaan Kumar	vihaan.kumar.chem.2022	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
4c71d5d7-a700-4efe-9704-5d907e44a49f	akhil.mehta.csbs.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Akhil Mehta	akhil.mehta.csbs.2023	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
4636a0ae-4ae1-4e50-9dc4-20f1f6304096	kairav.tandon.chem.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Kairav Tandon	kairav.tandon.chem.2023	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
4921379b-1277-497c-8659-47e4156a5774	aditya.goel.chem.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Aditya Goel	aditya.goel.chem.2022	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
e711111e-b1b6-4a2d-8b25-a028853c901a	mohit.sharma.civil.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Mohit Sharma	mohit.sharma.civil.2023	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
0a4a5eb1-afa7-4285-9fef-3b57b937103d	ramesh.dutta.csbs.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Ramesh Dutta	ramesh.dutta.csbs.2022	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
dbe6f91c-7526-44ea-bdfb-d38d083530f6	arya.vyas.aids.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Arya Vyas	arya.vyas.aids.2024	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
066bd297-28e7-4157-b4e2-25e64bd3834c	rohit.murthy.cse.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Rohit Murthy	rohit.murthy.cse.grad	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
2a170eb4-eef2-4936-bd8f-8ef6fed7499d	ramesh.sen.civil.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Ramesh Sen	ramesh.sen.civil.grad	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
2300b5d3-beda-4fee-912c-3b6674025dc2	rita.sundaram.csbs.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Rita Sundaram	rita.sundaram.csbs.grad	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.386618+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.386618+05:30
3671347e-912b-49bf-897a-bc97e7f31916	vihaan.chopra.it.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Vihaan Chopra	vihaan.chopra.it.grad	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.406578+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.406578+05:30
3f925245-2286-4eae-bb5a-c3bf53c556df	yash.menon.ece.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Yash Menon	yash.menon.ece.grad	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.406578+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.406578+05:30
96c936f6-ff6e-4c92-808f-fbf95767b527	rita.mukherjee.aids.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Rita Mukherjee	rita.mukherjee.aids.grad	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.406578+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.406578+05:30
fcea31b5-b267-45e7-a65b-760c59071eb5	ishaan.murthy.mech.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Ishaan Murthy	ishaan.murthy.mech.2023	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.406578+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.406578+05:30
b9fefb31-2996-4e4b-854e-6173dffdcce3	advait.sharma.aids.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Advait Sharma	advait.sharma.aids.2022	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.406578+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.406578+05:30
2aed1d75-95a1-49de-abd7-3f3e972b96b9	akhil.khanna.chem.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Akhil Khanna	akhil.khanna.chem.2022	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.406578+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.406578+05:30
3c0310f4-0e98-4a8b-823e-32a128b1188e	rudra.nair.civil.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Rudra Nair	rudra.nair.civil.2023	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.406578+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.406578+05:30
d542af11-6ee7-4957-b7fa-159aa92d4032	ira.gupta.cse.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Ira Gupta	ira.gupta.cse.2022	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.406578+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.406578+05:30
06f6aac9-cfe1-411b-8dd9-5cb7b53623b4	disha.kumar.ece.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Disha Kumar	disha.kumar.ece.2023	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.406578+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.406578+05:30
b6ea4ca7-00f7-41ef-8ce3-b7d6c67e1b92	advait.khanna.it.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Advait Khanna	advait.khanna.it.2024	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.406578+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.406578+05:30
2cb44d7b-1b38-41ee-8327-71d0b012aaa8	dhruv.murthy.aids.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Dhruv Murthy	dhruv.murthy.aids.2024	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.406578+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.406578+05:30
3dfb448a-f5c3-4002-bb33-1d104fd20ee3	kairav.goyal.cse.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Kairav Goyal	kairav.goyal.cse.2022	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.406578+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.406578+05:30
f985359b-f604-40a2-ae66-11e673ae8cc5	akhil.bhat.cse.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Akhil Bhat	akhil.bhat.cse.2022	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.406578+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.406578+05:30
dab3aee6-6af4-4873-af15-37cadc6cf86d	savita.tandon.aids.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Savita Tandon	savita.tandon.aids.2024	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.406578+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.406578+05:30
42926f16-66a7-4773-bc41-e7f45a8ac247	riya.joshi.mech.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Riya Joshi	riya.joshi.mech.2024	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.406578+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.406578+05:30
fdaf03b4-1497-425a-9146-3a76f1029ed4	ramesh.goyal.mech.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Ramesh Goyal	ramesh.goyal.mech.2024	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.406578+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.406578+05:30
f7de5f20-0c01-4718-8f43-e0a7458b90f1	pihu.krishnan.chem.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Pihu Krishnan	pihu.krishnan.chem.grad	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.406578+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.406578+05:30
a73c5134-712b-46c8-bd70-c6867092de3e	neha.krishna.it.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Neha Krishna	neha.krishna.it.2024	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.406578+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.406578+05:30
db079ff1-55e6-4f53-bd93-f942beccb239	priya.srinivas.cse.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Priya Srinivas	priya.srinivas.cse.2024	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.406578+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.406578+05:30
c5f7f24a-2ed9-41d6-9186-ae92590ad41d	vihaan.srinivas.mech.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Vihaan Srinivas	vihaan.srinivas.mech.grad	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.406578+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.406578+05:30
ea39f055-7cf4-4837-b82f-8a36d6c8f7a6	sachin.mehta.civil.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Sachin Mehta	sachin.mehta.civil.2024	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.406578+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.406578+05:30
1de62976-1c2e-4a1c-96bd-bb8ff8a9306a	riya.chandra.it.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Riya Chandra	riya.chandra.it.grad	\N	student	achievers	\N	{}	{}	2025-09-18 09:54:07.406578+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.406578+05:30
f6ff25db-9d05-4145-b0bf-eb0a9f403119	sachin.prasad.cse.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Sachin Prasad	sachin.prasad.cse.grad	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
6b552eb4-a4eb-41dd-8db1-0d80843b68ef	aditya.mukherjee.eee.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Aditya Mukherjee	aditya.mukherjee.eee.grad	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
e3e040e6-2b37-467b-aa92-4c4987ec74f7	amit.kumar.ece.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Amit Kumar	amit.kumar.ece.2022	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
465356b6-39dd-44cb-91c8-b29c9a04f4b5	nisha.singh.aids.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Nisha Singh	nisha.singh.aids.2022	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
fe92388c-92c7-422b-b223-35966f52e805	arjun.das.it.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Arjun Das	arjun.das.it.grad	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
717269a6-7bb1-4d2f-826d-606f6e12e05a	ira.raju.mech.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Ira Raju	ira.raju.mech.2023	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
234f4ab1-3cc5-45ae-b57b-f508cae2230e	rudra.malhotra.it.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Rudra Malhotra	rudra.malhotra.it.2024	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
4f98318c-d90a-45cc-88b4-2e4c29404669	mohit.sen.csbs.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Mohit Sen	mohit.sen.csbs.grad	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
5fd73003-f42f-4262-9e8d-a654843c7aba	krishna.dutta.csbs.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Krishna Dutta	krishna.dutta.csbs.2024	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
88cb2af1-1193-4283-8f5f-3b1513d41999	kairav.rao.ece.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Kairav Rao	kairav.rao.ece.grad	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
3c0ceb61-764b-45a7-88de-4405d04a681d	vihaan.kumar.eee.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Vihaan Kumar	vihaan.kumar.eee.2023	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
de385e06-4718-4f3d-8aa5-cefd7133b79f	atharv.kumar.ece.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Atharv Kumar	atharv.kumar.ece.2023	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
58afc09b-40d8-4774-a9e4-d0dbaf3a320f	aryan.iyer.it.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Aryan Iyer	aryan.iyer.it.2024	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
e86b44bd-b5fd-4b57-9b52-11aa0bc693b1	naresh.sarkar.civil.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Naresh Sarkar	naresh.sarkar.civil.2023	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
3903c13a-e086-4a28-9336-11a5e2af9ef7	reyansh.bansal.it.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Reyansh Bansal	reyansh.bansal.it.2024	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
482a6cfa-8497-449a-bdde-c2d898a9e215	dhruv.goyal.aids.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Dhruv Goyal	dhruv.goyal.aids.2023	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
0ea91a60-6a08-437f-a089-4b33dbba9f8c	rajesh.dutta.csbs.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Rajesh Dutta	rajesh.dutta.csbs.grad	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
c23999a3-5baa-4cdf-9b82-2a314c20f6b9	arjun.vyas.mech.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Arjun Vyas	arjun.vyas.mech.2024	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
abb68ef2-2088-4ab8-be02-da525934eb58	asha.agarwal.eee.2022@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Asha Agarwal	asha.agarwal.eee.2022	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
b494b968-3d04-434e-914c-c83a998df7d8	rajesh.tandon.it.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Rajesh Tandon	rajesh.tandon.it.grad	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
7a7cf0db-2270-41d5-9eff-7ce114b2c9f7	reyansh.khanna.cse.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Reyansh Khanna	reyansh.khanna.cse.2024	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
96ed8413-d286-494c-9193-94c5df18c332	varun.krishna.cse.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Varun Krishna	varun.krishna.cse.2023	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
bfd29cec-50f9-4f35-8c6e-ed8470556fe7	varun.goyal.aids.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Varun Goyal	varun.goyal.aids.2023	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
490a5350-2cce-4765-995a-fa1f0d8c61d0	ajit.roy.ece.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Ajit Roy	ajit.roy.ece.2024	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
08f4f5d4-d28f-403c-8225-15576e2fb692	hitesh.murthy.cse.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Hitesh Murthy	hitesh.murthy.cse.grad	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
4112c950-6b4a-4a39-ae53-58734ba0675b	geeta.sharma.mech.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Geeta Sharma	geeta.sharma.mech.grad	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
9ef27827-5b57-4194-84b7-d44d4fb1da57	atharv.bhatia.it.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Atharv Bhatia	atharv.bhatia.it.grad	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
8fc2a9dd-3565-42d5-a65b-3f948ce046d4	savita.venkat.civil.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Savita Venkat	savita.venkat.civil.grad	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
fe427f69-106a-4ebb-8415-c92965084246	aarav.vyas.ece.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Aarav Vyas	aarav.vyas.ece.2023	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
af5a33e1-43cb-4e32-b120-4c53bba19b1e	jignesh.prasad.chem.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Jignesh Prasad	jignesh.prasad.chem.2023	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
a1129a33-cad2-49ea-aece-910e1b9fa9f0	vedant.menon.mech.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Vedant Menon	vedant.menon.mech.2023	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
7bd30579-8548-4fa6-a451-d738af86c264	aditya.venkat.eee.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Aditya Venkat	aditya.venkat.eee.2024	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
5fa319e5-cdcc-4ac5-b90a-54a78ef99efc	riya.menon.cse.2023@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Riya Menon	riya.menon.cse.2023	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
1eda73be-2c3d-4a14-8e90-cd05278d45ec	amit.iyer.civil.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Amit Iyer	amit.iyer.civil.grad	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
6c504779-5a21-41bc-8130-7b5357830cb4	sunita.raju.cse.grad@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Sunita Raju	sunita.raju.cse.grad	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
dbb737b9-c4a1-4f95-b4cf-c0110d261a2b	disha.bose.eee.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Disha Bose	disha.bose.eee.2024	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
3e6a0b6b-cdc8-4078-a7fc-0dbb57129ac6	vedant.pillai.eee.2024@stvincentngp.edu.in	$2b$10$MiaS4kQbzsLtiJc4QpnbfecyRC9ho/wEnyv4eraiyi6wUD/QyJk8K	Vedant Pillai	vedant.pillai.eee.2024	\N	student	artovert	\N	{}	{}	2025-09-18 09:54:07.419025+05:30	2025-09-18 13:22:18.235846+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-09-18 09:54:07.419025+05:30
466f3cb4-18bb-485e-827a-e5290cedd969	samiksha.dhawas@zenith.edu	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Samiksha Dhawas	\N	\N	student	artovert	\N	{}	{}	2025-08-26 00:30:57.789111+05:30	2025-09-18 13:22:18.235846+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=samiksha	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:30:57.789111+05:30
516a1eee-d8f9-4283-8cfb-740c0387ca8c	vidhimenghare0305@gmail.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Vidhi Pravin Menghare	\N	\N	co_coordinator	aster	\N	{}	{}	2025-08-26 00:30:57.789111+05:30	2025-09-18 13:46:43.034129+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=vidhi	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:30:57.789111+05:30
5a3749b1-618a-4314-b6ab-74d534f568e2	burdeishika@gmail.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Ishika Burde	\N	\N	student	artovert	\N	{}	{}	2025-08-26 00:30:57.789111+05:30	2025-09-18 14:00:24.467624+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=radha	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:30:57.789111+05:30
\.


--
-- TOC entry 4439 (class 0 OID 20072)
-- Dependencies: 278
-- Data for Name: users_backup; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users_backup (id, email, password_hash, name, username, avatar, role, club_id, bio, social_links, preferences, created_at, updated_at, profile_image_url, profile_images, verification_photo_url, phone_number, date_of_birth, address, emergency_contact, phone, location, website, github, linkedin, twitter, email_verified, email_verification_token, email_verification_token_expires_at, password_reset_token, password_reset_token_expires_at, oauth_provider, oauth_id, oauth_data, has_password, totp_secret, totp_temp_secret, totp_temp_secret_created_at, totp_enabled, totp_enabled_at, totp_recovery_codes, notification_preferences, email_otp_enabled, email_otp_verified, email_otp_secret, email_otp_backup_codes, email_otp_last_used, email_otp_created_at, email_otp, email_otp_expires_at, last_activity) FROM stdin;
204a06d7-e042-4c19-8e97-b0f2d8ad1271	dev.joshi2025@example.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Dev Joshi	\N	\N	student	\N	\N	{}	{}	2025-08-26 00:06:34.686581+05:30	2025-09-16 15:43:45.251418+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=dev	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:06:34.686581+05:30
086ebbaa-f6dd-4ce4-a836-246833f9573c	aditi.jain2025@example.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Aditi Jain	\N	\N	student	\N	\N	{}	{}	2025-08-26 00:06:34.686581+05:30	2025-09-16 15:43:45.251418+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=aditi	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:06:34.686581+05:30
19124f5e-a896-4728-bb75-701f616c7716	rohan.kumar2025@example.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Rohan Kumar	\N	\N	student	\N	\N	{}	{}	2025-08-26 00:06:34.686581+05:30	2025-09-16 15:43:45.251418+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=rohan	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:06:34.686581+05:30
1ac23e35-54f9-4e34-8ff3-bfff79885d88	riya.shah2025@example.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Riya Shah	\N	\N	student	\N	\N	{}	{}	2025-08-26 00:06:34.686581+05:30	2025-09-16 15:43:45.251418+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=riya	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:06:34.686581+05:30
571ebb33-aeb5-4861-87a0-0c442bae3a6b	rahul.sharma2025@example.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Rahul Sharma	\N	\N	student	\N	\N	{}	{}	2025-08-26 00:06:34.686581+05:30	2025-09-16 15:43:45.251418+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=rahul	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:06:34.686581+05:30
63fd6cb0-d546-448b-9fdc-5cb407f61d6a	kavya.reddy2025@example.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Kavya Reddy	\N	\N	student	\N	\N	{}	{}	2025-08-26 00:06:34.686581+05:30	2025-09-16 15:43:45.251418+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=kavya	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:06:34.686581+05:30
6e11229a-a444-4e8b-8b56-e8b6536302d5	sneha.agarwal2025@example.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Sneha Agarwal	\N	\N	student	\N	\N	{}	{}	2025-08-26 00:06:34.686581+05:30	2025-09-16 15:43:45.251418+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=sneha	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:06:34.686581+05:30
70672185-25b9-41b5-bae0-e74ea1a26db9	vikram.singh2025@example.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Vikram Singh	\N	\N	student	\N	\N	{}	{}	2025-08-26 00:06:34.686581+05:30	2025-09-16 15:43:45.251418+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=vikram	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:06:34.686581+05:30
ec962745-fe2f-4079-b859-7d86bf711c20	arjun.nair2025@example.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Arjun Nair	\N	\N	student	\N	\N	{}	{}	2025-08-26 00:06:34.686581+05:30	2025-09-16 15:43:45.251418+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=arjun	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:06:34.686581+05:30
febf3dd5-655c-4e18-86a9-2abbf245cb16	vedant.wardhana@zenith.edu	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Vedanti Wandhare	\N	\N	student	\N	\N	{}	{}	2025-08-26 00:30:57.789111+05:30	2025-09-16 15:43:45.251418+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=vedant	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:30:57.789111+05:30
1351d77c-38fe-4dd3-84bd-7d9aff156a82	yagneshwar.chaudhari@zenith.edu	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Yogeshvar Chaudhari	\N	https://qpulpytptbwwumicyzwr.supabase.co/storage/v1/object/public/avatars/profile_7c36ecbe-44d3-40df-8b8b-886e5385e839_1755673151393_Screenshot%202025-08-20%20120444.png	student	\N	\N	{}	{}	2025-08-26 00:28:40.87628+05:30	2025-09-16 15:43:45.251418+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:28:40.87628+05:30
17254128-6271-484c-bec9-756ff7f7a043	mansavi.giradkar@zenith.edu	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Mansavi Giradkar	\N	https://qpulpytptbwwumicyzwr.supabase.co/storage/v1/object/public/avatars/profile_53cbed56-2bc7-4faf-bd6e-5f953de4dfa5_1755673094883_Screenshot%202025-08-20%20120312.png	student	\N	\N	{}	{}	2025-08-26 00:28:40.87628+05:30	2025-09-16 15:43:45.251418+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:28:40.87628+05:30
8397062d-0b15-4115-9ee3-3e2f4bef0e36	isha.bansal2025@example.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Isha Bansal	\N	\N	student	\N	\N	{}	{}	2025-08-26 00:06:34.686581+05:30	2025-09-16 15:43:45.251418+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=isha	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:06:34.686581+05:30
85831284-34d0-4724-90c2-26e6204c1428	nikhil.verma2025@example.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Nikhil Verma	\N	\N	student	\N	\N	{}	{}	2025-08-26 00:06:34.686581+05:30	2025-09-16 15:43:45.251418+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=nikhil	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:06:34.686581+05:30
924ede2a-5fd4-4e9d-9a28-95438e5b4898	kaivalya.pund@zenith.edu	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Kaiwalya Pund	\N	https://qpulpytptbwwumicyzwr.supabase.co/storage/v1/object/public/avatars/profile_9755eab9-39cb-443b-9cca-853d727afe40_1755672871466_Screenshot%202025-08-20%20120548.png	student	\N	\N	{}	{}	2025-08-26 00:28:40.87628+05:30	2025-09-16 15:43:45.251418+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:28:40.87628+05:30
9e494d57-59b3-48d0-a140-f131099a0a11	harsh.pandey2025@example.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Harsh Pandey	\N	\N	student	\N	\N	{}	{}	2025-08-26 00:06:34.686581+05:30	2025-09-16 15:43:45.251418+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=harsh	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:06:34.686581+05:30
b9f1d273-57c1-4ba4-9411-5495254ff797	karan.mehta2025@example.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Karan Mehta	\N	\N	student	\N	\N	{}	{}	2025-08-26 00:06:34.686581+05:30	2025-09-16 15:43:45.251418+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=karan	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:06:34.686581+05:30
bca6518e-d6ec-4489-9422-1898f5086ba4	anita.gupta2025@example.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Anita Gupta	\N	\N	student	\N	\N	{}	{}	2025-08-26 00:06:34.686581+05:30	2025-09-16 15:43:45.251418+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=anita	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:06:34.686581+05:30
c088cdf3-11ff-408d-b95a-1f50bb794c27	sanjeed.kabarle@zenith.edu	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Sanved Kabade	\N	\N	student	\N	\N	{}	{}	2025-08-26 00:30:57.789111+05:30	2025-09-16 15:43:45.251418+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=sanjeed	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:30:57.789111+05:30
e624fa3f-bb9f-4da6-b569-c6a22904b389	priya.patel2025@example.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Priya Patel	\N	\N	student	\N	\N	{}	{}	2025-08-26 00:06:34.686581+05:30	2025-09-16 15:43:45.251418+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=priya	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:06:34.686581+05:30
550e8400-e29b-41d4-a716-446655440001	superadmin@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Super Admin	superadmin	\N	admin	\N	Super administrator overseeing all clubs	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440023	aster.media@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	ASTER Media Head	aster_media	\N	media	aster	Media coordinator for ASTER club	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440033	achievers.media@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	ACHIEVERS Media Head	achievers_media	\N	media	achievers	Media coordinator for ACHIEVERS club	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440100	student1.ascend@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Alice Johnson	alice_j	\N	student	ascend	Computer Science student passionate about coding	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440101	student2.ascend@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Bob Smith	bob_s	\N	student	ascend	Software Engineering student interested in web development	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440102	student3.ascend@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Charlie Brown	charlie_b	\N	student	ascend	Data Science student exploring machine learning	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440200	student1.aster@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Frank Miller	frank_m	\N	student	aster	Communication student focusing on interpersonal skills	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440201	student2.aster@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Grace Lee	grace_l	\N	student	aster	Leadership development and team building enthusiast	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440202	student3.aster@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Henry Wilson	henry_w	\N	student	aster	Public speaking and presentation skills specialist	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440300	student1.achievers@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Karen White	karen_w	\N	student	achievers	Preparing for competitive exams and higher studies	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440301	student2.achievers@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Liam Garcia	liam_g	\N	student	achievers	Research and academic excellence focused	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440302	student3.achievers@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Maya Patel	maya_p	\N	student	achievers	Graduate school preparation and academic mentorship	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
466f3cb4-18bb-485e-827a-e5290cedd969	samiksha.dhawas@zenith.edu	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Samiksha Dhawas	\N	\N	student	\N	\N	{}	{}	2025-08-26 00:30:57.789111+05:30	2025-09-16 15:43:45.251418+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=samiksha	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:30:57.789111+05:30
5a3749b1-618a-4314-b6ab-74d534f568e2	radha.tadas@zenith.edu	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Radha Tadas	\N	\N	student	\N	\N	{}	{}	2025-08-26 00:30:57.789111+05:30	2025-09-16 15:43:45.251418+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=radha	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:30:57.789111+05:30
8fcc0b11-a2d9-4463-a83c-c1a1370325a6	madhura.shende@zenith.edu	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Madhura Shende	\N	\N	student	\N	\N	{}	{}	2025-08-26 00:30:57.789111+05:30	2025-09-16 15:43:45.251418+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=madhura	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:30:57.789111+05:30
e75ebfdc-b1e8-440c-a987-c77306ab8348	tejasri.rinait@zenith.edu	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Tejasi Rinait	\N	\N	student	\N	\N	{}	{}	2025-08-26 00:30:57.789111+05:30	2025-09-16 15:43:45.251418+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=tejasri	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:30:57.789111+05:30
550e8400-e29b-41d4-a716-446655440000	admin@zenith.com	$2b$12$ufmFf8S.K53iJlEisoy4seTE/Sy9pEm7H3FOXb4wcGMAs37FkFIEa	Admin User	admin	\N	admin	ascend	System administrator with full access	{}	{}	2025-07-27 13:47:32.966+05:30	2025-09-16 22:12:38.7155+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
5aaf2cd5-eac6-4303-8c0c-d60e56576dc8	test.api.1754509297076@example.com	$2b$12$SVqXLWt/AmAFGIKaPpQ8A.TaSW6VMd7Et8hrttFvPSXLMd1EaWF1i	Test User 1754509297076	\N	\N	student	ascend	\N	{}	{}	2025-08-07 01:11:38.307+05:30	2025-08-07 01:11:38.307+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440012	ascend.secretary@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Mohit Telang	ascend_secretary	\N	secretary	ascend	Secretary managing ASCEND documentation	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-08 22:11:35.038+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440013	ascend.media@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Aditya Yelne 	ascend_media	\N	media	ascend	Media coordinator for ASCEND club	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-08 22:11:44.008+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440021	aster.co-coordinator@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Gargi Udapure 	aster_co_coord	\N	co_coordinator	aster	Co-coordinator supporting ASTER activities	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-08 22:12:15.856+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440022	aster.secretary@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Sahil Shrivastava 	aster_secretary	\N	secretary	aster	Secretary managing ASTER documentation	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-08 22:13:26.458+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440030	achievers.coordinator@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Paritosh Magare	achievers_coord	\N	coordinator	achievers	Lead coordinator for ACHIEVERS higher studies club	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-08 22:14:49.879+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440031	achievers.co-coordinator@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Aayushi Asole	achievers_co_coord	\N	co_coordinator	achievers	Co-coordinator supporting ACHIEVERS activities	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-08 22:15:09.603+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440032	achievers.secretary@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Mayur Aglawe 	achievers_secretary	\N	secretary	achievers	Secretary managing ACHIEVERS documentation	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-08 22:16:19.5+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
cc0b35da-a560-416e-9366-00680dead616	test.api.manual@example.com	$2b$12$kTGtfsK6x1YSTPLP8HVX2Og5DyKMmwsQY3SOJ1ckIgBHhaIIrcKr6	Manual Test User	\N	\N	student	ascend	\N	{}	{}	2025-08-07 01:12:15.546+05:30	2025-08-07 01:12:15.546+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440011	ascend.co-coordinator@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Ayush Kshirsagar	ascend_co_coord	https://qpulpytptbwwumicyzwr.supabase.co/storage/v1/object/public/avatars/profile_550e8400-e29b-41d4-a716-446655440011_1755328377221_ayushphoto.jpg	co_coordinator	ascend	Co-coordinator supporting ASCEND activities	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-16 12:43:06.117+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440010	ascend.coordinator@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Atharva Bhede	ascend_coord	https://qpulpytptbwwumicyzwr.supabase.co/storage/v1/object/public/avatars/profile_550e8400-e29b-41d4-a716-446655440010_1755680000670_Screenshot%202025-08-20%20141027.png	coordinator	ascend	Lead coordinator for ASCEND coding club	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-24 15:29:23.810841+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	AYAVENLPN5SQOVK4	\N	\N	t	2025-08-09 04:50:10.737	["620F2163", "8FD17E98", "BD8320DB", "452B43BA", "A2C610DB", "F12116B6", "4FC378F0", "E1DC2D47", "C682A95A", "BB09D2C7"]	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
516a1eee-d8f9-4283-8cfb-740c0387ca8c	vidhi.morajkar@zenith.edu	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Vidhi Pravin Menghare	\N	\N	student	\N	\N	{}	{}	2025-08-26 00:30:57.789111+05:30	2025-09-16 15:43:45.251418+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=vidhi	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:30:57.789111+05:30
550e8400-e29b-41d4-a716-446655440400	student1.artovert@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Oliver Davis	oliver_d	\N	student	artovert	Holistic development and all-round skill building	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-25 18:04:57.007481+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
1d5b1108-eb4c-4191-ae75-751e3610d519	ayushkshirsagar28@gmail.com	$2b$12$wSqDv2ll3YykTou..zdoouw0Yxwh3fon.Z936KB1bKdp9rXD/KZky	Ayush Kshirsagar	\N	\N	student	ascend	tech 	{}	{}	2025-08-07 01:25:30.145+05:30	2025-08-28 11:12:08.805108+05:30	/uploads/profiles/avatars/atharva_1756359728798_eb3fedded2aa1bf4.png	[]	\N	\N	\N	\N	{}	7249360170	Nagpur	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
59c443c7-2e5e-41ec-96bb-0b33ca557948	shubham.kaut@zenith.edu	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Sharawari Raut	\N	\N	student	\N	\N	{}	{}	2025-08-26 00:30:57.789111+05:30	2025-09-16 15:43:45.251418+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=shubham	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:30:57.789111+05:30
8203d590-1c95-472d-a9a6-643d696a04e9	aditya.yethe@zenith.edu	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Aditya Yelne	\N	\N	student	\N	\N	{}	{}	2025-08-26 00:30:57.789111+05:30	2025-09-16 15:43:45.251418+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=aditya	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:30:57.789111+05:30
8694ff1f-1d1e-4a7b-8ecb-eebda2c937d3	yash.siddhabhatti@zenith.edu	$2b$12$XbcEa4LED/o71VjyMDgIKOuVoOyOqCZG4AMVxVGt4nQZf13Cv3wcy	Yash Siddhabhatti	\N	https://qpulpytptbwwumicyzwr.supabase.co/storage/v1/object/public/avatars/profile_8694ff1f-1d1e-4a7b-8ecb-eebda2c937d3_1755672985159_yashprofle.png	president	\N	\N	{}	{}	2025-08-20 11:30:17.917+05:30	2025-08-20 12:26:24.623+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-20 11:30:17.917+05:30
241f4f32-458e-410e-b2f2-6dcfda992455	sarthak.thote@zenith.edu	$2b$12$XbcEa4LED/o71VjyMDgIKOuVoOyOqCZG4AMVxVGt4nQZf13Cv3wcy	Sarthak Thote	\N	https://qpulpytptbwwumicyzwr.supabase.co/storage/v1/object/public/avatars/profile_241f4f32-458e-410e-b2f2-6dcfda992455_1755673025315_screen1.png	vice_president	\N	\N	{}	{}	2025-08-20 11:30:17.917+05:30	2025-08-20 12:27:05.659+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-20 11:30:17.917+05:30
53cbed56-2bc7-4faf-bd6e-5f953de4dfa5	manasvi.giradkar@zenith.edu	$2b$12$XbcEa4LED/o71VjyMDgIKOuVoOyOqCZG4AMVxVGt4nQZf13Cv3wcy	Manasvi Giradkar	\N	https://qpulpytptbwwumicyzwr.supabase.co/storage/v1/object/public/avatars/profile_53cbed56-2bc7-4faf-bd6e-5f953de4dfa5_1755673094883_Screenshot%202025-08-20%20120312.png	zenith_secretary	\N	\N	{}	{}	2025-08-20 11:30:17.917+05:30	2025-08-20 13:26:41.332+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-20 11:30:17.917+05:30
7c36ecbe-44d3-40df-8b8b-886e5385e839	yogeshvar.chaudhari@zenith.edu	$2b$12$XbcEa4LED/o71VjyMDgIKOuVoOyOqCZG4AMVxVGt4nQZf13Cv3wcy	Yogeshvar Chaudhari	\N	https://qpulpytptbwwumicyzwr.supabase.co/storage/v1/object/public/avatars/profile_7c36ecbe-44d3-40df-8b8b-886e5385e839_1755673151393_Screenshot%202025-08-20%20120444.png	treasurer	\N	\N	{}	{}	2025-08-20 11:30:17.917+05:30	2025-08-26 00:53:55.138726+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-20 11:30:17.917+05:30
9755eab9-39cb-443b-9cca-853d727afe40	kaiwalya.pund@zenith.edu	$2b$12$XbcEa4LED/o71VjyMDgIKOuVoOyOqCZG4AMVxVGt4nQZf13Cv3wcy	Kaiwalya Pund	\N	https://qpulpytptbwwumicyzwr.supabase.co/storage/v1/object/public/avatars/profile_9755eab9-39cb-443b-9cca-853d727afe40_1755672871466_Screenshot%202025-08-20%20120548.png	media	\N	\N	{}	{}	2025-08-20 11:30:17.917+05:30	2025-08-26 00:54:15.022906+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-20 11:30:17.917+05:30
21a95efa-ccfa-4c4c-af7f-50cfa0a35053	naitamatharva14@gmail.com	$2b$12$H657HWHhjgIErR7Jjbg1rewgKsxIHUYNWhXwbn6tPQkYEedyFLf4y	Atharva Naitam	\N	https://qpulpytptbwwumicyzwr.supabase.co/storage/v1/object/public/avatars/profile_21a95efa-ccfa-4c4c-af7f-50cfa0a35053_1755672934344_Screenshot%202025-08-20%20120530.png	innovation_head	ascend	\N	{}	{}	2025-08-20 11:30:17.917+05:30	2025-08-29 01:10:49.844202+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-20 11:30:17.917+05:30
8eb864a5-a99b-4d3b-94f9-4619ed66c5e3	shreya.borde@example.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Shreya Borde	\N	\N	student	\N	\N	{}	{}	2025-08-26 00:42:07.684881+05:30	2025-09-16 15:43:45.251418+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=shreya	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:42:07.684881+05:30
550e8400-e29b-41d4-a716-446655440401	student2.artovert@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Sophie Chen	sophie_c	\N	student	artovert	Balanced development across technical and soft skills	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-25 18:04:57.007481+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
a758760c-468e-4185-b84c-374ec2168a4a	uday.bhoyar@example.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Uday Bhoyar	\N	\N	student	\N	\N	{}	{}	2025-08-26 00:42:07.684881+05:30	2025-09-16 15:43:45.251418+05:30	https://api.dicebear.com/7.x/avataaars/svg?seed=uday	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-26 00:42:07.684881+05:30
550e8400-e29b-41d4-a716-446655440020	aster.coordinator@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Radhika Salodkar	\N	\N	coordinator	aster	Lead coordinator for ASTER soft skills club	{}	{}	2025-07-27 13:47:32.966+05:30	2025-09-16 22:18:14.314061+05:30	/uploads/profiles/avatars/Screenshot from 2025-08-24 13-48-12_1756024176742_333e05fb871c9932.png	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	t	PE4ECHCYOMZSUGTR	LBKWOCKQIF3BSTCU	2025-08-16 08:27:25.065	f	\N	["F757E466", "3EE85BF7", "43A22EEB", "D7478D0E", "6EA60825", "A10652FA", "C086BBAE", "6799C08A", "CC3C4FA8", "946F6CCB"]	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440402	student3.artovert@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	David Park	david_p	\N	student	artovert	Complete personality development enthusiast	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-25 18:04:57.007481+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440040	artovert.coordinator@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	ARTOVERT Coordinator	artovert_coord	\N	coordinator	artovert	Lead coordinator for ARTOVERT development club	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-25 18:04:57.007481+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440041	artovert.co-coordinator@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	ARTOVERT Co-Coordinator	artovert_co_coord	\N	co_coordinator	artovert	Co-coordinator supporting ARTOVERT activities	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-25 18:04:57.007481+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440042	artovert.secretary@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	ARTOVERT Secretary	artovert_secretary	\N	secretary	artovert	Secretary managing ARTOVERT documentation	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-25 18:04:57.007481+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440043	artovert.media@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	ARTOVERT Media Head	artovert_media	\N	media	artovert	Media coordinator for ARTOVERT club	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-25 18:04:57.007481+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
\.


--
-- TOC entry 4451 (class 0 OID 0)
-- Dependencies: 211
-- Name: club_statistics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.club_statistics_id_seq', 1, false);


--
-- TOC entry 4452 (class 0 OID 0)
-- Dependencies: 212
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 6, true);


--
-- TOC entry 4453 (class 0 OID 0)
-- Dependencies: 213
-- Name: system_statistics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.system_statistics_id_seq', 1, false);


--
-- TOC entry 4454 (class 0 OID 0)
-- Dependencies: 214
-- Name: user_activities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_activities_id_seq', 1, true);


--
-- TOC entry 3950 (class 2606 OID 17646)
-- Name: ai_assignment_generations ai_assignment_generations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_assignment_generations
    ADD CONSTRAINT ai_assignment_generations_pkey PRIMARY KEY (id);


--
-- TOC entry 4009 (class 2606 OID 17926)
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- TOC entry 3970 (class 2606 OID 17734)
-- Name: assignment_attempts assignment_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_attempts
    ADD CONSTRAINT assignment_attempts_pkey PRIMARY KEY (id);


--
-- TOC entry 3982 (class 2606 OID 17754)
-- Name: assignment_audit_log assignment_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_audit_log
    ADD CONSTRAINT assignment_audit_log_pkey PRIMARY KEY (id);


--
-- TOC entry 3956 (class 2606 OID 17681)
-- Name: assignment_questions assignment_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_questions
    ADD CONSTRAINT assignment_questions_pkey PRIMARY KEY (id);


--
-- TOC entry 3963 (class 2606 OID 17699)
-- Name: assignment_submissions assignment_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_pkey PRIMARY KEY (id);


--
-- TOC entry 3944 (class 2606 OID 17628)
-- Name: assignment_templates assignment_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_templates
    ADD CONSTRAINT assignment_templates_pkey PRIMARY KEY (id);


--
-- TOC entry 3985 (class 2606 OID 17778)
-- Name: assignment_violations assignment_violations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_violations
    ADD CONSTRAINT assignment_violations_pkey PRIMARY KEY (id);


--
-- TOC entry 3937 (class 2606 OID 17605)
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- TOC entry 4085 (class 2606 OID 18321)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 4169 (class 2606 OID 19661)
-- Name: carousel_slides carousel_slides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carousel_slides
    ADD CONSTRAINT carousel_slides_pkey PRIMARY KEY (id);


--
-- TOC entry 4040 (class 2606 OID 18176)
-- Name: chat_attachments chat_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_attachments
    ADD CONSTRAINT chat_attachments_pkey PRIMARY KEY (id);


--
-- TOC entry 4045 (class 2606 OID 18193)
-- Name: chat_invitations chat_invitations_invitation_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_invitations
    ADD CONSTRAINT chat_invitations_invitation_token_key UNIQUE (invitation_token);


--
-- TOC entry 4047 (class 2606 OID 18191)
-- Name: chat_invitations chat_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_invitations
    ADD CONSTRAINT chat_invitations_pkey PRIMARY KEY (id);


--
-- TOC entry 4033 (class 2606 OID 18137)
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- TOC entry 4029 (class 2606 OID 18112)
-- Name: chat_room_members chat_room_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_room_members
    ADD CONSTRAINT chat_room_members_pkey PRIMARY KEY (id);


--
-- TOC entry 4026 (class 2606 OID 18092)
-- Name: chat_rooms chat_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_pkey PRIMARY KEY (id);


--
-- TOC entry 4049 (class 2606 OID 18211)
-- Name: club_members club_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.club_members
    ADD CONSTRAINT club_members_pkey PRIMARY KEY (id);


--
-- TOC entry 4059 (class 2606 OID 18226)
-- Name: club_statistics club_statistics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.club_statistics
    ADD CONSTRAINT club_statistics_pkey PRIMARY KEY (id);


--
-- TOC entry 3915 (class 2606 OID 17492)
-- Name: clubs clubs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clubs
    ADD CONSTRAINT clubs_pkey PRIMARY KEY (id);


--
-- TOC entry 3994 (class 2606 OID 17830)
-- Name: code_results code_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.code_results
    ADD CONSTRAINT code_results_pkey PRIMARY KEY (id);


--
-- TOC entry 3996 (class 2606 OID 17846)
-- Name: coding_submissions coding_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coding_submissions
    ADD CONSTRAINT coding_submissions_pkey PRIMARY KEY (id);


--
-- TOC entry 4187 (class 2606 OID 19766)
-- Name: comment_likes comment_likes_comment_id_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_comment_id_user_id_unique UNIQUE (comment_id, user_id);


--
-- TOC entry 4189 (class 2606 OID 19764)
-- Name: comment_likes comment_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_pkey PRIMARY KEY (id);


--
-- TOC entry 4122 (class 2606 OID 19062)
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- TOC entry 3931 (class 2606 OID 17551)
-- Name: committee_members committee_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.committee_members
    ADD CONSTRAINT committee_members_pkey PRIMARY KEY (id);


--
-- TOC entry 3928 (class 2606 OID 17534)
-- Name: committee_roles committee_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.committee_roles
    ADD CONSTRAINT committee_roles_pkey PRIMARY KEY (id);


--
-- TOC entry 3911 (class 2606 OID 17480)
-- Name: committees committees_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.committees
    ADD CONSTRAINT committees_name_key UNIQUE (name);


--
-- TOC entry 3913 (class 2606 OID 17478)
-- Name: committees committees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.committees
    ADD CONSTRAINT committees_pkey PRIMARY KEY (id);


--
-- TOC entry 4178 (class 2606 OID 19719)
-- Name: content_permissions content_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_permissions
    ADD CONSTRAINT content_permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 4013 (class 2606 OID 18007)
-- Name: discussion_replies discussion_replies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discussion_replies
    ADD CONSTRAINT discussion_replies_pkey PRIMARY KEY (id);


--
-- TOC entry 4011 (class 2606 OID 17986)
-- Name: discussions discussions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discussions
    ADD CONSTRAINT discussions_pkey PRIMARY KEY (id);


--
-- TOC entry 4066 (class 2606 OID 18257)
-- Name: email_logs email_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 4181 (class 2606 OID 19750)
-- Name: email_otps email_otps_email_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_otps
    ADD CONSTRAINT email_otps_email_type_key UNIQUE (email, type);


--
-- TOC entry 4183 (class 2606 OID 19748)
-- Name: email_otps email_otps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_otps
    ADD CONSTRAINT email_otps_pkey PRIMARY KEY (id);


--
-- TOC entry 4020 (class 2606 OID 18055)
-- Name: event_attendees event_attendees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_attendees
    ADD CONSTRAINT event_attendees_pkey PRIMARY KEY (id);


--
-- TOC entry 4024 (class 2606 OID 18076)
-- Name: event_registrations event_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_pkey PRIMARY KEY (id);


--
-- TOC entry 4015 (class 2606 OID 18035)
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- TOC entry 4175 (class 2606 OID 19698)
-- Name: featured_events featured_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_events
    ADD CONSTRAINT featured_events_pkey PRIMARY KEY (id);


--
-- TOC entry 4114 (class 2606 OID 19788)
-- Name: likes likes_comment_user_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_comment_user_unique UNIQUE (comment_id, user_id);


--
-- TOC entry 4116 (class 2606 OID 19039)
-- Name: likes likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_pkey PRIMARY KEY (id);


--
-- TOC entry 4118 (class 2606 OID 19786)
-- Name: likes likes_post_user_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_post_user_unique UNIQUE (post_id, user_id);


--
-- TOC entry 4003 (class 2606 OID 17863)
-- Name: media_files media_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_files
    ADD CONSTRAINT media_files_pkey PRIMARY KEY (id);


--
-- TOC entry 4100 (class 2606 OID 18382)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- TOC entry 4155 (class 2606 OID 19571)
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (name);


--
-- TOC entry 4064 (class 2606 OID 18244)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 4167 (class 2606 OID 19643)
-- Name: page_content page_content_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_content
    ADD CONSTRAINT page_content_pkey PRIMARY KEY (id);


--
-- TOC entry 4164 (class 2606 OID 19598)
-- Name: post_attachments post_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_attachments
    ADD CONSTRAINT post_attachments_pkey PRIMARY KEY (id);


--
-- TOC entry 4108 (class 2606 OID 19015)
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- TOC entry 4110 (class 2606 OID 19017)
-- Name: posts posts_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_slug_key UNIQUE (slug);


--
-- TOC entry 4007 (class 2606 OID 17905)
-- Name: proctoring_sessions proctoring_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proctoring_sessions
    ADD CONSTRAINT proctoring_sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 4149 (class 2606 OID 19187)
-- Name: project_invitations project_invitations_invitation_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_invitations
    ADD CONSTRAINT project_invitations_invitation_token_key UNIQUE (invitation_token);


--
-- TOC entry 4151 (class 2606 OID 19185)
-- Name: project_invitations project_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_invitations
    ADD CONSTRAINT project_invitations_pkey PRIMARY KEY (id);


--
-- TOC entry 4135 (class 2606 OID 19118)
-- Name: project_members project_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_pkey PRIMARY KEY (id);


--
-- TOC entry 4129 (class 2606 OID 19094)
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- TOC entry 4098 (class 2606 OID 18373)
-- Name: query_cache query_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.query_cache
    ADD CONSTRAINT query_cache_pkey PRIMARY KEY (cache_key);


--
-- TOC entry 4005 (class 2606 OID 17879)
-- Name: question_media question_media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_media
    ADD CONSTRAINT question_media_pkey PRIMARY KEY (id);


--
-- TOC entry 3988 (class 2606 OID 17794)
-- Name: question_options question_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_options
    ADD CONSTRAINT question_options_pkey PRIMARY KEY (id);


--
-- TOC entry 3992 (class 2606 OID 17811)
-- Name: question_responses question_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_responses
    ADD CONSTRAINT question_responses_pkey PRIMARY KEY (id);


--
-- TOC entry 4083 (class 2606 OID 18306)
-- Name: security_events security_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_events
    ADD CONSTRAINT security_events_pkey PRIMARY KEY (id);


--
-- TOC entry 4074 (class 2606 OID 18271)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 4076 (class 2606 OID 18273)
-- Name: sessions sessions_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key UNIQUE (token);


--
-- TOC entry 4159 (class 2606 OID 19579)
-- Name: submission_attachments submission_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submission_attachments
    ADD CONSTRAINT submission_attachments_pkey PRIMARY KEY (id);


--
-- TOC entry 4096 (class 2606 OID 18365)
-- Name: system_statistics system_statistics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_statistics
    ADD CONSTRAINT system_statistics_pkey PRIMARY KEY (id);


--
-- TOC entry 4153 (class 2606 OID 19554)
-- Name: task_activity task_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_activity
    ADD CONSTRAINT task_activity_pkey PRIMARY KEY (id);


--
-- TOC entry 4143 (class 2606 OID 19150)
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 4173 (class 2606 OID 19680)
-- Name: team_cards team_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_cards
    ADD CONSTRAINT team_cards_pkey PRIMARY KEY (id);


--
-- TOC entry 4079 (class 2606 OID 18290)
-- Name: trusted_devices trusted_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trusted_devices
    ADD CONSTRAINT trusted_devices_pkey PRIMARY KEY (id);


--
-- TOC entry 4057 (class 2606 OID 19914)
-- Name: club_members unique_club_member_year; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.club_members
    ADD CONSTRAINT unique_club_member_year UNIQUE (user_id, club_id, academic_year);


--
-- TOC entry 4120 (class 2606 OID 19041)
-- Name: likes unique_post_user_like; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT unique_post_user_like UNIQUE (post_id, user_id);


--
-- TOC entry 4131 (class 2606 OID 19096)
-- Name: projects unique_project_key_club; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT unique_project_key_club UNIQUE (club_id, project_key);


--
-- TOC entry 4137 (class 2606 OID 19120)
-- Name: project_members unique_project_member; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT unique_project_member UNIQUE (project_id, user_id);


--
-- TOC entry 4145 (class 2606 OID 19152)
-- Name: tasks unique_task_key_project; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT unique_task_key_project UNIQUE (project_id, task_key);


--
-- TOC entry 4092 (class 2606 OID 18335)
-- Name: user_activities user_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activities
    ADD CONSTRAINT user_activities_pkey PRIMARY KEY (id);


--
-- TOC entry 4094 (class 2606 OID 18349)
-- Name: user_badges user_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_pkey PRIMARY KEY (id);


--
-- TOC entry 3924 (class 2606 OID 17517)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3926 (class 2606 OID 17515)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3951 (class 1259 OID 18403)
-- Name: idx_ai_generations_assignment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_generations_assignment_id ON public.ai_assignment_generations USING btree (generated_assignment_id);


--
-- TOC entry 3952 (class 1259 OID 18404)
-- Name: idx_ai_generations_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_generations_created_at ON public.ai_assignment_generations USING btree (created_at);


--
-- TOC entry 3953 (class 1259 OID 18405)
-- Name: idx_ai_generations_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_generations_status ON public.ai_assignment_generations USING btree (generation_status);


--
-- TOC entry 3954 (class 1259 OID 18406)
-- Name: idx_ai_generations_template_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_generations_template_id ON public.ai_assignment_generations USING btree (template_id);


--
-- TOC entry 3971 (class 1259 OID 18407)
-- Name: idx_assignment_attempts_assignment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_attempts_assignment_id ON public.assignment_attempts USING btree (assignment_id);


--
-- TOC entry 3972 (class 1259 OID 18408)
-- Name: idx_assignment_attempts_assignment_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_attempts_assignment_user ON public.assignment_attempts USING btree (assignment_id, user_id);


--
-- TOC entry 3973 (class 1259 OID 18409)
-- Name: idx_assignment_attempts_auto_save; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_attempts_auto_save ON public.assignment_attempts USING btree (assignment_id, user_id, last_auto_save);


--
-- TOC entry 3974 (class 1259 OID 18410)
-- Name: idx_assignment_attempts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_attempts_status ON public.assignment_attempts USING btree (status);


--
-- TOC entry 3975 (class 1259 OID 18411)
-- Name: idx_assignment_attempts_submitted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_attempts_submitted_at ON public.assignment_attempts USING btree (submitted_at);


--
-- TOC entry 3976 (class 1259 OID 18412)
-- Name: idx_assignment_attempts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_attempts_user_id ON public.assignment_attempts USING btree (user_id);


--
-- TOC entry 3977 (class 1259 OID 18413)
-- Name: idx_assignment_attempts_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_attempts_user_status ON public.assignment_attempts USING btree (user_id, status, submitted_at DESC);


--
-- TOC entry 3978 (class 1259 OID 18414)
-- Name: idx_assignment_attempts_violations; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_attempts_violations ON public.assignment_attempts USING btree (assignment_id, window_violations);


--
-- TOC entry 3983 (class 1259 OID 18417)
-- Name: idx_assignment_audit_log_assignment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_audit_log_assignment ON public.assignment_audit_log USING btree (assignment_id);


--
-- TOC entry 3957 (class 1259 OID 18418)
-- Name: idx_assignment_questions_assignment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_questions_assignment_id ON public.assignment_questions USING btree (assignment_id);


--
-- TOC entry 3958 (class 1259 OID 18419)
-- Name: idx_assignment_questions_correct_answer_jsonb; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_questions_correct_answer_jsonb ON public.assignment_questions USING gin (correct_answer);


--
-- TOC entry 3959 (class 1259 OID 18420)
-- Name: idx_assignment_questions_language_settings; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_questions_language_settings ON public.assignment_questions USING btree (code_language, allow_any_language);


--
-- TOC entry 3964 (class 1259 OID 18423)
-- Name: idx_assignment_submissions_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_assignment_submissions_unique ON public.assignment_submissions USING btree (assignment_id, user_id);


--
-- TOC entry 3965 (class 1259 OID 18424)
-- Name: idx_assignment_submissions_user_submitted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_submissions_user_submitted ON public.assignment_submissions USING btree (user_id, submitted_at DESC);


--
-- TOC entry 3945 (class 1259 OID 18428)
-- Name: idx_assignment_templates_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_templates_category ON public.assignment_templates USING btree (category);


--
-- TOC entry 3946 (class 1259 OID 18429)
-- Name: idx_assignment_templates_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_templates_created_by ON public.assignment_templates USING btree (created_by);


--
-- TOC entry 3947 (class 1259 OID 18430)
-- Name: idx_assignment_templates_difficulty; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_templates_difficulty ON public.assignment_templates USING btree (difficulty_level);


--
-- TOC entry 3948 (class 1259 OID 18431)
-- Name: idx_assignment_templates_subject; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_templates_subject ON public.assignment_templates USING btree (subject);


--
-- TOC entry 3986 (class 1259 OID 18432)
-- Name: idx_assignment_violations_submission_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_violations_submission_id ON public.assignment_violations USING btree (submission_id);


--
-- TOC entry 3938 (class 1259 OID 18433)
-- Name: idx_assignments_club_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_club_id ON public.assignments USING btree (club_id);


--
-- TOC entry 3939 (class 1259 OID 18434)
-- Name: idx_assignments_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_created_by ON public.assignments USING btree (created_by);


--
-- TOC entry 3940 (class 1259 OID 18435)
-- Name: idx_assignments_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_due_date ON public.assignments USING btree (due_date);


--
-- TOC entry 3941 (class 1259 OID 18436)
-- Name: idx_assignments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_status ON public.assignments USING btree (status);


--
-- TOC entry 3942 (class 1259 OID 18437)
-- Name: idx_assignments_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_type ON public.assignments USING btree (assignment_type);


--
-- TOC entry 3979 (class 1259 OID 18415)
-- Name: idx_attempts_assignment_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attempts_assignment_status ON public.assignment_attempts USING btree (assignment_id, status);


--
-- TOC entry 3980 (class 1259 OID 18416)
-- Name: idx_attempts_user_assignment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attempts_user_assignment ON public.assignment_attempts USING btree (user_id, assignment_id, attempt_number);


--
-- TOC entry 4086 (class 1259 OID 18473)
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- TOC entry 4087 (class 1259 OID 18474)
-- Name: idx_audit_logs_resource_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_resource_type ON public.audit_logs USING btree (resource_type);


--
-- TOC entry 4088 (class 1259 OID 18472)
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- TOC entry 4170 (class 1259 OID 19731)
-- Name: idx_carousel_slides_page; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_carousel_slides_page ON public.carousel_slides USING btree (page_type, page_reference_id);


--
-- TOC entry 4041 (class 1259 OID 19628)
-- Name: idx_chat_attachments_file_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_attachments_file_id ON public.chat_attachments USING btree (file_id);


--
-- TOC entry 4042 (class 1259 OID 19616)
-- Name: idx_chat_attachments_room_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_attachments_room_id ON public.chat_attachments USING btree (room_id);


--
-- TOC entry 4043 (class 1259 OID 19627)
-- Name: idx_chat_attachments_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_attachments_user_id ON public.chat_attachments USING btree (user_id);


--
-- TOC entry 4034 (class 1259 OID 19533)
-- Name: idx_chat_messages_can_edit_until; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_can_edit_until ON public.chat_messages USING btree (can_edit_until);


--
-- TOC entry 4035 (class 1259 OID 18454)
-- Name: idx_chat_messages_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_created_at ON public.chat_messages USING btree (created_at);


--
-- TOC entry 4036 (class 1259 OID 19532)
-- Name: idx_chat_messages_edited_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_edited_at ON public.chat_messages USING btree (edited_at);


--
-- TOC entry 4037 (class 1259 OID 18452)
-- Name: idx_chat_messages_room_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_room_id ON public.chat_messages USING btree (room_id);


--
-- TOC entry 4038 (class 1259 OID 18453)
-- Name: idx_chat_messages_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_user_id ON public.chat_messages USING btree (user_id);


--
-- TOC entry 4030 (class 1259 OID 18455)
-- Name: idx_chat_room_members_chat_room_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_room_members_chat_room_id ON public.chat_room_members USING btree (chat_room_id);


--
-- TOC entry 4031 (class 1259 OID 18456)
-- Name: idx_chat_room_members_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_room_members_user_id ON public.chat_room_members USING btree (user_id);


--
-- TOC entry 4027 (class 1259 OID 19534)
-- Name: idx_chat_rooms_profile_picture; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_rooms_profile_picture ON public.chat_rooms USING btree (profile_picture_url);


--
-- TOC entry 4050 (class 1259 OID 19853)
-- Name: idx_club_members_academic_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_club_members_academic_year ON public.club_members USING btree (academic_year);


--
-- TOC entry 4051 (class 1259 OID 19896)
-- Name: idx_club_members_club_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_club_members_club_id ON public.club_members USING btree (club_id);


--
-- TOC entry 4052 (class 1259 OID 19895)
-- Name: idx_club_members_club_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_club_members_club_year ON public.club_members USING btree (club_id, academic_year);


--
-- TOC entry 4053 (class 1259 OID 19855)
-- Name: idx_club_members_current_term; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_club_members_current_term ON public.club_members USING btree (is_current_term);


--
-- TOC entry 4054 (class 1259 OID 19923)
-- Name: idx_club_members_hierarchy; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_club_members_hierarchy ON public.club_members USING btree (hierarchy);


--
-- TOC entry 4055 (class 1259 OID 18459)
-- Name: idx_club_members_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_club_members_user_id ON public.club_members USING btree (user_id);


--
-- TOC entry 3916 (class 1259 OID 18457)
-- Name: idx_clubs_coordinator_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clubs_coordinator_id ON public.clubs USING btree (coordinator_id);


--
-- TOC entry 3917 (class 1259 OID 18458)
-- Name: idx_clubs_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clubs_type ON public.clubs USING btree (type);


--
-- TOC entry 3997 (class 1259 OID 18481)
-- Name: idx_coding_submissions_question_response_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coding_submissions_question_response_id ON public.coding_submissions USING btree (question_response_id);


--
-- TOC entry 4190 (class 1259 OID 19777)
-- Name: idx_comment_likes_comment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comment_likes_comment_id ON public.comment_likes USING btree (comment_id);


--
-- TOC entry 4191 (class 1259 OID 19778)
-- Name: idx_comment_likes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comment_likes_user_id ON public.comment_likes USING btree (user_id);


--
-- TOC entry 4123 (class 1259 OID 19207)
-- Name: idx_comments_author_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_author_id ON public.comments USING btree (author_id);


--
-- TOC entry 4124 (class 1259 OID 19206)
-- Name: idx_comments_post_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_post_id ON public.comments USING btree (post_id);


--
-- TOC entry 3932 (class 1259 OID 19886)
-- Name: idx_committee_members_academic_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_committee_members_academic_year ON public.committee_members USING btree (committee_id, academic_year);


--
-- TOC entry 3933 (class 1259 OID 18449)
-- Name: idx_committee_members_committee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_committee_members_committee_id ON public.committee_members USING btree (committee_id);


--
-- TOC entry 3934 (class 1259 OID 19887)
-- Name: idx_committee_members_current_term; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_committee_members_current_term ON public.committee_members USING btree (committee_id, is_current_term, status);


--
-- TOC entry 3935 (class 1259 OID 18450)
-- Name: idx_committee_members_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_committee_members_user_id ON public.committee_members USING btree (user_id);


--
-- TOC entry 3929 (class 1259 OID 18451)
-- Name: idx_committee_roles_committee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_committee_roles_committee_id ON public.committee_roles USING btree (committee_id);


--
-- TOC entry 4179 (class 1259 OID 19734)
-- Name: idx_content_permissions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_permissions_user ON public.content_permissions USING btree (user_id, page_type, page_reference_id);


--
-- TOC entry 4067 (class 1259 OID 18470)
-- Name: idx_email_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_created_at ON public.email_logs USING btree (created_at);


--
-- TOC entry 4068 (class 1259 OID 18469)
-- Name: idx_email_logs_recipient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_recipient ON public.email_logs USING btree (recipient);


--
-- TOC entry 4069 (class 1259 OID 18471)
-- Name: idx_email_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_status ON public.email_logs USING btree (status);


--
-- TOC entry 4184 (class 1259 OID 19751)
-- Name: idx_email_otps_email_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_otps_email_type ON public.email_otps USING btree (email, type);


--
-- TOC entry 4185 (class 1259 OID 19752)
-- Name: idx_email_otps_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_otps_expires_at ON public.email_otps USING btree (expires_at);


--
-- TOC entry 4021 (class 1259 OID 18464)
-- Name: idx_event_attendees_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_attendees_event_id ON public.event_attendees USING btree (event_id);


--
-- TOC entry 4022 (class 1259 OID 18465)
-- Name: idx_event_attendees_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_attendees_user_id ON public.event_attendees USING btree (user_id);


--
-- TOC entry 4016 (class 1259 OID 18461)
-- Name: idx_events_club_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_club_id ON public.events USING btree (club_id);


--
-- TOC entry 4017 (class 1259 OID 18462)
-- Name: idx_events_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_created_by ON public.events USING btree (created_by);


--
-- TOC entry 4018 (class 1259 OID 18463)
-- Name: idx_events_event_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_event_date ON public.events USING btree (event_date);


--
-- TOC entry 4176 (class 1259 OID 19733)
-- Name: idx_featured_events_page; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_events_page ON public.featured_events USING btree (page_type, page_reference_id);


--
-- TOC entry 4111 (class 1259 OID 19204)
-- Name: idx_likes_post_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_likes_post_id ON public.likes USING btree (post_id);


--
-- TOC entry 4112 (class 1259 OID 19205)
-- Name: idx_likes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_likes_user_id ON public.likes USING btree (user_id);


--
-- TOC entry 3998 (class 1259 OID 19610)
-- Name: idx_media_files_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_media_files_created_at ON public.media_files USING btree (created_at);


--
-- TOC entry 3999 (class 1259 OID 18478)
-- Name: idx_media_files_upload_context; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_media_files_upload_context ON public.media_files USING btree (upload_context);


--
-- TOC entry 4000 (class 1259 OID 19609)
-- Name: idx_media_files_upload_reference; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_media_files_upload_reference ON public.media_files USING btree (upload_reference_id, upload_context);


--
-- TOC entry 4001 (class 1259 OID 18477)
-- Name: idx_media_files_uploaded_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_media_files_uploaded_by ON public.media_files USING btree (uploaded_by);


--
-- TOC entry 4060 (class 1259 OID 18467)
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at);


--
-- TOC entry 4061 (class 1259 OID 18468)
-- Name: idx_notifications_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_read ON public.notifications USING btree (read);


--
-- TOC entry 4062 (class 1259 OID 18466)
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- TOC entry 4165 (class 1259 OID 19730)
-- Name: idx_page_content_page; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_content_page ON public.page_content USING btree (page_type, page_reference_id);


--
-- TOC entry 4160 (class 1259 OID 19614)
-- Name: idx_post_attachments_media_file_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_attachments_media_file_id ON public.post_attachments USING btree (media_file_id);


--
-- TOC entry 4161 (class 1259 OID 19613)
-- Name: idx_post_attachments_post_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_attachments_post_id ON public.post_attachments USING btree (post_id);


--
-- TOC entry 4162 (class 1259 OID 19615)
-- Name: idx_post_attachments_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_attachments_type ON public.post_attachments USING btree (attachment_type);


--
-- TOC entry 4101 (class 1259 OID 19198)
-- Name: idx_posts_author_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_author_id ON public.posts USING btree (author_id);


--
-- TOC entry 4102 (class 1259 OID 19199)
-- Name: idx_posts_club_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_club_id ON public.posts USING btree (club_id);


--
-- TOC entry 4103 (class 1259 OID 19201)
-- Name: idx_posts_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_created_at ON public.posts USING btree (created_at);


--
-- TOC entry 4104 (class 1259 OID 19203)
-- Name: idx_posts_search_vector; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_search_vector ON public.posts USING gin (search_vector);


--
-- TOC entry 4105 (class 1259 OID 19202)
-- Name: idx_posts_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_slug ON public.posts USING btree (slug);


--
-- TOC entry 4106 (class 1259 OID 19200)
-- Name: idx_posts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_status ON public.posts USING btree (status);


--
-- TOC entry 4146 (class 1259 OID 19754)
-- Name: idx_project_invitations_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_invitations_email ON public.project_invitations USING btree (email);


--
-- TOC entry 4147 (class 1259 OID 19753)
-- Name: idx_project_invitations_keys; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_invitations_keys ON public.project_invitations USING btree (project_key, access_key);


--
-- TOC entry 4132 (class 1259 OID 19211)
-- Name: idx_project_members_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_members_project_id ON public.project_members USING btree (project_id);


--
-- TOC entry 4133 (class 1259 OID 19212)
-- Name: idx_project_members_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_members_user_id ON public.project_members USING btree (user_id);


--
-- TOC entry 4125 (class 1259 OID 19208)
-- Name: idx_projects_club_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_club_id ON public.projects USING btree (club_id);


--
-- TOC entry 4126 (class 1259 OID 19209)
-- Name: idx_projects_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_created_by ON public.projects USING btree (created_by);


--
-- TOC entry 4127 (class 1259 OID 19210)
-- Name: idx_projects_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_status ON public.projects USING btree (status);


--
-- TOC entry 3989 (class 1259 OID 18480)
-- Name: idx_question_responses_question_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_question_responses_question_id ON public.question_responses USING btree (question_id);


--
-- TOC entry 3990 (class 1259 OID 18479)
-- Name: idx_question_responses_submission_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_question_responses_submission_id ON public.question_responses USING btree (submission_id);


--
-- TOC entry 3960 (class 1259 OID 18421)
-- Name: idx_questions_assignment_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_questions_assignment_order ON public.assignment_questions USING btree (assignment_id, question_order);


--
-- TOC entry 3961 (class 1259 OID 18422)
-- Name: idx_questions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_questions_type ON public.assignment_questions USING btree (question_type);


--
-- TOC entry 4080 (class 1259 OID 18448)
-- Name: idx_security_events_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_events_event_type ON public.security_events USING btree (event_type);


--
-- TOC entry 4081 (class 1259 OID 18447)
-- Name: idx_security_events_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_events_user_id ON public.security_events USING btree (user_id);


--
-- TOC entry 4070 (class 1259 OID 18445)
-- Name: idx_sessions_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_expires_at ON public.sessions USING btree (expires_at);


--
-- TOC entry 4071 (class 1259 OID 18444)
-- Name: idx_sessions_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_token ON public.sessions USING btree (token);


--
-- TOC entry 4072 (class 1259 OID 18443)
-- Name: idx_sessions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_user_id ON public.sessions USING btree (user_id);


--
-- TOC entry 4156 (class 1259 OID 19612)
-- Name: idx_submission_attachments_media_file_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submission_attachments_media_file_id ON public.submission_attachments USING btree (media_file_id);


--
-- TOC entry 4157 (class 1259 OID 19611)
-- Name: idx_submission_attachments_submission_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submission_attachments_submission_id ON public.submission_attachments USING btree (submission_id);


--
-- TOC entry 3966 (class 1259 OID 18425)
-- Name: idx_submissions_assignment_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_assignment_status ON public.assignment_submissions USING btree (assignment_id, status);


--
-- TOC entry 3967 (class 1259 OID 18426)
-- Name: idx_submissions_status_submitted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_status_submitted ON public.assignment_submissions USING btree (status, submitted_at DESC);


--
-- TOC entry 3968 (class 1259 OID 18427)
-- Name: idx_submissions_user_submitted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_user_submitted ON public.assignment_submissions USING btree (user_id, submitted_at DESC);


--
-- TOC entry 4138 (class 1259 OID 19214)
-- Name: idx_tasks_assignee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_assignee_id ON public.tasks USING btree (assignee_id);


--
-- TOC entry 4139 (class 1259 OID 19216)
-- Name: idx_tasks_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_due_date ON public.tasks USING btree (due_date);


--
-- TOC entry 4140 (class 1259 OID 19213)
-- Name: idx_tasks_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_project_id ON public.tasks USING btree (project_id);


--
-- TOC entry 4141 (class 1259 OID 19215)
-- Name: idx_tasks_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_status ON public.tasks USING btree (status);


--
-- TOC entry 4171 (class 1259 OID 19732)
-- Name: idx_team_cards_page; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_cards_page ON public.team_cards USING btree (page_type, page_reference_id);


--
-- TOC entry 4077 (class 1259 OID 18446)
-- Name: idx_trusted_devices_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trusted_devices_user_id ON public.trusted_devices USING btree (user_id);


--
-- TOC entry 4089 (class 1259 OID 18476)
-- Name: idx_user_activities_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_activities_created_at ON public.user_activities USING btree (created_at);


--
-- TOC entry 4090 (class 1259 OID 18475)
-- Name: idx_user_activities_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_activities_user_id ON public.user_activities USING btree (user_id);


--
-- TOC entry 3918 (class 1259 OID 18439)
-- Name: idx_users_club_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_club_id ON public.users USING btree (club_id);


--
-- TOC entry 3919 (class 1259 OID 18441)
-- Name: idx_users_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_created_at ON public.users USING btree (created_at);


--
-- TOC entry 3920 (class 1259 OID 18438)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 3921 (class 1259 OID 18442)
-- Name: idx_users_last_activity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_last_activity ON public.users USING btree (last_activity);


--
-- TOC entry 3922 (class 1259 OID 18440)
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- TOC entry 4223 (class 2620 OID 19218)
-- Name: posts posts_search_vector_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER posts_search_vector_update BEFORE INSERT OR UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_post_search_vector();


--
-- TOC entry 4228 (class 2620 OID 19220)
-- Name: tasks tasks_generate_key; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tasks_generate_key BEFORE INSERT ON public.tasks FOR EACH ROW WHEN (((new.task_key IS NULL) OR ((new.task_key)::text = ''::text))) EXECUTE FUNCTION public.generate_task_key();


--
-- TOC entry 4227 (class 2620 OID 19222)
-- Name: tasks tasks_update_project_progress; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tasks_update_project_progress AFTER INSERT OR DELETE OR UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_project_progress();


--
-- TOC entry 4219 (class 2620 OID 18484)
-- Name: assignments update_assignments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4230 (class 2620 OID 19736)
-- Name: carousel_slides update_carousel_slides_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_carousel_slides_updated_at BEFORE UPDATE ON public.carousel_slides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4221 (class 2620 OID 19885)
-- Name: club_members update_club_privileges_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_club_privileges_trigger AFTER INSERT OR UPDATE ON public.club_members FOR EACH ROW EXECUTE FUNCTION public.update_club_privileges();


--
-- TOC entry 4214 (class 2620 OID 18483)
-- Name: clubs update_clubs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON public.clubs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4224 (class 2620 OID 19226)
-- Name: comments update_comments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4217 (class 2620 OID 18486)
-- Name: committee_members update_committee_members_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_committee_members_updated_at BEFORE UPDATE ON public.committee_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4216 (class 2620 OID 18487)
-- Name: committee_roles update_committee_roles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_committee_roles_updated_at BEFORE UPDATE ON public.committee_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4213 (class 2620 OID 18488)
-- Name: committees update_committees_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_committees_updated_at BEFORE UPDATE ON public.committees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4220 (class 2620 OID 18485)
-- Name: events update_events_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4232 (class 2620 OID 19738)
-- Name: featured_events update_featured_events_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_featured_events_updated_at BEFORE UPDATE ON public.featured_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4229 (class 2620 OID 19735)
-- Name: page_content update_page_content_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_page_content_updated_at BEFORE UPDATE ON public.page_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4222 (class 2620 OID 19223)
-- Name: posts update_posts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4218 (class 2620 OID 19884)
-- Name: committee_members update_privileged_roles_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_privileged_roles_trigger AFTER INSERT OR UPDATE ON public.committee_members FOR EACH ROW EXECUTE FUNCTION public.update_committee_privileges();


--
-- TOC entry 4225 (class 2620 OID 19224)
-- Name: projects update_projects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4226 (class 2620 OID 19225)
-- Name: tasks update_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4231 (class 2620 OID 19737)
-- Name: team_cards update_team_cards_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_team_cards_updated_at BEFORE UPDATE ON public.team_cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4215 (class 2620 OID 18482)
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4205 (class 2606 OID 19662)
-- Name: carousel_slides carousel_slides_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carousel_slides
    ADD CONSTRAINT carousel_slides_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4194 (class 2606 OID 19622)
-- Name: chat_attachments chat_attachments_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_attachments
    ADD CONSTRAINT chat_attachments_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.media_files(id) ON DELETE CASCADE;


--
-- TOC entry 4195 (class 2606 OID 19617)
-- Name: chat_attachments chat_attachments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_attachments
    ADD CONSTRAINT chat_attachments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4196 (class 2606 OID 19908)
-- Name: club_members club_members_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.club_members
    ADD CONSTRAINT club_members_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE;


--
-- TOC entry 4211 (class 2606 OID 19767)
-- Name: comment_likes comment_likes_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- TOC entry 4212 (class 2606 OID 19772)
-- Name: comment_likes comment_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4209 (class 2606 OID 19725)
-- Name: content_permissions content_permissions_granted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_permissions
    ADD CONSTRAINT content_permissions_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.users(id);


--
-- TOC entry 4210 (class 2606 OID 19720)
-- Name: content_permissions content_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_permissions
    ADD CONSTRAINT content_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4207 (class 2606 OID 19704)
-- Name: featured_events featured_events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_events
    ADD CONSTRAINT featured_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4208 (class 2606 OID 19699)
-- Name: featured_events featured_events_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_events
    ADD CONSTRAINT featured_events_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- TOC entry 4193 (class 2606 OID 19535)
-- Name: chat_messages fk_chat_messages_edited_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT fk_chat_messages_edited_by FOREIGN KEY (edited_by) REFERENCES public.users(id);


--
-- TOC entry 4192 (class 2606 OID 19540)
-- Name: chat_rooms fk_chat_rooms_edited_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT fk_chat_rooms_edited_by FOREIGN KEY (edited_by) REFERENCES public.users(id);


--
-- TOC entry 4197 (class 2606 OID 19779)
-- Name: likes likes_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- TOC entry 4204 (class 2606 OID 19644)
-- Name: page_content page_content_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_content
    ADD CONSTRAINT page_content_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4202 (class 2606 OID 19604)
-- Name: post_attachments post_attachments_media_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_attachments
    ADD CONSTRAINT post_attachments_media_file_id_fkey FOREIGN KEY (media_file_id) REFERENCES public.media_files(id) ON DELETE CASCADE;


--
-- TOC entry 4203 (class 2606 OID 19599)
-- Name: post_attachments post_attachments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_attachments
    ADD CONSTRAINT post_attachments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- TOC entry 4200 (class 2606 OID 19585)
-- Name: submission_attachments submission_attachments_media_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submission_attachments
    ADD CONSTRAINT submission_attachments_media_file_id_fkey FOREIGN KEY (media_file_id) REFERENCES public.media_files(id) ON DELETE CASCADE;


--
-- TOC entry 4201 (class 2606 OID 19580)
-- Name: submission_attachments submission_attachments_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submission_attachments
    ADD CONSTRAINT submission_attachments_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.assignment_submissions(id) ON DELETE CASCADE;


--
-- TOC entry 4198 (class 2606 OID 19555)
-- Name: task_activity task_activity_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_activity
    ADD CONSTRAINT task_activity_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- TOC entry 4199 (class 2606 OID 19560)
-- Name: task_activity task_activity_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_activity
    ADD CONSTRAINT task_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4206 (class 2606 OID 19681)
-- Name: team_cards team_cards_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_cards
    ADD CONSTRAINT team_cards_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


-- Completed on 2025-09-18 14:08:41 IST

--
-- PostgreSQL database dump complete
--

\unrestrict Q9awpkgy1QHkB2KTkPykZfPbILj6wBtWN3geqZIUkEfmW63BSVn4n2QbAynkPRo

