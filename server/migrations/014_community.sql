CREATE TABLE school_feedback (
 id uuid PRIMARY KEY,school_id uuid NOT NULL REFERENCES schools(id),owner_id uuid NOT NULL REFERENCES users(id),
 membership_id uuid NOT NULL REFERENCES memberships(id),title text NOT NULL,body text NOT NULL,
 anonymous boolean NOT NULL DEFAULT true,status text NOT NULL DEFAULT 'new' CHECK(status IN ('new','reviewed')),
 reply text NOT NULL DEFAULT '',version integer NOT NULL DEFAULT 1,created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(membership_id,owner_id) REFERENCES memberships(id,user_id)
);
CREATE INDEX school_feedback_list ON school_feedback(school_id,created_at DESC,id);
CREATE TABLE school_surveys (
 id uuid PRIMARY KEY,school_id uuid NOT NULL REFERENCES schools(id),year_id uuid NOT NULL,
 title text NOT NULL,description text NOT NULL,questions jsonb NOT NULL,audience text[] NOT NULL,class_ids uuid[] NOT NULL,
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','closed')),version integer NOT NULL DEFAULT 1,
 created_by uuid NOT NULL REFERENCES users(id),created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(school_id,id),FOREIGN KEY(school_id,year_id) REFERENCES academic_years(school_id,id)
);
CREATE TABLE survey_recipients (
 school_id uuid NOT NULL,survey_id uuid NOT NULL,membership_id uuid NOT NULL REFERENCES memberships(id),
 PRIMARY KEY(survey_id,membership_id),FOREIGN KEY(school_id,survey_id) REFERENCES school_surveys(school_id,id)
);
CREATE TABLE survey_responses (
 school_id uuid NOT NULL,survey_id uuid NOT NULL,membership_id uuid NOT NULL,user_id uuid NOT NULL REFERENCES users(id),
 answers jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(survey_id,membership_id),
 FOREIGN KEY(survey_id,membership_id) REFERENCES survey_recipients(survey_id,membership_id),
 FOREIGN KEY(school_id,survey_id) REFERENCES school_surveys(school_id,id)
);
CREATE INDEX school_surveys_list ON school_surveys(school_id,year_id,created_at DESC,id);
ALTER TABLE school_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_feedback FORCE ROW LEVEL SECURITY;
ALTER TABLE school_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_surveys FORCE ROW LEVEL SECURITY;
ALTER TABLE survey_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_recipients FORCE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses FORCE ROW LEVEL SECURITY;
CREATE POLICY feedback_scope ON school_feedback USING(school_id::text=current_setting('app.school_id',true) OR current_setting('app.platform',true)='true');
CREATE POLICY survey_scope ON school_surveys USING(school_id::text=current_setting('app.school_id',true) OR current_setting('app.platform',true)='true');
CREATE POLICY survey_recipient_scope ON survey_recipients USING(school_id::text=current_setting('app.school_id',true) OR current_setting('app.platform',true)='true');
CREATE POLICY survey_response_scope ON survey_responses USING(school_id::text=current_setting('app.school_id',true) OR current_setting('app.platform',true)='true');

ALTER TABLE inbox_messages DROP CONSTRAINT inbox_messages_kind_check;
ALTER TABLE inbox_messages ADD CONSTRAINT inbox_messages_kind_check CHECK(kind IN ('direct','support','announcement','survey'));
