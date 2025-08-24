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
-- Data for Name: committee_roles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.committee_roles (id, committee_id, name, description, hierarchy, permissions, created_at, updated_at) VALUES ('f90bd115-48a4-4c90-9ef3-74b5778eb82b', '8f28c85b-1315-4583-923a-a827f9507a00', 'President', 'Overall leadership and strategic direction', 1, '{MANAGE_ALL,APPROVE_EVENTS,MANAGE_MEMBERS,APPROVE_BUDGETS,SYSTEM_ADMIN}', '2025-08-13 23:54:14.189+05:30', '2025-08-13 23:54:14.189+05:30');
INSERT INTO public.committee_roles (id, committee_id, name, description, hierarchy, permissions, created_at, updated_at) VALUES ('f0e6549c-bb74-4a24-955d-c9666db048e1', '8f28c85b-1315-4583-923a-a827f9507a00', 'Vice President', 'Support president and lead special initiatives', 2, '{MANAGE_EVENTS,MANAGE_MEMBERS,APPROVE_CONTENT,COORDINATE_ACTIVITIES}', '2025-08-13 23:54:14.264+05:30', '2025-08-13 23:54:14.264+05:30');
INSERT INTO public.committee_roles (id, committee_id, name, description, hierarchy, permissions, created_at, updated_at) VALUES ('8aee812a-b63e-403c-a7fc-d77e050a9138', '8f28c85b-1315-4583-923a-a827f9507a00', 'Innovation Head', 'Lead technical initiatives and innovation projects', 3, '{MANAGE_TECH_EVENTS,APPROVE_PROJECTS,COORDINATE_WORKSHOPS,MANAGE_RESOURCES}', '2025-08-13 23:54:14.309+05:30', '2025-08-13 23:54:14.309+05:30');
INSERT INTO public.committee_roles (id, committee_id, name, description, hierarchy, permissions, created_at, updated_at) VALUES ('a3c8888c-77ae-4b5f-9cd2-cdff1afbe4e3', '8f28c85b-1315-4583-923a-a827f9507a00', 'Secretary', 'Maintain records and manage communications', 4, '{MANAGE_COMMUNICATIONS,MAINTAIN_RECORDS,SCHEDULE_MEETINGS,COORDINATE_LOGISTICS}', '2025-08-13 23:54:14.369+05:30', '2025-08-13 23:54:14.369+05:30');
INSERT INTO public.committee_roles (id, committee_id, name, description, hierarchy, permissions, created_at, updated_at) VALUES ('84fc77f3-d148-4e12-8ebb-ff301cee2e49', '8f28c85b-1315-4583-923a-a827f9507a00', 'Outreach Coordinator', 'Manage external relations and partnerships', 5, '{MANAGE_PARTNERSHIPS,COORDINATE_OUTREACH,MANAGE_PUBLICITY,ORGANIZE_COLLABORATIONS}', '2025-08-13 23:54:14.419+05:30', '2025-08-13 23:54:14.419+05:30');
INSERT INTO public.committee_roles (id, committee_id, name, description, hierarchy, permissions, created_at, updated_at) VALUES ('b52c4c16-3d76-4a3b-ae5d-407d26cac92f', '8f28c85b-1315-4583-923a-a827f9507a00', 'Media Coordinator', 'Manage social media and content creation', 6, '{MANAGE_SOCIAL_MEDIA,CREATE_CONTENT,MANAGE_PUBLICITY,COORDINATE_MEDIA}', '2025-08-13 23:54:14.469+05:30', '2025-08-13 23:54:14.469+05:30');
INSERT INTO public.committee_roles (id, committee_id, name, description, hierarchy, permissions, created_at, updated_at) VALUES ('32708d72-6fea-4c91-93d8-49072a1f481a', '8f28c85b-1315-4583-923a-a827f9507a00', 'Treasurer', 'Manage finances and budget planning', 7, '{MANAGE_FINANCES,TRACK_BUDGETS,APPROVE_EXPENSES,MAINTAIN_ACCOUNTS}', '2025-08-13 23:54:14.509+05:30', '2025-08-13 23:54:14.509+05:30');
INSERT INTO public.committee_roles (id, committee_id, name, description, hierarchy, permissions, created_at, updated_at) VALUES ('bd8838dc-d4db-4bf9-a483-fc970b01d35a', '9e2a45e8-88e0-4998-bbc1-1ab68cf9f989', 'President', 'President of the Student Executive Committee', 1, '{all_permissions,admin_access,committee_management}', '2025-08-20 11:30:17.917+05:30', '2025-08-20 11:30:17.917+05:30');
INSERT INTO public.committee_roles (id, committee_id, name, description, hierarchy, permissions, created_at, updated_at) VALUES ('61066b5a-6b0c-411a-83fd-ea3fa81893b5', '9e2a45e8-88e0-4998-bbc1-1ab68cf9f989', 'Vice President', 'Vice President of the Student Executive Committee', 2, '{executive_access,committee_management,event_management}', '2025-08-20 11:30:17.917+05:30', '2025-08-20 11:30:17.917+05:30');
INSERT INTO public.committee_roles (id, committee_id, name, description, hierarchy, permissions, created_at, updated_at) VALUES ('60880bea-c878-4fe6-9388-8b4384ad2a59', '9e2a45e8-88e0-4998-bbc1-1ab68cf9f989', 'Secretary', 'Secretary of the Student Executive Committee', 3, '{documentation,meeting_management,communication}', '2025-08-20 11:30:17.917+05:30', '2025-08-20 11:30:17.917+05:30');
INSERT INTO public.committee_roles (id, committee_id, name, description, hierarchy, permissions, created_at, updated_at) VALUES ('885e95e5-f639-43d9-b5a0-c1fa555e0b24', '9e2a45e8-88e0-4998-bbc1-1ab68cf9f989', 'Treasurer', 'Treasurer of the Student Executive Committee', 4, '{financial_management,budget_control,expense_tracking}', '2025-08-20 11:30:17.917+05:30', '2025-08-20 11:30:17.917+05:30');
INSERT INTO public.committee_roles (id, committee_id, name, description, hierarchy, permissions, created_at, updated_at) VALUES ('e74c3e2f-3bdf-40e5-9bc2-a2ca07d81b1e', '9e2a45e8-88e0-4998-bbc1-1ab68cf9f989', 'Innovation Head', 'Innovation Head of the Student Executive Committee', 5, '{innovation_projects,technology_initiatives,research_coordination}', '2025-08-20 11:30:17.917+05:30', '2025-08-20 11:30:17.917+05:30');
INSERT INTO public.committee_roles (id, committee_id, name, description, hierarchy, permissions, created_at, updated_at) VALUES ('728861c2-df1f-47b2-81b4-d892b4ee819e', '9e2a45e8-88e0-4998-bbc1-1ab68cf9f989', 'Media Head', 'Media Head of the Student Executive Committee', 6, '{media_management,social_media,publicity,content_creation}', '2025-08-20 11:30:17.917+05:30', '2025-08-20 11:30:17.917+05:30');


--
-- PostgreSQL database dump complete
--

