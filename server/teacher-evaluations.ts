import {randomUUID} from 'node:crypto';
import type {Tx} from './db';
import {requireValue} from './errors';

/** Materialize the actual class/teacher assignments once, at publication. */
export async function publishTeacherEvaluation(tx:Tx,s:{id:string;school_id:string;year_id:string;title:string;description:string;questions:unknown;class_ids:string[]},userId:string){
 const pairs=(await tx.query(`SELECT t.id AS teacher_id,c.id AS class_id,t.data->>'name' AS teacher_name,c.data->>'name' AS class_name
 FROM records t JOIN records c ON c.school_id=t.school_id AND c.year_id=t.year_id AND c.kind='classes' AND COALESCE(t.data->'assignedClassIds','[]'::jsonb) ? c.id::text
 WHERE t.school_id=$1 AND t.year_id=$2 AND t.kind='teachers' AND COALESCE(t.data->>'status','active')='active'
 AND (cardinality($3::uuid[])=0 OR c.id=ANY($3::uuid[])) ORDER BY c.id,t.id`,[s.school_id,s.year_id,s.class_ids])).rows;
 requireValue(pairs.length,'برای کلاس‌های انتخابی دبیر منصوبی وجود ندارد؛ ابتدا تخصیص دبیر به کلاس را ثبت کنید.');
 const items=pairs.map(pair=>({...pair,id:randomUUID()}));
 await tx.query(`INSERT INTO school_surveys(id,school_id,year_id,title,description,questions,audience,class_ids,status,created_by,kind,parent_id,teacher_id,class_id,teacher_name,class_name)
  SELECT x.id,$2::uuid,$3::uuid,left(x.teacher_name||' · '||x.class_name,200),$4,$5::jsonb,ARRAY['student'],ARRAY[x.class_id],'published',$6::uuid,'evaluation_item',$7::uuid,x.teacher_id,x.class_id,x.teacher_name,x.class_name
  FROM jsonb_to_recordset($1::jsonb) AS x(id uuid,teacher_id uuid,class_id uuid,teacher_name text,class_name text)`,[JSON.stringify(items),s.school_id,s.year_id,s.description,JSON.stringify(s.questions),userId,s.id]);
 await tx.query(`INSERT INTO survey_recipients(school_id,survey_id,membership_id)
  SELECT DISTINCT $1::uuid,item.id,m.id FROM school_surveys item
  JOIN records c ON c.school_id=item.school_id AND c.year_id=item.year_id AND c.class_id=item.class_id AND c.kind='students'
  JOIN memberships m ON m.school_id=c.school_id AND (c.id=m.student_id OR c.identity_id=m.student_id)
  JOIN users u ON u.id=m.user_id
  WHERE item.parent_id=$2 AND item.school_id=$1 AND item.year_id=$3 AND m.role='student' AND m.active AND u.active AND COALESCE(c.data->>'status','active')='active'`,[s.school_id,s.id,s.year_id]);
 await tx.query(`INSERT INTO survey_recipients(school_id,survey_id,membership_id) SELECT DISTINCT $1::uuid,$2::uuid,r.membership_id FROM survey_recipients r JOIN school_surveys c ON c.id=r.survey_id WHERE c.parent_id=$2`,[s.school_id,s.id]);
}

export const evaluationAnswered=`CASE WHEN s.kind='evaluation' THEN NOT EXISTS(
 SELECT 1 FROM school_surveys c JOIN survey_recipients cr ON cr.survey_id=c.id
 WHERE c.parent_id=s.id AND cr.membership_id=$3 AND NOT EXISTS(SELECT 1 FROM survey_responses a WHERE a.survey_id=c.id AND a.membership_id=$3)
 ) ELSE EXISTS(SELECT 1 FROM survey_responses a WHERE a.survey_id=s.id AND a.membership_id=$3) END`;
