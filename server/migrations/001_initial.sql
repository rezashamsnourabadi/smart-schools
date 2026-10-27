CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), username text NOT NULL UNIQUE,
 name text NOT NULL, phone text NOT NULL, password_hash text,
 active boolean NOT NULL DEFAULT true, phone_verified boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE schools (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), data jsonb NOT NULL, version integer NOT NULL DEFAULT 1);
CREATE TABLE memberships (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id),
 school_id uuid REFERENCES schools(id), role text NOT NULL CHECK(role IN ('platform_admin','principal','vice_principal','teacher','student','parent')),
 profile_id uuid, student_id uuid, permissions jsonb NOT NULL DEFAULT '{}', active boolean NOT NULL DEFAULT true,
 CHECK ((role='platform_admin')=(school_id IS NULL))
);
CREATE UNIQUE INDEX membership_identity ON memberships(user_id,COALESCE(school_id,'00000000-0000-0000-0000-000000000000'),role,COALESCE(student_id,'00000000-0000-0000-0000-000000000000'));
CREATE INDEX membership_user ON memberships(user_id) WHERE active;
CREATE TABLE sessions (
 id text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id), csrf text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), last_seen timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL, mfa boolean NOT NULL DEFAULT false
);
CREATE INDEX sessions_expiry ON sessions(expires_at);
CREATE TABLE challenges (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id), purpose text NOT NULL,
 code_hash text NOT NULL, attempts integer NOT NULL DEFAULT 0, expires_at timestamptz NOT NULL,
 consumed boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE academic_years (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid NOT NULL REFERENCES schools(id),
 data jsonb NOT NULL, version integer NOT NULL DEFAULT 1, UNIQUE(school_id,id)
);
CREATE UNIQUE INDEX one_current_year ON academic_years(school_id) WHERE (data->>'isCurrent')='true';
CREATE UNIQUE INDEX year_title ON academic_years(school_id,(data->>'title'));

-- Relational scope and foreign keys are authoritative. JSONB contains typed display/domain
-- fields, never credentials or an entire school workspace.
CREATE TABLE records (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid NOT NULL REFERENCES schools(id),
 year_id uuid NOT NULL, kind text NOT NULL CHECK(kind IN ('students','classes','teachers','vicePrincipals','schedule','attendanceSessions','grades','homework','homeworkSubmissions','exams','feeItems','announcements','questionBank','notifications')),
 class_id uuid, student_id uuid, teacher_id uuid, subject text,
 data jsonb NOT NULL, version integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(school_id,year_id,id),
 FOREIGN KEY(school_id,year_id) REFERENCES academic_years(school_id,id),
 FOREIGN KEY(school_id,year_id,class_id) REFERENCES records(school_id,year_id,id),
 FOREIGN KEY(school_id,year_id,student_id) REFERENCES records(school_id,year_id,id),
 FOREIGN KEY(school_id,year_id,teacher_id) REFERENCES records(school_id,year_id,id)
);
CREATE INDEX records_scope ON records(school_id,year_id,kind,created_at DESC,id);
CREATE INDEX records_class ON records(school_id,year_id,class_id,kind);
CREATE INDEX records_student ON records(school_id,year_id,student_id,kind);
CREATE INDEX records_teacher ON records(school_id,year_id,teacher_id,kind);
CREATE INDEX records_name ON records(school_id,year_id,kind,lower(data->>'name'));
CREATE UNIQUE INDEX student_national_code ON records(school_id,year_id,(data->>'nationalCode')) WHERE kind='students';
CREATE UNIQUE INDEX attendance_session ON records(school_id,year_id,class_id,(data->>'date'),(data->>'period')) WHERE kind='attendanceSessions';
CREATE UNIQUE INDEX schedule_class_slot ON records(school_id,year_id,class_id,(data->>'dayOfWeek'),(data->>'period')) WHERE kind='schedule';
CREATE UNIQUE INDEX schedule_teacher_slot ON records(school_id,year_id,teacher_id,(data->>'dayOfWeek'),(data->>'period')) WHERE kind='schedule';
CREATE UNIQUE INDEX homework_student ON records(school_id,year_id,student_id,(data->>'homeworkId')) WHERE kind='homeworkSubmissions';
CREATE TABLE regional_content (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),kind text NOT NULL CHECK(kind IN ('banners','announcements','questionBank')),data jsonb NOT NULL,version integer NOT NULL DEFAULT 1);
CREATE TABLE audit_log (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,school_id uuid REFERENCES schools(id),user_id uuid REFERENCES users(id),action text NOT NULL,entity_id uuid,details jsonb NOT NULL DEFAULT '{}',created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE idempotency (user_id uuid NOT NULL REFERENCES users(id),key text NOT NULL,request_hash text NOT NULL,response jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(user_id,key));
CREATE TABLE outbox (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),school_id uuid REFERENCES schools(id),payload jsonb NOT NULL,status text NOT NULL DEFAULT 'pending',attempts integer NOT NULL DEFAULT 0,available_at timestamptz NOT NULL DEFAULT now(),created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX outbox_pending ON outbox(available_at) WHERE status IN ('pending','queued');
CREATE TABLE files (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),school_id uuid NOT NULL REFERENCES schools(id),year_id uuid NOT NULL,owner_id uuid NOT NULL REFERENCES users(id),class_id uuid,student_id uuid,name text NOT NULL,mime text NOT NULL,size integer NOT NULL CHECK(size BETWEEN 1 AND 2097152),storage_key text NOT NULL UNIQUE,created_at timestamptz NOT NULL DEFAULT now(),FOREIGN KEY(school_id,year_id) REFERENCES academic_years(school_id,id));

ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years FORCE ROW LEVEL SECURITY;
CREATE POLICY year_scope ON academic_years USING (school_id::text=current_setting('app.school_id',true)) WITH CHECK(school_id::text=current_setting('app.school_id',true));
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE records FORCE ROW LEVEL SECURITY;
CREATE POLICY record_scope ON records USING(school_id::text=current_setting('app.school_id',true)) WITH CHECK(school_id::text=current_setting('app.school_id',true));
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE files FORCE ROW LEVEL SECURITY;
CREATE POLICY file_scope ON files USING(school_id::text=current_setting('app.school_id',true)) WITH CHECK(school_id::text=current_setting('app.school_id',true));
