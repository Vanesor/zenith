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
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.events (id, title, description, club_id, created_by, event_date, event_time, location, max_attendees, status, image_url, created_at, updated_at, event_images, banner_image_url, gallery_images) VALUES ('550e8400-3001-41d4-a716-446655440001', 'Coding Summit 2025', 'Annual coding summit featuring industry leaders and programming challenges', 'ascend', '550e8400-e29b-41d4-a716-446655440010', '2025-08-10', '09:00:00', 'Main Auditorium', 200, 'upcoming', NULL, '2025-07-27 13:47:32.966+05:30', '2025-07-27 13:47:32.966+05:30', '[]', NULL, '[]');
INSERT INTO public.events (id, title, description, club_id, created_by, event_date, event_time, location, max_attendees, status, image_url, created_at, updated_at, event_images, banner_image_url, gallery_images) VALUES ('550e8400-3001-41d4-a716-446655440002', 'Hackathon Weekend', '48-hour coding marathon to build innovative solutions', 'ascend', '550e8400-e29b-41d4-a716-446655440010', '2025-08-17', '18:00:00', 'Computer Lab Block A', 50, 'upcoming', NULL, '2025-07-27 13:47:32.966+05:30', '2025-07-27 13:47:32.966+05:30', '[]', NULL, '[]');
INSERT INTO public.events (id, title, description, club_id, created_by, event_date, event_time, location, max_attendees, status, image_url, created_at, updated_at, event_images, banner_image_url, gallery_images) VALUES ('550e8400-3002-41d4-a716-446655440001', 'Communication Skills Workshop', 'Interactive workshop on effective communication and presentation', 'aster', '550e8400-e29b-41d4-a716-446655440020', '2025-08-13', '10:00:00', 'Seminar Hall', 100, 'upcoming', NULL, '2025-07-27 13:47:32.966+05:30', '2025-07-27 13:47:32.966+05:30', '[]', NULL, '[]');
INSERT INTO public.events (id, title, description, club_id, created_by, event_date, event_time, location, max_attendees, status, image_url, created_at, updated_at, event_images, banner_image_url, gallery_images) VALUES ('550e8400-3002-41d4-a716-446655440002', 'Leadership Development Session', 'Leadership training with industry professionals', 'aster', '550e8400-e29b-41d4-a716-446655440020', '2025-08-07', '17:00:00', 'Conference Room B', 60, 'upcoming', NULL, '2025-07-27 13:47:32.966+05:30', '2025-07-27 13:47:32.966+05:30', '[]', NULL, '[]');
INSERT INTO public.events (id, title, description, club_id, created_by, event_date, event_time, location, max_attendees, status, image_url, created_at, updated_at, event_images, banner_image_url, gallery_images) VALUES ('550e8400-3003-41d4-a716-446655440001', 'Higher Studies Fair', 'Information fair about higher education opportunities', 'achievers', '550e8400-e29b-41d4-a716-446655440030', '2025-08-15', '16:00:00', 'Exhibition Hall', 300, 'upcoming', NULL, '2025-07-27 13:47:32.966+05:30', '2025-07-27 13:47:32.966+05:30', '[]', NULL, '[]');
INSERT INTO public.events (id, title, description, club_id, created_by, event_date, event_time, location, max_attendees, status, image_url, created_at, updated_at, event_images, banner_image_url, gallery_images) VALUES ('550e8400-3003-41d4-a716-446655440002', 'Research Methodology Workshop', 'Workshop on research techniques and academic writing', 'achievers', '550e8400-e29b-41d4-a716-446655440030', '2025-08-05', '19:00:00', 'Library Auditorium', 120, 'upcoming', NULL, '2025-07-27 13:47:32.966+05:30', '2025-07-27 13:47:32.966+05:30', '[]', NULL, '[]');
INSERT INTO public.events (id, title, description, club_id, created_by, event_date, event_time, location, max_attendees, status, image_url, created_at, updated_at, event_images, banner_image_url, gallery_images) VALUES ('550e8400-3004-41d4-a716-446655440001', 'Holistic Development Fair', 'Showcase of comprehensive skill development activities', 'altogether', '550e8400-e29b-41d4-a716-446655440040', '2025-08-20', '14:00:00', 'Main Campus', 400, 'upcoming', NULL, '2025-07-27 13:47:32.966+05:30', '2025-07-27 13:47:32.966+05:30', '[]', NULL, '[]');
INSERT INTO public.events (id, title, description, club_id, created_by, event_date, event_time, location, max_attendees, status, image_url, created_at, updated_at, event_images, banner_image_url, gallery_images) VALUES ('550e8400-3004-41d4-a716-446655440002', 'Cross-Club Collaboration Meet', 'Inter-club collaboration and networking event', 'altogether', '550e8400-e29b-41d4-a716-446655440040', '2025-08-03', '16:30:00', 'Community Center', 150, 'upcoming', NULL, '2025-07-27 13:47:32.966+05:30', '2025-07-27 13:47:32.966+05:30', '[]', NULL, '[]');


--
-- PostgreSQL database dump complete
--

