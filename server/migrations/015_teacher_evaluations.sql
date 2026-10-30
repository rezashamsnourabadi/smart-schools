ALTER TABLE school_surveys ADD COLUMN kind text NOT NULL DEFAULT 'standard' CHECK(kind IN ('standard','evaluation','evaluation_item'));
ALTER TABLE school_surveys ADD COLUMN parent_id uuid;
ALTER TABLE school_surveys ADD COLUMN teacher_id uuid;
ALTER TABLE school_surveys ADD COLUMN class_id uuid;
ALTER TABLE school_surveys ADD COLUMN teacher_name text;
ALTER TABLE school_surveys ADD COLUMN class_name text;
ALTER TABLE school_surveys ADD CONSTRAINT evaluation_parent FOREIGN KEY(school_id,parent_id) REFERENCES school_surveys(school_id,id);
ALTER TABLE school_surveys ADD CONSTRAINT evaluation_teacher FOREIGN KEY(school_id,year_id,teacher_id) REFERENCES records(school_id,year_id,id);
ALTER TABLE school_surveys ADD CONSTRAINT evaluation_class FOREIGN KEY(school_id,year_id,class_id) REFERENCES records(school_id,year_id,id);
ALTER TABLE school_surveys ADD CONSTRAINT evaluation_target CHECK(
 (kind='evaluation_item' AND parent_id IS NOT NULL AND teacher_id IS NOT NULL AND class_id IS NOT NULL AND teacher_name IS NOT NULL AND class_name IS NOT NULL)
 OR (kind<>'evaluation_item' AND parent_id IS NULL AND teacher_id IS NULL AND class_id IS NULL)
);
CREATE UNIQUE INDEX evaluation_assignment ON school_surveys(parent_id,teacher_id,class_id) WHERE parent_id IS NOT NULL;
