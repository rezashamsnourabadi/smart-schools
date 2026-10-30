ALTER TABLE inbox_messages DROP CONSTRAINT inbox_messages_kind_check;
ALTER TABLE inbox_messages ADD CONSTRAINT inbox_messages_kind_check CHECK(kind IN ('direct','support','announcement','survey','feedback'));

CREATE INDEX school_feedback_status ON school_feedback(school_id,status,created_at DESC,id);
