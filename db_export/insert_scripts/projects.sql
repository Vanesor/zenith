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
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.projects (id, name, description, club_id, created_by, project_key, project_type, priority, status, start_date, target_end_date, actual_end_date, access_password, is_public, progress_percentage, total_tasks, completed_tasks, created_at, updated_at) VALUES ('411bad76-ae50-436b-bf00-0f841b4f682f', 'Nagpur2', 'teat', 'ascend', '550e8400-e29b-41d4-a716-446655440020', 'NAGPU642', 'innovation', 'medium', 'planning', NULL, '2025-08-29', NULL, 'NAGPRADHFEC3', true, 0, 0, 0, '2025-08-23 21:18:53.035843+05:30', '2025-08-23 21:18:53.035843+05:30');
INSERT INTO public.projects (id, name, description, club_id, created_by, project_key, project_type, priority, status, start_date, target_end_date, actual_end_date, access_password, is_public, progress_percentage, total_tasks, completed_tasks, created_at, updated_at) VALUES ('12413e7f-8ff1-47f7-b6d6-91558835948c', 'Nagpur', 'test', 'ascend', '550e8400-e29b-41d4-a716-446655440020', 'NAGPU046', 'innovation', 'medium', 'planning', NULL, '2025-08-28', NULL, 'NAGPRADH9298', false, 100.0, 1, 1, '2025-08-23 21:08:20.405678+05:30', '2025-08-24 02:21:50.191196+05:30');
INSERT INTO public.projects (id, name, description, club_id, created_by, project_key, project_type, priority, status, start_date, target_end_date, actual_end_date, access_password, is_public, progress_percentage, total_tasks, completed_tasks, created_at, updated_at) VALUES ('41ad1a02-02a7-4b65-a464-0cb72a13b355', 'testDelpoy', 'hi', 'aster', '550e8400-e29b-41d4-a716-446655440020', 'TE93DA47', 'innovation', 'critical', 'planning', NULL, '2025-08-29', NULL, 'TE6690768B2FD1', false, 33.3, 9, 3, '2025-08-24 09:34:06.14803+05:30', '2025-08-24 10:38:48.617495+05:30');


--
-- PostgreSQL database dump complete
--

