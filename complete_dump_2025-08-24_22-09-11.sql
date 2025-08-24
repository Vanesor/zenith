--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Ubuntu 14.18-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 14.18 (Ubuntu 14.18-0ubuntu0.22.04.1)

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
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
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
-- Name: club_statistics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.club_statistics_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
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
-- Name: comment_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comment_likes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    comment_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
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
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    name character varying(255) NOT NULL,
    applied_at timestamp with time zone DEFAULT now()
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
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
-- Name: query_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.query_cache (
    cache_key text NOT NULL,
    cache_value jsonb NOT NULL,
    last_updated timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone NOT NULL
);


--
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
-- Name: system_statistics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_statistics_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
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
-- Name: user_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_activities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
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
-- Data for Name: ai_assignment_generations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ai_assignment_generations (id, template_id, generated_assignment_id, source_file_url, generation_prompt, ai_model_used, generation_status, questions_extracted, questions_created, processing_log, error_details, generated_by, created_at, completed_at) FROM stdin;
\.


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.announcements (id, title, content, author_id, club_id, priority, expires_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: assignment_attempts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assignment_attempts (id, assignment_id, user_id, attempt_number, start_time, end_time, time_spent, score, max_score, percentage, is_passing, answers, graded_answers, violations, status, submitted_at, created_at, updated_at, is_fullscreen, auto_save_data, window_violations, last_auto_save, browser_info) FROM stdin;
\.


--
-- Data for Name: assignment_audit_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assignment_audit_log (id, assignment_id, user_id, attempt_id, action, details, created_at) FROM stdin;
\.


--
-- Data for Name: assignment_questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assignment_questions (id, assignment_id, question_text, question_type, marks, time_limit, code_language, code_template, test_cases, expected_output, solution, ordering, created_at, updated_at, type, title, description, options, correct_answer, points, question_order, starter_code, integer_min, integer_max, integer_step, explanation, allowed_languages, allow_any_language, question_image_url, question_image_alt, question_images, answer_images) FROM stdin;
\.


--
-- Data for Name: assignment_submissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assignment_submissions (id, assignment_id, user_id, submission_text, file_url, submitted_at, status, grade, feedback, started_at, completed_at, violation_count, time_spent, auto_submitted, ip_address, user_agent, total_score) FROM stdin;
\.


--
-- Data for Name: assignment_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assignment_templates (id, name, description, template_file_url, template_type, category, subject, difficulty_level, estimated_questions, created_by, is_active, usage_count, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: assignment_violations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assignment_violations (id, submission_id, violation_type, occurred_at, details) FROM stdin;
\.


--
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assignments (id, title, description, club_id, created_by, due_date, max_points, instructions, status, created_at, updated_at, assignment_type, target_audience, target_clubs, time_limit, allow_navigation, passing_score, is_proctored, shuffle_questions, allow_calculator, show_results, allow_review, shuffle_options, max_attempts, is_published, coding_instructions, objective_instructions, mixed_instructions, essay_instructions, require_fullscreen, auto_submit_on_violation, max_violations, code_editor_settings, require_camera, require_microphone, require_face_verification, proctoring_settings, start_date, start_time) FROM stdin;
\.


--
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
24c25726-ced6-416b-9a18-c0c391039cff	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "0d2e0f87-8dca-4a66-899f-afb7cce5a8e1", "timestamp": "2025-08-24T15:55:28.250Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 21:25:28.251095+05:30
9e61cb8b-3aa8-4558-812b-6d606f3075f0	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "74b42ab0-2fe4-44d6-b1e0-7b7770473c27", "timestamp": "2025-08-24T16:00:29.199Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 21:30:29.199612+05:30
cbafe159-830b-4f43-a455-5ad0dc9a004c	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "74b42ab0-2fe4-44d6-b1e0-7b7770473c27", "timestamp": "2025-08-24T16:00:57.955Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 21:30:57.955884+05:30
3fe70b26-5262-437f-b758-5ea30964e181	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "f7b56342-ef88-4621-a1f4-ccacd8aa11ee", "timestamp": "2025-08-24T16:24:29.168Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 21:54:29.168622+05:30
d45d6ff9-00bf-4e31-b767-d9276bc3d0ce	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "f7b56342-ef88-4621-a1f4-ccacd8aa11ee", "timestamp": "2025-08-24T16:35:29.630Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 22:05:29.631029+05:30
2d874404-28f6-4b66-819f-63dc17dd63b7	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "f7b56342-ef88-4621-a1f4-ccacd8aa11ee", "timestamp": "2025-08-24T16:36:39.264Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 22:06:39.264491+05:30
651eb52c-e35a-422e-ae4f-e99a60e68a80	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "f7b56342-ef88-4621-a1f4-ccacd8aa11ee", "timestamp": "2025-08-24T16:36:43.087Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 22:06:43.087396+05:30
01d9eb49-498d-4ae5-8c9c-ff3b62e26141	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	login	auth	\N	\N	\N	{"reason": "Invalid session", "endpoint": "/api/auth/check", "sessionId": "f7b56342-ef88-4621-a1f4-ccacd8aa11ee", "timestamp": "2025-08-24T16:37:12.972Z"}	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-24 22:07:12.972333+05:30
\.


--
-- Data for Name: carousel_slides; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.carousel_slides (id, page_type, page_reference_id, title, subtitle, description, image_url, button_text, button_link, display_order, is_active, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: chat_attachments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_attachments (id, message_id, room_id, filename, original_filename, file_path, file_type, file_size, mime_type, encryption_key, created_at, user_id, file_id) FROM stdin;
\.


--
-- Data for Name: chat_invitations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_invitations (id, room_id, inviter_id, invitee_email, invitation_token, message, status, expires_at, created_at, accepted_at) FROM stdin;
\.


--
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
\.


--
-- Data for Name: chat_room_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_room_members (id, chat_room_id, user_id, joined_at, role, user_email) FROM stdin;
\.


--
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
550e8400-1004-41d4-a716-446655440001	ALTOGETHER General	Main discussion room for ALTOGETHER development club	altogether	club	550e8400-e29b-41d4-a716-446655440040	{}	2025-07-27 13:47:32.966+05:30	2025-07-30 19:29:51.513+05:30	club	f	\N	[]	{}	\N	\N	\N
550e8400-1004-41d4-a716-446655440002	ALTOGETHER Growth	Discussion about overall development	altogether	club	550e8400-e29b-41d4-a716-446655440040	{}	2025-07-27 13:47:32.966+05:30	2025-07-30 19:29:51.513+05:30	club	f	\N	[]	{}	\N	\N	\N
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
\.


--
-- Data for Name: club_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.club_members (id, user_id, club_id, is_leader, joined_at) FROM stdin;
\.


--
-- Data for Name: club_statistics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.club_statistics (id, club_id, member_count, event_count, assignment_count, comment_count, total_engagement, average_engagement, last_updated) FROM stdin;
\.


--
-- Data for Name: clubs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clubs (id, name, type, description, long_description, icon, color, coordinator_id, co_coordinator_id, secretary_id, media_id, guidelines, meeting_schedule, created_at, updated_at, logo_url, banner_image_url, club_images, member_count) FROM stdin;
ascend	ASCEND	Technical	A coding club focused on programming and technology	ASCEND is the premier coding club fostering programming skills, software development, and technological innovation. We organize hackathons, coding workshops, and technical seminars to help students master programming languages and development frameworks.	Code	blue	550e8400-e29b-41d4-a716-446655440010	550e8400-e29b-41d4-a716-446655440011	550e8400-e29b-41d4-a716-446655440012	550e8400-e29b-41d4-a716-446655440013	Focus on coding excellence and software development	{}	2025-07-27 13:47:32.966+05:30	2025-08-14 00:09:39.49+05:30	\N	\N	[]	0
aster	ASTER	Soft Skills	A club focused on developing interpersonal and communication skills	ASTER is dedicated to enhancing soft skills including communication, leadership, teamwork, and professional development. We organize workshops, seminars, and activities to help students develop essential workplace skills.	Users	green	550e8400-e29b-41d4-a716-446655440020	550e8400-e29b-41d4-a716-446655440021	550e8400-e29b-41d4-a716-446655440022	550e8400-e29b-41d4-a716-446655440023	Develop essential soft skills for professional success	{}	2025-07-27 13:47:32.966+05:30	2025-08-14 00:09:39.49+05:30	\N	\N	[]	0
achievers	ACHIEVERS	Higher Studies	A club supporting students pursuing higher education and academic excellence	ACHIEVERS supports students in their academic journey towards higher studies including competitive exams, research opportunities, and advanced academic pursuits. We provide guidance, resources, and mentorship for academic excellence.	GraduationCap	purple	550e8400-e29b-41d4-a716-446655440030	550e8400-e29b-41d4-a716-446655440031	550e8400-e29b-41d4-a716-446655440032	550e8400-e29b-41d4-a716-446655440033	Support academic excellence and higher education goals	{}	2025-07-27 13:47:32.966+05:30	2025-08-14 00:09:39.49+05:30	\N	\N	[]	0
altogether	ALTOGETHER	Overall Development	A comprehensive club focusing on holistic student development	ALTOGETHER promotes overall personality development combining technical skills, soft skills, academic excellence, and personal growth. We organize diverse activities to ensure well-rounded development of students across all areas.	Target	orange	550e8400-e29b-41d4-a716-446655440040	550e8400-e29b-41d4-a716-446655440041	550e8400-e29b-41d4-a716-446655440042	550e8400-e29b-41d4-a716-446655440043	Foster complete personality and skill development	{}	2025-07-27 13:47:32.966+05:30	2025-08-14 00:09:39.49+05:30	\N	\N	[]	0
\.


--
-- Data for Name: code_results; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.code_results (id, response_id, test_case_index, passed, stdout, stderr, execution_time, memory_used, created_at) FROM stdin;
\.


--
-- Data for Name: coding_submissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.coding_submissions (id, question_response_id, language, code, is_final, execution_result, created_at) FROM stdin;
\.


--
-- Data for Name: comment_likes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.comment_likes (id, comment_id, user_id, created_at) FROM stdin;
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.comments (id, post_id, author_id, content, parent_id, likes_count, created_at, updated_at) FROM stdin;
c6cb6351-a125-491b-a4fa-c74ea8c80147	3bc000fa-d086-4977-9cb3-08105ada3771	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	nice	\N	0	2025-08-24 19:01:38.717994+05:30	2025-08-24 19:01:38.717994+05:30
\.


--
-- Data for Name: committee_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.committee_members (id, committee_id, role_id, user_id, status, joined_at, term_start, term_end, achievements, created_at, updated_at) FROM stdin;
efdde746-50c9-48a0-86a1-3d991d813b6b	9e2a45e8-88e0-4998-bbc1-1ab68cf9f989	bd8838dc-d4db-4bf9-a483-fc970b01d35a	8694ff1f-1d1e-4a7b-8ecb-eebda2c937d3	active	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30	2026-08-20 11:30:17.917+05:30	\N	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30
8663ee16-2776-46f5-91fb-567490ead94f	9e2a45e8-88e0-4998-bbc1-1ab68cf9f989	61066b5a-6b0c-411a-83fd-ea3fa81893b5	241f4f32-458e-410e-b2f2-6dcfda992455	active	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30	2026-08-20 11:30:17.917+05:30	\N	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30
d8102f60-2815-4571-8806-e4979624b577	9e2a45e8-88e0-4998-bbc1-1ab68cf9f989	60880bea-c878-4fe6-9388-8b4384ad2a59	53cbed56-2bc7-4faf-bd6e-5f953de4dfa5	active	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30	2026-08-20 11:30:17.917+05:30	\N	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30
9b0fe363-33c3-44be-9151-ac6c3813a55e	9e2a45e8-88e0-4998-bbc1-1ab68cf9f989	885e95e5-f639-43d9-b5a0-c1fa555e0b24	7c36ecbe-44d3-40df-8b8b-886e5385e839	active	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30	2026-08-20 11:30:17.917+05:30	\N	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30
68ae4f2b-8b6c-40f6-be82-36ae77bf252b	9e2a45e8-88e0-4998-bbc1-1ab68cf9f989	e74c3e2f-3bdf-40e5-9bc2-a2ca07d81b1e	21a95efa-ccfa-4c4c-af7f-50cfa0a35053	active	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30	2026-08-20 11:30:17.917+05:30	\N	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30
43fe11fe-8263-44bb-8190-5ec39dc7ee7b	9e2a45e8-88e0-4998-bbc1-1ab68cf9f989	728861c2-df1f-47b2-81b4-d892b4ee819e	9755eab9-39cb-443b-9cca-853d727afe40	active	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30	2026-08-20 11:30:17.917+05:30	\N	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30
\.


--
-- Data for Name: committee_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.committee_roles (id, committee_id, name, description, hierarchy, permissions, created_at, updated_at) FROM stdin;
f90bd115-48a4-4c90-9ef3-74b5778eb82b	8f28c85b-1315-4583-923a-a827f9507a00	President	Overall leadership and strategic direction	1	{MANAGE_ALL,APPROVE_EVENTS,MANAGE_MEMBERS,APPROVE_BUDGETS,SYSTEM_ADMIN}	2025-08-13 23:54:14.189+05:30	2025-08-13 23:54:14.189+05:30
f0e6549c-bb74-4a24-955d-c9666db048e1	8f28c85b-1315-4583-923a-a827f9507a00	Vice President	Support president and lead special initiatives	2	{MANAGE_EVENTS,MANAGE_MEMBERS,APPROVE_CONTENT,COORDINATE_ACTIVITIES}	2025-08-13 23:54:14.264+05:30	2025-08-13 23:54:14.264+05:30
8aee812a-b63e-403c-a7fc-d77e050a9138	8f28c85b-1315-4583-923a-a827f9507a00	Innovation Head	Lead technical initiatives and innovation projects	3	{MANAGE_TECH_EVENTS,APPROVE_PROJECTS,COORDINATE_WORKSHOPS,MANAGE_RESOURCES}	2025-08-13 23:54:14.309+05:30	2025-08-13 23:54:14.309+05:30
a3c8888c-77ae-4b5f-9cd2-cdff1afbe4e3	8f28c85b-1315-4583-923a-a827f9507a00	Secretary	Maintain records and manage communications	4	{MANAGE_COMMUNICATIONS,MAINTAIN_RECORDS,SCHEDULE_MEETINGS,COORDINATE_LOGISTICS}	2025-08-13 23:54:14.369+05:30	2025-08-13 23:54:14.369+05:30
84fc77f3-d148-4e12-8ebb-ff301cee2e49	8f28c85b-1315-4583-923a-a827f9507a00	Outreach Coordinator	Manage external relations and partnerships	5	{MANAGE_PARTNERSHIPS,COORDINATE_OUTREACH,MANAGE_PUBLICITY,ORGANIZE_COLLABORATIONS}	2025-08-13 23:54:14.419+05:30	2025-08-13 23:54:14.419+05:30
b52c4c16-3d76-4a3b-ae5d-407d26cac92f	8f28c85b-1315-4583-923a-a827f9507a00	Media Coordinator	Manage social media and content creation	6	{MANAGE_SOCIAL_MEDIA,CREATE_CONTENT,MANAGE_PUBLICITY,COORDINATE_MEDIA}	2025-08-13 23:54:14.469+05:30	2025-08-13 23:54:14.469+05:30
32708d72-6fea-4c91-93d8-49072a1f481a	8f28c85b-1315-4583-923a-a827f9507a00	Treasurer	Manage finances and budget planning	7	{MANAGE_FINANCES,TRACK_BUDGETS,APPROVE_EXPENSES,MAINTAIN_ACCOUNTS}	2025-08-13 23:54:14.509+05:30	2025-08-13 23:54:14.509+05:30
bd8838dc-d4db-4bf9-a483-fc970b01d35a	9e2a45e8-88e0-4998-bbc1-1ab68cf9f989	President	President of the Student Executive Committee	1	{all_permissions,admin_access,committee_management}	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30
61066b5a-6b0c-411a-83fd-ea3fa81893b5	9e2a45e8-88e0-4998-bbc1-1ab68cf9f989	Vice President	Vice President of the Student Executive Committee	2	{executive_access,committee_management,event_management}	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30
60880bea-c878-4fe6-9388-8b4384ad2a59	9e2a45e8-88e0-4998-bbc1-1ab68cf9f989	Secretary	Secretary of the Student Executive Committee	3	{documentation,meeting_management,communication}	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30
885e95e5-f639-43d9-b5a0-c1fa555e0b24	9e2a45e8-88e0-4998-bbc1-1ab68cf9f989	Treasurer	Treasurer of the Student Executive Committee	4	{financial_management,budget_control,expense_tracking}	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30
e74c3e2f-3bdf-40e5-9bc2-a2ca07d81b1e	9e2a45e8-88e0-4998-bbc1-1ab68cf9f989	Innovation Head	Innovation Head of the Student Executive Committee	5	{innovation_projects,technology_initiatives,research_coordination}	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30
728861c2-df1f-47b2-81b4-d892b4ee819e	9e2a45e8-88e0-4998-bbc1-1ab68cf9f989	Media Head	Media Head of the Student Executive Committee	6	{media_management,social_media,publicity,content_creation}	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30
\.


--
-- Data for Name: committees; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.committees (id, name, description, hierarchy_level, is_active, created_at, updated_at) FROM stdin;
8f28c85b-1315-4583-923a-a827f9507a00	Zenith Main Committee	The main student committee for Zenith organization	1	t	2025-08-13 23:52:53.549+05:30	2025-08-13 23:52:53.549+05:30
9e2a45e8-88e0-4998-bbc1-1ab68cf9f989	Student Executive Committee	The main student executive committee responsible for overall governance and leadership	1	t	2025-08-20 11:30:17.917+05:30	2025-08-20 11:30:17.917+05:30
\.


--
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
416c3fca-3009-416b-bf52-311f29211b2b	550e8400-e29b-41d4-a716-446655440040	club_home	altogether	admin	550e8400-e29b-41d4-a716-446655440040	2025-08-24 12:28:51.059243+05:30
a815aa7e-e212-472a-9fee-819bec720e3a	550e8400-e29b-41d4-a716-446655440041	club_home	altogether	admin	550e8400-e29b-41d4-a716-446655440041	2025-08-24 12:28:51.059243+05:30
b503b9ee-d1d5-43e8-8751-50bb3bdd0f44	550e8400-e29b-41d4-a716-446655440021	club_home	aster	admin	550e8400-e29b-41d4-a716-446655440021	2025-08-24 12:28:51.059243+05:30
15ec78dd-d8b4-400d-b425-1d307f54a922	550e8400-e29b-41d4-a716-446655440030	club_home	achievers	admin	550e8400-e29b-41d4-a716-446655440030	2025-08-24 12:28:51.059243+05:30
31994e60-1fb1-488f-a7b0-d7cd2c727ff9	550e8400-e29b-41d4-a716-446655440031	club_home	achievers	admin	550e8400-e29b-41d4-a716-446655440031	2025-08-24 12:28:51.059243+05:30
368e78de-1382-432a-bd95-5f0ebec0998f	550e8400-e29b-41d4-a716-446655440011	club_home	ascend	admin	550e8400-e29b-41d4-a716-446655440011	2025-08-24 12:28:51.059243+05:30
0f350f15-e5b9-48a9-8453-cdb0028cf13a	550e8400-e29b-41d4-a716-446655440010	club_home	ascend	admin	550e8400-e29b-41d4-a716-446655440010	2025-08-24 12:28:51.059243+05:30
cbf8fbaa-0d08-4d45-a1b7-103f6e6320d8	550e8400-e29b-41d4-a716-446655440020	club_home	aster	admin	550e8400-e29b-41d4-a716-446655440020	2025-08-24 12:28:51.059243+05:30
\.


--
-- Data for Name: discussion_replies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.discussion_replies (id, discussion_id, author_id, content, parent_id, likes_count, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: discussions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.discussions (id, title, description, author_id, club_id, tags, is_locked, is_pinned, views_count, replies_count, last_activity, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: email_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_logs (id, recipient, subject, content_preview, status, message_id, category, related_id, created_at, sent_at, email_service, error_message, updated_at) FROM stdin;
\.


--
-- Data for Name: email_otps; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_otps (id, email, otp, type, expires_at, created_at) FROM stdin;
5c243870-c046-4208-9739-be44b8f5736b	anubuntu14@gmail.com	352576	verification	2025-08-24 17:07:50.51+05:30	2025-08-24 16:52:50.510826+05:30
1016ec8d-6639-48a1-934c-426010f7ddd1	aster.coordinator@zenith.com	654691	verification	2025-08-24 20:28:23.139+05:30	2025-08-24 20:13:23.139545+05:30
01dbcc23-abc5-47d6-985d-ca56b2dae451	ascend.co-coordinator@zenith.com	725466	verification	2025-08-24 20:57:59.863+05:30	2025-08-24 20:42:59.863818+05:30
\.


--
-- Data for Name: event_attendees; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.event_attendees (id, event_id, user_id, registered_at, attendance_status) FROM stdin;
a1000001-1111-2222-3333-444444444444	e1000001-1111-2222-3333-444444444444	550e8400-e29b-41d4-a716-446655440020	2025-08-21 13:55:47.999635+05:30	registered
a1000002-1111-2222-3333-444444444444	e1000002-1111-2222-3333-444444444444	550e8400-e29b-41d4-a716-446655440020	2025-08-21 13:55:47.999635+05:30	registered
a1000003-1111-2222-3333-444444444444	e2000001-1111-2222-3333-444444444444	550e8400-e29b-41d4-a716-446655440020	2025-08-21 13:55:47.999635+05:30	registered
\.


--
-- Data for Name: event_registrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.event_registrations (id, event_id, user_id, status, registration_data, registered_at, updated_at) FROM stdin;
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.events (id, title, description, club_id, created_by, event_date, event_time, location, max_attendees, status, image_url, created_at, updated_at, event_images, banner_image_url, gallery_images) FROM stdin;
550e8400-3001-41d4-a716-446655440001	Coding Summit 2025	Annual coding summit featuring industry leaders and programming challenges	ascend	550e8400-e29b-41d4-a716-446655440010	2025-08-10	09:00:00	Main Auditorium	200	upcoming	\N	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	[]	\N	[]
550e8400-3001-41d4-a716-446655440002	Hackathon Weekend	48-hour coding marathon to build innovative solutions	ascend	550e8400-e29b-41d4-a716-446655440010	2025-08-17	18:00:00	Computer Lab Block A	50	upcoming	\N	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	[]	\N	[]
550e8400-3002-41d4-a716-446655440001	Communication Skills Workshop	Interactive workshop on effective communication and presentation	aster	550e8400-e29b-41d4-a716-446655440020	2025-08-13	10:00:00	Seminar Hall	100	upcoming	\N	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	[]	\N	[]
550e8400-3002-41d4-a716-446655440002	Leadership Development Session	Leadership training with industry professionals	aster	550e8400-e29b-41d4-a716-446655440020	2025-08-07	17:00:00	Conference Room B	60	upcoming	\N	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	[]	\N	[]
550e8400-3003-41d4-a716-446655440001	Higher Studies Fair	Information fair about higher education opportunities	achievers	550e8400-e29b-41d4-a716-446655440030	2025-08-15	16:00:00	Exhibition Hall	300	upcoming	\N	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	[]	\N	[]
550e8400-3003-41d4-a716-446655440002	Research Methodology Workshop	Workshop on research techniques and academic writing	achievers	550e8400-e29b-41d4-a716-446655440030	2025-08-05	19:00:00	Library Auditorium	120	upcoming	\N	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	[]	\N	[]
550e8400-3004-41d4-a716-446655440001	Holistic Development Fair	Showcase of comprehensive skill development activities	altogether	550e8400-e29b-41d4-a716-446655440040	2025-08-20	14:00:00	Main Campus	400	upcoming	\N	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	[]	\N	[]
550e8400-3004-41d4-a716-446655440002	Cross-Club Collaboration Meet	Inter-club collaboration and networking event	altogether	550e8400-e29b-41d4-a716-446655440040	2025-08-03	16:30:00	Community Center	150	upcoming	\N	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	[]	\N	[]
\.


--
-- Data for Name: featured_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.featured_events (id, event_id, page_type, page_reference_id, custom_title, custom_description, custom_image_url, display_order, is_active, featured_until, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: likes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.likes (id, post_id, user_id, created_at, comment_id) FROM stdin;
2b5b1bcd-653d-4f33-948c-bf38bcb13e64	3bc000fa-d086-4977-9cb3-08105ada3771	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	2025-08-24 20:45:52.419621+05:30	\N
ad0dade1-98a7-40e2-95d0-03ebc170808e	\N	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	2025-08-24 20:45:59.276092+05:30	c6cb6351-a125-491b-a4fa-c74ea8c80147
\.


--
-- Data for Name: media_files; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.media_files (id, filename, original_filename, file_size, mime_type, file_url, thumbnail_url, alt_text, description, uploaded_by, upload_context, upload_reference_id, is_public, metadata, created_at, updated_at) FROM stdin;
a19b9671-407d-4f77-8dc2-d0fc8a342a88	profiles/avatars/black pallotti_1756021695713_e8b026230f1a2a47.png	black pallotti.png	37153	image/png	/uploads/profiles/avatars/black pallotti_1756021695713_e8b026230f1a2a47.png	/uploads/profiles/avatars/black pallotti_1756021695713_e8b026230f1a2a47.png	\N	\N	550e8400-e29b-41d4-a716-446655440020	profiles	\N	t	{"type": "avatar", "userId": "550e8400-e29b-41d4-a716-446655440020"}	2025-08-24 13:18:15.713+05:30	2025-08-24 13:18:15.713+05:30
cfc5feed-9381-4054-9950-39fc9a04ee73	profiles/avatars/zenith-logo_1756021719703_68ee879f0d3e41bf.svg	zenith-logo.svg	755088	image/svg+xml	/uploads/profiles/avatars/zenith-logo_1756021719703_68ee879f0d3e41bf.svg	/uploads/profiles/avatars/zenith-logo_1756021719703_68ee879f0d3e41bf.svg	\N	\N	550e8400-e29b-41d4-a716-446655440020	profiles	\N	t	{"type": "avatar", "userId": "550e8400-e29b-41d4-a716-446655440020"}	2025-08-24 13:18:39.707+05:30	2025-08-24 13:18:39.707+05:30
34c60ceb-5117-465e-8f54-95270f2424ce	profiles/avatars/cd dep_1756022080753_48371a1403067f5c.png	cd dep.png	23676	image/png	/uploads/profiles/avatars/cd dep_1756022080753_48371a1403067f5c.png	/uploads/profiles/avatars/cd dep_1756022080753_48371a1403067f5c.png	\N	\N	550e8400-e29b-41d4-a716-446655440020	profiles	\N	t	{"type": "avatar", "userId": "550e8400-e29b-41d4-a716-446655440020"}	2025-08-24 13:24:40.754+05:30	2025-08-24 13:24:40.754+05:30
87b6edb0-8ab9-400a-b2c5-676bb2f5255b	profiles/avatars/Screenshot from 2025-08-24 13-48-12_1756024176742_333e05fb871c9932.png	Screenshot from 2025-08-24 13-48-12.png	312523	image/png	/uploads/profiles/avatars/Screenshot from 2025-08-24 13-48-12_1756024176742_333e05fb871c9932.png	/uploads/profiles/avatars/Screenshot from 2025-08-24 13-48-12_1756024176742_333e05fb871c9932.png	\N	\N	550e8400-e29b-41d4-a716-446655440020	profiles	\N	t	{"type": "avatar", "userId": "550e8400-e29b-41d4-a716-446655440020"}	2025-08-24 13:59:36.744+05:30	2025-08-24 13:59:36.744+05:30
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.messages (id, chat_room_id, user_id, content, attachment_url, created_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.migrations (name, applied_at) FROM stdin;
comprehensive_media_system	2025-08-24 12:11:05.27565+05:30
fix_chat_attachments_structure	2025-08-24 12:12:19.362659+05:30
\.


--
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
-- Data for Name: page_content; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.page_content (id, page_type, page_reference_id, content_type, title, subtitle, description, image_url, link_url, metadata, display_order, is_active, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: post_attachments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.post_attachments (id, post_id, media_file_id, file_name, file_type, file_size, attachment_type, uploaded_at, created_at) FROM stdin;
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.posts (id, title, content, author_id, club_id, category, post_type, tags, excerpt, reading_time_minutes, featured_image_url, post_images, content_blocks, meta_description, slug, status, is_featured, is_pinned, view_count, likes_count, published_at, created_at, updated_at, edited_by, search_vector) FROM stdin;
550e8400-4001-41d4-a716-446655440001	Getting Started with React Hooks	React Hooks have revolutionized how we write React components. In this comprehensive guide, I'll share best practices for using useState, useEffect, and custom hooks in your projects. Learn how to manage state effectively and create reusable logic.	550e8400-e29b-41d4-a716-446655440100	ascend	tutorial	blog	{react,javascript,frontend,hooks}	\N	0	\N	[]	[]	\N	\N	draft	f	f	0	2	\N	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	'best':22 'compon':14 'comprehens':17 'creat':41 'custom':29 'effect':39 'frontend':46 'get':1 'guid':18 'hook':5,7,30,47 'javascript':45 'learn':34 'll':20 'logic':43 'manag':37 'practic':23 'project':33 'react':4,6,13,44 'reusabl':42 'revolution':9 'share':21 'start':2 'state':38 'use':25 'useeffect':27 'usest':26 'write':12
550e8400-4002-41d4-a716-446655440001	Effective Communication in Teams	Communication is the cornerstone of successful teamwork. Here are essential techniques for clear, respectful, and productive communication in professional environments, including active listening and conflict resolution strategies.	550e8400-e29b-41d4-a716-446655440200	aster	discussion	blog	{communication,teamwork,soft-skills,leadership}	\N	0	\N	[]	[]	\N	\N	draft	f	f	0	1	\N	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	'activ':26 'clear':17 'communic':2,5,21,32 'conflict':29 'cornerston':8 'effect':1 'environ':24 'essenti':14 'includ':25 'leadership':37 'listen':27 'product':20 'profession':23 'resolut':30 'respect':18 'skill':36 'soft':35 'soft-skil':34 'strategi':31 'success':10 'team':4 'teamwork':11,33 'techniqu':15
550e8400-4003-41d4-a716-446655440001	PhD Application Tips	Preparing for PhD applications? Here's a comprehensive guide covering research proposal writing, finding supervisors, application timelines, and interview preparation to help you succeed in your higher studies journey.	550e8400-e29b-41d4-a716-446655440300	achievers	tutorial	blog	{phd,higher-studies,research,academic}	\N	0	\N	[]	[]	\N	\N	draft	f	f	0	1	\N	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	'academ':38 'applic':2,7,19 'comprehens':11 'cover':13 'find':17 'guid':12 'help':25 'higher':30,35 'higher-studi':34 'interview':22 'journey':32 'phd':1,6,33 'prepar':4,23 'propos':15 'research':14,37 'studi':31,36 'succeed':27 'supervisor':18 'timelin':20 'tip':3 'write':16
550e8400-4004-41d4-a716-446655440001	Balancing Technical and Soft Skills	In today's competitive world, success requires both technical expertise and soft skills. Learn how to develop a balanced skill set that makes you stand out in any field while maintaining personal growth and well-being.	550e8400-e29b-41d4-a716-446655440400	altogether	discussion	blog	{balance,development,skills,growth}	\N	0	\N	[]	[]	\N	\N	draft	f	f	0	1	\N	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	'balanc':1,24,43 'competit':9 'develop':22,44 'expertis':15 'field':34 'growth':38,46 'learn':19 'maintain':36 'make':28 'person':37 'requir':12 'set':26 'skill':5,18,25,45 'soft':4,17 'stand':30 'success':11 'technic':2,14 'today':7 'well':41 'well-b':40 'world':10
0aa4697c-e3de-4097-a7ba-c72d7ab2777c	The Future of Artificial Intelligence in Education	# The Future of Artificial Intelligence in Education\n\n## Introduction\nArtificial Intelligence is revolutionizing how we learn and teach. From personalized learning experiences to automated grading systems, AI is reshaping the educational landscape.\n\n## Key Applications\n\n### 1. Personalized Learning\nAI algorithms can analyze student performance data to create customized learning paths that adapt to individual learning styles and pace.\n\n### 2. Intelligent Tutoring Systems\n```python\n# Example of an AI-powered learning system\nclass IntelligentTutor:\n    def __init__(self, student_profile):\n        self.student = student_profile\n        self.learning_path = self.generate_path()\n    \n    def adapt_content(self, performance_data):\n        # Adjust difficulty based on student performance\n        if performance_data.accuracy < 0.7:\n            self.reduce_difficulty()\n        elif performance_data.accuracy > 0.9:\n            self.increase_difficulty()\n```\n\n### 3. Automated Assessment\nAI can provide instant feedback on assignments and help identify areas where students need additional support.\n\n## Conclusion\nAs we move forward, the integration of AI in education must be thoughtful and ethical, ensuring that technology enhances rather than replaces human connection in learning.	550e8400-e29b-41d4-a716-446655440020	cs	blog	blog	{artificial-intelligence,education,machine-learning,technology}	Exploring how artificial intelligence is transforming education with personalized learning, intelligent tutoring systems, and automated assessment tools.	0	\N	[]	[]	\N	future-of-ai-in-education	published	f	f	0	0	\N	2025-08-19 14:04:10.987798+05:30	2025-08-19 14:04:10.987798+05:30	\N	'0.7':105 '0.9':110 '1':41 '2':64 '3':113 'adapt':57,92 'addit':130 'adjust':97 'ai':33,44,73,116,140 'ai-pow':72 'algorithm':45 'analyz':47 'applic':40 'area':126 'artifici':4,11,16,161,177 'artificial-intellig':176 'assess':115,174 'assign':122 'autom':30,114,173 'base':99 'class':77 'conclus':132 'connect':156 'content':93 'creat':52 'custom':53 'data':50,96 'def':79,91 'difficulti':98,107,112 'educ':7,14,37,142,165,179 'elif':108 'enhanc':151 'ensur':148 'ethic':147 'exampl':69 'experi':28 'explor':159 'feedback':120 'forward':136 'futur':2,9 'grade':31 'help':124 'human':155 'identifi':125 'individu':59 'init':80 'instant':119 'integr':138 'intellig':5,12,17,65,162,169,178 'intelligenttutor':78 'introduct':15 'key':39 'landscap':38 'learn':22,27,43,54,60,75,158,168,182 'machin':181 'machine-learn':180 'move':135 'must':143 'need':129 'pace':63 'path':55,88,90 'perform':49,95,102 'performance_data.accuracy':104,109 'person':26,42,167 'power':74 'profil':83,86 'provid':118 'python':68 'rather':152 'replac':154 'reshap':35 'revolution':19 'self':81,94 'self.generate':89 'self.increase':111 'self.learning':87 'self.reduce':106 'self.student':84 'student':48,82,85,101,128 'style':61 'support':131 'system':32,67,76,171 'teach':24 'technolog':150,183 'thought':145 'tool':175 'transform':164 'tutor':66,170
b96d8a44-35bd-43c8-a98b-5365f7f65a61	Building Your First Arduino Robot: A Complete Guide	# Building Your First Arduino Robot: A Complete Guide\n\nWelcome to the exciting world of robotics! In this comprehensive guide, we will walk you through creating your very first Arduino-based robot.\n\n## What You Need\n\n### Hardware Components\n- Arduino Uno microcontroller\n- Ultrasonic sensor (HC-SR04)\n- Servo motors (2x)\n- Wheels and chassis\n- Breadboard and jumper wires\n- 9V battery pack\n\n## Step-by-Step Assembly\n\n### 1. Setting Up the Chassis\nStart by assembling your robot frame. Most beginner kits come with pre-cut acrylic or plastic pieces.\n\n### 2. Wiring the Arduino\n```cpp\n// Basic robot control code\n#include <Servo.h>\n\nServo leftWheel;\nServo rightWheel;\n\nconst int trigPin = 9;\nconst int echoPin = 10;\n\nvoid setup() {\n  leftWheel.attach(6);\n  rightWheel.attach(5);\n  pinMode(trigPin, OUTPUT);\n  pinMode(echoPin, INPUT);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  long distance = getDistance();\n  \n  if (distance > 20) {\n    moveForward();\n  } else {\n    turnRight();\n    delay(500);\n  }\n}\n```\n\n## Next Steps\nOnce you have mastered the basics:\n1. Add LED indicators for different states\n2. Implement line-following capabilities\n3. Add Bluetooth control via smartphone app\n\nHappy building! 🤖	550e8400-e29b-41d4-a716-446655440020	robotics	blog	blog	{arduino,robotics,diy,programming,electronics}	Learn to build your first Arduino robot with this step-by-step guide covering hardware assembly, programming, and troubleshooting tips.	0	\N	[]	[]	\N	building-first-arduino-robot-guide	published	f	f	0	0	\N	2025-08-16 14:04:10.987798+05:30	2025-08-16 14:04:10.987798+05:30	\N	'1':72,152 '10':116 '2':95,159 '20':138 '2x':56 '3':165 '5':122 '500':143 '6':120 '9':112 '9600':130 '9v':64 'acryl':91 'add':153,166 'app':171 'arduino':4,12,38,46,98,179,195 'arduino-bas':37 'assembl':71,79,190 'base':39 'basic':100,151 'batteri':65 'beginn':84 'bluetooth':167 'breadboard':60 'build':1,9,173,176 'capabl':164 'chassi':59,76 'code':103 'come':86 'complet':7,15 'compon':45 'comprehens':26 'const':109,113 'control':102,168 'cover':188 'cpp':99 'creat':33 'cut':90 'delay':142 'differ':157 'distanc':134,137 'diy':197 'echopin':115,127 'electron':199 'els':140 'excit':20 'first':3,11,36,178 'follow':163 'frame':82 'getdist':135 'guid':8,16,27,187 'happi':172 'hardwar':44,189 'hc':52 'hc-sr04':51 'implement':160 'includ':104 'indic':155 'input':128 'int':110,114 'jumper':62 'kit':85 'learn':174 'led':154 'leftwheel':106 'leftwheel.attach':119 'line':162 'line-follow':161 'long':133 'loop':132 'master':149 'microcontrol':48 'motor':55 'moveforward':139 'need':43 'next':144 'output':125 'pack':66 'piec':94 'pinmod':123,126 'plastic':93 'pre':89 'pre-cut':88 'program':191,198 'rightwheel':108 'rightwheel.attach':121 'robot':5,13,23,40,81,101,180,196 'sensor':50 'serial.begin':129 'servo':54,105,107 'set':73 'setup':118 'smartphon':170 'sr04':53 'start':77 'state':158 'step':68,70,145,184,186 'step-by-step':67,183 'tip':194 'trigpin':111,124 'troubleshoot':193 'turnright':141 'ultrason':49 'uno':47 'via':169 'void':117,131 'walk':30 'welcom':17 'wheel':57 'wire':63,96 'world':21
2012b548-dc72-4f0f-9adc-767b69dd3f92	The Art of Method Acting: Techniques for Authentic Performance	# The Art of Method Acting: Techniques for Authentic Performance\n\nMethod acting has revolutionized modern theater and film, creating some of the most memorable and emotionally powerful performances in entertainment history.\n\n## What is Method Acting?\n\nMethod acting is an approach to acting that encourages actors to use their **personal experiences** and emotions to create authentic characters.\n\n## Core Techniques\n\n### 1. Emotional Memory\nActors draw upon their own past experiences to connect with their character emotional state.\n\n### 2. Sense Memory\nThis involves recreating physical sensations and environmental conditions through imagination and muscle memory.\n\n### 3. Substitution\nWhen an actor cannot relate to their character situation, they substitute it with a similar experience from their own life.\n\n## Famous Method Actors\n\n- **Marlon Brando** - Revolutionized film acting with his naturalistic approach\n- **Daniel Day-Lewis** - Known for staying in character throughout entire film productions\n- **Meryl Streep** - Masters accents and mannerisms through intensive preparation\n\n## Tips for Beginning Method Actors\n\n1. **Start small** - Begin with simple emotional exercises\n2. **Keep a journal** - Document your emotional and physical observations\n3. **Work with partners** - Practice scene work and improvisations\n4. **Take care of yourself** - Do not let character work overwhelm your personal life\n\nJoin us for our **Acting Masterclass** on August 30th at 6:00 PM in the Theater Hall!	550e8400-e29b-41d4-a716-446655440020	drama	blog	blog	{method-acting,theater,performance,acting-techniques,emotion}	Explore the fundamentals of method acting, from emotional memory to sense substitution, with practical exercises and insights from legendary performers.	0	\N	[]	[]	\N	art-of-method-acting-techniques	published	f	f	0	0	\N	2025-08-18 14:04:10.987798+05:30	2025-08-18 14:04:10.987798+05:30	\N	'00':213 '1':67,161 '2':84,169 '3':100,179 '30th':210 '4':188 '6':212 'accent':150 'act':5,14,20,43,45,50,129,206,224,241,245 'acting-techniqu':244 'actor':53,70,104,124,160 'approach':48,133 'art':2,11 'august':209 'authent':8,17,63 'begin':158,164 'brando':126 'cannot':105 'care':190 'charact':64,81,109,142,196 'condit':94 'connect':78 'core':65 'creat':27,62 'daniel':134 'day':136 'day-lewi':135 'document':173 'draw':71 'emot':34,60,68,82,167,175,226,247 'encourag':52 'entertain':38 'entir':144 'environment':93 'exercis':168,233 'experi':58,76,117 'explor':219 'famous':122 'film':26,128,145 'fundament':221 'hall':218 'histori':39 'imagin':96 'improvis':187 'insight':235 'intens':154 'involv':88 'join':202 'journal':172 'keep':170 'known':138 'legendari':237 'let':195 'lewi':137 'life':121,201 'manner':152 'marlon':125 'master':149 'masterclass':207 'memor':32 'memori':69,86,99,227 'meryl':147 'method':4,13,19,42,44,123,159,223,240 'method-act':239 'modern':23 'muscl':98 'naturalist':132 'observ':178 'overwhelm':198 'partner':182 'past':75 'perform':9,18,36,238,243 'person':57,200 'physic':90,177 'pm':214 'power':35 'practic':183,232 'prepar':155 'product':146 'recreat':89 'relat':106 'revolution':22,127 'scene':184 'sens':85,229 'sensat':91 'similar':116 'simpl':166 'situat':110 'small':163 'start':162 'state':83 'stay':140 'streep':148 'substitut':101,112,230 'take':189 'techniqu':6,15,66,246 'theater':24,217,242 'throughout':143 'tip':156 'upon':72 'us':203 'use':55 'work':180,185,197
876734eb-f439-46ca-ae21-d4bd11e612dd	Jazz Improvisation: Finding Your Voice Through Musical Freedom	# Jazz Improvisation: Finding Your Voice Through Musical Freedom\n\nJazz improvisation is the **heart and soul** of jazz music - the magical moment when musicians create spontaneous melodies, harmonies, and rhythms that have never existed before and may never exist again.\n\n## The Essence of Jazz Improvisation\n\nImprovisation in jazz is like having a **musical conversation**. Each musician contributes their unique voice while listening and responding to others, creating a collaborative masterpiece in real-time.\n\n## Fundamental Elements\n\n### 1. Scales and Modes\nUnderstanding the building blocks of jazz harmony:\n\n- **Major and Minor Scales**\n- **Blues Scale** - The foundation of jazz expression\n- **Dorian Mode** - Perfect for minor key improvisation\n- **Mixolydian Mode** - Essential for dominant chord solos\n\n### 2. Chord Progressions\nMaster these essential progressions:\n\n```\nii-V-I Progression:\nDm7 - G7 - CMaj7\n\nJazz Standard Turnaround:\nCMaj7 - A7 - Dm7 - G7\n```\n\n## Great Jazz Improvisers\n\n### 🎺 **Miles Davis**\n*"Do not fear mistakes. There are none."*\n\nRevolutionary trumpeter who constantly reinvented jazz through different periods: bebop, cool jazz, fusion.\n\n### 🎷 **John Coltrane**\nMaster of extended improvisation and spiritual expression through music.\n\n## Practice Strategies\n\n### Daily Routine\n1. **Warm-up** with scales (15 minutes)\n2. **Chord progression practice** (20 minutes)\n3. **Transcription work** (15 minutes)\n4. **Free improvisation** (10 minutes)\n\nJoin our **Jazz Night** on September 1st at 8:00 PM at Music Hall!	550e8400-e29b-41d4-a716-446655440020	music	blog	blog	{jazz,improvisation,music-theory,performance,creativity}	Discover the art of jazz improvisation with techniques, tips, and insights from legendary musicians to help you develop your unique musical voice.	0	\N	[]	[]	\N	jazz-improvisation-finding-your-voice	published	f	f	0	0	\N	2025-08-20 14:04:10.987798+05:30	2025-08-20 14:04:10.987798+05:30	\N	'00':215 '1':84,182 '10':204 '15':188,199 '1st':212 '2':120,190 '20':194 '3':196 '4':201 '8':214 'a7':139 'art':222 'bebop':163 'block':91 'blue':99 'build':90 'chord':118,121,191 'cmaj7':134,138 'collabor':76 'coltran':168 'constant':157 'contribut':64 'convers':61 'cool':164 'creat':32,74 'creativ':248 'daili':180 'davi':146 'develop':237 'differ':161 'discov':220 'dm7':132,140 'domin':117 'dorian':106 'element':83 'essenc':49 'essenti':115,125 'exist':41,46 'express':105,175 'extend':171 'fear':149 'find':3,11 'foundat':102 'free':202 'freedom':8,16 'fundament':82 'fusion':166 'g7':133,141 'great':142 'hall':219 'harmoni':35,94 'heart':21 'help':235 'ii':128 'ii-v-i':127 'improvis':2,10,18,52,53,112,144,172,203,225,243 'insight':230 'jazz':1,9,17,25,51,55,93,104,135,143,159,165,208,224,242 'john':167 'join':206 'key':111 'legendari':232 'like':57 'listen':69 'magic':28 'major':95 'master':123,169 'masterpiec':77 'may':44 'melodi':34 'mile':145 'minor':97,110 'minut':189,195,200,205 'mistak':150 'mixolydian':113 'mode':87,107,114 'moment':29 'music':7,15,26,60,177,218,240,245 'music-theori':244 'musician':31,63,233 'never':40,45 'night':209 'none':153 'other':73 'perfect':108 'perform':247 'period':162 'pm':216 'practic':178,193 'progress':122,126,131,192 'real':80 'real-tim':79 'reinvent':158 'respond':71 'revolutionari':154 'rhythm':37 'routin':181 'scale':85,98,100,187 'septemb':211 'solo':119 'soul':23 'spiritu':174 'spontan':33 'standard':136 'strategi':179 'techniqu':227 'theori':246 'time':81 'tip':228 'transcript':197 'trumpet':155 'turnaround':137 'understand':88 'uniqu':66,239 'v':129 'voic':5,13,67,241 'warm':184 'warm-up':183 'work':198
19996dd7-d767-4332-9a23-0d889a7d9b1c	Digital Art vs Traditional Art: Bridging Two Worlds	# Digital Art vs Traditional Art: Bridging Two Worlds\n\nThe art world has undergone a **revolutionary transformation** with the advent of digital tools. Rather than replacing traditional methods, digital art has opened new avenues for creative expression while honoring time-tested techniques.\n\n## The Evolution of Artistic Expression\n\n### Traditional Art: The Foundation\nTraditional art forms have been humanity primary means of visual expression for **thousands of years**:\n\n- **Painting** - Oil, watercolor, acrylic on canvas\n- **Drawing** - Pencil, charcoal, ink on paper  \n- **Sculpture** - Clay, marble, bronze, wood\n- **Printmaking** - Etching, lithography, screen printing\n\n### Digital Art: The New Frontier\nDigital art emerged in the late 20th century and has exploded in popularity:\n\n- **Digital Painting** - Using tablets and styluses\n- **3D Modeling** - Creating three-dimensional objects\n- **Photo Manipulation** - Transforming photographs\n- **Motion Graphics** - Animated visual content\n\n## Popular Digital Art Software\n\n### Professional Tools\n- **Adobe Photoshop** - Industry standard for digital painting and photo editing\n- **Procreate** - iPad app beloved by digital artists\n- **Clip Studio Paint** - Excellent for illustration and comics\n- **Blender** - Free 3D modeling and animation software\n\n### Skills That Transfer\n- **Composition** - Rule of thirds, balance, focal points\n- **Color theory** - Harmony, temperature, value\n- **Drawing fundamentals** - Proportion, perspective, anatomy\n- **Creative thinking** - Concept development, storytelling\n\n## Conclusion\n\nThe future of art lies not in choosing between traditional and digital, but in **understanding and appreciating both**. Each medium offers unique strengths, and the most versatile artists often work fluidly between both worlds.\n\nJoin our **Digital Art Workshop** on August 27, 2025 at 3:30 PM in the Art Studio!	550e8400-e29b-41d4-a716-446655440020	art	blog	blog	{digital-art,traditional-art,creativity,technology,artistic-expression}	Exploring the relationship between traditional and digital art, comparing their strengths, and discovering how modern artists bridge both worlds.	0	\N	[]	[]	\N	digital-art-vs-traditional-art-bridging-worlds	published	f	f	0	0	\N	2025-08-17 14:04:10.987798+05:30	2025-08-17 14:04:10.987798+05:30	\N	'2025':243 '20th':108 '27':242 '3':245 '30':246 '3d':121,170 'acryl':78 'adob':143 'advent':27 'anatomi':194 'anim':134,173 'app':155 'appreci':217 'art':2,5,10,13,18,37,57,61,98,103,139,204,238,250,259,273,276 'artist':54,159,228,267,280 'artistic-express':279 'august':241 'avenu':41 'balanc':182 'belov':156 'blender':168 'bridg':6,14,268 'bronz':90 'canva':80 'centuri':109 'charcoal':83 'choos':208 'clay':88 'clip':160 'color':185 'comic':167 'compar':260 'composit':178 'concept':197 'conclus':200 'content':136 'creat':123 'creativ':43,195,277 'develop':198 'digit':1,9,29,36,97,102,115,138,148,158,212,237,258,272 'digital-art':271 'dimension':126 'discov':264 'draw':81,190 'edit':152 'emerg':104 'etch':93 'evolut':52 'excel':163 'explod':112 'explor':252 'express':44,55,70,281 'fluid':231 'focal':183 'form':62 'foundat':59 'free':169 'frontier':101 'fundament':191 'futur':202 'graphic':133 'harmoni':187 'honor':46 'human':65 'illustr':165 'industri':145 'ink':84 'ipad':154 'join':235 'late':107 'lie':205 'lithographi':94 'manipul':129 'marbl':89 'mean':67 'medium':220 'method':35 'model':122,171 'modern':266 'motion':132 'new':40,100 'object':127 'offer':221 'often':229 'oil':76 'open':39 'paint':75,116,149,162 'paper':86 'pencil':82 'perspect':193 'photo':128,151 'photograph':131 'photoshop':144 'pm':247 'point':184 'popular':114,137 'primari':66 'print':96 'printmak':92 'procreat':153 'profession':141 'proport':192 'rather':31 'relationship':254 'replac':33 'revolutionari':23 'rule':179 'screen':95 'sculptur':87 'skill':175 'softwar':140,174 'standard':146 'storytel':199 'strength':223,262 'studio':161,251 'stylus':120 'tablet':118 'techniqu':50 'technolog':278 'temperatur':188 'test':49 'theori':186 'think':196 'third':181 'thousand':72 'three':125 'three-dimension':124 'time':48 'time-test':47 'tool':30,142 'tradit':4,12,34,56,60,210,256,275 'traditional-art':274 'transfer':177 'transform':24,130 'two':7,15 'undergon':21 'understand':215 'uniqu':222 'use':117 'valu':189 'versatil':227 'visual':69,135 'vs':3,11 'watercolor':77 'wood':91 'work':230 'workshop':239 'world':8,16,19,234,270 'year':74
9c2e0737-d2ad-4ba7-b077-683e275f0ff4	The Science of Athletic Performance: Training Mind and Body	# The Science of Athletic Performance: Training Mind and Body\n\nModern athletics has evolved far beyond simple physical training. Today elite athletes understand that **peak performance** requires a holistic approach that integrates physical conditioning, mental preparation, nutrition science, and recovery strategies.\n\n## The Foundation: Physical Training\n\n### Strength and Conditioning\nProper strength training forms the backbone of athletic performance:\n\n#### **Progressive Overload**\nGradually increasing training demands to stimulate adaptation and growth.\n\n#### **Specificity Principle**  \nTraining movements and energy systems specific to your sport.\n\n#### **Recovery and Adaptation**\nUnderstanding that growth happens during rest, not just during training.\n\n### Training Periodization\n```\nMacrocycle (Annual Plan)\n├── Preparation Phase (Base Building)\n├── Competition Phase (Peak Performance)\n└── Transition Phase (Active Recovery)\n\nMicrocycle (Weekly Plan)\n├── High Intensity Days\n├── Moderate Intensity Days\n└── Recovery Days\n```\n\n## The Mental Game\n\n### Sports Psychology Fundamentals\n\n#### **Goal Setting**\n- **SMART Goals**: Specific, Measurable, Achievable, Relevant, Time-bound\n- **Process vs Outcome**: Focus on controllable actions rather than results\n- **Progressive Targets**: Building confidence through incremental achievements\n\n#### **Visualization Techniques**\nElite athletes spend significant time mentally rehearsing their performance.\n\n## Nutrition: Fueling Performance\n\n### Macronutrients for Athletes\n\n#### **Carbohydrates** - The Primary Fuel\n- **Pre-Exercise**: 1-4g per kg body weight, 1-4 hours before\n- **During Exercise**: 30-60g per hour for sessions > 60 minutes\n- **Post-Exercise**: 1.5g per kg body weight within 30 minutes\n\n#### **Proteins** - Building and Repair\n- **Daily Intake**: 1.2-2.0g per kg body weight\n- **Post-Workout**: 20-25g within 2 hours\n\n## Upcoming Events\n\n### 🏀 **Basketball Tournament**\n**Date:** September 10, 2025 at 4:00 PM  \n**Location:** Basketball Court  \n\n### 💪 **Fitness Challenge**  \n**Date:** August 29, 2025 at 8:00 AM  \n**Location:** Sports Complex\n\nRemember: **every expert was once a beginner**. Start where you are, use what you have, and do what you can.	550e8400-e29b-41d4-a716-446655440020	sports	blog	blog	{athletics,sports-science,training,nutrition,performance}	Discover the science behind peak athletic performance, covering physical training, mental preparation, nutrition, recovery, and injury prevention.	0	\N	[]	[]	\N	science-of-athletic-performance-training	published	f	f	0	0	\N	2025-08-15 14:04:10.987798+05:30	2025-08-15 14:04:10.987798+05:30	\N	'-2.0':228 '-25':238 '-4':188,195 '-60':201 '00':253,266 '1':187,194 '1.2':227 '1.5':212 '10':249 '2':241 '20':237 '2025':250,263 '29':262 '30':200,219 '4':252 '60':207 '8':265 'achiev':141,162 'action':152 'activ':116 'adapt':74,90 'annual':104 'approach':38 'athlet':4,13,20,30,64,166,179,296,308 'august':261 'backbon':62 'base':108 'basketbal':245,256 'beginn':277 'behind':294 'beyond':24 'bodi':9,18,192,216,232 'bound':145 'build':109,158,222 'carbohydr':180 'challeng':259 'competit':110 'complex':270 'condit':42,56 'confid':159 'control':151 'court':257 'cover':298 'daili':225 'date':247,260 'day':123,126,128 'demand':71 'discov':291 'elit':29,165 'energi':82 'event':244 'everi':272 'evolv':22 'exercis':186,199,211 'expert':273 'far':23 'fit':258 'focus':149 'form':60 'foundat':51 'fuel':175,183 'fundament':134 'g':189,202,213,229,239 'game':131 'goal':135,138 'gradual':68 'growth':76,93 'happen':94 'high':121 'holist':37 'hour':196,204,242 'increas':69 'increment':161 'injuri':306 'intak':226 'integr':40 'intens':122,125 'kg':191,215,231 'locat':255,268 'macrocycl':103 'macronutri':177 'measur':140 'mental':43,130,170,301 'microcycl':118 'mind':7,16 'minut':208,220 'moder':124 'modern':19 'movement':80 'nutrit':45,174,303,313 'outcom':148 'overload':67 'peak':33,112,295 'per':190,203,214,230 'perform':5,14,34,65,113,173,176,297,314 'period':102 'phase':107,111,115 'physic':26,41,52,299 'plan':105,120 'pm':254 'post':210,235 'post-exercis':209 'post-workout':234 'pre':185 'pre-exercis':184 'prepar':44,106,302 'prevent':307 'primari':182 'principl':78 'process':146 'progress':66,156 'proper':57 'protein':221 'psycholog':133 'rather':153 'recoveri':48,88,117,127,304 'rehears':171 'relev':142 'rememb':271 'repair':224 'requir':35 'rest':96 'result':155 'scienc':2,11,46,293,311 'septemb':248 'session':206 'set':136 'signific':168 'simpl':25 'smart':137 'specif':77,84,139 'spend':167 'sport':87,132,269,310 'sports-scienc':309 'start':278 'stimul':73 'strategi':49 'strength':54,58 'system':83 'target':157 'techniqu':164 'time':144,169 'time-bound':143 'today':28 'tournament':246 'train':6,15,27,53,59,70,79,100,101,300,312 'transit':114 'understand':31,91 'upcom':243 'use':282 'visual':163 'vs':147 'week':119 'weight':193,217,233 'within':218,240 'workout':236
3bc000fa-d086-4977-9cb3-08105ada3771	Arduino	## Unleash Your Inner Maker: Getting Started with Arduino\n\nWelcome, ASCENDers!  This post is for anyone curious about the amazing world of Arduino – a fantastic platform for bringing your coding projects to life. Whether you're a complete beginner or have some programming experience, Arduino offers a rewarding and accessible path to hardware interaction.\n\n**What is Arduino?**\n\nArduino isn't just a piece of hardware; it's a complete ecosystem. At its core, it's a microcontroller board – a tiny, programmable computer – that can be used to control a vast array of electronic components. Think LEDs, motors, sensors, and much more!  What sets Arduino apart is its ease of use.  Its intuitive programming language (based on C++) and large, supportive community make it perfect for learning and experimentation.\n\n**Why Learn Arduino?**\n\n* **Hands-on learning:**  Forget abstract concepts; Arduino lets you *see* your code in action.  You'll build projects, troubleshoot problems, and develop practical skills applicable to various fields.\n* **Creative freedom:** The possibilities are virtually endless.  Build robots, automate home appliances, create interactive art installations – the only limit is your imagination!\n* **Boost your resume:**  Demonstrating proficiency in Arduino showcases your problem-solving abilities, your understanding of embedded systems, and your dedication to learning.  Employers across various industries value these skills.\n* **Join a vibrant community:**  The Arduino community is massive and supportive.  You'll find countless tutorials, projects, and forums to help you every step of the way.\n\n\n**Getting Started: Your First Arduino Project**\n\nLet's build a simple project: blinking an LED!  This seemingly basic project will introduce you to the fundamental concepts of Arduino programming.\n\n**You'll need:**\n\n* An Arduino Uno (or similar board)\n* A LED\n* A 220-ohm resistor (crucial to prevent damage to the LED)\n* Jumper wires\n* A breadboard (optional, but highly recommended)\n\n**Steps:**\n\n1. **Download the Arduino IDE:**  Head to [https://www.arduino.cc/en/Main/Software](https://www.arduino.cc/en/Main/Software) and download the software for your operating system.\n2. **Connect the components:**  Connect the longer leg (positive anode) of the LED to digital pin 13 on your Arduino board through the 220-ohm resistor.  Connect the shorter leg (negative cathode) to ground (GND) on the Arduino board. A breadboard simplifies this process.\n3. **Write the code:** Copy and paste the following code into the Arduino IDE:\n\n```c++\nvoid setup() {\n  pinMode(13, OUTPUT); // Set pin 13 as an output\n}\n\nvoid loop() {\n  digitalWrite(13, HIGH); // Turn LED ON\n  delay(1000);          // Wait for 1 second\n  digitalWrite(13, LOW);  // Turn LED OFF\n  delay(1000);          // Wait for 1 second\n}\n```\n\n4. **Upload the code:** Connect your Arduino to your computer via USB and upload the code.  Your LED should now blink!\n\n**Next Steps:**\n\nThis is just the beginning!  Explore different sensors, motors, and libraries to expand your projects.  Consider these resources:\n\n* **Official Arduino website:** [https://www.arduino.cc/](https://www.arduino.cc/)\n* **Instructables:** A great source of project ideas and tutorials.\n* **YouTube:**  Search for "Arduino projects for beginners" for countless video tutorials.\n\nDon't be afraid to experiment, make mistakes, and learn from them.  The Arduino community is here to support you on your journey. Happy making, ASCENDers!\n	550e8400-e29b-41d4-a716-446655440020	ascend	blog	blog	{}	 Unleash Your Inner Maker: Getting Started with Arduino\n\nWelcome, ASCENDers!  This post is for anyone curious about the amazing world of Arduino – a fantastic platform for bringing your coding proje...	0	\N	[]	[]	\N	arduino	published	f	f	30	0	\N	2025-08-24 16:37:20.818237+05:30	2025-08-24 20:46:53.311192+05:30	\N	'/](https://www.arduino.cc/)':460 '/en/main/software](https://www.arduino.cc/en/main/software)':309 '1':300,400,412 '1000':397,409 '13':334,380,384,391,403 '2':318 '220':281,341 '3':362 '4':414 'abil':195 'abstract':137 'access':50 'across':207 'action':146 'afraid':484 'amaz':20,525 'anod':327 'anyon':16,521 'apart':105 'applianc':172 'applic':157 'arduino':1,9,23,45,57,58,104,131,139,189,218,244,267,273,303,337,355,374,420,456,473,494,514,528 'array':91 'art':175 'ascend':11,506,516 'autom':170 'base':115 'basic':257 'begin':441 'beginn':39,476 'blink':252,434 'board':78,277,338,356 'boost':183 'breadboard':294,358 'bring':28,533 'build':149,168,248 'c':117,376 'cathod':349 'code':30,144,365,371,417,429,535 'communiti':121,216,219,495 'complet':38,69 'compon':94,321 'comput':82,423 'concept':138,265 'connect':319,322,344,418 'consid':452 'control':88 'copi':366 'core':73 'countless':227,478 'creat':173 'creativ':161 'crucial':284 'curious':17,522 'damag':287 'dedic':203 'delay':396,408 'demonstr':186 'develop':154 'differ':443 'digit':332 'digitalwrit':390,402 'download':301,311 'eas':108 'ecosystem':70 'electron':93 'embed':199 'employ':206 'endless':167 'everi':235 'expand':449 'experi':44,486 'experiment':128 'explor':442 'fantast':25,530 'field':160 'find':226 'first':243 'follow':370 'forget':136 'forum':231 'freedom':162 'fundament':264 'get':6,240,511 'gnd':352 'great':463 'ground':351 'hand':133 'hands-on':132 'happi':504 'hardwar':53,65 'head':305 'help':233 'high':297,392 'home':171 'ide':304,375 'idea':467 'imagin':182 'industri':209 'inner':4,509 'instal':176 'instruct':461 'interact':54,174 'introduc':260 'intuit':112 'isn':59 'join':213 'journey':503 'jumper':291 'languag':114 'larg':119 'learn':126,130,135,205,490 'led':96,254,279,290,330,394,406,431 'leg':325,347 'let':140,246 'librari':447 'life':33 'limit':179 'll':148,225,270 'longer':324 'loop':389 'low':404 'make':122,487,505 'maker':5,510 'massiv':221 'microcontrol':77 'mistak':488 'motor':97,445 'much':100 'need':271 'negat':348 'next':435 'offer':46 'offici':455 'ohm':282,342 'oper':316 'option':295 'output':381,387 'past':368 'path':51 'perfect':124 'piec':63 'pin':333,383 'pinmod':379 'platform':26,531 'posit':326 'possibl':164 'post':13,518 'practic':155 'prevent':286 'problem':152,193 'problem-solv':192 'process':361 'profici':187 'program':43,113,268 'programm':81 'proje':536 'project':31,150,229,245,251,258,451,466,474 're':36 'recommend':298 'resistor':283,343 'resourc':454 'resum':185 'reward':48 'robot':169 'search':471 'second':401,413 'see':142 'seem':256 'sensor':98,444 'set':103,382 'setup':378 'shorter':346 'showcas':190 'similar':276 'simpl':250 'simplifi':359 'skill':156,212 'softwar':313 'solv':194 'sourc':464 'start':7,241,512 'step':236,299,436 'support':120,223,499 'system':200,317 'think':95 'tini':80 'troubleshoot':151 'turn':393,405 'tutori':228,469,480 'understand':197 'unleash':2,507 'uno':274 'upload':415,427 'usb':425 'use':86,110 'valu':210 'various':159,208 'vast':90 'via':424 'vibrant':215 'video':479 'virtual':166 'void':377,388 'wait':398,410 'way':239 'websit':457 'welcom':10,515 'whether':34 'wire':292 'world':21,526 'write':363 'www.arduino.cc':308,459 'www.arduino.cc/](https://www.arduino.cc/)':458 'www.arduino.cc/en/main/software](https://www.arduino.cc/en/main/software)':307 'youtub':470
\.


--
-- Data for Name: proctoring_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proctoring_sessions (id, assignment_id, user_id, session_start, session_end, camera_enabled, microphone_enabled, face_verified, violations, screenshots, system_info, session_data) FROM stdin;
\.


--
-- Data for Name: project_invitations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.project_invitations (id, project_id, inviter_id, email, role, invitation_token, project_password, status, message, expires_at, sent_at, accepted_at, created_at, project_key, access_key) FROM stdin;
\.


--
-- Data for Name: project_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.project_members (id, project_id, user_id, role, status, joined_at, invited_by, created_at) FROM stdin;
b86ebb6d-8610-49ee-992c-9f033cd329b0	12413e7f-8ff1-47f7-b6d6-91558835948c	550e8400-e29b-41d4-a716-446655440020	admin	active	2025-08-23 21:08:20.408168+05:30	550e8400-e29b-41d4-a716-446655440020	2025-08-23 21:08:20.408168+05:30
5bfef142-f9f7-4cea-8bcc-03aef906c0b2	411bad76-ae50-436b-bf00-0f841b4f682f	550e8400-e29b-41d4-a716-446655440020	admin	active	2025-08-23 21:18:53.037679+05:30	550e8400-e29b-41d4-a716-446655440020	2025-08-23 21:18:53.037679+05:30
734eb3a3-2d39-4580-a839-36ac9adf5630	41ad1a02-02a7-4b65-a464-0cb72a13b355	550e8400-e29b-41d4-a716-446655440020	admin	active	2025-08-24 09:34:06.150689+05:30	550e8400-e29b-41d4-a716-446655440020	2025-08-24 09:34:06.150689+05:30
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.projects (id, name, description, club_id, created_by, project_key, project_type, priority, status, start_date, target_end_date, actual_end_date, access_password, is_public, progress_percentage, total_tasks, completed_tasks, created_at, updated_at) FROM stdin;
411bad76-ae50-436b-bf00-0f841b4f682f	Nagpur2	teat	ascend	550e8400-e29b-41d4-a716-446655440020	NAGPU642	innovation	medium	planning	\N	2025-08-29	\N	NAGPRADHFEC3	t	0	0	0	2025-08-23 21:18:53.035843+05:30	2025-08-23 21:18:53.035843+05:30
12413e7f-8ff1-47f7-b6d6-91558835948c	Nagpur	test	ascend	550e8400-e29b-41d4-a716-446655440020	NAGPU046	innovation	medium	planning	\N	2025-08-28	\N	NAGPRADH9298	f	100.0	1	1	2025-08-23 21:08:20.405678+05:30	2025-08-24 02:21:50.191196+05:30
41ad1a02-02a7-4b65-a464-0cb72a13b355	testDelpoy	hi	aster	550e8400-e29b-41d4-a716-446655440020	TE93DA47	innovation	critical	planning	\N	2025-08-29	\N	TE6690768B2FD1	f	33.3	9	3	2025-08-24 09:34:06.14803+05:30	2025-08-24 10:38:48.617495+05:30
\.


--
-- Data for Name: query_cache; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.query_cache (cache_key, cache_value, last_updated, expires_at) FROM stdin;
\.


--
-- Data for Name: question_media; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.question_media (id, question_id, media_file_id, media_type, display_order, is_primary, caption, created_at) FROM stdin;
\.


--
-- Data for Name: question_options; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.question_options (id, question_id, option_text, is_correct, ordering, created_at) FROM stdin;
\.


--
-- Data for Name: question_responses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.question_responses (id, submission_id, question_id, selected_options, code_answer, essay_answer, is_correct, score, time_spent, feedback, created_at, updated_at, selected_language, last_auto_save, attempt_history) FROM stdin;
\.


--
-- Data for Name: security_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.security_events (id, user_id, event_type, ip_address, device_info, event_data, created_at) FROM stdin;
\.


--
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
e0f7f862-bdff-49f2-87b8-d23e547ff974	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMmI1YzZhNy03OTA0LTRkMDItYmQxZi1kYjlmZmRhN2E0ZWIiLCJpYXQiOjE3NTYwNDYwMzgsImV4cCI6MTc1NjEzMjQzOCwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.NxYhdU_0S5aacU8li8G73BY63TeQQNhAfMeRwo-x9MM	2025-08-25 20:03:58.469+05:30	2025-08-24 20:03:58.471491+05:30	2025-08-24 20:03:58.471491+05:30	\N	\N	{}	f	t	f
8c84b613-1e23-4fd9-9a18-48f97dadee21	550e8400-e29b-41d4-a716-446655440020	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjAiLCJpYXQiOjE3NTYwNDY2MDMsImV4cCI6MTc1NjEzMzAwMywiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.I8ymeCkfyYgchVI9JAi-sW6T9WajryCS-lP9ILYXzSA	2025-08-25 20:13:23.118+05:30	2025-08-24 20:13:23.120855+05:30	2025-08-24 20:13:23.120855+05:30	\N	\N	{}	f	t	f
ee54e910-8d52-46e1-b17d-a37cf1a054da	550e8400-e29b-41d4-a716-446655440011	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMTEiLCJpYXQiOjE3NTYwNDgzNzksImV4cCI6MTc1NjEzNDc3OSwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.7FOMxuiU3jOIcQtoVohBgIGE-301gmcQVoWCMXgU4SM	2025-08-25 20:42:59.858+05:30	2025-08-24 20:42:59.861069+05:30	2025-08-24 20:42:59.861069+05:30	\N	\N	{}	f	t	f
064fe241-a42d-4929-86d8-a9bc1f06af6f	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMmI1YzZhNy03OTA0LTRkMDItYmQxZi1kYjlmZmRhN2E0ZWIiLCJpYXQiOjE3NTYwNDg0ODIsImV4cCI6MTc1NjEzNDg4MiwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.IwjTHNgBfzNGl1KIr1mLGPC7cx1w7XSdYkh5hNRrIP8	2025-08-25 20:44:42.366+05:30	2025-08-24 20:44:42.367905+05:30	2025-08-24 20:44:42.367905+05:30	\N	\N	{}	f	t	f
0d2e0f87-8dca-4a66-899f-afb7cce5a8e1	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMmI1YzZhNy03OTA0LTRkMDItYmQxZi1kYjlmZmRhN2E0ZWIiLCJpYXQiOjE3NTYwNTA0MjEsImV4cCI6MTc1NjEzNjgyMSwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.Gn55uq3KK594_auNgMKm31kQ6Ov7Xgm0g39aZ3JEQn4	2025-08-25 21:17:01.351+05:30	2025-08-24 21:17:01.353077+05:30	2025-08-24 21:17:01.353077+05:30	\N	\N	{}	f	t	f
74b42ab0-2fe4-44d6-b1e0-7b7770473c27	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMmI1YzZhNy03OTA0LTRkMDItYmQxZi1kYjlmZmRhN2E0ZWIiLCJpYXQiOjE3NTYwNTExODMsImV4cCI6MTc1NjEzNzU4MywiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.blaAykxyn_mOBUVGzf7VtQ_Y0r2e0RjbdWBguXnu06s	2025-08-25 21:29:43.568+05:30	2025-08-24 21:29:43.570699+05:30	2025-08-24 21:29:43.570699+05:30	\N	\N	{}	f	t	f
09332dc5-5fa9-404f-9da9-d305ccb47cbe	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMmI1YzZhNy03OTA0LTRkMDItYmQxZi1kYjlmZmRhN2E0ZWIiLCJpYXQiOjE3NTYwNTI1MzEsImV4cCI6MTc1NjEzODkzMSwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.lc9xT6z5exwghvbjGbtdyMHRY0HG76ergnAah7LTMHA	2025-08-25 21:52:11.978+05:30	2025-08-24 21:52:11.981351+05:30	2025-08-24 21:52:11.981351+05:30	\N	\N	{}	f	t	f
f7b56342-ef88-4621-a1f4-ccacd8aa11ee	e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMmI1YzZhNy03OTA0LTRkMDItYmQxZi1kYjlmZmRhN2E0ZWIiLCJpYXQiOjE3NTYwNTI1OTcsImV4cCI6MTc1NjEzODk5NywiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.wwczwjo6rYr2-aVa5inaz-QAZiP1HBA-EpOotmVbnzM	2025-08-25 21:53:17.235+05:30	2025-08-24 21:53:17.238257+05:30	2025-08-24 21:53:17.238257+05:30	\N	\N	{}	f	t	f
\.


--
-- Data for Name: submission_attachments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.submission_attachments (id, submission_id, media_file_id, file_name, file_type, file_size, uploaded_at, created_at) FROM stdin;
\.


--
-- Data for Name: system_statistics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_statistics (id, active_users_count, total_users_count, total_clubs_count, total_events_count, total_assignments_count, total_comments_count, daily_active_users, weekly_active_users, monthly_active_users, "timestamp") FROM stdin;
\.


--
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
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tasks (id, project_id, title, description, task_key, task_type, priority, status, assignee_id, reporter_id, parent_task_id, story_points, time_spent_hours, due_date, completed_date, is_completed, created_at, updated_at) FROM stdin;
a874db74-a981-49de-8066-7c13280d5dda	41ad1a02-02a7-4b65-a464-0cb72a13b355	task 2	2	TE93DA47-2	task	medium	todo	550e8400-e29b-41d4-a716-446655440020	550e8400-e29b-41d4-a716-446655440020	\N	\N	0	2025-08-26 00:00:00+05:30	\N	f	2025-08-24 09:36:46.923063+05:30	2025-08-24 10:37:22.308696+05:30
80811692-3145-4557-8d74-a151d2d0e7a5	41ad1a02-02a7-4b65-a464-0cb72a13b355	htaa	ef	TE93DA47-5	task	medium	in_progress	\N	550e8400-e29b-41d4-a716-446655440020	\N	\N	0	2025-08-27 00:00:00+05:30	\N	f	2025-08-24 09:38:04.623443+05:30	2025-08-24 10:37:25.076507+05:30
6df975a8-f72b-42d7-b732-5d6de3a9b89c	41ad1a02-02a7-4b65-a464-0cb72a13b355	ifsgd	regt	TE93DA47-6	task	medium	in_progress	\N	550e8400-e29b-41d4-a716-446655440020	\N	\N	0	\N	\N	f	2025-08-24 09:38:21.673498+05:30	2025-08-24 10:37:26.700074+05:30
e89dbb9b-c9b1-4da4-b012-731344cb7ff3	41ad1a02-02a7-4b65-a464-0cb72a13b355	dafkj	adsf	TE93DA47-4	task	medium	done	\N	550e8400-e29b-41d4-a716-446655440020	\N	\N	0	2025-08-28 00:00:00+05:30	\N	f	2025-08-24 09:37:47.209637+05:30	2025-08-24 10:37:38.260207+05:30
180990cd-b534-4216-953a-153fa52e3030	41ad1a02-02a7-4b65-a464-0cb72a13b355	task3	ji	TE93DA47-3	task	medium	done	\N	550e8400-e29b-41d4-a716-446655440020	\N	\N	0	2025-08-26 00:00:00+05:30	\N	f	2025-08-24 09:37:30.610104+05:30	2025-08-24 10:38:48.616006+05:30
199bf0e2-7d8e-4968-b769-cf6e8a21619b	12413e7f-8ff1-47f7-b6d6-91558835948c	first	test	NAGPU046-1	task	medium	done	550e8400-e29b-41d4-a716-446655440020	550e8400-e29b-41d4-a716-446655440020	\N	\N	0	2025-08-29 00:00:00+05:30	\N	f	2025-08-24 01:54:45.534999+05:30	2025-08-24 02:21:50.179887+05:30
96808225-b8ac-4a08-b995-1fa2523b9dc6	41ad1a02-02a7-4b65-a464-0cb72a13b355	task 1	des	TE93DA47-1	task	medium	todo	550e8400-e29b-41d4-a716-446655440020	550e8400-e29b-41d4-a716-446655440020	\N	\N	0	2025-08-31 00:00:00+05:30	\N	f	2025-08-24 09:35:18.066214+05:30	2025-08-24 10:16:02.789926+05:30
89390ffc-7681-4380-9adf-2396d41c3f38	41ad1a02-02a7-4b65-a464-0cb72a13b355	0	0	TE93DA47-7	task	medium	done	\N	550e8400-e29b-41d4-a716-446655440020	\N	\N	0	\N	\N	f	2025-08-24 10:06:32.317337+05:30	2025-08-24 10:16:43.857952+05:30
d52f1cc7-db95-42ae-a514-3307b7d4c7cf	41ad1a02-02a7-4b65-a464-0cb72a13b355	new	new	TE93DA47-8	task	medium	in_review	\N	550e8400-e29b-41d4-a716-446655440020	\N	\N	0	\N	\N	f	2025-08-24 10:06:47.769485+05:30	2025-08-24 10:16:48.008982+05:30
66575c54-e22b-46f4-a63f-80915f562b68	41ad1a02-02a7-4b65-a464-0cb72a13b355	ui	ae	TE93DA47-9	task	medium	in_progress	\N	550e8400-e29b-41d4-a716-446655440020	\N	\N	0	\N	\N	f	2025-08-24 10:16:32.152132+05:30	2025-08-24 10:31:06.223981+05:30
\.


--
-- Data for Name: team_cards; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.team_cards (id, page_type, page_reference_id, member_name, member_role, member_email, member_phone, avatar_url, bio, social_links, display_order, is_active, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: trusted_devices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trusted_devices (id, user_id, device_identifier, device_name, device_type, browser, os, ip_address, last_used, created_at, expires_at, trust_level) FROM stdin;
\.


--
-- Data for Name: user_activities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_activities (id, user_id, action, target_type, target_id, target_name, details, created_at) FROM stdin;
\.


--
-- Data for Name: user_badges; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_badges (id, user_id, badge_name, badge_description, badge_icon, earned_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password_hash, name, username, avatar, role, club_id, bio, social_links, preferences, created_at, updated_at, profile_image_url, profile_images, verification_photo_url, phone_number, date_of_birth, address, emergency_contact, phone, location, website, github, linkedin, twitter, email_verified, email_verification_token, email_verification_token_expires_at, password_reset_token, password_reset_token_expires_at, oauth_provider, oauth_id, oauth_data, has_password, totp_secret, totp_temp_secret, totp_temp_secret_created_at, totp_enabled, totp_enabled_at, totp_recovery_codes, notification_preferences, email_otp_enabled, email_otp_verified, email_otp_secret, email_otp_backup_codes, email_otp_last_used, email_otp_created_at, email_otp, email_otp_expires_at, last_activity) FROM stdin;
550e8400-e29b-41d4-a716-446655440000	admin@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Admin User	admin	\N	admin	ascend	System administrator with full access	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440001	superadmin@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Super Admin	superadmin	\N	admin	\N	Super administrator overseeing all clubs	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440023	aster.media@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	ASTER Media Head	aster_media	\N	media	aster	Media coordinator for ASTER club	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440033	achievers.media@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	ACHIEVERS Media Head	achievers_media	\N	media	achievers	Media coordinator for ACHIEVERS club	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440040	altogether.coordinator@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	ALTOGETHER Coordinator	altogether_coord	\N	coordinator	altogether	Lead coordinator for ALTOGETHER development club	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440041	altogether.co-coordinator@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	ALTOGETHER Co-Coordinator	altogether_co_coord	\N	co_coordinator	altogether	Co-coordinator supporting ALTOGETHER activities	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440042	altogether.secretary@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	ALTOGETHER Secretary	altogether_secretary	\N	secretary	altogether	Secretary managing ALTOGETHER documentation	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440043	altogether.media@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	ALTOGETHER Media Head	altogether_media	\N	media	altogether	Media coordinator for ALTOGETHER club	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440100	student1.ascend@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Alice Johnson	alice_j	\N	student	ascend	Computer Science student passionate about coding	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440101	student2.ascend@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Bob Smith	bob_s	\N	student	ascend	Software Engineering student interested in web development	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440102	student3.ascend@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Charlie Brown	charlie_b	\N	student	ascend	Data Science student exploring machine learning	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440200	student1.aster@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Frank Miller	frank_m	\N	student	aster	Communication student focusing on interpersonal skills	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440201	student2.aster@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Grace Lee	grace_l	\N	student	aster	Leadership development and team building enthusiast	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440202	student3.aster@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Henry Wilson	henry_w	\N	student	aster	Public speaking and presentation skills specialist	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440300	student1.achievers@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Karen White	karen_w	\N	student	achievers	Preparing for competitive exams and higher studies	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440301	student2.achievers@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Liam Garcia	liam_g	\N	student	achievers	Research and academic excellence focused	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440302	student3.achievers@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Maya Patel	maya_p	\N	student	achievers	Graduate school preparation and academic mentorship	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440400	student1.altogether@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Oliver Davis	oliver_d	\N	student	altogether	Holistic development and all-round skill building	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440401	student2.altogether@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Sophie Chen	sophie_c	\N	student	altogether	Balanced development across technical and soft skills	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440402	student3.altogether@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	David Park	david_p	\N	student	altogether	Complete personality development enthusiast	{}	{}	2025-07-27 13:47:32.966+05:30	2025-07-27 13:47:32.966+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
5aaf2cd5-eac6-4303-8c0c-d60e56576dc8	test.api.1754509297076@example.com	$2b$12$SVqXLWt/AmAFGIKaPpQ8A.TaSW6VMd7Et8hrttFvPSXLMd1EaWF1i	Test User 1754509297076	\N	\N	student	ascend	\N	{}	{}	2025-08-07 01:11:38.307+05:30	2025-08-07 01:11:38.307+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440012	ascend.secretary@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Mohit Telang	ascend_secretary	\N	secretary	ascend	Secretary managing ASCEND documentation	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-08 22:11:35.038+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440013	ascend.media@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Aditya Yelne 	ascend_media	\N	media	ascend	Media coordinator for ASCEND club	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-08 22:11:44.008+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440021	aster.co-coordinator@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Gargi Udapure 	aster_co_coord	\N	co_coordinator	aster	Co-coordinator supporting ASTER activities	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-08 22:12:15.856+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440022	aster.secretary@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Sahil Shrivastava 	aster_secretary	\N	secretary	aster	Secretary managing ASTER documentation	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-08 22:13:26.458+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440030	achievers.coordinator@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Paritosh Magare	achievers_coord	\N	coordinator	achievers	Lead coordinator for ACHIEVERS higher studies club	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-08 22:14:49.879+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440031	achievers.co-coordinator@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Aayushi Asole	achievers_co_coord	\N	co_coordinator	achievers	Co-coordinator supporting ACHIEVERS activities	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-08 22:15:09.603+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440032	achievers.secretary@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Mayur Aglawe 	achievers_secretary	\N	secretary	achievers	Secretary managing ACHIEVERS documentation	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-08 22:16:19.5+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
cc0b35da-a560-416e-9366-00680dead616	test.api.manual@example.com	$2b$12$kTGtfsK6x1YSTPLP8HVX2Og5DyKMmwsQY3SOJ1ckIgBHhaIIrcKr6	Manual Test User	\N	\N	student	ascend	\N	{}	{}	2025-08-07 01:12:15.546+05:30	2025-08-07 01:12:15.546+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
1d5b1108-eb4c-4191-ae75-751e3610d519	ayushkshirsagar28@gmail.com	$2b$12$XbcEa4LED/o71VjyMDgIKOuVoOyOqCZG4AMVxVGt4nQZf13Cv3wcy	Ayush Kshirsagar	ayush01	https://qpulpytptbwwumicyzwr.supabase.co/storage/v1/object/public/avatars/profile_1d5b1108-eb4c-4191-ae75-751e3610d519_1755330454927_Gemini_Generated_Image_ypwrszypwrszypwr-removebg-preview.png	student	ascend	tech 	{}	{}	2025-08-07 01:25:30.145+05:30	2025-08-16 13:17:37.088+05:30	\N	[]	\N	\N	\N	\N	{}	7249360170	Nagpur	\N	https://github.com/08Ayush	https://www.linkedin.com/in/ayush-kshirsagar-37766a257/	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440011	ascend.co-coordinator@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Ayush Kshirsagar	ascend_co_coord	https://qpulpytptbwwumicyzwr.supabase.co/storage/v1/object/public/avatars/profile_550e8400-e29b-41d4-a716-446655440011_1755328377221_ayushphoto.jpg	co_coordinator	ascend	Co-coordinator supporting ASCEND activities	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-16 12:43:06.117+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
550e8400-e29b-41d4-a716-446655440010	ascend.coordinator@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Atharva Bhede	ascend_coord	https://qpulpytptbwwumicyzwr.supabase.co/storage/v1/object/public/avatars/profile_550e8400-e29b-41d4-a716-446655440010_1755680000670_Screenshot%202025-08-20%20141027.png	coordinator	ascend	Lead coordinator for ASCEND coding club	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-24 15:29:23.810841+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	AYAVENLPN5SQOVK4	\N	\N	t	2025-08-09 04:50:10.737	["620F2163", "8FD17E98", "BD8320DB", "452B43BA", "A2C610DB", "F12116B6", "4FC378F0", "E1DC2D47", "C682A95A", "BB09D2C7"]	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
9755eab9-39cb-443b-9cca-853d727afe40	kaiwalya.pund@zenith.edu	$2b$12$XbcEa4LED/o71VjyMDgIKOuVoOyOqCZG4AMVxVGt4nQZf13Cv3wcy	Kaiwalya Pund	\N	https://qpulpytptbwwumicyzwr.supabase.co/storage/v1/object/public/avatars/profile_9755eab9-39cb-443b-9cca-853d727afe40_1755672871466_Screenshot%202025-08-20%20120548.png	media	\N	\N	{}	{}	2025-08-20 11:30:17.917+05:30	2025-08-20 12:24:31.978+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-20 11:30:17.917+05:30
21a95efa-ccfa-4c4c-af7f-50cfa0a35053	atharva.naitam@zenith.edu	$2b$12$XbcEa4LED/o71VjyMDgIKOuVoOyOqCZG4AMVxVGt4nQZf13Cv3wcy	Atharva Naitam	\N	https://qpulpytptbwwumicyzwr.supabase.co/storage/v1/object/public/avatars/profile_21a95efa-ccfa-4c4c-af7f-50cfa0a35053_1755672934344_Screenshot%202025-08-20%20120530.png	innovation_head	\N	\N	{}	{}	2025-08-20 11:30:17.917+05:30	2025-08-20 12:25:33.8+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-20 11:30:17.917+05:30
8694ff1f-1d1e-4a7b-8ecb-eebda2c937d3	yash.siddhabhatti@zenith.edu	$2b$12$XbcEa4LED/o71VjyMDgIKOuVoOyOqCZG4AMVxVGt4nQZf13Cv3wcy	Yash Siddhabhatti	\N	https://qpulpytptbwwumicyzwr.supabase.co/storage/v1/object/public/avatars/profile_8694ff1f-1d1e-4a7b-8ecb-eebda2c937d3_1755672985159_yashprofle.png	president	\N	\N	{}	{}	2025-08-20 11:30:17.917+05:30	2025-08-20 12:26:24.623+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-20 11:30:17.917+05:30
241f4f32-458e-410e-b2f2-6dcfda992455	sarthak.thote@zenith.edu	$2b$12$XbcEa4LED/o71VjyMDgIKOuVoOyOqCZG4AMVxVGt4nQZf13Cv3wcy	Sarthak Thote	\N	https://qpulpytptbwwumicyzwr.supabase.co/storage/v1/object/public/avatars/profile_241f4f32-458e-410e-b2f2-6dcfda992455_1755673025315_screen1.png	vice_president	\N	\N	{}	{}	2025-08-20 11:30:17.917+05:30	2025-08-20 12:27:05.659+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-20 11:30:17.917+05:30
7c36ecbe-44d3-40df-8b8b-886e5385e839	yogeshvar.chaudhari@zenith.edu	$2b$12$XbcEa4LED/o71VjyMDgIKOuVoOyOqCZG4AMVxVGt4nQZf13Cv3wcy	Yogeshvar Chaudhari	\N	https://qpulpytptbwwumicyzwr.supabase.co/storage/v1/object/public/avatars/profile_7c36ecbe-44d3-40df-8b8b-886e5385e839_1755673151393_Screenshot%202025-08-20%20120444.png	treasurer	\N	\N	{}	{}	2025-08-20 11:30:17.917+05:30	2025-08-20 12:29:11.606+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-20 11:30:17.917+05:30
53cbed56-2bc7-4faf-bd6e-5f953de4dfa5	manasvi.giradkar@zenith.edu	$2b$12$XbcEa4LED/o71VjyMDgIKOuVoOyOqCZG4AMVxVGt4nQZf13Cv3wcy	Manasvi Giradkar	\N	https://qpulpytptbwwumicyzwr.supabase.co/storage/v1/object/public/avatars/profile_53cbed56-2bc7-4faf-bd6e-5f953de4dfa5_1755673094883_Screenshot%202025-08-20%20120312.png	zenith_secretary	\N	\N	{}	{}	2025-08-20 11:30:17.917+05:30	2025-08-20 13:26:41.332+05:30	\N	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-20 11:30:17.917+05:30
9d543990-baf7-45ba-8963-eeeddb27a9b1	anubuntu14@gmail.com	$2b$12$MHOdRmVoYkvJZK8bJ/DQf.u4TJWKcNFNLQKkved8sNOI.mwyemS.2	Atharva Naitam	\N	\N	student	ascend	\N	{}	{}	2025-08-24 16:52:50.508429+05:30	2025-08-24 16:52:50.508429+05:30	\N	[]	\N	\N	2000-10-27	\N	{}	8552877097	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-24 16:52:50.508429+05:30
e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb	atharvanaitam14@gmail.com	$2b$12$VZFnz.u3recotChxk3331.OS6V9QhxiGOqjzOLCd7XUyHLQLPmuJy	Atharva Naitam	\N	\N	student	ascend	\N	{}	{}	2025-08-24 16:47:13.14983+05:30	2025-08-24 18:39:28.498987+05:30	\N	[]	\N	\N	2006-02-18	\N	{}	8552877097	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-24 16:47:13.14983+05:30
550e8400-e29b-41d4-a716-446655440020	aster.coordinator@zenith.com	$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu	Radhika Salodkar	\N	\N	coordinator	aster	Lead coordinator for ASTER soft skills club	{}	{}	2025-07-27 13:47:32.966+05:30	2025-08-24 15:29:54.785166+05:30	/uploads/profiles/avatars/Screenshot from 2025-08-24 13-48-12_1756024176742_333e05fb871c9932.png	[]	\N	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	t	PE4ECHCYOMZSUGTR	LBKWOCKQIF3BSTCU	2025-08-16 08:27:25.065	f	\N	["F757E466", "3EE85BF7", "43A22EEB", "D7478D0E", "6EA60825", "A10652FA", "C086BBAE", "6799C08A", "CC3C4FA8", "946F6CCB"]	{"email": {"events": true, "results": true, "assignments": true, "discussions": true}}	f	f	\N	[]	\N	\N	\N	\N	2025-08-14 00:03:24.83+05:30
\.


--
-- Name: club_statistics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.club_statistics_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 6, true);


--
-- Name: system_statistics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.system_statistics_id_seq', 1, false);


--
-- Name: user_activities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_activities_id_seq', 1, false);


--
-- Name: ai_assignment_generations ai_assignment_generations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_assignment_generations
    ADD CONSTRAINT ai_assignment_generations_pkey PRIMARY KEY (id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: assignment_attempts assignment_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_attempts
    ADD CONSTRAINT assignment_attempts_pkey PRIMARY KEY (id);


--
-- Name: assignment_audit_log assignment_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_audit_log
    ADD CONSTRAINT assignment_audit_log_pkey PRIMARY KEY (id);


--
-- Name: assignment_questions assignment_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_questions
    ADD CONSTRAINT assignment_questions_pkey PRIMARY KEY (id);


--
-- Name: assignment_submissions assignment_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_pkey PRIMARY KEY (id);


--
-- Name: assignment_templates assignment_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_templates
    ADD CONSTRAINT assignment_templates_pkey PRIMARY KEY (id);


--
-- Name: assignment_violations assignment_violations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_violations
    ADD CONSTRAINT assignment_violations_pkey PRIMARY KEY (id);


--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: carousel_slides carousel_slides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carousel_slides
    ADD CONSTRAINT carousel_slides_pkey PRIMARY KEY (id);


--
-- Name: chat_attachments chat_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_attachments
    ADD CONSTRAINT chat_attachments_pkey PRIMARY KEY (id);


--
-- Name: chat_invitations chat_invitations_invitation_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_invitations
    ADD CONSTRAINT chat_invitations_invitation_token_key UNIQUE (invitation_token);


--
-- Name: chat_invitations chat_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_invitations
    ADD CONSTRAINT chat_invitations_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: chat_room_members chat_room_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_room_members
    ADD CONSTRAINT chat_room_members_pkey PRIMARY KEY (id);


--
-- Name: chat_rooms chat_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_pkey PRIMARY KEY (id);


--
-- Name: club_members club_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.club_members
    ADD CONSTRAINT club_members_pkey PRIMARY KEY (id);


--
-- Name: club_statistics club_statistics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.club_statistics
    ADD CONSTRAINT club_statistics_pkey PRIMARY KEY (id);


--
-- Name: clubs clubs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clubs
    ADD CONSTRAINT clubs_pkey PRIMARY KEY (id);


--
-- Name: code_results code_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.code_results
    ADD CONSTRAINT code_results_pkey PRIMARY KEY (id);


--
-- Name: coding_submissions coding_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coding_submissions
    ADD CONSTRAINT coding_submissions_pkey PRIMARY KEY (id);


--
-- Name: comment_likes comment_likes_comment_id_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_comment_id_user_id_unique UNIQUE (comment_id, user_id);


--
-- Name: comment_likes comment_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: committee_members committee_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.committee_members
    ADD CONSTRAINT committee_members_pkey PRIMARY KEY (id);


--
-- Name: committee_roles committee_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.committee_roles
    ADD CONSTRAINT committee_roles_pkey PRIMARY KEY (id);


--
-- Name: committees committees_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.committees
    ADD CONSTRAINT committees_name_key UNIQUE (name);


--
-- Name: committees committees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.committees
    ADD CONSTRAINT committees_pkey PRIMARY KEY (id);


--
-- Name: content_permissions content_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_permissions
    ADD CONSTRAINT content_permissions_pkey PRIMARY KEY (id);


--
-- Name: discussion_replies discussion_replies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discussion_replies
    ADD CONSTRAINT discussion_replies_pkey PRIMARY KEY (id);


--
-- Name: discussions discussions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discussions
    ADD CONSTRAINT discussions_pkey PRIMARY KEY (id);


--
-- Name: email_logs email_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_pkey PRIMARY KEY (id);


--
-- Name: email_otps email_otps_email_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_otps
    ADD CONSTRAINT email_otps_email_type_key UNIQUE (email, type);


--
-- Name: email_otps email_otps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_otps
    ADD CONSTRAINT email_otps_pkey PRIMARY KEY (id);


--
-- Name: event_attendees event_attendees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_attendees
    ADD CONSTRAINT event_attendees_pkey PRIMARY KEY (id);


--
-- Name: event_registrations event_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: featured_events featured_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_events
    ADD CONSTRAINT featured_events_pkey PRIMARY KEY (id);


--
-- Name: likes likes_comment_user_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_comment_user_unique UNIQUE (comment_id, user_id);


--
-- Name: likes likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_pkey PRIMARY KEY (id);


--
-- Name: likes likes_post_user_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_post_user_unique UNIQUE (post_id, user_id);


--
-- Name: media_files media_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_files
    ADD CONSTRAINT media_files_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (name);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: page_content page_content_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_content
    ADD CONSTRAINT page_content_pkey PRIMARY KEY (id);


--
-- Name: post_attachments post_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_attachments
    ADD CONSTRAINT post_attachments_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: posts posts_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_slug_key UNIQUE (slug);


--
-- Name: proctoring_sessions proctoring_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proctoring_sessions
    ADD CONSTRAINT proctoring_sessions_pkey PRIMARY KEY (id);


--
-- Name: project_invitations project_invitations_invitation_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_invitations
    ADD CONSTRAINT project_invitations_invitation_token_key UNIQUE (invitation_token);


--
-- Name: project_invitations project_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_invitations
    ADD CONSTRAINT project_invitations_pkey PRIMARY KEY (id);


--
-- Name: project_members project_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: query_cache query_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.query_cache
    ADD CONSTRAINT query_cache_pkey PRIMARY KEY (cache_key);


--
-- Name: question_media question_media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_media
    ADD CONSTRAINT question_media_pkey PRIMARY KEY (id);


--
-- Name: question_options question_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_options
    ADD CONSTRAINT question_options_pkey PRIMARY KEY (id);


--
-- Name: question_responses question_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_responses
    ADD CONSTRAINT question_responses_pkey PRIMARY KEY (id);


--
-- Name: security_events security_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_events
    ADD CONSTRAINT security_events_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key UNIQUE (token);


--
-- Name: submission_attachments submission_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submission_attachments
    ADD CONSTRAINT submission_attachments_pkey PRIMARY KEY (id);


--
-- Name: system_statistics system_statistics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_statistics
    ADD CONSTRAINT system_statistics_pkey PRIMARY KEY (id);


--
-- Name: task_activity task_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_activity
    ADD CONSTRAINT task_activity_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: team_cards team_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_cards
    ADD CONSTRAINT team_cards_pkey PRIMARY KEY (id);


--
-- Name: trusted_devices trusted_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trusted_devices
    ADD CONSTRAINT trusted_devices_pkey PRIMARY KEY (id);


--
-- Name: likes unique_post_user_like; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT unique_post_user_like UNIQUE (post_id, user_id);


--
-- Name: projects unique_project_key_club; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT unique_project_key_club UNIQUE (club_id, project_key);


--
-- Name: project_members unique_project_member; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT unique_project_member UNIQUE (project_id, user_id);


--
-- Name: tasks unique_task_key_project; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT unique_task_key_project UNIQUE (project_id, task_key);


--
-- Name: user_activities user_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activities
    ADD CONSTRAINT user_activities_pkey PRIMARY KEY (id);


--
-- Name: user_badges user_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_ai_generations_assignment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_generations_assignment_id ON public.ai_assignment_generations USING btree (generated_assignment_id);


--
-- Name: idx_ai_generations_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_generations_created_at ON public.ai_assignment_generations USING btree (created_at);


--
-- Name: idx_ai_generations_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_generations_status ON public.ai_assignment_generations USING btree (generation_status);


--
-- Name: idx_ai_generations_template_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_generations_template_id ON public.ai_assignment_generations USING btree (template_id);


--
-- Name: idx_assignment_attempts_assignment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_attempts_assignment_id ON public.assignment_attempts USING btree (assignment_id);


--
-- Name: idx_assignment_attempts_assignment_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_attempts_assignment_user ON public.assignment_attempts USING btree (assignment_id, user_id);


--
-- Name: idx_assignment_attempts_auto_save; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_attempts_auto_save ON public.assignment_attempts USING btree (assignment_id, user_id, last_auto_save);


--
-- Name: idx_assignment_attempts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_attempts_status ON public.assignment_attempts USING btree (status);


--
-- Name: idx_assignment_attempts_submitted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_attempts_submitted_at ON public.assignment_attempts USING btree (submitted_at);


--
-- Name: idx_assignment_attempts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_attempts_user_id ON public.assignment_attempts USING btree (user_id);


--
-- Name: idx_assignment_attempts_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_attempts_user_status ON public.assignment_attempts USING btree (user_id, status, submitted_at DESC);


--
-- Name: idx_assignment_attempts_violations; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_attempts_violations ON public.assignment_attempts USING btree (assignment_id, window_violations);


--
-- Name: idx_assignment_audit_log_assignment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_audit_log_assignment ON public.assignment_audit_log USING btree (assignment_id);


--
-- Name: idx_assignment_questions_assignment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_questions_assignment_id ON public.assignment_questions USING btree (assignment_id);


--
-- Name: idx_assignment_questions_correct_answer_jsonb; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_questions_correct_answer_jsonb ON public.assignment_questions USING gin (correct_answer);


--
-- Name: idx_assignment_questions_language_settings; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_questions_language_settings ON public.assignment_questions USING btree (code_language, allow_any_language);


--
-- Name: idx_assignment_submissions_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_assignment_submissions_unique ON public.assignment_submissions USING btree (assignment_id, user_id);


--
-- Name: idx_assignment_submissions_user_submitted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_submissions_user_submitted ON public.assignment_submissions USING btree (user_id, submitted_at DESC);


--
-- Name: idx_assignment_templates_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_templates_category ON public.assignment_templates USING btree (category);


--
-- Name: idx_assignment_templates_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_templates_created_by ON public.assignment_templates USING btree (created_by);


--
-- Name: idx_assignment_templates_difficulty; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_templates_difficulty ON public.assignment_templates USING btree (difficulty_level);


--
-- Name: idx_assignment_templates_subject; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_templates_subject ON public.assignment_templates USING btree (subject);


--
-- Name: idx_assignment_violations_submission_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_violations_submission_id ON public.assignment_violations USING btree (submission_id);


--
-- Name: idx_assignments_club_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_club_id ON public.assignments USING btree (club_id);


--
-- Name: idx_assignments_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_created_by ON public.assignments USING btree (created_by);


--
-- Name: idx_assignments_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_due_date ON public.assignments USING btree (due_date);


--
-- Name: idx_assignments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_status ON public.assignments USING btree (status);


--
-- Name: idx_assignments_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_type ON public.assignments USING btree (assignment_type);


--
-- Name: idx_attempts_assignment_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attempts_assignment_status ON public.assignment_attempts USING btree (assignment_id, status);


--
-- Name: idx_attempts_user_assignment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attempts_user_assignment ON public.assignment_attempts USING btree (user_id, assignment_id, attempt_number);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- Name: idx_audit_logs_resource_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_resource_type ON public.audit_logs USING btree (resource_type);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_carousel_slides_page; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_carousel_slides_page ON public.carousel_slides USING btree (page_type, page_reference_id);


--
-- Name: idx_chat_attachments_file_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_attachments_file_id ON public.chat_attachments USING btree (file_id);


--
-- Name: idx_chat_attachments_room_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_attachments_room_id ON public.chat_attachments USING btree (room_id);


--
-- Name: idx_chat_attachments_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_attachments_user_id ON public.chat_attachments USING btree (user_id);


--
-- Name: idx_chat_messages_can_edit_until; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_can_edit_until ON public.chat_messages USING btree (can_edit_until);


--
-- Name: idx_chat_messages_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_created_at ON public.chat_messages USING btree (created_at);


--
-- Name: idx_chat_messages_edited_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_edited_at ON public.chat_messages USING btree (edited_at);


--
-- Name: idx_chat_messages_room_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_room_id ON public.chat_messages USING btree (room_id);


--
-- Name: idx_chat_messages_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_user_id ON public.chat_messages USING btree (user_id);


--
-- Name: idx_chat_room_members_chat_room_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_room_members_chat_room_id ON public.chat_room_members USING btree (chat_room_id);


--
-- Name: idx_chat_room_members_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_room_members_user_id ON public.chat_room_members USING btree (user_id);


--
-- Name: idx_chat_rooms_profile_picture; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_rooms_profile_picture ON public.chat_rooms USING btree (profile_picture_url);


--
-- Name: idx_club_members_club_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_club_members_club_id ON public.club_members USING btree (club_id);


--
-- Name: idx_club_members_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_club_members_user_id ON public.club_members USING btree (user_id);


--
-- Name: idx_clubs_coordinator_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clubs_coordinator_id ON public.clubs USING btree (coordinator_id);


--
-- Name: idx_clubs_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clubs_type ON public.clubs USING btree (type);


--
-- Name: idx_coding_submissions_question_response_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coding_submissions_question_response_id ON public.coding_submissions USING btree (question_response_id);


--
-- Name: idx_comment_likes_comment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comment_likes_comment_id ON public.comment_likes USING btree (comment_id);


--
-- Name: idx_comment_likes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comment_likes_user_id ON public.comment_likes USING btree (user_id);


--
-- Name: idx_comments_author_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_author_id ON public.comments USING btree (author_id);


--
-- Name: idx_comments_post_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_post_id ON public.comments USING btree (post_id);


--
-- Name: idx_committee_members_committee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_committee_members_committee_id ON public.committee_members USING btree (committee_id);


--
-- Name: idx_committee_members_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_committee_members_user_id ON public.committee_members USING btree (user_id);


--
-- Name: idx_committee_roles_committee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_committee_roles_committee_id ON public.committee_roles USING btree (committee_id);


--
-- Name: idx_content_permissions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_permissions_user ON public.content_permissions USING btree (user_id, page_type, page_reference_id);


--
-- Name: idx_email_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_created_at ON public.email_logs USING btree (created_at);


--
-- Name: idx_email_logs_recipient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_recipient ON public.email_logs USING btree (recipient);


--
-- Name: idx_email_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_status ON public.email_logs USING btree (status);


--
-- Name: idx_email_otps_email_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_otps_email_type ON public.email_otps USING btree (email, type);


--
-- Name: idx_email_otps_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_otps_expires_at ON public.email_otps USING btree (expires_at);


--
-- Name: idx_event_attendees_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_attendees_event_id ON public.event_attendees USING btree (event_id);


--
-- Name: idx_event_attendees_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_attendees_user_id ON public.event_attendees USING btree (user_id);


--
-- Name: idx_events_club_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_club_id ON public.events USING btree (club_id);


--
-- Name: idx_events_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_created_by ON public.events USING btree (created_by);


--
-- Name: idx_events_event_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_event_date ON public.events USING btree (event_date);


--
-- Name: idx_featured_events_page; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_events_page ON public.featured_events USING btree (page_type, page_reference_id);


--
-- Name: idx_likes_post_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_likes_post_id ON public.likes USING btree (post_id);


--
-- Name: idx_likes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_likes_user_id ON public.likes USING btree (user_id);


--
-- Name: idx_media_files_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_media_files_created_at ON public.media_files USING btree (created_at);


--
-- Name: idx_media_files_upload_context; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_media_files_upload_context ON public.media_files USING btree (upload_context);


--
-- Name: idx_media_files_upload_reference; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_media_files_upload_reference ON public.media_files USING btree (upload_reference_id, upload_context);


--
-- Name: idx_media_files_uploaded_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_media_files_uploaded_by ON public.media_files USING btree (uploaded_by);


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at);


--
-- Name: idx_notifications_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_read ON public.notifications USING btree (read);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_page_content_page; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_content_page ON public.page_content USING btree (page_type, page_reference_id);


--
-- Name: idx_post_attachments_media_file_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_attachments_media_file_id ON public.post_attachments USING btree (media_file_id);


--
-- Name: idx_post_attachments_post_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_attachments_post_id ON public.post_attachments USING btree (post_id);


--
-- Name: idx_post_attachments_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_attachments_type ON public.post_attachments USING btree (attachment_type);


--
-- Name: idx_posts_author_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_author_id ON public.posts USING btree (author_id);


--
-- Name: idx_posts_club_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_club_id ON public.posts USING btree (club_id);


--
-- Name: idx_posts_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_created_at ON public.posts USING btree (created_at);


--
-- Name: idx_posts_search_vector; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_search_vector ON public.posts USING gin (search_vector);


--
-- Name: idx_posts_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_slug ON public.posts USING btree (slug);


--
-- Name: idx_posts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_status ON public.posts USING btree (status);


--
-- Name: idx_project_invitations_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_invitations_email ON public.project_invitations USING btree (email);


--
-- Name: idx_project_invitations_keys; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_invitations_keys ON public.project_invitations USING btree (project_key, access_key);


--
-- Name: idx_project_members_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_members_project_id ON public.project_members USING btree (project_id);


--
-- Name: idx_project_members_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_members_user_id ON public.project_members USING btree (user_id);


--
-- Name: idx_projects_club_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_club_id ON public.projects USING btree (club_id);


--
-- Name: idx_projects_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_created_by ON public.projects USING btree (created_by);


--
-- Name: idx_projects_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_status ON public.projects USING btree (status);


--
-- Name: idx_question_responses_question_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_question_responses_question_id ON public.question_responses USING btree (question_id);


--
-- Name: idx_question_responses_submission_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_question_responses_submission_id ON public.question_responses USING btree (submission_id);


--
-- Name: idx_questions_assignment_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_questions_assignment_order ON public.assignment_questions USING btree (assignment_id, question_order);


--
-- Name: idx_questions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_questions_type ON public.assignment_questions USING btree (question_type);


--
-- Name: idx_security_events_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_events_event_type ON public.security_events USING btree (event_type);


--
-- Name: idx_security_events_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_events_user_id ON public.security_events USING btree (user_id);


--
-- Name: idx_sessions_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_expires_at ON public.sessions USING btree (expires_at);


--
-- Name: idx_sessions_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_token ON public.sessions USING btree (token);


--
-- Name: idx_sessions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_user_id ON public.sessions USING btree (user_id);


--
-- Name: idx_submission_attachments_media_file_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submission_attachments_media_file_id ON public.submission_attachments USING btree (media_file_id);


--
-- Name: idx_submission_attachments_submission_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submission_attachments_submission_id ON public.submission_attachments USING btree (submission_id);


--
-- Name: idx_submissions_assignment_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_assignment_status ON public.assignment_submissions USING btree (assignment_id, status);


--
-- Name: idx_submissions_status_submitted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_status_submitted ON public.assignment_submissions USING btree (status, submitted_at DESC);


--
-- Name: idx_submissions_user_submitted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_user_submitted ON public.assignment_submissions USING btree (user_id, submitted_at DESC);


--
-- Name: idx_tasks_assignee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_assignee_id ON public.tasks USING btree (assignee_id);


--
-- Name: idx_tasks_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_due_date ON public.tasks USING btree (due_date);


--
-- Name: idx_tasks_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_project_id ON public.tasks USING btree (project_id);


--
-- Name: idx_tasks_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_status ON public.tasks USING btree (status);


--
-- Name: idx_team_cards_page; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_cards_page ON public.team_cards USING btree (page_type, page_reference_id);


--
-- Name: idx_trusted_devices_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trusted_devices_user_id ON public.trusted_devices USING btree (user_id);


--
-- Name: idx_user_activities_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_activities_created_at ON public.user_activities USING btree (created_at);


--
-- Name: idx_user_activities_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_activities_user_id ON public.user_activities USING btree (user_id);


--
-- Name: idx_users_club_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_club_id ON public.users USING btree (club_id);


--
-- Name: idx_users_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_created_at ON public.users USING btree (created_at);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_last_activity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_last_activity ON public.users USING btree (last_activity);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: posts posts_search_vector_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER posts_search_vector_update BEFORE INSERT OR UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_post_search_vector();


--
-- Name: tasks tasks_generate_key; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tasks_generate_key BEFORE INSERT ON public.tasks FOR EACH ROW WHEN (((new.task_key IS NULL) OR ((new.task_key)::text = ''::text))) EXECUTE FUNCTION public.generate_task_key();


--
-- Name: tasks tasks_update_project_progress; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tasks_update_project_progress AFTER INSERT OR DELETE OR UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_project_progress();


--
-- Name: assignments update_assignments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: carousel_slides update_carousel_slides_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_carousel_slides_updated_at BEFORE UPDATE ON public.carousel_slides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: clubs update_clubs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON public.clubs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: comments update_comments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: committee_members update_committee_members_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_committee_members_updated_at BEFORE UPDATE ON public.committee_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: committee_roles update_committee_roles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_committee_roles_updated_at BEFORE UPDATE ON public.committee_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: committees update_committees_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_committees_updated_at BEFORE UPDATE ON public.committees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: events update_events_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: featured_events update_featured_events_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_featured_events_updated_at BEFORE UPDATE ON public.featured_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: page_content update_page_content_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_page_content_updated_at BEFORE UPDATE ON public.page_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: posts update_posts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: projects update_projects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tasks update_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: team_cards update_team_cards_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_team_cards_updated_at BEFORE UPDATE ON public.team_cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: carousel_slides carousel_slides_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carousel_slides
    ADD CONSTRAINT carousel_slides_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: chat_attachments chat_attachments_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_attachments
    ADD CONSTRAINT chat_attachments_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.media_files(id) ON DELETE CASCADE;


--
-- Name: chat_attachments chat_attachments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_attachments
    ADD CONSTRAINT chat_attachments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: comment_likes comment_likes_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- Name: comment_likes comment_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: content_permissions content_permissions_granted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_permissions
    ADD CONSTRAINT content_permissions_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.users(id);


--
-- Name: content_permissions content_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_permissions
    ADD CONSTRAINT content_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: featured_events featured_events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_events
    ADD CONSTRAINT featured_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: featured_events featured_events_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_events
    ADD CONSTRAINT featured_events_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: chat_messages fk_chat_messages_edited_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT fk_chat_messages_edited_by FOREIGN KEY (edited_by) REFERENCES public.users(id);


--
-- Name: chat_rooms fk_chat_rooms_edited_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT fk_chat_rooms_edited_by FOREIGN KEY (edited_by) REFERENCES public.users(id);


--
-- Name: likes likes_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- Name: page_content page_content_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_content
    ADD CONSTRAINT page_content_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: post_attachments post_attachments_media_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_attachments
    ADD CONSTRAINT post_attachments_media_file_id_fkey FOREIGN KEY (media_file_id) REFERENCES public.media_files(id) ON DELETE CASCADE;


--
-- Name: post_attachments post_attachments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_attachments
    ADD CONSTRAINT post_attachments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: submission_attachments submission_attachments_media_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submission_attachments
    ADD CONSTRAINT submission_attachments_media_file_id_fkey FOREIGN KEY (media_file_id) REFERENCES public.media_files(id) ON DELETE CASCADE;


--
-- Name: submission_attachments submission_attachments_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submission_attachments
    ADD CONSTRAINT submission_attachments_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.assignment_submissions(id) ON DELETE CASCADE;


--
-- Name: task_activity task_activity_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_activity
    ADD CONSTRAINT task_activity_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_activity task_activity_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_activity
    ADD CONSTRAINT task_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: team_cards team_cards_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_cards
    ADD CONSTRAINT team_cards_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

