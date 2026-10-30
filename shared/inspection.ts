import type {AcademicYear,ClassGroup,School,Student} from '../src/types';
import type {SchoolAccess} from './operations';
export interface InspectionMeta {school:School;access:SchoolAccess;years:AcademicYear[];totalYears:number;principals:{name:string;username:string;active:boolean}[];currentYearId:string|null;currentYearTitle:string|null}
export interface InspectionSummary {students:number;activeStudents:number;classes:number;teachers:number;vicePrincipals:number}
export interface InspectionStudent {id:string;name:string;studentNumber:string;grade:string;classGroupId:string|null;className:string|null;status:string}
export interface InspectionClass {id:string;name:string;grade:string;major?:string;room:string;studentCount:number}
export interface InspectionStaff {id:string;name:string;phone:string;kind:'teachers'|'vicePrincipals';roleTitle?:string;teachingSubjects:string[];assignedClassIds:string[]}
export interface InspectionReceipt {id:string;name:string}
export interface InspectionDossier {student:Student;classGroup:ClassGroup|null;receipts:InspectionReceipt[]}
export interface DossierInspection {schoolId:string;yearId:string;yearTitle:string;classes:ClassGroup[];receipts:InspectionReceipt[]}
