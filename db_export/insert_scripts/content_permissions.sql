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
-- Data for Name: content_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.content_permissions (id, user_id, page_type, page_reference_id, permission_type, granted_by, created_at) VALUES ('c77996d8-f86d-44a4-9071-2e38bb97c128', '550e8400-e29b-41d4-a716-446655440000', 'landing', NULL, 'admin', '550e8400-e29b-41d4-a716-446655440000', '2025-08-24 12:28:51.052969+05:30');
INSERT INTO public.content_permissions (id, user_id, page_type, page_reference_id, permission_type, granted_by, created_at) VALUES ('b9f052b6-6d60-49bf-a15b-76b788aabde1', '550e8400-e29b-41d4-a716-446655440001', 'landing', NULL, 'admin', '550e8400-e29b-41d4-a716-446655440001', '2025-08-24 12:28:51.052969+05:30');
INSERT INTO public.content_permissions (id, user_id, page_type, page_reference_id, permission_type, granted_by, created_at) VALUES ('aae61912-59a5-4e75-93b7-aa79887b1f99', '550e8400-e29b-41d4-a716-446655440042', 'landing', NULL, 'admin', '550e8400-e29b-41d4-a716-446655440042', '2025-08-24 12:28:51.052969+05:30');
INSERT INTO public.content_permissions (id, user_id, page_type, page_reference_id, permission_type, granted_by, created_at) VALUES ('ccb8474b-79f9-4601-a4fc-3875c69938a5', '550e8400-e29b-41d4-a716-446655440012', 'landing', NULL, 'admin', '550e8400-e29b-41d4-a716-446655440012', '2025-08-24 12:28:51.052969+05:30');
INSERT INTO public.content_permissions (id, user_id, page_type, page_reference_id, permission_type, granted_by, created_at) VALUES ('f8d5a71d-dad4-4a52-8380-3b8a1fb6b883', '550e8400-e29b-41d4-a716-446655440022', 'landing', NULL, 'admin', '550e8400-e29b-41d4-a716-446655440022', '2025-08-24 12:28:51.052969+05:30');
INSERT INTO public.content_permissions (id, user_id, page_type, page_reference_id, permission_type, granted_by, created_at) VALUES ('78f26f0d-cbcf-4aca-b6e6-d5fcf5b38941', '550e8400-e29b-41d4-a716-446655440032', 'landing', NULL, 'admin', '550e8400-e29b-41d4-a716-446655440032', '2025-08-24 12:28:51.052969+05:30');
INSERT INTO public.content_permissions (id, user_id, page_type, page_reference_id, permission_type, granted_by, created_at) VALUES ('5118fd6d-1a57-43e7-8f41-248c4b20cdfc', '21a95efa-ccfa-4c4c-af7f-50cfa0a35053', 'landing', NULL, 'admin', '21a95efa-ccfa-4c4c-af7f-50cfa0a35053', '2025-08-24 12:28:51.052969+05:30');
INSERT INTO public.content_permissions (id, user_id, page_type, page_reference_id, permission_type, granted_by, created_at) VALUES ('cf1d4148-910d-4909-934b-758ef94474c4', '8694ff1f-1d1e-4a7b-8ecb-eebda2c937d3', 'landing', NULL, 'admin', '8694ff1f-1d1e-4a7b-8ecb-eebda2c937d3', '2025-08-24 12:28:51.052969+05:30');
INSERT INTO public.content_permissions (id, user_id, page_type, page_reference_id, permission_type, granted_by, created_at) VALUES ('e4df01d4-176a-4631-bbe9-c4dbbe0975cc', '241f4f32-458e-410e-b2f2-6dcfda992455', 'landing', NULL, 'admin', '241f4f32-458e-410e-b2f2-6dcfda992455', '2025-08-24 12:28:51.052969+05:30');
INSERT INTO public.content_permissions (id, user_id, page_type, page_reference_id, permission_type, granted_by, created_at) VALUES ('a4cb2606-084f-475b-bf0c-ac64351a50a0', '7c36ecbe-44d3-40df-8b8b-886e5385e839', 'landing', NULL, 'admin', '7c36ecbe-44d3-40df-8b8b-886e5385e839', '2025-08-24 12:28:51.052969+05:30');
INSERT INTO public.content_permissions (id, user_id, page_type, page_reference_id, permission_type, granted_by, created_at) VALUES ('416c3fca-3009-416b-bf52-311f29211b2b', '550e8400-e29b-41d4-a716-446655440040', 'club_home', 'altogether', 'admin', '550e8400-e29b-41d4-a716-446655440040', '2025-08-24 12:28:51.059243+05:30');
INSERT INTO public.content_permissions (id, user_id, page_type, page_reference_id, permission_type, granted_by, created_at) VALUES ('a815aa7e-e212-472a-9fee-819bec720e3a', '550e8400-e29b-41d4-a716-446655440041', 'club_home', 'altogether', 'admin', '550e8400-e29b-41d4-a716-446655440041', '2025-08-24 12:28:51.059243+05:30');
INSERT INTO public.content_permissions (id, user_id, page_type, page_reference_id, permission_type, granted_by, created_at) VALUES ('b503b9ee-d1d5-43e8-8751-50bb3bdd0f44', '550e8400-e29b-41d4-a716-446655440021', 'club_home', 'aster', 'admin', '550e8400-e29b-41d4-a716-446655440021', '2025-08-24 12:28:51.059243+05:30');
INSERT INTO public.content_permissions (id, user_id, page_type, page_reference_id, permission_type, granted_by, created_at) VALUES ('15ec78dd-d8b4-400d-b425-1d307f54a922', '550e8400-e29b-41d4-a716-446655440030', 'club_home', 'achievers', 'admin', '550e8400-e29b-41d4-a716-446655440030', '2025-08-24 12:28:51.059243+05:30');
INSERT INTO public.content_permissions (id, user_id, page_type, page_reference_id, permission_type, granted_by, created_at) VALUES ('31994e60-1fb1-488f-a7b0-d7cd2c727ff9', '550e8400-e29b-41d4-a716-446655440031', 'club_home', 'achievers', 'admin', '550e8400-e29b-41d4-a716-446655440031', '2025-08-24 12:28:51.059243+05:30');
INSERT INTO public.content_permissions (id, user_id, page_type, page_reference_id, permission_type, granted_by, created_at) VALUES ('368e78de-1382-432a-bd95-5f0ebec0998f', '550e8400-e29b-41d4-a716-446655440011', 'club_home', 'ascend', 'admin', '550e8400-e29b-41d4-a716-446655440011', '2025-08-24 12:28:51.059243+05:30');
INSERT INTO public.content_permissions (id, user_id, page_type, page_reference_id, permission_type, granted_by, created_at) VALUES ('0f350f15-e5b9-48a9-8453-cdb0028cf13a', '550e8400-e29b-41d4-a716-446655440010', 'club_home', 'ascend', 'admin', '550e8400-e29b-41d4-a716-446655440010', '2025-08-24 12:28:51.059243+05:30');
INSERT INTO public.content_permissions (id, user_id, page_type, page_reference_id, permission_type, granted_by, created_at) VALUES ('cbf8fbaa-0d08-4d45-a1b7-103f6e6320d8', '550e8400-e29b-41d4-a716-446655440020', 'club_home', 'aster', 'admin', '550e8400-e29b-41d4-a716-446655440020', '2025-08-24 12:28:51.059243+05:30');


--
-- PostgreSQL database dump complete
--

