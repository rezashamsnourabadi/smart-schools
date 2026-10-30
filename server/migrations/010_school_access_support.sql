CREATE TABLE school_access_policies (
 school_id uuid PRIMARY KEY REFERENCES schools(id),
 mode text NOT NULL CHECK(mode IN ('active','read_only','suspended')),
 reason text NOT NULL DEFAULT '', expires_at timestamptz,
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 updated_by uuid NOT NULL REFERENCES users(id), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(mode='active' OR length(trim(reason))>0)
);
ALTER TABLE school_access_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_access_policies FORCE ROW LEVEL SECURITY;
CREATE POLICY school_access_read ON school_access_policies FOR SELECT USING(school_id::text=current_setting('app.school_id',true) OR current_setting('app.platform',true)='true');
CREATE POLICY school_access_manage ON school_access_policies FOR ALL USING(current_setting('app.platform',true)='true') WITH CHECK(current_setting('app.platform',true)='true');
CREATE TABLE school_access_history (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),school_id uuid NOT NULL REFERENCES schools(id),
 mode text NOT NULL CHECK(mode IN ('active','read_only','suspended')),reason text NOT NULL,
 expires_at timestamptz,version integer NOT NULL,changed_by uuid NOT NULL REFERENCES users(id),created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX school_access_history_school ON school_access_history(school_id,created_at DESC,id);
ALTER TABLE school_access_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_access_history FORCE ROW LEVEL SECURITY;
CREATE POLICY school_access_history_platform ON school_access_history USING(current_setting('app.platform',true)='true') WITH CHECK(current_setting('app.platform',true)='true');
CREATE TABLE support_tickets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),school_id uuid NOT NULL REFERENCES schools(id),
 owner_id uuid NOT NULL REFERENCES users(id),membership_id uuid NOT NULL REFERENCES memberships(id),
 title text NOT NULL CHECK(length(title) BETWEEN 1 AND 200),
 category text NOT NULL CHECK(category IN ('technical','education','finance','access')),
 priority text NOT NULL CHECK(priority IN ('normal','high')),
 status text NOT NULL DEFAULT 'new' CHECK(status IN ('new','in_progress','waiting_user','resolved','closed')),
 version integer NOT NULL DEFAULT 1,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(school_id,id)
);
CREATE INDEX support_ticket_owner ON support_tickets(school_id,owner_id,updated_at DESC,id);
CREATE INDEX support_ticket_platform ON support_tickets(status,updated_at DESC,id);
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets FORCE ROW LEVEL SECURITY;
CREATE POLICY support_ticket_scope ON support_tickets USING(current_setting('app.platform',true)='true' OR school_id::text=current_setting('app.school_id',true) AND owner_id::text=current_setting('app.user_id',true)) WITH CHECK(current_setting('app.platform',true)='true' OR school_id::text=current_setting('app.school_id',true) AND owner_id::text=current_setting('app.user_id',true));
CREATE TABLE support_replies (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),school_id uuid NOT NULL,ticket_id uuid NOT NULL,
 author_id uuid NOT NULL REFERENCES users(id),is_staff boolean NOT NULL,
 message text NOT NULL CHECK(length(message) BETWEEN 1 AND 5000),created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(school_id,ticket_id) REFERENCES support_tickets(school_id,id)
);
CREATE INDEX support_reply_ticket ON support_replies(school_id,ticket_id,created_at DESC,id);
ALTER TABLE support_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_replies FORCE ROW LEVEL SECURITY;
CREATE POLICY support_reply_scope ON support_replies USING(current_setting('app.platform',true)='true' OR school_id::text=current_setting('app.school_id',true) AND EXISTS(SELECT 1 FROM support_tickets t WHERE t.id=ticket_id AND t.school_id=support_replies.school_id AND t.owner_id::text=current_setting('app.user_id',true))) WITH CHECK(current_setting('app.platform',true)='true' OR school_id::text=current_setting('app.school_id',true) AND author_id::text=current_setting('app.user_id',true) AND NOT is_staff AND EXISTS(SELECT 1 FROM support_tickets t WHERE t.id=ticket_id AND t.school_id=support_replies.school_id AND t.owner_id::text=current_setting('app.user_id',true)));
