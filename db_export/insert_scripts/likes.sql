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
-- Data for Name: likes; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.likes (id, post_id, user_id, created_at, comment_id) VALUES ('2b5b1bcd-653d-4f33-948c-bf38bcb13e64', '3bc000fa-d086-4977-9cb3-08105ada3771', 'e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb', '2025-08-24 20:45:52.419621+05:30', NULL);
INSERT INTO public.likes (id, post_id, user_id, created_at, comment_id) VALUES ('ad0dade1-98a7-40e2-95d0-03ebc170808e', NULL, 'e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb', '2025-08-24 20:45:59.276092+05:30', 'c6cb6351-a125-491b-a4fa-c74ea8c80147');


--
-- PostgreSQL database dump complete
--

