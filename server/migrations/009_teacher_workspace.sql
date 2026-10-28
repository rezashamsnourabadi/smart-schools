CREATE TABLE classroom_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 school_id uuid NOT NULL REFERENCES schools(id), year_id uuid NOT NULL,
 class_id uuid NOT NULL, teacher_id uuid NOT NULL, subject text NOT NULL,
 student_id uuid, kind text NOT NULL CHECK(kind IN ('positive','negative','journal')),
 title text NOT NULL, note text NOT NULL DEFAULT '', points integer NOT NULL DEFAULT 0 CHECK(points BETWEEN -10 AND 10),
 event_date date NOT NULL, active boolean NOT NULL DEFAULT true, version integer NOT NULL DEFAULT 1,
 created_by uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(school_id,year_id) REFERENCES academic_years(school_id,id),
 FOREIGN KEY(school_id,year_id,class_id) REFERENCES records(school_id,year_id,id),
 FOREIGN KEY(school_id,year_id,teacher_id) REFERENCES records(school_id,year_id,id),
 FOREIGN KEY(school_id,year_id,student_id) REFERENCES records(school_id,year_id,id),
 CHECK ((kind='journal' AND student_id IS NULL AND points=0) OR (kind<>'journal' AND student_id IS NOT NULL))
);
CREATE INDEX classroom_events_scope ON classroom_events(school_id,year_id,teacher_id,class_id,subject,event_date DESC,created_at DESC);
CREATE INDEX classroom_events_student ON classroom_events(school_id,year_id,student_id,teacher_id,subject);
ALTER TABLE classroom_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_events FORCE ROW LEVEL SECURITY;
CREATE POLICY classroom_event_scope ON classroom_events USING(school_id::text=current_setting('app.school_id',true)) WITH CHECK(school_id::text=current_setting('app.school_id',true));
