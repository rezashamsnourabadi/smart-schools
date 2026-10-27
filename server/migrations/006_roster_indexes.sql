CREATE INDEX attendance_roster_lookup ON records USING gin ((data->'records') jsonb_path_ops) WHERE kind='attendanceSessions';
CREATE INDEX grade_roster_lookup ON records USING gin ((data->'scores') jsonb_path_ops) WHERE kind='grades';
