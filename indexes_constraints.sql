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

SET default_tablespace = '';

--
-- Name: ai_assignment_generations ai_assignment_generations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_assignment_generations
    ADD CONSTRAINT ai_assignment_generations_pkey PRIMARY KEY (id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: assignment_attempts assignment_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_attempts
    ADD CONSTRAINT assignment_attempts_pkey PRIMARY KEY (id);


--
-- Name: assignment_audit_log assignment_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_audit_log
    ADD CONSTRAINT assignment_audit_log_pkey PRIMARY KEY (id);


--
-- Name: assignment_questions assignment_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_questions
    ADD CONSTRAINT assignment_questions_pkey PRIMARY KEY (id);


--
-- Name: assignment_submissions assignment_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_pkey PRIMARY KEY (id);


--
-- Name: assignment_templates assignment_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_templates
    ADD CONSTRAINT assignment_templates_pkey PRIMARY KEY (id);


--
-- Name: assignment_violations assignment_violations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_violations
    ADD CONSTRAINT assignment_violations_pkey PRIMARY KEY (id);


--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: carousel_slides carousel_slides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carousel_slides
    ADD CONSTRAINT carousel_slides_pkey PRIMARY KEY (id);


--
-- Name: chat_attachments chat_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_attachments
    ADD CONSTRAINT chat_attachments_pkey PRIMARY KEY (id);


--
-- Name: chat_invitations chat_invitations_invitation_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_invitations
    ADD CONSTRAINT chat_invitations_invitation_token_key UNIQUE (invitation_token);


--
-- Name: chat_invitations chat_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_invitations
    ADD CONSTRAINT chat_invitations_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: chat_room_members chat_room_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_room_members
    ADD CONSTRAINT chat_room_members_pkey PRIMARY KEY (id);


--
-- Name: chat_rooms chat_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_pkey PRIMARY KEY (id);


--
-- Name: club_members club_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.club_members
    ADD CONSTRAINT club_members_pkey PRIMARY KEY (id);


--
-- Name: club_statistics club_statistics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.club_statistics
    ADD CONSTRAINT club_statistics_pkey PRIMARY KEY (id);


--
-- Name: clubs clubs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clubs
    ADD CONSTRAINT clubs_pkey PRIMARY KEY (id);


--
-- Name: code_results code_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.code_results
    ADD CONSTRAINT code_results_pkey PRIMARY KEY (id);


--
-- Name: coding_submissions coding_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coding_submissions
    ADD CONSTRAINT coding_submissions_pkey PRIMARY KEY (id);


--
-- Name: comment_likes comment_likes_comment_id_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_comment_id_user_id_unique UNIQUE (comment_id, user_id);


--
-- Name: comment_likes comment_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: committee_members committee_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.committee_members
    ADD CONSTRAINT committee_members_pkey PRIMARY KEY (id);


--
-- Name: committee_roles committee_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.committee_roles
    ADD CONSTRAINT committee_roles_pkey PRIMARY KEY (id);


--
-- Name: committees committees_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.committees
    ADD CONSTRAINT committees_name_key UNIQUE (name);


--
-- Name: committees committees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.committees
    ADD CONSTRAINT committees_pkey PRIMARY KEY (id);


--
-- Name: content_permissions content_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_permissions
    ADD CONSTRAINT content_permissions_pkey PRIMARY KEY (id);


--
-- Name: discussion_replies discussion_replies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discussion_replies
    ADD CONSTRAINT discussion_replies_pkey PRIMARY KEY (id);


--
-- Name: discussions discussions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discussions
    ADD CONSTRAINT discussions_pkey PRIMARY KEY (id);


--
-- Name: email_logs email_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_pkey PRIMARY KEY (id);


--
-- Name: email_otps email_otps_email_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_otps
    ADD CONSTRAINT email_otps_email_type_key UNIQUE (email, type);


--
-- Name: email_otps email_otps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_otps
    ADD CONSTRAINT email_otps_pkey PRIMARY KEY (id);


--
-- Name: event_attendees event_attendees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_attendees
    ADD CONSTRAINT event_attendees_pkey PRIMARY KEY (id);


--
-- Name: event_registrations event_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: featured_events featured_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_events
    ADD CONSTRAINT featured_events_pkey PRIMARY KEY (id);


--
-- Name: likes likes_comment_user_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_comment_user_unique UNIQUE (comment_id, user_id);


--
-- Name: likes likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_pkey PRIMARY KEY (id);


--
-- Name: likes likes_post_user_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_post_user_unique UNIQUE (post_id, user_id);


--
-- Name: media_files media_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_files
    ADD CONSTRAINT media_files_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (name);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: page_content page_content_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_content
    ADD CONSTRAINT page_content_pkey PRIMARY KEY (id);


--
-- Name: post_attachments post_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_attachments
    ADD CONSTRAINT post_attachments_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: posts posts_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_slug_key UNIQUE (slug);


--
-- Name: proctoring_sessions proctoring_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proctoring_sessions
    ADD CONSTRAINT proctoring_sessions_pkey PRIMARY KEY (id);


--
-- Name: project_invitations project_invitations_invitation_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_invitations
    ADD CONSTRAINT project_invitations_invitation_token_key UNIQUE (invitation_token);


--
-- Name: project_invitations project_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_invitations
    ADD CONSTRAINT project_invitations_pkey PRIMARY KEY (id);


--
-- Name: project_members project_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: query_cache query_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.query_cache
    ADD CONSTRAINT query_cache_pkey PRIMARY KEY (cache_key);


--
-- Name: question_media question_media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_media
    ADD CONSTRAINT question_media_pkey PRIMARY KEY (id);


--
-- Name: question_options question_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_options
    ADD CONSTRAINT question_options_pkey PRIMARY KEY (id);


--
-- Name: question_responses question_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_responses
    ADD CONSTRAINT question_responses_pkey PRIMARY KEY (id);


--
-- Name: security_events security_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_events
    ADD CONSTRAINT security_events_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key UNIQUE (token);


--
-- Name: submission_attachments submission_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submission_attachments
    ADD CONSTRAINT submission_attachments_pkey PRIMARY KEY (id);


--
-- Name: system_statistics system_statistics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_statistics
    ADD CONSTRAINT system_statistics_pkey PRIMARY KEY (id);


--
-- Name: task_activity task_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_activity
    ADD CONSTRAINT task_activity_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: team_cards team_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_cards
    ADD CONSTRAINT team_cards_pkey PRIMARY KEY (id);


--
-- Name: trusted_devices trusted_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trusted_devices
    ADD CONSTRAINT trusted_devices_pkey PRIMARY KEY (id);


--
-- Name: likes unique_post_user_like; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT unique_post_user_like UNIQUE (post_id, user_id);


--
-- Name: projects unique_project_key_club; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT unique_project_key_club UNIQUE (club_id, project_key);


--
-- Name: project_members unique_project_member; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT unique_project_member UNIQUE (project_id, user_id);


--
-- Name: tasks unique_task_key_project; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT unique_task_key_project UNIQUE (project_id, task_key);


--
-- Name: user_activities user_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activities
    ADD CONSTRAINT user_activities_pkey PRIMARY KEY (id);


--
-- Name: user_badges user_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_ai_generations_assignment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_generations_assignment_id ON public.ai_assignment_generations USING btree (generated_assignment_id);


--
-- Name: idx_ai_generations_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_generations_created_at ON public.ai_assignment_generations USING btree (created_at);


--
-- Name: idx_ai_generations_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_generations_status ON public.ai_assignment_generations USING btree (generation_status);


--
-- Name: idx_ai_generations_template_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_generations_template_id ON public.ai_assignment_generations USING btree (template_id);


--
-- Name: idx_assignment_attempts_assignment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_attempts_assignment_id ON public.assignment_attempts USING btree (assignment_id);


--
-- Name: idx_assignment_attempts_assignment_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_attempts_assignment_user ON public.assignment_attempts USING btree (assignment_id, user_id);


--
-- Name: idx_assignment_attempts_auto_save; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_attempts_auto_save ON public.assignment_attempts USING btree (assignment_id, user_id, last_auto_save);


--
-- Name: idx_assignment_attempts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_attempts_status ON public.assignment_attempts USING btree (status);


--
-- Name: idx_assignment_attempts_submitted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_attempts_submitted_at ON public.assignment_attempts USING btree (submitted_at);


--
-- Name: idx_assignment_attempts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_attempts_user_id ON public.assignment_attempts USING btree (user_id);


--
-- Name: idx_assignment_attempts_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_attempts_user_status ON public.assignment_attempts USING btree (user_id, status, submitted_at DESC);


--
-- Name: idx_assignment_attempts_violations; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_attempts_violations ON public.assignment_attempts USING btree (assignment_id, window_violations);


--
-- Name: idx_assignment_audit_log_assignment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_audit_log_assignment ON public.assignment_audit_log USING btree (assignment_id);


--
-- Name: idx_assignment_questions_assignment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_questions_assignment_id ON public.assignment_questions USING btree (assignment_id);


--
-- Name: idx_assignment_questions_correct_answer_jsonb; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_questions_correct_answer_jsonb ON public.assignment_questions USING gin (correct_answer);


--
-- Name: idx_assignment_questions_language_settings; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_questions_language_settings ON public.assignment_questions USING btree (code_language, allow_any_language);


--
-- Name: idx_assignment_submissions_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_assignment_submissions_unique ON public.assignment_submissions USING btree (assignment_id, user_id);


--
-- Name: idx_assignment_submissions_user_submitted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_submissions_user_submitted ON public.assignment_submissions USING btree (user_id, submitted_at DESC);


--
-- Name: idx_assignment_templates_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_templates_category ON public.assignment_templates USING btree (category);


--
-- Name: idx_assignment_templates_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_templates_created_by ON public.assignment_templates USING btree (created_by);


--
-- Name: idx_assignment_templates_difficulty; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_templates_difficulty ON public.assignment_templates USING btree (difficulty_level);


--
-- Name: idx_assignment_templates_subject; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_templates_subject ON public.assignment_templates USING btree (subject);


--
-- Name: idx_assignment_violations_submission_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_violations_submission_id ON public.assignment_violations USING btree (submission_id);


--
-- Name: idx_assignments_club_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_club_id ON public.assignments USING btree (club_id);


--
-- Name: idx_assignments_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_created_by ON public.assignments USING btree (created_by);


--
-- Name: idx_assignments_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_due_date ON public.assignments USING btree (due_date);


--
-- Name: idx_assignments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_status ON public.assignments USING btree (status);


--
-- Name: idx_assignments_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_type ON public.assignments USING btree (assignment_type);


--
-- Name: idx_attempts_assignment_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attempts_assignment_status ON public.assignment_attempts USING btree (assignment_id, status);


--
-- Name: idx_attempts_user_assignment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attempts_user_assignment ON public.assignment_attempts USING btree (user_id, assignment_id, attempt_number);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- Name: idx_audit_logs_resource_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_resource_type ON public.audit_logs USING btree (resource_type);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_carousel_slides_page; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_carousel_slides_page ON public.carousel_slides USING btree (page_type, page_reference_id);


--
-- Name: idx_chat_attachments_file_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_attachments_file_id ON public.chat_attachments USING btree (file_id);


--
-- Name: idx_chat_attachments_room_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_attachments_room_id ON public.chat_attachments USING btree (room_id);


--
-- Name: idx_chat_attachments_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_attachments_user_id ON public.chat_attachments USING btree (user_id);


--
-- Name: idx_chat_messages_can_edit_until; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_can_edit_until ON public.chat_messages USING btree (can_edit_until);


--
-- Name: idx_chat_messages_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_created_at ON public.chat_messages USING btree (created_at);


--
-- Name: idx_chat_messages_edited_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_edited_at ON public.chat_messages USING btree (edited_at);


--
-- Name: idx_chat_messages_room_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_room_id ON public.chat_messages USING btree (room_id);


--
-- Name: idx_chat_messages_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_user_id ON public.chat_messages USING btree (user_id);


--
-- Name: idx_chat_room_members_chat_room_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_room_members_chat_room_id ON public.chat_room_members USING btree (chat_room_id);


--
-- Name: idx_chat_room_members_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_room_members_user_id ON public.chat_room_members USING btree (user_id);


--
-- Name: idx_chat_rooms_profile_picture; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_rooms_profile_picture ON public.chat_rooms USING btree (profile_picture_url);


--
-- Name: idx_club_members_club_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_club_members_club_id ON public.club_members USING btree (club_id);


--
-- Name: idx_club_members_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_club_members_user_id ON public.club_members USING btree (user_id);


--
-- Name: idx_clubs_coordinator_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clubs_coordinator_id ON public.clubs USING btree (coordinator_id);


--
-- Name: idx_clubs_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clubs_type ON public.clubs USING btree (type);


--
-- Name: idx_coding_submissions_question_response_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coding_submissions_question_response_id ON public.coding_submissions USING btree (question_response_id);


--
-- Name: idx_comment_likes_comment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comment_likes_comment_id ON public.comment_likes USING btree (comment_id);


--
-- Name: idx_comment_likes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comment_likes_user_id ON public.comment_likes USING btree (user_id);


--
-- Name: idx_comments_author_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_author_id ON public.comments USING btree (author_id);


--
-- Name: idx_comments_post_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_post_id ON public.comments USING btree (post_id);


--
-- Name: idx_committee_members_committee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_committee_members_committee_id ON public.committee_members USING btree (committee_id);


--
-- Name: idx_committee_members_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_committee_members_user_id ON public.committee_members USING btree (user_id);


--
-- Name: idx_committee_roles_committee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_committee_roles_committee_id ON public.committee_roles USING btree (committee_id);


--
-- Name: idx_content_permissions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_permissions_user ON public.content_permissions USING btree (user_id, page_type, page_reference_id);


--
-- Name: idx_email_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_created_at ON public.email_logs USING btree (created_at);


--
-- Name: idx_email_logs_recipient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_recipient ON public.email_logs USING btree (recipient);


--
-- Name: idx_email_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_status ON public.email_logs USING btree (status);


--
-- Name: idx_email_otps_email_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_otps_email_type ON public.email_otps USING btree (email, type);


--
-- Name: idx_email_otps_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_otps_expires_at ON public.email_otps USING btree (expires_at);


--
-- Name: idx_event_attendees_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_attendees_event_id ON public.event_attendees USING btree (event_id);


--
-- Name: idx_event_attendees_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_attendees_user_id ON public.event_attendees USING btree (user_id);


--
-- Name: idx_events_club_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_club_id ON public.events USING btree (club_id);


--
-- Name: idx_events_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_created_by ON public.events USING btree (created_by);


--
-- Name: idx_events_event_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_event_date ON public.events USING btree (event_date);


--
-- Name: idx_featured_events_page; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_events_page ON public.featured_events USING btree (page_type, page_reference_id);


--
-- Name: idx_likes_post_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_likes_post_id ON public.likes USING btree (post_id);


--
-- Name: idx_likes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_likes_user_id ON public.likes USING btree (user_id);


--
-- Name: idx_media_files_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_media_files_created_at ON public.media_files USING btree (created_at);


--
-- Name: idx_media_files_upload_context; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_media_files_upload_context ON public.media_files USING btree (upload_context);


--
-- Name: idx_media_files_upload_reference; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_media_files_upload_reference ON public.media_files USING btree (upload_reference_id, upload_context);


--
-- Name: idx_media_files_uploaded_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_media_files_uploaded_by ON public.media_files USING btree (uploaded_by);


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at);


--
-- Name: idx_notifications_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_read ON public.notifications USING btree (read);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_page_content_page; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_content_page ON public.page_content USING btree (page_type, page_reference_id);


--
-- Name: idx_post_attachments_media_file_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_attachments_media_file_id ON public.post_attachments USING btree (media_file_id);


--
-- Name: idx_post_attachments_post_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_attachments_post_id ON public.post_attachments USING btree (post_id);


--
-- Name: idx_post_attachments_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_attachments_type ON public.post_attachments USING btree (attachment_type);


--
-- Name: idx_posts_author_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_author_id ON public.posts USING btree (author_id);


--
-- Name: idx_posts_club_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_club_id ON public.posts USING btree (club_id);


--
-- Name: idx_posts_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_created_at ON public.posts USING btree (created_at);


--
-- Name: idx_posts_search_vector; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_search_vector ON public.posts USING gin (search_vector);


--
-- Name: idx_posts_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_slug ON public.posts USING btree (slug);


--
-- Name: idx_posts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_status ON public.posts USING btree (status);


--
-- Name: idx_project_invitations_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_invitations_email ON public.project_invitations USING btree (email);


--
-- Name: idx_project_invitations_keys; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_invitations_keys ON public.project_invitations USING btree (project_key, access_key);


--
-- Name: idx_project_members_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_members_project_id ON public.project_members USING btree (project_id);


--
-- Name: idx_project_members_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_members_user_id ON public.project_members USING btree (user_id);


--
-- Name: idx_projects_club_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_club_id ON public.projects USING btree (club_id);


--
-- Name: idx_projects_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_created_by ON public.projects USING btree (created_by);


--
-- Name: idx_projects_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_status ON public.projects USING btree (status);


--
-- Name: idx_question_responses_question_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_question_responses_question_id ON public.question_responses USING btree (question_id);


--
-- Name: idx_question_responses_submission_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_question_responses_submission_id ON public.question_responses USING btree (submission_id);


--
-- Name: idx_questions_assignment_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_questions_assignment_order ON public.assignment_questions USING btree (assignment_id, question_order);


--
-- Name: idx_questions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_questions_type ON public.assignment_questions USING btree (question_type);


--
-- Name: idx_security_events_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_events_event_type ON public.security_events USING btree (event_type);


--
-- Name: idx_security_events_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_events_user_id ON public.security_events USING btree (user_id);


--
-- Name: idx_sessions_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_expires_at ON public.sessions USING btree (expires_at);


--
-- Name: idx_sessions_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_token ON public.sessions USING btree (token);


--
-- Name: idx_sessions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_user_id ON public.sessions USING btree (user_id);


--
-- Name: idx_submission_attachments_media_file_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submission_attachments_media_file_id ON public.submission_attachments USING btree (media_file_id);


--
-- Name: idx_submission_attachments_submission_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submission_attachments_submission_id ON public.submission_attachments USING btree (submission_id);


--
-- Name: idx_submissions_assignment_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_assignment_status ON public.assignment_submissions USING btree (assignment_id, status);


--
-- Name: idx_submissions_status_submitted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_status_submitted ON public.assignment_submissions USING btree (status, submitted_at DESC);


--
-- Name: idx_submissions_user_submitted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_user_submitted ON public.assignment_submissions USING btree (user_id, submitted_at DESC);


--
-- Name: idx_tasks_assignee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_assignee_id ON public.tasks USING btree (assignee_id);


--
-- Name: idx_tasks_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_due_date ON public.tasks USING btree (due_date);


--
-- Name: idx_tasks_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_project_id ON public.tasks USING btree (project_id);


--
-- Name: idx_tasks_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_status ON public.tasks USING btree (status);


--
-- Name: idx_team_cards_page; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_cards_page ON public.team_cards USING btree (page_type, page_reference_id);


--
-- Name: idx_trusted_devices_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trusted_devices_user_id ON public.trusted_devices USING btree (user_id);


--
-- Name: idx_user_activities_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_activities_created_at ON public.user_activities USING btree (created_at);


--
-- Name: idx_user_activities_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_activities_user_id ON public.user_activities USING btree (user_id);


--
-- Name: idx_users_club_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_club_id ON public.users USING btree (club_id);


--
-- Name: idx_users_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_created_at ON public.users USING btree (created_at);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_last_activity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_last_activity ON public.users USING btree (last_activity);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: posts posts_search_vector_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER posts_search_vector_update BEFORE INSERT OR UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_post_search_vector();


--
-- Name: tasks tasks_generate_key; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tasks_generate_key BEFORE INSERT ON public.tasks FOR EACH ROW WHEN (((new.task_key IS NULL) OR ((new.task_key)::text = ''::text))) EXECUTE FUNCTION public.generate_task_key();


--
-- Name: tasks tasks_update_project_progress; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tasks_update_project_progress AFTER INSERT OR DELETE OR UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_project_progress();


--
-- Name: assignments update_assignments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: carousel_slides update_carousel_slides_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_carousel_slides_updated_at BEFORE UPDATE ON public.carousel_slides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: clubs update_clubs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON public.clubs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: comments update_comments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: committee_members update_committee_members_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_committee_members_updated_at BEFORE UPDATE ON public.committee_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: committee_roles update_committee_roles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_committee_roles_updated_at BEFORE UPDATE ON public.committee_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: committees update_committees_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_committees_updated_at BEFORE UPDATE ON public.committees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: events update_events_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: featured_events update_featured_events_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_featured_events_updated_at BEFORE UPDATE ON public.featured_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: page_content update_page_content_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_page_content_updated_at BEFORE UPDATE ON public.page_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: posts update_posts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: projects update_projects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tasks update_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: team_cards update_team_cards_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_team_cards_updated_at BEFORE UPDATE ON public.team_cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: carousel_slides carousel_slides_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carousel_slides
    ADD CONSTRAINT carousel_slides_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: chat_attachments chat_attachments_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_attachments
    ADD CONSTRAINT chat_attachments_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.media_files(id) ON DELETE CASCADE;


--
-- Name: chat_attachments chat_attachments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_attachments
    ADD CONSTRAINT chat_attachments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: comment_likes comment_likes_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- Name: comment_likes comment_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: content_permissions content_permissions_granted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_permissions
    ADD CONSTRAINT content_permissions_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.users(id);


--
-- Name: content_permissions content_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_permissions
    ADD CONSTRAINT content_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: featured_events featured_events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_events
    ADD CONSTRAINT featured_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: featured_events featured_events_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_events
    ADD CONSTRAINT featured_events_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: chat_messages fk_chat_messages_edited_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT fk_chat_messages_edited_by FOREIGN KEY (edited_by) REFERENCES public.users(id);


--
-- Name: chat_rooms fk_chat_rooms_edited_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT fk_chat_rooms_edited_by FOREIGN KEY (edited_by) REFERENCES public.users(id);


--
-- Name: likes likes_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- Name: page_content page_content_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_content
    ADD CONSTRAINT page_content_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: post_attachments post_attachments_media_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_attachments
    ADD CONSTRAINT post_attachments_media_file_id_fkey FOREIGN KEY (media_file_id) REFERENCES public.media_files(id) ON DELETE CASCADE;


--
-- Name: post_attachments post_attachments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_attachments
    ADD CONSTRAINT post_attachments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: submission_attachments submission_attachments_media_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submission_attachments
    ADD CONSTRAINT submission_attachments_media_file_id_fkey FOREIGN KEY (media_file_id) REFERENCES public.media_files(id) ON DELETE CASCADE;


--
-- Name: submission_attachments submission_attachments_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submission_attachments
    ADD CONSTRAINT submission_attachments_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.assignment_submissions(id) ON DELETE CASCADE;


--
-- Name: task_activity task_activity_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_activity
    ADD CONSTRAINT task_activity_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_activity task_activity_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_activity
    ADD CONSTRAINT task_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: team_cards team_cards_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_cards
    ADD CONSTRAINT team_cards_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

