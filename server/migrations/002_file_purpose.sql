ALTER TABLE files ADD COLUMN purpose text NOT NULL DEFAULT 'receipt' CHECK(purpose IN ('homework','submission','receipt','post'));
