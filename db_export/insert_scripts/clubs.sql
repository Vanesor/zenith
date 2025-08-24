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
-- Data for Name: clubs; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.clubs (id, name, type, description, long_description, icon, color, coordinator_id, co_coordinator_id, secretary_id, media_id, guidelines, meeting_schedule, created_at, updated_at, logo_url, banner_image_url, club_images, member_count) VALUES ('ascend', 'ASCEND', 'Technical', 'A coding club focused on programming and technology', 'ASCEND is the premier coding club fostering programming skills, software development, and technological innovation. We organize hackathons, coding workshops, and technical seminars to help students master programming languages and development frameworks.', 'Code', 'blue', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440013', 'Focus on coding excellence and software development', '{}', '2025-07-27 13:47:32.966+05:30', '2025-08-14 00:09:39.49+05:30', NULL, NULL, '[]', 0);
INSERT INTO public.clubs (id, name, type, description, long_description, icon, color, coordinator_id, co_coordinator_id, secretary_id, media_id, guidelines, meeting_schedule, created_at, updated_at, logo_url, banner_image_url, club_images, member_count) VALUES ('aster', 'ASTER', 'Soft Skills', 'A club focused on developing interpersonal and communication skills', 'ASTER is dedicated to enhancing soft skills including communication, leadership, teamwork, and professional development. We organize workshops, seminars, and activities to help students develop essential workplace skills.', 'Users', 'green', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440023', 'Develop essential soft skills for professional success', '{}', '2025-07-27 13:47:32.966+05:30', '2025-08-14 00:09:39.49+05:30', NULL, NULL, '[]', 0);
INSERT INTO public.clubs (id, name, type, description, long_description, icon, color, coordinator_id, co_coordinator_id, secretary_id, media_id, guidelines, meeting_schedule, created_at, updated_at, logo_url, banner_image_url, club_images, member_count) VALUES ('achievers', 'ACHIEVERS', 'Higher Studies', 'A club supporting students pursuing higher education and academic excellence', 'ACHIEVERS supports students in their academic journey towards higher studies including competitive exams, research opportunities, and advanced academic pursuits. We provide guidance, resources, and mentorship for academic excellence.', 'GraduationCap', 'purple', '550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440033', 'Support academic excellence and higher education goals', '{}', '2025-07-27 13:47:32.966+05:30', '2025-08-14 00:09:39.49+05:30', NULL, NULL, '[]', 0);
INSERT INTO public.clubs (id, name, type, description, long_description, icon, color, coordinator_id, co_coordinator_id, secretary_id, media_id, guidelines, meeting_schedule, created_at, updated_at, logo_url, banner_image_url, club_images, member_count) VALUES ('altogether', 'ALTOGETHER', 'Overall Development', 'A comprehensive club focusing on holistic student development', 'ALTOGETHER promotes overall personality development combining technical skills, soft skills, academic excellence, and personal growth. We organize diverse activities to ensure well-rounded development of students across all areas.', 'Target', 'orange', '550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440043', 'Foster complete personality and skill development', '{}', '2025-07-27 13:47:32.966+05:30', '2025-08-14 00:09:39.49+05:30', NULL, NULL, '[]', 0);


--
-- PostgreSQL database dump complete
--

