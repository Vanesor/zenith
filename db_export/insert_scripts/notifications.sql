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
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.notifications (id, user_id, type, title, message, link, read, delivery_method, created_at, sent_by, club_id, email_sent, email_sent_at, related_id, metadata) VALUES (1, '550e8400-e29b-41d4-a716-446655440020', 'event_join', 'New event attendee', 'A user has joined your event "Communication Skills Workshop"', NULL, false, 'in-app', '2025-08-12 16:02:02.904+05:30', NULL, NULL, false, NULL, '550e8400-3002-41d4-a716-446655440001', '{}');
INSERT INTO public.notifications (id, user_id, type, title, message, link, read, delivery_method, created_at, sent_by, club_id, email_sent, email_sent_at, related_id, metadata) VALUES (2, '550e8400-e29b-41d4-a716-446655440020', 'event_leave', 'Event attendee left', 'A user has left your event "Communication Skills Workshop"', NULL, false, 'in-app', '2025-08-12 16:02:08.482+05:30', NULL, NULL, false, NULL, '550e8400-3002-41d4-a716-446655440001', '{}');
INSERT INTO public.notifications (id, user_id, type, title, message, link, read, delivery_method, created_at, sent_by, club_id, email_sent, email_sent_at, related_id, metadata) VALUES (3, '550e8400-e29b-41d4-a716-446655440010', 'event_join', 'New event attendee', 'A user has joined your event "Hackathon Weekend"', NULL, false, 'in-app', '2025-08-12 16:02:12.771+05:30', NULL, NULL, false, NULL, '550e8400-3001-41d4-a716-446655440002', '{}');
INSERT INTO public.notifications (id, user_id, type, title, message, link, read, delivery_method, created_at, sent_by, club_id, email_sent, email_sent_at, related_id, metadata) VALUES (4, '550e8400-e29b-41d4-a716-446655440040', 'event_join', 'New event attendee', 'A user has joined your event "Holistic Development Fair"', NULL, false, 'in-app', '2025-08-12 16:02:14.885+05:30', NULL, NULL, false, NULL, '550e8400-3004-41d4-a716-446655440001', '{}');
INSERT INTO public.notifications (id, user_id, type, title, message, link, read, delivery_method, created_at, sent_by, club_id, email_sent, email_sent_at, related_id, metadata) VALUES (5, '550e8400-e29b-41d4-a716-446655440020', 'event_join', 'New event attendee', 'A user has joined your event "Communication Skills Workshop"', NULL, false, 'in-app', '2025-08-12 16:47:16.331+05:30', NULL, NULL, false, NULL, '550e8400-3002-41d4-a716-446655440001', '{}');
INSERT INTO public.notifications (id, user_id, type, title, message, link, read, delivery_method, created_at, sent_by, club_id, email_sent, email_sent_at, related_id, metadata) VALUES (6, '550e8400-e29b-41d4-a716-446655440020', 'event_leave', 'Event attendee left', 'A user has left your event "Communication Skills Workshop"', NULL, false, 'in-app', '2025-08-12 16:47:34.01+05:30', NULL, NULL, false, NULL, '550e8400-3002-41d4-a716-446655440001', '{}');


--
-- PostgreSQL database dump complete
--

