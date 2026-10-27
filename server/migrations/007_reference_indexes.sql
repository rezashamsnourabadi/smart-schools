-- Foreign-key checks must not scan whole multi-school tables during maintenance.
CREATE INDEX records_identity_reference ON records(identity_id) WHERE identity_id IS NOT NULL;
CREATE INDEX sessions_user ON sessions(user_id);
CREATE INDEX challenges_user_time ON challenges(user_id,created_at DESC);
CREATE INDEX memberships_school ON memberships(school_id);
CREATE INDEX audit_school_time ON audit_log(school_id,created_at DESC);
CREATE INDEX audit_user ON audit_log(user_id);
CREATE INDEX outbox_school ON outbox(school_id);
CREATE INDEX files_owner ON files(owner_id);
CREATE INDEX files_scope ON files(school_id,year_id);
REVOKE INSERT,UPDATE,DELETE ON schema_migrations FROM school_app;
