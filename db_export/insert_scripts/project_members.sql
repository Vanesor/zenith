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
-- Data for Name: project_members; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.project_members (id, project_id, user_id, role, status, joined_at, invited_by, created_at) VALUES ('b86ebb6d-8610-49ee-992c-9f033cd329b0', '12413e7f-8ff1-47f7-b6d6-91558835948c', '550e8400-e29b-41d4-a716-446655440020', 'admin', 'active', '2025-08-23 21:08:20.408168+05:30', '550e8400-e29b-41d4-a716-446655440020', '2025-08-23 21:08:20.408168+05:30');
INSERT INTO public.project_members (id, project_id, user_id, role, status, joined_at, invited_by, created_at) VALUES ('5bfef142-f9f7-4cea-8bcc-03aef906c0b2', '411bad76-ae50-436b-bf00-0f841b4f682f', '550e8400-e29b-41d4-a716-446655440020', 'admin', 'active', '2025-08-23 21:18:53.037679+05:30', '550e8400-e29b-41d4-a716-446655440020', '2025-08-23 21:18:53.037679+05:30');
INSERT INTO public.project_members (id, project_id, user_id, role, status, joined_at, invited_by, created_at) VALUES ('734eb3a3-2d39-4580-a839-36ac9adf5630', '41ad1a02-02a7-4b65-a464-0cb72a13b355', '550e8400-e29b-41d4-a716-446655440020', 'admin', 'active', '2025-08-24 09:34:06.150689+05:30', '550e8400-e29b-41d4-a716-446655440020', '2025-08-24 09:34:06.150689+05:30');


--
-- PostgreSQL database dump complete
--

