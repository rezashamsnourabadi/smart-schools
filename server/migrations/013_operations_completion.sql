ALTER TABLE support_tickets ADD COLUMN assigned_to uuid REFERENCES users(id);
CREATE INDEX support_assignee ON support_tickets(assigned_to,status,updated_at DESC);
CREATE TABLE support_attachments (
 id uuid PRIMARY KEY,school_id uuid NOT NULL,ticket_id uuid NOT NULL,author_id uuid NOT NULL REFERENCES users(id),
 name text NOT NULL,mime text NOT NULL,size integer NOT NULL CHECK(size BETWEEN 1 AND 2097152),storage_key text NOT NULL UNIQUE,
 upload_key text NOT NULL,digest text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(school_id,ticket_id) REFERENCES support_tickets(school_id,id),UNIQUE(ticket_id,author_id,upload_key)
);
ALTER TABLE support_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_attachments FORCE ROW LEVEL SECURITY;
CREATE POLICY support_attachment_scope ON support_attachments USING(current_setting('app.platform',true)='true' OR school_id::text=current_setting('app.school_id',true) AND EXISTS(SELECT 1 FROM support_tickets t WHERE t.id=ticket_id AND t.school_id=support_attachments.school_id AND t.owner_id::text=current_setting('app.user_id',true))) WITH CHECK((current_setting('app.platform',true)='true' OR school_id::text=current_setting('app.school_id',true) AND EXISTS(SELECT 1 FROM support_tickets t WHERE t.id=ticket_id AND t.owner_id::text=current_setting('app.user_id',true))) AND author_id::text=current_setting('app.user_id',true));
ALTER TABLE inbox_messages DROP CONSTRAINT inbox_messages_kind_check;
ALTER TABLE inbox_messages ADD CONSTRAINT inbox_messages_kind_check CHECK(kind IN ('direct','support','announcement'));
ALTER TABLE memberships ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
CREATE TABLE announcement_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),message_id uuid NOT NULL UNIQUE REFERENCES inbox_messages(id),
 announcement_id uuid NOT NULL,school_id uuid REFERENCES schools(id),year_id uuid,
 author_id uuid NOT NULL REFERENCES users(id),membership_id uuid NOT NULL REFERENCES memberships(id),
 audience text NOT NULL CHECK(audience IN ('all','teachers','parents','students')),cursor uuid,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','completed','cancelled')),available_at timestamptz NOT NULL DEFAULT now(),
 delivered integer NOT NULL DEFAULT 0,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX announcement_pending ON announcement_jobs(created_at,id) WHERE status='pending';
ALTER TABLE announcement_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_jobs FORCE ROW LEVEL SECURITY;
CREATE POLICY announcement_job_scope ON announcement_jobs USING(current_setting('app.platform',true)='true' OR author_id::text=current_setting('app.user_id',true) AND membership_id::text=current_setting('app.membership_id',true)) WITH CHECK(author_id::text=current_setting('app.user_id',true) AND membership_id::text=current_setting('app.membership_id',true) AND (school_id::text=current_setting('app.school_id',true) OR current_setting('app.platform',true)='true'));
CREATE TABLE analytics_retention (
 id boolean PRIMARY KEY DEFAULT true CHECK(id),days integer NOT NULL DEFAULT 180 CHECK(days BETWEEN 90 AND 730),
 enabled boolean NOT NULL DEFAULT true,version integer NOT NULL DEFAULT 1,updated_by uuid REFERENCES users(id),
 last_run timestamptz,next_run timestamptz NOT NULL DEFAULT now(),deleted bigint NOT NULL DEFAULT 0
);
INSERT INTO analytics_retention(id) VALUES(true);
CREATE POLICY analytics_retention_delete ON analytics_events FOR DELETE USING(current_setting('app.platform',true)='true');
CREATE TABLE bale_links (user_id uuid PRIMARY KEY REFERENCES users(id),chat_id text NOT NULL UNIQUE,verified_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE bale_pairings (user_id uuid PRIMARY KEY REFERENCES users(id),code_hash text NOT NULL UNIQUE,expires_at timestamptz NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE inbox_recipients ADD COLUMN bale_status text NOT NULL DEFAULT 'not_requested' CHECK(bale_status IN ('not_requested','queued','sent','unavailable','failed'));
