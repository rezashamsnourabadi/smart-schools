ALTER TABLE records ADD COLUMN civil_day date;
CREATE INDEX attendance_day ON records(school_id,year_id,civil_day,class_id) WHERE kind='attendanceSessions';
CREATE TABLE enrollment_identities (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), national_code text NOT NULL UNIQUE CHECK(national_code ~ '^[0-9]{10}$')
);
-- No public endpoint exposes this region-wide identity registry.
ALTER TABLE records ADD COLUMN identity_id uuid REFERENCES enrollment_identities(id);
CREATE UNIQUE INDEX enrollment_per_year ON records(school_id,year_id,identity_id) WHERE kind='students';
