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
-- Data for Name: committees; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.committees (id, name, description, hierarchy_level, is_active, created_at, updated_at) VALUES ('8f28c85b-1315-4583-923a-a827f9507a00', 'Zenith Main Committee', 'The main student committee for Zenith organization', 1, true, '2025-08-13 23:52:53.549+05:30', '2025-08-13 23:52:53.549+05:30');
INSERT INTO public.committees (id, name, description, hierarchy_level, is_active, created_at, updated_at) VALUES ('9e2a45e8-88e0-4998-bbc1-1ab68cf9f989', 'Student Executive Committee', 'The main student executive committee responsible for overall governance and leadership', 1, true, '2025-08-20 11:30:17.917+05:30', '2025-08-20 11:30:17.917+05:30');


--
-- PostgreSQL database dump complete
--

