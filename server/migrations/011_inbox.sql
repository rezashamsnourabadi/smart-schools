ALTER TABLE memberships ADD CONSTRAINT membership_user_identity UNIQUE(id,user_id);
CREATE TABLE inbox_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),sender_id uuid NOT NULL REFERENCES users(id),
 sender_membership_id uuid NOT NULL,school_id uuid REFERENCES schools(id),
 title text NOT NULL CHECK(length(title) BETWEEN 1 AND 200),body text NOT NULL CHECK(length(body) BETWEEN 1 AND 2000),
 kind text NOT NULL DEFAULT 'direct' CHECK(kind IN ('direct','support')),
 reference_id uuid,created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(sender_membership_id,sender_id) REFERENCES memberships(id,user_id)
);
CREATE TABLE inbox_recipients (
 message_id uuid NOT NULL REFERENCES inbox_messages(id),membership_id uuid NOT NULL,user_id uuid NOT NULL,
 school_id uuid REFERENCES schools(id),read_at timestamptz,sms_status text NOT NULL DEFAULT 'not_requested'
 CHECK(sms_status IN ('not_requested','queued','sent','unavailable','failed')),
 PRIMARY KEY(message_id,membership_id),FOREIGN KEY(membership_id,user_id) REFERENCES memberships(id,user_id)
);
CREATE INDEX inbox_message_recent ON inbox_messages(created_at DESC,id DESC);
CREATE INDEX inbox_recipient_member ON inbox_recipients(membership_id,message_id);
CREATE INDEX inbox_recipient_unread ON inbox_recipients(membership_id,message_id) WHERE read_at IS NULL;
ALTER TABLE inbox_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE inbox_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_recipients FORCE ROW LEVEL SECURITY;
CREATE POLICY inbox_recipient_read ON inbox_recipients FOR SELECT USING(user_id::text=current_setting('app.user_id',true) AND membership_id::text=current_setting('app.membership_id',true) OR current_setting('app.platform',true)='true');
CREATE POLICY inbox_message_read ON inbox_messages FOR SELECT USING(sender_id::text=current_setting('app.user_id',true) AND sender_membership_id::text=current_setting('app.membership_id',true) OR EXISTS(SELECT 1 FROM inbox_recipients r WHERE r.message_id=inbox_messages.id AND r.user_id::text=current_setting('app.user_id',true) AND r.membership_id::text=current_setting('app.membership_id',true)));
CREATE POLICY inbox_message_insert ON inbox_messages FOR INSERT WITH CHECK(sender_id::text=current_setting('app.user_id',true) AND sender_membership_id::text=current_setting('app.membership_id',true));
CREATE POLICY inbox_recipient_insert ON inbox_recipients FOR INSERT WITH CHECK((school_id::text=current_setting('app.school_id',true) OR current_setting('app.platform',true)='true') AND EXISTS(SELECT 1 FROM inbox_messages m WHERE m.id=message_id AND m.sender_id::text=current_setting('app.user_id',true) AND m.sender_membership_id::text=current_setting('app.membership_id',true)));
CREATE POLICY inbox_recipient_update ON inbox_recipients FOR UPDATE USING(user_id::text=current_setting('app.user_id',true) AND membership_id::text=current_setting('app.membership_id',true) OR current_setting('app.platform',true)='true') WITH CHECK(user_id::text=current_setting('app.user_id',true) AND membership_id::text=current_setting('app.membership_id',true) OR current_setting('app.platform',true)='true');
