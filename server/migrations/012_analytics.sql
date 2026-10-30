CREATE TABLE analytics_collection (id boolean PRIMARY KEY DEFAULT true CHECK(id),started_at timestamptz NOT NULL DEFAULT now());
INSERT INTO analytics_collection(id) VALUES(true);
CREATE TABLE analytics_events (
 user_id uuid NOT NULL,event_id uuid NOT NULL,membership_id uuid NOT NULL,
 school_id uuid REFERENCES schools(id),role text NOT NULL CHECK(role IN ('principal','vice_principal','teacher','student','parent')),
 kind text NOT NULL CHECK(kind IN ('activity','banner_impression','banner_click','dana_plus_open')),
 banner_id uuid REFERENCES regional_content(id),banner_title text,
 dedup_key text NOT NULL,day date NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Tehran')::date,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,event_id),UNIQUE(user_id,dedup_key),
 FOREIGN KEY(membership_id,user_id) REFERENCES memberships(id,user_id),
 CHECK((kind IN ('banner_impression','banner_click'))=(banner_id IS NOT NULL))
);
CREATE INDEX analytics_day_kind ON analytics_events(day,kind,user_id);
CREATE INDEX analytics_school_day ON analytics_events(school_id,day,kind,user_id);
CREATE INDEX analytics_banner_day ON analytics_events(banner_id,day,kind,user_id) WHERE banner_id IS NOT NULL;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events FORCE ROW LEVEL SECURITY;
CREATE POLICY analytics_platform_read ON analytics_events FOR SELECT USING(current_setting('app.platform',true)='true');
CREATE POLICY analytics_actor_insert ON analytics_events FOR INSERT WITH CHECK(user_id::text=current_setting('app.user_id',true) AND membership_id::text=current_setting('app.membership_id',true) AND school_id::text=current_setting('app.school_id',true));
