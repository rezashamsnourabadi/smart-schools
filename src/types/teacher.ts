import type {AttendanceSession,AttendanceStatus,GradeItem,HomeworkItem,ScheduleSlot,OnlineExam} from '../types';
export interface TeachingContext {classId:string;className:string;subject:string}
export interface TeacherStudent {id:string;name:string;studentNumber:string;classGroupId:string}
export interface TeacherClasses {items:TeachingContext[];schedule:ScheduleSlot[]}
export interface TeacherSession extends AttendanceSession {version:number;studentNames?:Record<string,string>;correctionReason?:string;correctedAt?:string}
export interface TeacherGrade extends GradeItem {version:number}
export interface ClassroomEvent {id:string;studentId:string|null;kind:'positive'|'negative'|'journal';title:string;note:string;points:number;date:string;active:boolean;version:number}
export interface Classroom {students:TeacherStudent[];previous:TeacherSession|null;stats:{homework:number;submissions:number;pendingReview:number}}
export interface TeacherRecordMap {grades:TeacherGrade;homework:HomeworkItem;exams:OnlineExam;sessions:TeacherSession;events:ClassroomEvent;submissions:import('../types').HomeworkSubmission}
export type PerformanceSection='overview'|'attendance'|'grades'|'homework'|'events';
export interface PerformanceSummary {sessions:number;absent:number;grades:number;homework:number;submitted:number;graded:number;positive:number;negative:number}
export interface TeacherPerformance {summary?:PerformanceSummary;student:TeacherStudent;grades:TeacherGrade[];sessions:TeacherSession[];homework:{id:string;title:string;dueDate:string;submission:{textContent:string;status:string;teacherScore?:number;teacherFeedback?:string;submissionDate:string;attachments?:{name:string;url?:string}[]}|null}[];events:ClassroomEvent[];limit:number}
export const attendanceNames:Record<AttendanceStatus,string>={present:'حاضر',absent:'غایب',late:'تأخیر',excused:'موجه'};
