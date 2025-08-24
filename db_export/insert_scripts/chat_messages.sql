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
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.chat_messages (id, room_id, user_id, message, message_type, file_url, created_at, reply_to_message_id, is_edited, reply_to, sender_id, content, is_encrypted, updated_at, attachments, message_images, reactions, thread_id, edited_at, edited_by, can_edit_until) VALUES ('a0789d34-6a64-4874-baaa-24ac43577531', '550e8400-1000-41d4-a716-446655440002', NULL, 'hey', 'text', NULL, '2025-08-21 00:52:32.440217+05:30', NULL, false, NULL, '550e8400-e29b-41d4-a716-446655440020', 'hey', false, NULL, '[]', '[]', '{}', NULL, NULL, NULL, NULL);
INSERT INTO public.chat_messages (id, room_id, user_id, message, message_type, file_url, created_at, reply_to_message_id, is_edited, reply_to, sender_id, content, is_encrypted, updated_at, attachments, message_images, reactions, thread_id, edited_at, edited_by, can_edit_until) VALUES ('edbaf64d-d51e-4140-b4eb-233949f4ca9f', '550e8400-1000-41d4-a716-446655440002', NULL, '😋', 'text', NULL, '2025-08-21 00:52:39.91869+05:30', NULL, false, NULL, '550e8400-e29b-41d4-a716-446655440020', '😋', false, NULL, '[]', '[]', '{}', NULL, NULL, NULL, NULL);
INSERT INTO public.chat_messages (id, room_id, user_id, message, message_type, file_url, created_at, reply_to_message_id, is_edited, reply_to, sender_id, content, is_encrypted, updated_at, attachments, message_images, reactions, thread_id, edited_at, edited_by, can_edit_until) VALUES ('8929a131-7dfc-4956-a237-a755cd4267e4', '15dc37c8-f5fb-40c1-8529-dd2c9ccee52d', NULL, 'hi', 'text', NULL, '2025-08-21 18:29:13.538973+05:30', NULL, false, NULL, '550e8400-e29b-41d4-a716-446655440020', NULL, false, NULL, '[]', '[]', '{}', NULL, NULL, NULL, '2025-08-21 20:29:13.538+05:30');
INSERT INTO public.chat_messages (id, room_id, user_id, message, message_type, file_url, created_at, reply_to_message_id, is_edited, reply_to, sender_id, content, is_encrypted, updated_at, attachments, message_images, reactions, thread_id, edited_at, edited_by, can_edit_until) VALUES ('ba4de82b-b491-49e0-a1f1-14092b928746', '15dc37c8-f5fb-40c1-8529-dd2c9ccee52d', NULL, 'hello', 'text', NULL, '2025-08-21 18:29:33.224555+05:30', '8929a131-7dfc-4956-a237-a755cd4267e4', false, NULL, '550e8400-e29b-41d4-a716-446655440020', NULL, false, NULL, '[]', '[]', '{}', NULL, NULL, NULL, '2025-08-21 20:29:33.224+05:30');
INSERT INTO public.chat_messages (id, room_id, user_id, message, message_type, file_url, created_at, reply_to_message_id, is_edited, reply_to, sender_id, content, is_encrypted, updated_at, attachments, message_images, reactions, thread_id, edited_at, edited_by, can_edit_until) VALUES ('3cf788dc-985f-4f69-a25d-95236a126e21', '8ed523ff-8417-4ab8-adee-6e98f5e43cee', NULL, 'hi', 'text', NULL, '2025-08-24 15:13:17.364573+05:30', NULL, false, NULL, '550e8400-e29b-41d4-a716-446655440011', NULL, false, NULL, '[]', '[]', '{}', NULL, NULL, NULL, '2025-08-24 17:13:17.363+05:30');
INSERT INTO public.chat_messages (id, room_id, user_id, message, message_type, file_url, created_at, reply_to_message_id, is_edited, reply_to, sender_id, content, is_encrypted, updated_at, attachments, message_images, reactions, thread_id, edited_at, edited_by, can_edit_until) VALUES ('98880f0f-f64b-4b5a-b26a-a8098a73f25f', '069d71e7-821c-42f4-8717-7ab370052b99', NULL, 'hi', 'text', NULL, '2025-08-24 20:47:48.295113+05:30', NULL, false, NULL, 'e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb', NULL, false, NULL, '[]', '[]', '{}', NULL, NULL, NULL, '2025-08-24 22:47:48.294+05:30');
INSERT INTO public.chat_messages (id, room_id, user_id, message, message_type, file_url, created_at, reply_to_message_id, is_edited, reply_to, sender_id, content, is_encrypted, updated_at, attachments, message_images, reactions, thread_id, edited_at, edited_by, can_edit_until) VALUES ('20227221-10ce-4f5f-8dd5-75bfbc782067', '069d71e7-821c-42f4-8717-7ab370052b99', NULL, 'hi', 'text', NULL, '2025-08-24 20:47:57.462002+05:30', '98880f0f-f64b-4b5a-b26a-a8098a73f25f', false, NULL, 'e2b5c6a7-7904-4d02-bd1f-db9ffda7a4eb', NULL, false, NULL, '[]', '[]', '{}', NULL, NULL, NULL, '2025-08-24 22:47:57.461+05:30');


--
-- PostgreSQL database dump complete
--

