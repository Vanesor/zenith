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
-- Data for Name: media_files; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.media_files (id, filename, original_filename, file_size, mime_type, file_url, thumbnail_url, alt_text, description, uploaded_by, upload_context, upload_reference_id, is_public, metadata, created_at, updated_at) VALUES ('a19b9671-407d-4f77-8dc2-d0fc8a342a88', 'profiles/avatars/black pallotti_1756021695713_e8b026230f1a2a47.png', 'black pallotti.png', 37153, 'image/png', '/uploads/profiles/avatars/black pallotti_1756021695713_e8b026230f1a2a47.png', '/uploads/profiles/avatars/black pallotti_1756021695713_e8b026230f1a2a47.png', NULL, NULL, '550e8400-e29b-41d4-a716-446655440020', 'profiles', NULL, true, '{"type": "avatar", "userId": "550e8400-e29b-41d4-a716-446655440020"}', '2025-08-24 13:18:15.713+05:30', '2025-08-24 13:18:15.713+05:30');
INSERT INTO public.media_files (id, filename, original_filename, file_size, mime_type, file_url, thumbnail_url, alt_text, description, uploaded_by, upload_context, upload_reference_id, is_public, metadata, created_at, updated_at) VALUES ('cfc5feed-9381-4054-9950-39fc9a04ee73', 'profiles/avatars/zenith-logo_1756021719703_68ee879f0d3e41bf.svg', 'zenith-logo.svg', 755088, 'image/svg+xml', '/uploads/profiles/avatars/zenith-logo_1756021719703_68ee879f0d3e41bf.svg', '/uploads/profiles/avatars/zenith-logo_1756021719703_68ee879f0d3e41bf.svg', NULL, NULL, '550e8400-e29b-41d4-a716-446655440020', 'profiles', NULL, true, '{"type": "avatar", "userId": "550e8400-e29b-41d4-a716-446655440020"}', '2025-08-24 13:18:39.707+05:30', '2025-08-24 13:18:39.707+05:30');
INSERT INTO public.media_files (id, filename, original_filename, file_size, mime_type, file_url, thumbnail_url, alt_text, description, uploaded_by, upload_context, upload_reference_id, is_public, metadata, created_at, updated_at) VALUES ('34c60ceb-5117-465e-8f54-95270f2424ce', 'profiles/avatars/cd dep_1756022080753_48371a1403067f5c.png', 'cd dep.png', 23676, 'image/png', '/uploads/profiles/avatars/cd dep_1756022080753_48371a1403067f5c.png', '/uploads/profiles/avatars/cd dep_1756022080753_48371a1403067f5c.png', NULL, NULL, '550e8400-e29b-41d4-a716-446655440020', 'profiles', NULL, true, '{"type": "avatar", "userId": "550e8400-e29b-41d4-a716-446655440020"}', '2025-08-24 13:24:40.754+05:30', '2025-08-24 13:24:40.754+05:30');
INSERT INTO public.media_files (id, filename, original_filename, file_size, mime_type, file_url, thumbnail_url, alt_text, description, uploaded_by, upload_context, upload_reference_id, is_public, metadata, created_at, updated_at) VALUES ('87b6edb0-8ab9-400a-b2c5-676bb2f5255b', 'profiles/avatars/Screenshot from 2025-08-24 13-48-12_1756024176742_333e05fb871c9932.png', 'Screenshot from 2025-08-24 13-48-12.png', 312523, 'image/png', '/uploads/profiles/avatars/Screenshot from 2025-08-24 13-48-12_1756024176742_333e05fb871c9932.png', '/uploads/profiles/avatars/Screenshot from 2025-08-24 13-48-12_1756024176742_333e05fb871c9932.png', NULL, NULL, '550e8400-e29b-41d4-a716-446655440020', 'profiles', NULL, true, '{"type": "avatar", "userId": "550e8400-e29b-41d4-a716-446655440020"}', '2025-08-24 13:59:36.744+05:30', '2025-08-24 13:59:36.744+05:30');


--
-- PostgreSQL database dump complete
--

