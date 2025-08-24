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
-- Data for Name: event_attendees; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.event_attendees (id, event_id, user_id, registered_at, attendance_status) VALUES ('a1000001-1111-2222-3333-444444444444', 'e1000001-1111-2222-3333-444444444444', '550e8400-e29b-41d4-a716-446655440020', '2025-08-21 13:55:47.999635+05:30', 'registered');
INSERT INTO public.event_attendees (id, event_id, user_id, registered_at, attendance_status) VALUES ('a1000002-1111-2222-3333-444444444444', 'e1000002-1111-2222-3333-444444444444', '550e8400-e29b-41d4-a716-446655440020', '2025-08-21 13:55:47.999635+05:30', 'registered');
INSERT INTO public.event_attendees (id, event_id, user_id, registered_at, attendance_status) VALUES ('a1000003-1111-2222-3333-444444444444', 'e2000001-1111-2222-3333-444444444444', '550e8400-e29b-41d4-a716-446655440020', '2025-08-21 13:55:47.999635+05:30', 'registered');


--
-- PostgreSQL database dump complete
--

