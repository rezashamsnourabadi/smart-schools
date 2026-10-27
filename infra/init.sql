-- Development only. Production credentials must be provisioned outside source control.
CREATE ROLE school_app LOGIN PASSWORD 'local-app-password' NOSUPERUSER NOBYPASSRLS;
GRANT CONNECT ON DATABASE schools TO school_app;
GRANT USAGE ON SCHEMA public TO school_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO school_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO school_app;
