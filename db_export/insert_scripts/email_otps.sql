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
-- Data for Name: email_otps; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.email_otps (id, email, otp, type, expires_at, created_at) VALUES ('5c243870-c046-4208-9739-be44b8f5736b', 'anubuntu14@gmail.com', '352576', 'verification', '2025-08-24 17:07:50.51+05:30', '2025-08-24 16:52:50.510826+05:30');
INSERT INTO public.email_otps (id, email, otp, type, expires_at, created_at) VALUES ('1016ec8d-6639-48a1-934c-426010f7ddd1', 'aster.coordinator@zenith.com', '654691', 'verification', '2025-08-24 20:28:23.139+05:30', '2025-08-24 20:13:23.139545+05:30');
INSERT INTO public.email_otps (id, email, otp, type, expires_at, created_at) VALUES ('01dbcc23-abc5-47d6-985d-ca56b2dae451', 'ascend.co-coordinator@zenith.com', '725466', 'verification', '2025-08-24 20:57:59.863+05:30', '2025-08-24 20:42:59.863818+05:30');


--
-- PostgreSQL database dump complete
--

