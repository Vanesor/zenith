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
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.comments (id, post_id, author_id, content, parent_id, likes_count, created_at, updated_at) VALUES ('c6cb6351-a125-491b-a4fa-c74ea8c80147', '3bc000fa-d086-4977-9cb3-08105ada3771', 'e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb', 'nice', NULL, 0, '2025-08-24 19:01:38.717994+05:30', '2025-08-24 19:01:38.717994+05:30');


--
-- PostgreSQL database dump complete
--

