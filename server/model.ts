import {pgTable,uuid,text,jsonb,integer,timestamp,date} from 'drizzle-orm/pg-core';

// SQL migrations remain the source of truth for checks, composite FKs, indexes and RLS.
export const records=pgTable('records',{
  id:uuid('id').primaryKey(),school_id:uuid('school_id').notNull(),year_id:uuid('year_id').notNull(),kind:text('kind').notNull(),
  class_id:uuid('class_id'),student_id:uuid('student_id'),teacher_id:uuid('teacher_id'),subject:text('subject'),
  data:jsonb('data').$type<Record<string,unknown>>().notNull(),version:integer('version').notNull(),created_at:timestamp('created_at',{withTimezone:true}).notNull(),civil_day:date('civil_day'),identity_id:uuid('identity_id'),
});
