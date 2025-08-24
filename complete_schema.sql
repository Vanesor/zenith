--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Ubuntu 14.18-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 14.18 (Ubuntu 14.18-0ubuntu0.22.04.1)

-- Started on 2025-08-25 02:18:46 IST

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
-- TOC entry 4329 (class 0 OID 0)
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
-- TOC entry 4330 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 323 (class 1255 OID 19755)
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
-- TOC entry 337 (class 1255 OID 19219)
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
-- TOC entry 325 (class 1255 OID 19217)
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
-- TOC entry 338 (class 1255 OID 19221)
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
-- TOC entry 324 (class 1255 OID 17453)
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
-- TOC entry 246 (class 1259 OID 18204)
-- Name: club_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.club_members (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    club_id uuid NOT NULL,
    is_leader boolean DEFAULT false,
    joined_at timestamp with time zone DEFAULT now()
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
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
-- TOC entry 3911 (class 2606 OID 17646)
-- Name: ai_assignment_generations ai_assignment_generations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_assignment_generations
    ADD CONSTRAINT ai_assignment_generations_pkey PRIMARY KEY (id);


--
-- TOC entry 3970 (class 2606 OID 17926)
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- TOC entry 3931 (class 2606 OID 17734)
-- Name: assignment_attempts assignment_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_attempts
    ADD CONSTRAINT assignment_attempts_pkey PRIMARY KEY (id);


--
-- TOC entry 3943 (class 2606 OID 17754)
-- Name: assignment_audit_log assignment_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_audit_log
    ADD CONSTRAINT assignment_audit_log_pkey PRIMARY KEY (id);


--
-- TOC entry 3917 (class 2606 OID 17681)
-- Name: assignment_questions assignment_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_questions
    ADD CONSTRAINT assignment_questions_pkey PRIMARY KEY (id);


--
-- TOC entry 3924 (class 2606 OID 17699)
-- Name: assignment_submissions assignment_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_pkey PRIMARY KEY (id);


--
-- TOC entry 3905 (class 2606 OID 17628)
-- Name: assignment_templates assignment_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_templates
    ADD CONSTRAINT assignment_templates_pkey PRIMARY KEY (id);


--
-- TOC entry 3946 (class 2606 OID 17778)
-- Name: assignment_violations assignment_violations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_violations
    ADD CONSTRAINT assignment_violations_pkey PRIMARY KEY (id);


--
-- TOC entry 3898 (class 2606 OID 17605)
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- TOC entry 4040 (class 2606 OID 18321)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 4124 (class 2606 OID 19661)
-- Name: carousel_slides carousel_slides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carousel_slides
    ADD CONSTRAINT carousel_slides_pkey PRIMARY KEY (id);


--
-- TOC entry 4001 (class 2606 OID 18176)
-- Name: chat_attachments chat_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_attachments
    ADD CONSTRAINT chat_attachments_pkey PRIMARY KEY (id);


--
-- TOC entry 4006 (class 2606 OID 18193)
-- Name: chat_invitations chat_invitations_invitation_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_invitations
    ADD CONSTRAINT chat_invitations_invitation_token_key UNIQUE (invitation_token);


--
-- TOC entry 4008 (class 2606 OID 18191)
-- Name: chat_invitations chat_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_invitations
    ADD CONSTRAINT chat_invitations_pkey PRIMARY KEY (id);


--
-- TOC entry 3994 (class 2606 OID 18137)
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- TOC entry 3990 (class 2606 OID 18112)
-- Name: chat_room_members chat_room_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_room_members
    ADD CONSTRAINT chat_room_members_pkey PRIMARY KEY (id);


--
-- TOC entry 3987 (class 2606 OID 18092)
-- Name: chat_rooms chat_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_pkey PRIMARY KEY (id);


--
-- TOC entry 4010 (class 2606 OID 18211)
-- Name: club_members club_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.club_members
    ADD CONSTRAINT club_members_pkey PRIMARY KEY (id);


--
-- TOC entry 4014 (class 2606 OID 18226)
-- Name: club_statistics club_statistics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.club_statistics
    ADD CONSTRAINT club_statistics_pkey PRIMARY KEY (id);


--
-- TOC entry 3878 (class 2606 OID 17492)
-- Name: clubs clubs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clubs
    ADD CONSTRAINT clubs_pkey PRIMARY KEY (id);


--
-- TOC entry 3955 (class 2606 OID 17830)
-- Name: code_results code_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.code_results
    ADD CONSTRAINT code_results_pkey PRIMARY KEY (id);


--
-- TOC entry 3957 (class 2606 OID 17846)
-- Name: coding_submissions coding_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coding_submissions
    ADD CONSTRAINT coding_submissions_pkey PRIMARY KEY (id);


--
-- TOC entry 4142 (class 2606 OID 19766)
-- Name: comment_likes comment_likes_comment_id_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_comment_id_user_id_unique UNIQUE (comment_id, user_id);


--
-- TOC entry 4144 (class 2606 OID 19764)
-- Name: comment_likes comment_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_pkey PRIMARY KEY (id);


--
-- TOC entry 4077 (class 2606 OID 19062)
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- TOC entry 3894 (class 2606 OID 17551)
-- Name: committee_members committee_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.committee_members
    ADD CONSTRAINT committee_members_pkey PRIMARY KEY (id);


--
-- TOC entry 3891 (class 2606 OID 17534)
-- Name: committee_roles committee_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.committee_roles
    ADD CONSTRAINT committee_roles_pkey PRIMARY KEY (id);


--
-- TOC entry 3874 (class 2606 OID 17480)
-- Name: committees committees_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.committees
    ADD CONSTRAINT committees_name_key UNIQUE (name);


--
-- TOC entry 3876 (class 2606 OID 17478)
-- Name: committees committees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.committees
    ADD CONSTRAINT committees_pkey PRIMARY KEY (id);


--
-- TOC entry 4133 (class 2606 OID 19719)
-- Name: content_permissions content_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_permissions
    ADD CONSTRAINT content_permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 3974 (class 2606 OID 18007)
-- Name: discussion_replies discussion_replies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discussion_replies
    ADD CONSTRAINT discussion_replies_pkey PRIMARY KEY (id);


--
-- TOC entry 3972 (class 2606 OID 17986)
-- Name: discussions discussions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discussions
    ADD CONSTRAINT discussions_pkey PRIMARY KEY (id);


--
-- TOC entry 4021 (class 2606 OID 18257)
-- Name: email_logs email_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 4136 (class 2606 OID 19750)
-- Name: email_otps email_otps_email_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_otps
    ADD CONSTRAINT email_otps_email_type_key UNIQUE (email, type);


--
-- TOC entry 4138 (class 2606 OID 19748)
-- Name: email_otps email_otps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_otps
    ADD CONSTRAINT email_otps_pkey PRIMARY KEY (id);


--
-- TOC entry 3981 (class 2606 OID 18055)
-- Name: event_attendees event_attendees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_attendees
    ADD CONSTRAINT event_attendees_pkey PRIMARY KEY (id);


--
-- TOC entry 3985 (class 2606 OID 18076)
-- Name: event_registrations event_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_pkey PRIMARY KEY (id);


--
-- TOC entry 3976 (class 2606 OID 18035)
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- TOC entry 4130 (class 2606 OID 19698)
-- Name: featured_events featured_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_events
    ADD CONSTRAINT featured_events_pkey PRIMARY KEY (id);


--
-- TOC entry 4069 (class 2606 OID 19788)
-- Name: likes likes_comment_user_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_comment_user_unique UNIQUE (comment_id, user_id);


--
-- TOC entry 4071 (class 2606 OID 19039)
-- Name: likes likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_pkey PRIMARY KEY (id);


--
-- TOC entry 4073 (class 2606 OID 19786)
-- Name: likes likes_post_user_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_post_user_unique UNIQUE (post_id, user_id);


--
-- TOC entry 3964 (class 2606 OID 17863)
-- Name: media_files media_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_files
    ADD CONSTRAINT media_files_pkey PRIMARY KEY (id);


--
-- TOC entry 4055 (class 2606 OID 18382)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- TOC entry 4110 (class 2606 OID 19571)
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (name);


--
-- TOC entry 4019 (class 2606 OID 18244)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 4122 (class 2606 OID 19643)
-- Name: page_content page_content_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_content
    ADD CONSTRAINT page_content_pkey PRIMARY KEY (id);


--
-- TOC entry 4119 (class 2606 OID 19598)
-- Name: post_attachments post_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_attachments
    ADD CONSTRAINT post_attachments_pkey PRIMARY KEY (id);


--
-- TOC entry 4063 (class 2606 OID 19015)
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- TOC entry 4065 (class 2606 OID 19017)
-- Name: posts posts_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_slug_key UNIQUE (slug);


--
-- TOC entry 3968 (class 2606 OID 17905)
-- Name: proctoring_sessions proctoring_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proctoring_sessions
    ADD CONSTRAINT proctoring_sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 4104 (class 2606 OID 19187)
-- Name: project_invitations project_invitations_invitation_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_invitations
    ADD CONSTRAINT project_invitations_invitation_token_key UNIQUE (invitation_token);


--
-- TOC entry 4106 (class 2606 OID 19185)
-- Name: project_invitations project_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_invitations
    ADD CONSTRAINT project_invitations_pkey PRIMARY KEY (id);


--
-- TOC entry 4090 (class 2606 OID 19118)
-- Name: project_members project_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_pkey PRIMARY KEY (id);


--
-- TOC entry 4084 (class 2606 OID 19094)
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- TOC entry 4053 (class 2606 OID 18373)
-- Name: query_cache query_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.query_cache
    ADD CONSTRAINT query_cache_pkey PRIMARY KEY (cache_key);


--
-- TOC entry 3966 (class 2606 OID 17879)
-- Name: question_media question_media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_media
    ADD CONSTRAINT question_media_pkey PRIMARY KEY (id);


--
-- TOC entry 3949 (class 2606 OID 17794)
-- Name: question_options question_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_options
    ADD CONSTRAINT question_options_pkey PRIMARY KEY (id);


--
-- TOC entry 3953 (class 2606 OID 17811)
-- Name: question_responses question_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_responses
    ADD CONSTRAINT question_responses_pkey PRIMARY KEY (id);


--
-- TOC entry 4038 (class 2606 OID 18306)
-- Name: security_events security_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_events
    ADD CONSTRAINT security_events_pkey PRIMARY KEY (id);


--
-- TOC entry 4029 (class 2606 OID 18271)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 4031 (class 2606 OID 18273)
-- Name: sessions sessions_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key UNIQUE (token);


--
-- TOC entry 4114 (class 2606 OID 19579)
-- Name: submission_attachments submission_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submission_attachments
    ADD CONSTRAINT submission_attachments_pkey PRIMARY KEY (id);


--
-- TOC entry 4051 (class 2606 OID 18365)
-- Name: system_statistics system_statistics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_statistics
    ADD CONSTRAINT system_statistics_pkey PRIMARY KEY (id);


--
-- TOC entry 4108 (class 2606 OID 19554)
-- Name: task_activity task_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_activity
    ADD CONSTRAINT task_activity_pkey PRIMARY KEY (id);


--
-- TOC entry 4098 (class 2606 OID 19150)
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 4128 (class 2606 OID 19680)
-- Name: team_cards team_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_cards
    ADD CONSTRAINT team_cards_pkey PRIMARY KEY (id);


--
-- TOC entry 4034 (class 2606 OID 18290)
-- Name: trusted_devices trusted_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trusted_devices
    ADD CONSTRAINT trusted_devices_pkey PRIMARY KEY (id);


--
-- TOC entry 4075 (class 2606 OID 19041)
-- Name: likes unique_post_user_like; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT unique_post_user_like UNIQUE (post_id, user_id);


--
-- TOC entry 4086 (class 2606 OID 19096)
-- Name: projects unique_project_key_club; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT unique_project_key_club UNIQUE (club_id, project_key);


--
-- TOC entry 4092 (class 2606 OID 19120)
-- Name: project_members unique_project_member; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT unique_project_member UNIQUE (project_id, user_id);


--
-- TOC entry 4100 (class 2606 OID 19152)
-- Name: tasks unique_task_key_project; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT unique_task_key_project UNIQUE (project_id, task_key);


--
-- TOC entry 4047 (class 2606 OID 18335)
-- Name: user_activities user_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activities
    ADD CONSTRAINT user_activities_pkey PRIMARY KEY (id);


--
-- TOC entry 4049 (class 2606 OID 18349)
-- Name: user_badges user_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_pkey PRIMARY KEY (id);


--
-- TOC entry 3887 (class 2606 OID 17517)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3889 (class 2606 OID 17515)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3912 (class 1259 OID 18403)
-- Name: idx_ai_generations_assignment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_generations_assignment_id ON public.ai_assignment_generations USING btree (generated_assignment_id);


--
-- TOC entry 3913 (class 1259 OID 18404)
-- Name: idx_ai_generations_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_generations_created_at ON public.ai_assignment_generations USING btree (created_at);


--
-- TOC entry 3914 (class 1259 OID 18405)
-- Name: idx_ai_generations_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_generations_status ON public.ai_assignment_generations USING btree (generation_status);


--
-- TOC entry 3915 (class 1259 OID 18406)
-- Name: idx_ai_generations_template_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_generations_template_id ON public.ai_assignment_generations USING btree (template_id);


--
-- TOC entry 3932 (class 1259 OID 18407)
-- Name: idx_assignment_attempts_assignment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_attempts_assignment_id ON public.assignment_attempts USING btree (assignment_id);


--
-- TOC entry 3933 (class 1259 OID 18408)
-- Name: idx_assignment_attempts_assignment_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_attempts_assignment_user ON public.assignment_attempts USING btree (assignment_id, user_id);


--
-- TOC entry 3934 (class 1259 OID 18409)
-- Name: idx_assignment_attempts_auto_save; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_attempts_auto_save ON public.assignment_attempts USING btree (assignment_id, user_id, last_auto_save);


--
-- TOC entry 3935 (class 1259 OID 18410)
-- Name: idx_assignment_attempts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_attempts_status ON public.assignment_attempts USING btree (status);


--
-- TOC entry 3936 (class 1259 OID 18411)
-- Name: idx_assignment_attempts_submitted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_attempts_submitted_at ON public.assignment_attempts USING btree (submitted_at);


--
-- TOC entry 3937 (class 1259 OID 18412)
-- Name: idx_assignment_attempts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_attempts_user_id ON public.assignment_attempts USING btree (user_id);


--
-- TOC entry 3938 (class 1259 OID 18413)
-- Name: idx_assignment_attempts_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_attempts_user_status ON public.assignment_attempts USING btree (user_id, status, submitted_at DESC);


--
-- TOC entry 3939 (class 1259 OID 18414)
-- Name: idx_assignment_attempts_violations; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_attempts_violations ON public.assignment_attempts USING btree (assignment_id, window_violations);


--
-- TOC entry 3944 (class 1259 OID 18417)
-- Name: idx_assignment_audit_log_assignment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_audit_log_assignment ON public.assignment_audit_log USING btree (assignment_id);


--
-- TOC entry 3918 (class 1259 OID 18418)
-- Name: idx_assignment_questions_assignment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_questions_assignment_id ON public.assignment_questions USING btree (assignment_id);


--
-- TOC entry 3919 (class 1259 OID 18419)
-- Name: idx_assignment_questions_correct_answer_jsonb; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_questions_correct_answer_jsonb ON public.assignment_questions USING gin (correct_answer);


--
-- TOC entry 3920 (class 1259 OID 18420)
-- Name: idx_assignment_questions_language_settings; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_questions_language_settings ON public.assignment_questions USING btree (code_language, allow_any_language);


--
-- TOC entry 3925 (class 1259 OID 18423)
-- Name: idx_assignment_submissions_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_assignment_submissions_unique ON public.assignment_submissions USING btree (assignment_id, user_id);


--
-- TOC entry 3926 (class 1259 OID 18424)
-- Name: idx_assignment_submissions_user_submitted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_submissions_user_submitted ON public.assignment_submissions USING btree (user_id, submitted_at DESC);


--
-- TOC entry 3906 (class 1259 OID 18428)
-- Name: idx_assignment_templates_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_templates_category ON public.assignment_templates USING btree (category);


--
-- TOC entry 3907 (class 1259 OID 18429)
-- Name: idx_assignment_templates_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_templates_created_by ON public.assignment_templates USING btree (created_by);


--
-- TOC entry 3908 (class 1259 OID 18430)
-- Name: idx_assignment_templates_difficulty; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_templates_difficulty ON public.assignment_templates USING btree (difficulty_level);


--
-- TOC entry 3909 (class 1259 OID 18431)
-- Name: idx_assignment_templates_subject; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_templates_subject ON public.assignment_templates USING btree (subject);


--
-- TOC entry 3947 (class 1259 OID 18432)
-- Name: idx_assignment_violations_submission_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_violations_submission_id ON public.assignment_violations USING btree (submission_id);


--
-- TOC entry 3899 (class 1259 OID 18433)
-- Name: idx_assignments_club_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_club_id ON public.assignments USING btree (club_id);


--
-- TOC entry 3900 (class 1259 OID 18434)
-- Name: idx_assignments_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_created_by ON public.assignments USING btree (created_by);


--
-- TOC entry 3901 (class 1259 OID 18435)
-- Name: idx_assignments_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_due_date ON public.assignments USING btree (due_date);


--
-- TOC entry 3902 (class 1259 OID 18436)
-- Name: idx_assignments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_status ON public.assignments USING btree (status);


--
-- TOC entry 3903 (class 1259 OID 18437)
-- Name: idx_assignments_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_type ON public.assignments USING btree (assignment_type);


--
-- TOC entry 3940 (class 1259 OID 18415)
-- Name: idx_attempts_assignment_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attempts_assignment_status ON public.assignment_attempts USING btree (assignment_id, status);


--
-- TOC entry 3941 (class 1259 OID 18416)
-- Name: idx_attempts_user_assignment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attempts_user_assignment ON public.assignment_attempts USING btree (user_id, assignment_id, attempt_number);


--
-- TOC entry 4041 (class 1259 OID 18473)
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- TOC entry 4042 (class 1259 OID 18474)
-- Name: idx_audit_logs_resource_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_resource_type ON public.audit_logs USING btree (resource_type);


--
-- TOC entry 4043 (class 1259 OID 18472)
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- TOC entry 4125 (class 1259 OID 19731)
-- Name: idx_carousel_slides_page; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_carousel_slides_page ON public.carousel_slides USING btree (page_type, page_reference_id);


--
-- TOC entry 4002 (class 1259 OID 19628)
-- Name: idx_chat_attachments_file_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_attachments_file_id ON public.chat_attachments USING btree (file_id);


--
-- TOC entry 4003 (class 1259 OID 19616)
-- Name: idx_chat_attachments_room_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_attachments_room_id ON public.chat_attachments USING btree (room_id);


--
-- TOC entry 4004 (class 1259 OID 19627)
-- Name: idx_chat_attachments_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_attachments_user_id ON public.chat_attachments USING btree (user_id);


--
-- TOC entry 3995 (class 1259 OID 19533)
-- Name: idx_chat_messages_can_edit_until; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_can_edit_until ON public.chat_messages USING btree (can_edit_until);


--
-- TOC entry 3996 (class 1259 OID 18454)
-- Name: idx_chat_messages_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_created_at ON public.chat_messages USING btree (created_at);


--
-- TOC entry 3997 (class 1259 OID 19532)
-- Name: idx_chat_messages_edited_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_edited_at ON public.chat_messages USING btree (edited_at);


--
-- TOC entry 3998 (class 1259 OID 18452)
-- Name: idx_chat_messages_room_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_room_id ON public.chat_messages USING btree (room_id);


--
-- TOC entry 3999 (class 1259 OID 18453)
-- Name: idx_chat_messages_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_user_id ON public.chat_messages USING btree (user_id);


--
-- TOC entry 3991 (class 1259 OID 18455)
-- Name: idx_chat_room_members_chat_room_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_room_members_chat_room_id ON public.chat_room_members USING btree (chat_room_id);


--
-- TOC entry 3992 (class 1259 OID 18456)
-- Name: idx_chat_room_members_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_room_members_user_id ON public.chat_room_members USING btree (user_id);


--
-- TOC entry 3988 (class 1259 OID 19534)
-- Name: idx_chat_rooms_profile_picture; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_rooms_profile_picture ON public.chat_rooms USING btree (profile_picture_url);


--
-- TOC entry 4011 (class 1259 OID 18460)
-- Name: idx_club_members_club_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_club_members_club_id ON public.club_members USING btree (club_id);


--
-- TOC entry 4012 (class 1259 OID 18459)
-- Name: idx_club_members_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_club_members_user_id ON public.club_members USING btree (user_id);


--
-- TOC entry 3879 (class 1259 OID 18457)
-- Name: idx_clubs_coordinator_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clubs_coordinator_id ON public.clubs USING btree (coordinator_id);


--
-- TOC entry 3880 (class 1259 OID 18458)
-- Name: idx_clubs_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clubs_type ON public.clubs USING btree (type);


--
-- TOC entry 3958 (class 1259 OID 18481)
-- Name: idx_coding_submissions_question_response_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coding_submissions_question_response_id ON public.coding_submissions USING btree (question_response_id);


--
-- TOC entry 4145 (class 1259 OID 19777)
-- Name: idx_comment_likes_comment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comment_likes_comment_id ON public.comment_likes USING btree (comment_id);


--
-- TOC entry 4146 (class 1259 OID 19778)
-- Name: idx_comment_likes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comment_likes_user_id ON public.comment_likes USING btree (user_id);


--
-- TOC entry 4078 (class 1259 OID 19207)
-- Name: idx_comments_author_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_author_id ON public.comments USING btree (author_id);


--
-- TOC entry 4079 (class 1259 OID 19206)
-- Name: idx_comments_post_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_post_id ON public.comments USING btree (post_id);


--
-- TOC entry 3895 (class 1259 OID 18449)
-- Name: idx_committee_members_committee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_committee_members_committee_id ON public.committee_members USING btree (committee_id);


--
-- TOC entry 3896 (class 1259 OID 18450)
-- Name: idx_committee_members_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_committee_members_user_id ON public.committee_members USING btree (user_id);


--
-- TOC entry 3892 (class 1259 OID 18451)
-- Name: idx_committee_roles_committee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_committee_roles_committee_id ON public.committee_roles USING btree (committee_id);


--
-- TOC entry 4134 (class 1259 OID 19734)
-- Name: idx_content_permissions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_permissions_user ON public.content_permissions USING btree (user_id, page_type, page_reference_id);


--
-- TOC entry 4022 (class 1259 OID 18470)
-- Name: idx_email_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_created_at ON public.email_logs USING btree (created_at);


--
-- TOC entry 4023 (class 1259 OID 18469)
-- Name: idx_email_logs_recipient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_recipient ON public.email_logs USING btree (recipient);


--
-- TOC entry 4024 (class 1259 OID 18471)
-- Name: idx_email_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_status ON public.email_logs USING btree (status);


--
-- TOC entry 4139 (class 1259 OID 19751)
-- Name: idx_email_otps_email_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_otps_email_type ON public.email_otps USING btree (email, type);


--
-- TOC entry 4140 (class 1259 OID 19752)
-- Name: idx_email_otps_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_otps_expires_at ON public.email_otps USING btree (expires_at);


--
-- TOC entry 3982 (class 1259 OID 18464)
-- Name: idx_event_attendees_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_attendees_event_id ON public.event_attendees USING btree (event_id);


--
-- TOC entry 3983 (class 1259 OID 18465)
-- Name: idx_event_attendees_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_attendees_user_id ON public.event_attendees USING btree (user_id);


--
-- TOC entry 3977 (class 1259 OID 18461)
-- Name: idx_events_club_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_club_id ON public.events USING btree (club_id);


--
-- TOC entry 3978 (class 1259 OID 18462)
-- Name: idx_events_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_created_by ON public.events USING btree (created_by);


--
-- TOC entry 3979 (class 1259 OID 18463)
-- Name: idx_events_event_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_event_date ON public.events USING btree (event_date);


--
-- TOC entry 4131 (class 1259 OID 19733)
-- Name: idx_featured_events_page; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_events_page ON public.featured_events USING btree (page_type, page_reference_id);


--
-- TOC entry 4066 (class 1259 OID 19204)
-- Name: idx_likes_post_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_likes_post_id ON public.likes USING btree (post_id);


--
-- TOC entry 4067 (class 1259 OID 19205)
-- Name: idx_likes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_likes_user_id ON public.likes USING btree (user_id);


--
-- TOC entry 3959 (class 1259 OID 19610)
-- Name: idx_media_files_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_media_files_created_at ON public.media_files USING btree (created_at);


--
-- TOC entry 3960 (class 1259 OID 18478)
-- Name: idx_media_files_upload_context; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_media_files_upload_context ON public.media_files USING btree (upload_context);


--
-- TOC entry 3961 (class 1259 OID 19609)
-- Name: idx_media_files_upload_reference; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_media_files_upload_reference ON public.media_files USING btree (upload_reference_id, upload_context);


--
-- TOC entry 3962 (class 1259 OID 18477)
-- Name: idx_media_files_uploaded_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_media_files_uploaded_by ON public.media_files USING btree (uploaded_by);


--
-- TOC entry 4015 (class 1259 OID 18467)
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at);


--
-- TOC entry 4016 (class 1259 OID 18468)
-- Name: idx_notifications_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_read ON public.notifications USING btree (read);


--
-- TOC entry 4017 (class 1259 OID 18466)
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- TOC entry 4120 (class 1259 OID 19730)
-- Name: idx_page_content_page; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_content_page ON public.page_content USING btree (page_type, page_reference_id);


--
-- TOC entry 4115 (class 1259 OID 19614)
-- Name: idx_post_attachments_media_file_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_attachments_media_file_id ON public.post_attachments USING btree (media_file_id);


--
-- TOC entry 4116 (class 1259 OID 19613)
-- Name: idx_post_attachments_post_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_attachments_post_id ON public.post_attachments USING btree (post_id);


--
-- TOC entry 4117 (class 1259 OID 19615)
-- Name: idx_post_attachments_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_attachments_type ON public.post_attachments USING btree (attachment_type);


--
-- TOC entry 4056 (class 1259 OID 19198)
-- Name: idx_posts_author_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_author_id ON public.posts USING btree (author_id);


--
-- TOC entry 4057 (class 1259 OID 19199)
-- Name: idx_posts_club_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_club_id ON public.posts USING btree (club_id);


--
-- TOC entry 4058 (class 1259 OID 19201)
-- Name: idx_posts_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_created_at ON public.posts USING btree (created_at);


--
-- TOC entry 4059 (class 1259 OID 19203)
-- Name: idx_posts_search_vector; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_search_vector ON public.posts USING gin (search_vector);


--
-- TOC entry 4060 (class 1259 OID 19202)
-- Name: idx_posts_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_slug ON public.posts USING btree (slug);


--
-- TOC entry 4061 (class 1259 OID 19200)
-- Name: idx_posts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_status ON public.posts USING btree (status);


--
-- TOC entry 4101 (class 1259 OID 19754)
-- Name: idx_project_invitations_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_invitations_email ON public.project_invitations USING btree (email);


--
-- TOC entry 4102 (class 1259 OID 19753)
-- Name: idx_project_invitations_keys; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_invitations_keys ON public.project_invitations USING btree (project_key, access_key);


--
-- TOC entry 4087 (class 1259 OID 19211)
-- Name: idx_project_members_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_members_project_id ON public.project_members USING btree (project_id);


--
-- TOC entry 4088 (class 1259 OID 19212)
-- Name: idx_project_members_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_members_user_id ON public.project_members USING btree (user_id);


--
-- TOC entry 4080 (class 1259 OID 19208)
-- Name: idx_projects_club_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_club_id ON public.projects USING btree (club_id);


--
-- TOC entry 4081 (class 1259 OID 19209)
-- Name: idx_projects_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_created_by ON public.projects USING btree (created_by);


--
-- TOC entry 4082 (class 1259 OID 19210)
-- Name: idx_projects_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_status ON public.projects USING btree (status);


--
-- TOC entry 3950 (class 1259 OID 18480)
-- Name: idx_question_responses_question_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_question_responses_question_id ON public.question_responses USING btree (question_id);


--
-- TOC entry 3951 (class 1259 OID 18479)
-- Name: idx_question_responses_submission_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_question_responses_submission_id ON public.question_responses USING btree (submission_id);


--
-- TOC entry 3921 (class 1259 OID 18421)
-- Name: idx_questions_assignment_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_questions_assignment_order ON public.assignment_questions USING btree (assignment_id, question_order);


--
-- TOC entry 3922 (class 1259 OID 18422)
-- Name: idx_questions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_questions_type ON public.assignment_questions USING btree (question_type);


--
-- TOC entry 4035 (class 1259 OID 18448)
-- Name: idx_security_events_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_events_event_type ON public.security_events USING btree (event_type);


--
-- TOC entry 4036 (class 1259 OID 18447)
-- Name: idx_security_events_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_events_user_id ON public.security_events USING btree (user_id);


--
-- TOC entry 4025 (class 1259 OID 18445)
-- Name: idx_sessions_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_expires_at ON public.sessions USING btree (expires_at);


--
-- TOC entry 4026 (class 1259 OID 18444)
-- Name: idx_sessions_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_token ON public.sessions USING btree (token);


--
-- TOC entry 4027 (class 1259 OID 18443)
-- Name: idx_sessions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_user_id ON public.sessions USING btree (user_id);


--
-- TOC entry 4111 (class 1259 OID 19612)
-- Name: idx_submission_attachments_media_file_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submission_attachments_media_file_id ON public.submission_attachments USING btree (media_file_id);


--
-- TOC entry 4112 (class 1259 OID 19611)
-- Name: idx_submission_attachments_submission_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submission_attachments_submission_id ON public.submission_attachments USING btree (submission_id);


--
-- TOC entry 3927 (class 1259 OID 18425)
-- Name: idx_submissions_assignment_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_assignment_status ON public.assignment_submissions USING btree (assignment_id, status);


--
-- TOC entry 3928 (class 1259 OID 18426)
-- Name: idx_submissions_status_submitted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_status_submitted ON public.assignment_submissions USING btree (status, submitted_at DESC);


--
-- TOC entry 3929 (class 1259 OID 18427)
-- Name: idx_submissions_user_submitted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_user_submitted ON public.assignment_submissions USING btree (user_id, submitted_at DESC);


--
-- TOC entry 4093 (class 1259 OID 19214)
-- Name: idx_tasks_assignee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_assignee_id ON public.tasks USING btree (assignee_id);


--
-- TOC entry 4094 (class 1259 OID 19216)
-- Name: idx_tasks_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_due_date ON public.tasks USING btree (due_date);


--
-- TOC entry 4095 (class 1259 OID 19213)
-- Name: idx_tasks_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_project_id ON public.tasks USING btree (project_id);


--
-- TOC entry 4096 (class 1259 OID 19215)
-- Name: idx_tasks_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_status ON public.tasks USING btree (status);


--
-- TOC entry 4126 (class 1259 OID 19732)
-- Name: idx_team_cards_page; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_cards_page ON public.team_cards USING btree (page_type, page_reference_id);


--
-- TOC entry 4032 (class 1259 OID 18446)
-- Name: idx_trusted_devices_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trusted_devices_user_id ON public.trusted_devices USING btree (user_id);


--
-- TOC entry 4044 (class 1259 OID 18476)
-- Name: idx_user_activities_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_activities_created_at ON public.user_activities USING btree (created_at);


--
-- TOC entry 4045 (class 1259 OID 18475)
-- Name: idx_user_activities_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_activities_user_id ON public.user_activities USING btree (user_id);


--
-- TOC entry 3881 (class 1259 OID 18439)
-- Name: idx_users_club_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_club_id ON public.users USING btree (club_id);


--
-- TOC entry 3882 (class 1259 OID 18441)
-- Name: idx_users_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_created_at ON public.users USING btree (created_at);


--
-- TOC entry 3883 (class 1259 OID 18438)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 3884 (class 1259 OID 18442)
-- Name: idx_users_last_activity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_last_activity ON public.users USING btree (last_activity);


--
-- TOC entry 3885 (class 1259 OID 18440)
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- TOC entry 4175 (class 2620 OID 19218)
-- Name: posts posts_search_vector_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER posts_search_vector_update BEFORE INSERT OR UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_post_search_vector();


--
-- TOC entry 4180 (class 2620 OID 19220)
-- Name: tasks tasks_generate_key; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tasks_generate_key BEFORE INSERT ON public.tasks FOR EACH ROW WHEN (((new.task_key IS NULL) OR ((new.task_key)::text = ''::text))) EXECUTE FUNCTION public.generate_task_key();


--
-- TOC entry 4179 (class 2620 OID 19222)
-- Name: tasks tasks_update_project_progress; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tasks_update_project_progress AFTER INSERT OR DELETE OR UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_project_progress();


--
-- TOC entry 4172 (class 2620 OID 18484)
-- Name: assignments update_assignments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4182 (class 2620 OID 19736)
-- Name: carousel_slides update_carousel_slides_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_carousel_slides_updated_at BEFORE UPDATE ON public.carousel_slides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4168 (class 2620 OID 18483)
-- Name: clubs update_clubs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON public.clubs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4176 (class 2620 OID 19226)
-- Name: comments update_comments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4171 (class 2620 OID 18486)
-- Name: committee_members update_committee_members_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_committee_members_updated_at BEFORE UPDATE ON public.committee_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4170 (class 2620 OID 18487)
-- Name: committee_roles update_committee_roles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_committee_roles_updated_at BEFORE UPDATE ON public.committee_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4167 (class 2620 OID 18488)
-- Name: committees update_committees_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_committees_updated_at BEFORE UPDATE ON public.committees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4173 (class 2620 OID 18485)
-- Name: events update_events_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4184 (class 2620 OID 19738)
-- Name: featured_events update_featured_events_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_featured_events_updated_at BEFORE UPDATE ON public.featured_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4181 (class 2620 OID 19735)
-- Name: page_content update_page_content_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_page_content_updated_at BEFORE UPDATE ON public.page_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4174 (class 2620 OID 19223)
-- Name: posts update_posts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4177 (class 2620 OID 19224)
-- Name: projects update_projects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4178 (class 2620 OID 19225)
-- Name: tasks update_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4183 (class 2620 OID 19737)
-- Name: team_cards update_team_cards_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_team_cards_updated_at BEFORE UPDATE ON public.team_cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4169 (class 2620 OID 18482)
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4159 (class 2606 OID 19662)
-- Name: carousel_slides carousel_slides_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carousel_slides
    ADD CONSTRAINT carousel_slides_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4149 (class 2606 OID 19622)
-- Name: chat_attachments chat_attachments_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_attachments
    ADD CONSTRAINT chat_attachments_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.media_files(id) ON DELETE CASCADE;


--
-- TOC entry 4150 (class 2606 OID 19617)
-- Name: chat_attachments chat_attachments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_attachments
    ADD CONSTRAINT chat_attachments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4165 (class 2606 OID 19767)
-- Name: comment_likes comment_likes_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- TOC entry 4166 (class 2606 OID 19772)
-- Name: comment_likes comment_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4163 (class 2606 OID 19725)
-- Name: content_permissions content_permissions_granted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_permissions
    ADD CONSTRAINT content_permissions_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.users(id);


--
-- TOC entry 4164 (class 2606 OID 19720)
-- Name: content_permissions content_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_permissions
    ADD CONSTRAINT content_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4161 (class 2606 OID 19704)
-- Name: featured_events featured_events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_events
    ADD CONSTRAINT featured_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4162 (class 2606 OID 19699)
-- Name: featured_events featured_events_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_events
    ADD CONSTRAINT featured_events_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- TOC entry 4148 (class 2606 OID 19535)
-- Name: chat_messages fk_chat_messages_edited_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT fk_chat_messages_edited_by FOREIGN KEY (edited_by) REFERENCES public.users(id);


--
-- TOC entry 4147 (class 2606 OID 19540)
-- Name: chat_rooms fk_chat_rooms_edited_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT fk_chat_rooms_edited_by FOREIGN KEY (edited_by) REFERENCES public.users(id);


--
-- TOC entry 4151 (class 2606 OID 19779)
-- Name: likes likes_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- TOC entry 4158 (class 2606 OID 19644)
-- Name: page_content page_content_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_content
    ADD CONSTRAINT page_content_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4156 (class 2606 OID 19604)
-- Name: post_attachments post_attachments_media_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_attachments
    ADD CONSTRAINT post_attachments_media_file_id_fkey FOREIGN KEY (media_file_id) REFERENCES public.media_files(id) ON DELETE CASCADE;


--
-- TOC entry 4157 (class 2606 OID 19599)
-- Name: post_attachments post_attachments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_attachments
    ADD CONSTRAINT post_attachments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- TOC entry 4154 (class 2606 OID 19585)
-- Name: submission_attachments submission_attachments_media_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submission_attachments
    ADD CONSTRAINT submission_attachments_media_file_id_fkey FOREIGN KEY (media_file_id) REFERENCES public.media_files(id) ON DELETE CASCADE;


--
-- TOC entry 4155 (class 2606 OID 19580)
-- Name: submission_attachments submission_attachments_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submission_attachments
    ADD CONSTRAINT submission_attachments_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.assignment_submissions(id) ON DELETE CASCADE;


--
-- TOC entry 4152 (class 2606 OID 19555)
-- Name: task_activity task_activity_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_activity
    ADD CONSTRAINT task_activity_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- TOC entry 4153 (class 2606 OID 19560)
-- Name: task_activity task_activity_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_activity
    ADD CONSTRAINT task_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4160 (class 2606 OID 19681)
-- Name: team_cards team_cards_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_cards
    ADD CONSTRAINT team_cards_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


-- Completed on 2025-08-25 02:18:53 IST

--
-- PostgreSQL database dump complete
--

