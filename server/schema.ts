import { z } from 'zod';
import {safeExternalUrl} from '../src/utils/externalLinks';

const text = z.string().trim().max(2000);
const name = text.min(1).max(200);
const id = z.uuid();
const money = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const date = z.string().max(30);
export const permissions = z.object({ canManageAnnouncements: z.boolean(), canManageSchedule: z.boolean(), canManageStudentsAndClasses: z.boolean(), canViewFullDossier: z.boolean(), canLogDisciplinary: z.boolean(), canManageFinances: z.boolean().optional() }).strict();
const attachment = z.object({name, type: text, size: text.optional(), url: z.string().regex(/^\/api\/v1\/files\/[a-f0-9-]+$/).optional()}).strict();
export const resourceSchemas = {
  schools: z.object({name, code: name, type: name, principalName: text, address: text, phone: text, studentCount: money.default(0), teacherCount: money.default(0), classesCount: money.default(0), accentColor: text.default('teal')}).strict(),
  classes: z.object({name, grade: name, major: text.optional(), room: text, studentCount: money.default(0)}).strict(),
  students: z.object({name, nationalCode: z.string().regex(/^\d{10}$/), birthDate: date, fatherName: text, motherName: text.optional(), studentPhone: text.optional(), parentName: name, parentPhone: text, emergencyPhone: text.optional(), address: text, parentBaleAccount: text, grade: name, fieldOfStudy: text, studentNumber: name, classGroupId: id.or(z.literal('')), status: z.enum(['active','graduated','transferred','pending_class_assignment']).default('active'), pendingClassGrade: text.optional()}).strict(),
  teachers: z.object({name, phone: text, avatarBg: text, teachingSubjects: z.array(name).max(50), assignedClassIds: z.array(id).max(100), roleTitle: text.optional()}).strict(),
  vicePrincipals: z.object({name, phone: text, avatarBg: text, roleTitle: name, permissions}).strict(),
  schedule: z.object({classGroupId: id, className: name, teacherId: id, teacherName: name, subject: name, dayOfWeek: z.enum(['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه']), period: z.number().int().min(1).max(4),startTime: date,endTime: date,isCurrentPeriod: z.boolean().optional()}).strict(),
  grades: z.object({classGroupId: id,subject: name,title: name,category: z.enum(['continuous','term1','term2','quiz']),categoryTitle: text,date,maxScore: z.number().positive().max(100),scores: z.array(z.object({studentId: id,score: z.number().nonnegative(),note: text.optional()}).strict()).max(200)}).strict(),
  homework: z.object({classGroupId:id,className:name,subject:name,teacherId:id,teacherName:name,title:name,description:text,assignedDate:date,dueDate:date,totalStudents:money,status:z.enum(['active','expired']),attachments:z.array(attachment).max(5).optional()}).strict(),
  homeworkSubmissions: z.object({homeworkId:id,studentId:id,studentName:name,textContent:text.min(1),attachments:z.array(attachment).max(5).optional()}).strict(),
  exams: z.object({classGroupId:id,className:name,subject:name,teacherName:name,title:name,examDate:date,startTime:date,durationMinutes:z.number().int().positive().max(600),totalScore:z.number().nonnegative().max(100),status:z.enum(['scheduled','active','completed']),questions:z.array(z.never()).default([])}).strict(),
  feeItems: z.object({academicYearId:id,title:name,category:z.enum(['tuition','registration_insurance','extracurricular','transportation','catering','uniform_supplies','camp_event','custom']),amount:money.refine(n=>n>0),isMandatory:z.boolean(),targetScope:z.enum(['all','grade_10','grade_11','grade_12','selective']),description:text.optional(),dueDate:date.optional(),defaultInstallmentsCount:z.number().int().min(1).max(1).optional()}).strict(),
  announcements: z.object({type:z.enum(['announcement','news','event','event_report']).optional(),title:name,content:text.min(1),senderRole:text,senderName:text,target:z.enum(['all','teachers','parents','students']),eventDate:date.optional(),eventLocation:text.optional(),imageUrl:z.string().max(500).optional(),coverImage:z.string().max(500).optional(),attachments:z.array(attachment.extend({caption:text.optional()})).max(5).optional(),priority:z.enum(['normal','important','urgent']),isPinned:z.boolean().optional()}).strict(),
  questionBank: z.object({title:name,content:text.min(1),subject:name,grade:name,difficulty:z.enum(['آسان','متوسط','دشوار']),type:z.enum(['تستی','تشریحی','کوتاه‌پاسخ']),options:z.array(text).max(10).optional(),correctAnswer:text.optional(),authorName:name,authorSchool:name,isSharedRegional:z.boolean(),tags:z.array(text).max(20)}).strict(),
  banners: z.object({title:name,description:text,sponsorName:name,targetAudience:z.array(z.enum(['all','students','parents','teachers'])),linkText:text,linkUrl:z.string().trim().max(2048).refine(value=>!!safeExternalUrl(value),'آدرس مقصد باید یک لینک معتبر http یا https باشد.').optional(),category:z.enum(['آموزشی','فرهنگی','کتابخوانی','فناوری','خدمات شهری']),badge:text,isActive:z.boolean()}).strict(),
  academicYears: z.object({title:z.string().regex(/^[0-9۰-۹]{4}-[0-9۰-۹]{4}$/),startDate:date,endDate:date,status:z.enum(['active','archived','planned']),isCurrent:z.boolean().optional(),currentTermId:z.enum(['term1','term2','summer']),terms:z.array(z.object({id:z.enum(['term1','term2','summer']),title:name,startDate:date,endDate:date,isCurrent:z.boolean()}).strict()).max(3),description:text.optional(),studentsCount:money.optional(),classesCount:money.optional()}).strict(),
};
export type Resource = keyof typeof resourceSchemas | 'attendanceSessions' | 'notifications';
export const resourceName = z.enum(['attendanceSessions','notifications',...Object.keys(resourceSchemas)]);
export const paging = z.object({limit:z.coerce.number().int().min(1).max(100).default(25),offset:z.coerce.number().int().nonnegative().max(1000000).default(0),search:z.string().max(100).default(''),classId:id.optional(),date:z.string().max(30).optional(),includeFinance:z.enum(['true','false']).default('false')});
