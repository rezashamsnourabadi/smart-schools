import {GradeViewPicker} from './GradeViewPicker';
import type {GradeView} from '../../shared/academic';
import React, { useEffect, useRef, useState } from 'react';
import {motion,useReducedMotion} from 'motion/react';
import {
  X,
  User,
  GraduationCap,
  Calendar,
  Phone,
  MapPin,
  FileText,
  Award,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Share2,
  Printer,
  Edit3,
  Save,
  Plus,
  ShieldAlert,
  Send,
  CreditCard
} from 'lucide-react';
import { useApp, useResource } from '../context/AppContext';
import { Student, DisciplinaryRecord, GradeItem, AttendanceSession } from '../types';
import {useStudentRecords} from '../api/hooks';
import {ReportCardEditor} from './ReportCardEditor';
import { toPersianDigits, formatPersianScore, normalizeSchoolDate } from '../utils/persianUtils';
import { StudentFinancialTab } from './StudentFinancialTab';
import { attendanceLabel } from '../utils/attendance';

interface StudentDossierModalProps {
  student: Student;
  onClose: () => void;
  canEditContact?: boolean;
  canManageDiscipline?: boolean;
  initialTab?: 'profile' | 'reportCards' | 'attendance' | 'discipline' | 'pastYears' | 'finances';
}

export const StudentDossierModal: React.FC<StudentDossierModalProps> = ({
  student,
  onClose,
  canEditContact = false,
  canManageDiscipline = true,
  initialTab = 'profile'
}) => {
  const { classes, updateParentContact, addDisciplinaryRecord, currentUser, currentRole, canManageSchool, schoolClock } = useApp();
  const [gradeOffset,setGradeOffset]=useState(0),[attendanceOffset,setAttendanceOffset]=useState(0);
  const [cardEditorOpen,setCardEditorOpen]=useState(false);
  const [gradeView,setGradeView]=useState<GradeView>('all');
  const [reportTerm,setReportTerm]=useState<'all'|'term1'|'term2'>('all');
  const reportCards=(student.reportCards||[]).filter(card=>reportTerm==='all'||card.term===reportTerm);
  const reducedMotion=useReducedMotion();
  const closeRef=useRef<HTMLButtonElement>(null),contentRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const previousFocus=document.activeElement;
    document.body.classList.add('student-dossier-open');closeRef.current?.focus();
    return()=>{document.body.classList.remove('student-dossier-open');if(previousFocus instanceof HTMLElement&&previousFocus.isConnected)previousFocus.focus();};
  },[]);

  const gradeQuery=useStudentRecords<GradeItem>(student.id,'grades',gradeOffset,gradeView);
  const attendanceQuery=useStudentRecords<AttendanceSession>(student.id,'attendanceSessions',attendanceOffset);
  const grades=gradeQuery.data?.items||[],attendanceSessions=attendanceQuery.data?.items||[];
  const canViewFinances = currentRole === 'parent' || currentRole === 'student' || canManageSchool('canManageFinances');
  const [activeTab, setActiveTab] = useState<'profile' | 'reportCards' | 'attendance' | 'discipline' | 'pastYears' | 'finances'>(initialTab === 'finances' && !canViewFinances ? 'profile' : initialTab);
  
  // Edit contact state
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editAddress, setEditAddress] = useState(student.address);
  const [editEmergencyPhone, setEditEmergencyPhone] = useState(student.emergencyPhone || '');
  const [editParentPhone, setEditParentPhone] = useState(student.parentPhone);
  const [editBale, setEditBale] = useState(student.parentBaleAccount);

  // New discipline record state
  const [showAddDiscipline, setShowAddDiscipline] = useState(false);
  const [newDiscType, setNewDiscType] = useState<'تشویقی' | 'تذکر' | 'تاخیر'>('تشویقی');
  const [newDiscTitle, setNewDiscTitle] = useState('');
  const [newDiscNote, setNewDiscNote] = useState('');

  const studentClass = classes.find((c) => c.id === student.classGroupId);

  const handleSaveContact = async () => {
    const saved0 = await updateParentContact(student.id, {
      address: editAddress,
      emergencyPhone: editEmergencyPhone,
      parentPhone: editParentPhone,
      parentBaleAccount: editBale
    }); if (!saved0.ok) return;
    setIsEditingContact(false);
  };

  const handleAddDiscipline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscTitle.trim()) return;
    const saved1 = await addDisciplinaryRecord(student.id, {
      type: newDiscType,
      title: newDiscTitle,
      note: newDiscNote,
      date: schoolClock.date,
      recordedBy: currentUser.name
    }); if (!saved1.ok) return;
    setNewDiscTitle('');
    setNewDiscNote('');
    setShowAddDiscipline(false);
  };

  const attendanceHistory = attendanceSessions.flatMap((session) => {
    const row = session.records.find((item) => item.studentId === student.id);
    return row ? [{ session, row }] : [];
  }).sort((a, b) => (normalizeSchoolDate(b.session.date) || '').localeCompare(normalizeSchoolDate(a.session.date) || '') || b.session.period - a.session.period);

  const activeTerm1Card = student.reportCards?.find((r) => r.term === 'term1');
  const activeTerm2Card = student.reportCards?.find((r) => r.term === 'term2');
  const studentGradebookItems = grades
    .filter((item) => item.classGroupId === student.classGroupId && item.scores.some((score) => score.studentId === student.id))
    .slice()
    .sort((a, b) => (normalizeSchoolDate(b.date) || '').localeCompare(normalizeSchoolDate(a.date) || ''));

  const dossierTabs=[
    {id:'profile',label:'مشخصات',icon:User},
    {id:'reportCards',label:'نمره و کارنامه',icon:GraduationCap},
    {id:'attendance',label:'حضور و غیاب',icon:Calendar},
    {id:'discipline',label:'سوابق رفتاری',icon:Award},
    {id:'pastYears',label:'سال‌های قبل',icon:Clock},
    {id:'finances',label:'امور مالی',icon:CreditCard},
  ] as const;
  const activeTitle=dossierTabs.find(tab=>tab.id===activeTab)?.label;
  return (
    <motion.div id="student-dossier-overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reducedMotion?0:0.16}} className="fixed inset-0 z-[80] flex items-center justify-center bg-[#19382e]/50 sm:p-4">
      <motion.section id="student-dossier-modal" role="dialog" aria-modal="true" aria-labelledby="student-dossier-title" aria-describedby="student-dossier-subtitle" initial={{y:reducedMotion?0:16}} animate={{y:0}} exit={{y:reducedMotion?0:16}} className="student-dossier flex min-h-0 w-full min-w-0 max-w-4xl flex-col overflow-hidden bg-white shadow-2xl sm:rounded-[28px] sm:border sm:border-[#dce5d3]">
        <header className="shrink-0 border-b border-[#e5ebde] bg-[#f4f7ef] px-4 pt-4 pb-3 sm:px-6 sm:pt-5">
          <div className="mb-3 flex items-center justify-between gap-3"><p className="text-[10px] font-bold tracking-wide text-[#8a9c7c]">پرونده دانش‌آموز</p><button id="student-dossier-close" ref={closeRef} onClick={onClose} aria-label="بستن پرونده" className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-[#e1e8d9] bg-white text-[#73866a] hover:bg-[#eaf0e2]"><X className="size-5" aria-hidden="true"/></button></div>
          <div className="flex items-center gap-3"><span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[#d9e5ce] bg-[#e5eddc] text-xl font-bold text-[#65834f] sm:size-14">{student.name.charAt(0)}</span><div className="min-w-0 flex-1"><h2 id="student-dossier-title" className="break-words text-lg font-bold leading-8 text-[#2e4c38] sm:text-xl">{student.name}</h2><p id="student-dossier-subtitle" className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[11px] leading-6 text-[#8a9680]"><span>{studentClass?.name||student.grade}</span><span>·</span><span>شماره دانش‌آموزی: {toPersianDigits(student.studentNumber)}</span></p></div></div>
        </header>
        <nav aria-label="بخش‌های پرونده دانش‌آموز" className="grid shrink-0 grid-cols-3 gap-1.5 border-b border-[#e7ecdf] bg-white p-3 sm:grid-cols-6 sm:px-5">
          {dossierTabs.filter(tab=>tab.id!=='finances'||canViewFinances).map(({id,label,icon:Icon})=><button id={`student-dossier-tab-${id}`} key={id} type="button" aria-pressed={activeTab===id} aria-controls="student-dossier-panel" onClick={()=>{setActiveTab(id);contentRef.current?.scrollTo(0,0);}} className={`flex min-h-[58px] min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl border px-1 py-2 text-[10px] font-bold leading-5 transition-colors sm:min-h-16 sm:text-[11px] ${activeTab===id?'border-[#d4e1c8] bg-[#eef4e6] text-[#547541]':'border-transparent bg-[#f9faf7] text-[#8b9783] hover:bg-[#f0f4e9] hover:text-[#587544]'}`}><Icon className="size-4 shrink-0" strokeWidth={1.7} aria-hidden="true"/><span className="break-words text-center">{label}</span></button>)}
        </nav>
        {/* Modal Body */}
        <div id="student-dossier-panel" ref={contentRef} role="region" aria-label={activeTitle} className="student-dossier-content min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain bg-[#f8faf5] p-4 sm:p-6">
          {cardEditorOpen&&<ReportCardEditor student={student} initialTerm={reportTerm==='all'?undefined:reportTerm} onClose={()=>setCardEditorOpen(false)}/>}
          {activeTab==='reportCards'&&currentRole==='principal'&&<button id="edit-official-report-card" className="min-h-11 mb-3 px-4 rounded-xl bg-teal-700 text-white font-bold text-sm" onClick={()=>setCardEditorOpen(true)}>ثبت یا انتشار کارنامه مدرسه</button>}
          {['reportCards','attendance'].includes(activeTab)&&(()=>{const query=activeTab==='reportCards'?gradeQuery:attendanceQuery,offset=activeTab==='reportCards'?gradeOffset:attendanceOffset,setOffset=activeTab==='reportCards'?setGradeOffset:setAttendanceOffset;return <div className="flex flex-wrap items-center gap-3 mb-4 text-xs">{query.error?<span role="alert" className="text-rose-800">{query.error.message}</span>:<span role="status">{query.isFetching?'در حال دریافت…':`${toPersianDigits(query.data?.total||0)} مورد`}</span>}<button disabled={query.isFetching||offset===0} onClick={()=>setOffset(Math.max(0,offset-25))} className="min-h-11 px-3 bg-white rounded-xl border border-slate-200">قبلی</button><button disabled={query.isFetching||offset+25>=(query.data?.total||0)} onClick={()=>setOffset(offset+25)} className="min-h-11 px-3 bg-white rounded-xl border border-slate-200">بعدی</button></div>;})()}
          {/* TAB 1: Profile & Contacts */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* Quick Academic Summary */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                <div className="min-w-0 rounded-2xl border border-[#e1e8d9] bg-white p-4">
                  <div className="mb-1 text-[11px] leading-6 text-[#91a084]">معدل کارنامه نوبت اول</div>
                  <div className="text-xl font-bold text-[#5b7949]">
                    {formatPersianScore(activeTerm1Card?.gpa)}
                  </div>
                </div>
                <div className="min-w-0 rounded-2xl border border-[#e1e8d9] bg-white p-4">
                  <div className="mb-1 text-[11px] leading-6 text-[#91a084]">رتبه در کلاس</div>
                  <div className="text-xl font-bold text-[#5b7949]">
                    {activeTerm1Card?.rankInClass ? `${toPersianDigits(activeTerm1Card.rankInClass)}` : '—'}
                  </div>
                </div>
                <div className="min-w-0 rounded-2xl border border-[#e1e8d9] bg-white p-4">
                  <div className="mb-1 text-[11px] leading-6 text-[#91a084]">نمره انضباط</div>
                  <div className="text-xl font-bold text-[#5b7949]">
                    {formatPersianScore(activeTerm1Card?.disciplineScore)}
                  </div>
                </div>
                <div className="min-w-0 rounded-2xl border border-[#e1e8d9] bg-white p-4">
                  <div className="mb-1 text-[11px] leading-6 text-[#91a084]">روزهای غیبت</div>
                  <div className="text-xl font-bold text-[#5b7949]">
                    {toPersianDigits(student.attendanceStats?.absentDays || 0)} روز ثبت‌شده
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div className="rounded-2xl border border-[#e1e7d8] bg-white p-4 sm:p-5">
                <h3 className="font-bold text-slate-800 text-sm sm:text-base mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-teal-600" />
                  مشخصات فردی و هویتی
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px] sm:text-sm">
                  <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-start gap-3 border-b border-[#edf0e7] py-2.5 [&>span]:min-w-0 [&>span]:break-words [&>span:last-child]:text-left">
                    <span className="text-slate-500">نام و نام خانوادگی:</span>
                    <span className="font-semibold text-slate-800">{student.name}</span>
                  </div>
                  <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-start gap-3 border-b border-[#edf0e7] py-2.5 [&>span]:min-w-0 [&>span]:break-words [&>span:last-child]:text-left">
                    <span className="text-slate-500">کد ملی:</span>
                    <span className="font-mono font-semibold text-slate-800">{toPersianDigits(student.nationalCode)}</span>
                  </div>
                  <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-start gap-3 border-b border-[#edf0e7] py-2.5 [&>span]:min-w-0 [&>span]:break-words [&>span:last-child]:text-left">
                    <span className="text-slate-500">تاریخ تولد:</span>
                    <span className="font-semibold text-slate-800">{toPersianDigits(student.birthDate || '—')}</span>
                  </div>
                  <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-start gap-3 border-b border-[#edf0e7] py-2.5 [&>span]:min-w-0 [&>span]:break-words [&>span:last-child]:text-left">
                    <span className="text-slate-500">نام پدر:</span>
                    <span className="font-semibold text-slate-800">{student.fatherName}</span>
                  </div>
                  <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-start gap-3 border-b border-[#edf0e7] py-2.5 [&>span]:min-w-0 [&>span]:break-words [&>span:last-child]:text-left">
                    <span className="text-slate-500">پایه و رشته تحصیلی:</span>
                    <span className="font-semibold text-slate-800">{student.grade} - {student.fieldOfStudy}</span>
                  </div>
                  <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-start gap-3 border-b border-[#edf0e7] py-2.5 [&>span]:min-w-0 [&>span]:break-words [&>span:last-child]:text-left">
                    <span className="text-slate-500">کلاس جاری:</span>
                    <span className="font-semibold text-slate-800">{studentClass?.name || student.grade}</span>
                  </div>
                </div>
              </div>

              {/* Contact & Address with Parent Edit Capability */}
              <div className="rounded-2xl border border-[#e1e7d8] bg-white p-4 sm:p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                    <Phone className="w-4 h-4 text-teal-600" />
                    اطلاعات اولیا، تماس و سکونت
                  </h3>
                  {canEditContact && !isEditingContact && (
                    <button
                      onClick={() => setIsEditingContact(true)}
                      className="text-xs text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1 rounded-lg flex items-center gap-1 font-medium transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      ویرایش توسط اولیا
                    </button>
                  )}
                </div>

                {isEditingContact ? (
                  <div className="space-y-3 bg-teal-50/50 p-3 rounded-xl border border-teal-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">شماره همراه ولی (جهت دریافت پیامک):</label>
                        <input
                          type="text"
                          value={editParentPhone}
                          onChange={(e) => setEditParentPhone(e.target.value)}
                          className="w-full text-[13px] sm:text-sm p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">شماره تماس اضطراری:</label>
                        <input
                          type="text"
                          value={editEmergencyPhone}
                          onChange={(e) => setEditEmergencyPhone(e.target.value)}
                          className="w-full text-[13px] sm:text-sm p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">شناسه پیام‌رسان بله:</label>
                        <input
                          type="text"
                          value={editBale}
                          onChange={(e) => setEditBale(e.target.value)}
                          className="w-full text-[13px] sm:text-sm p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-left"
                          dir="ltr"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-700 mb-1">نشانی دقیق پستی منزل:</label>
                        <input
                          type="text"
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          className="w-full text-[13px] sm:text-sm p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setIsEditingContact(false)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                      >
                        انصراف
                      </button>
                      <button
                        onClick={handleSaveContact}
                        className="px-4 py-1.5 text-xs bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium flex items-center gap-1 shadow-xs"
                      >
                        <Save className="w-3.5 h-3.5" />
                        ذخیره تغییرات
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px] sm:text-sm">
                    <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-start gap-3 border-b border-[#edf0e7] py-2.5 [&>span]:min-w-0 [&>span]:break-words [&>span:last-child]:text-left">
                      <span className="text-slate-500">نام سرپرست/ولی:</span>
                      <span className="font-semibold text-slate-800">{student.parentName}</span>
                    </div>
                    <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-start gap-3 border-b border-[#edf0e7] py-2.5 [&>span]:min-w-0 [&>span]:break-words [&>span:last-child]:text-left">
                      <span className="text-slate-500">شماره همراه ولی:</span>
                      <span className="font-mono font-semibold text-teal-800">{toPersianDigits(student.parentPhone)}</span>
                    </div>
                    <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-start gap-3 border-b border-[#edf0e7] py-2.5 [&>span]:min-w-0 [&>span]:break-words [&>span:last-child]:text-left">
                      <span className="text-slate-500">تماس اضطراری منزل:</span>
                      <span className="font-mono text-slate-800">{toPersianDigits(student.emergencyPhone || '—')}</span>
                    </div>
                    <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-start gap-3 border-b border-[#edf0e7] py-2.5 [&>span]:min-w-0 [&>span]:break-words [&>span:last-child]:text-left">
                      <span className="text-slate-500">حساب پیام‌رسان بله:</span>
                      <span className="font-mono text-cyan-700 font-semibold">{student.parentBaleAccount}</span>
                    </div>
                    <div className="sm:col-span-2 flex flex-col py-1.5">
                      <span className="text-slate-500 mb-1">نشانی سکونت:</span>
                      <span className="font-medium text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                        {toPersianDigits(student.address)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Official Report Cards (کارنامه‌های تحصیلی) */}
          {activeTab === 'reportCards' && (
            <div className="space-y-6">
              <section aria-labelledby="gradebook-heading" className="space-y-3">
                <div>
                  <h3 id="gradebook-heading" className="font-bold text-slate-900">دفتر نمره</h3>
                  <p className="mt-1 text-xs text-slate-600 leading-6">ارزشیابی‌های ثبت‌شده دبیر در این بخش نمایش داده می‌شوند و به‌تنهایی کارنامه رسمی یا معدل نوبت را تعیین نمی‌کنند.</p>
                </div>
                <GradeViewPicker id="student-grade-view" value={gradeView} onChange={value=>{setGradeView(value);setGradeOffset(0);}}/>
                {studentGradebookItems.length ? <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {studentGradebookItems.map((item) => {
                    const result = item.scores.find((score) => score.studentId === student.id);
                    if (!result) return null;
                    return <li key={item.id} className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex justify-between items-start gap-2"><div className="min-w-0"><h4 className="font-bold text-sm break-words">{item.subject}</h4><p className="text-xs text-slate-600 mt-1 break-words">{item.title} • {item.categoryTitle}</p></div><time className="text-[11px] text-slate-500 shrink-0">{toPersianDigits(item.date)}</time></div>
                      <div className="flex flex-wrap gap-2 text-xs"><span className="px-2 py-1 rounded-lg bg-teal-50 text-teal-900">نمره: {formatPersianScore(result.score)} از {toPersianDigits(item.maxScore)}</span></div>
                      {result.note && <p className="text-xs leading-6 text-slate-700 border-t border-slate-100 pt-2">یادداشت دبیر: {result.note}</p>}
                    </li>;
                  })}
                </ul> : <p role="status" className="p-4 rounded-2xl border border-dashed border-slate-300 text-sm text-slate-600">ارزشیابی‌ای با این فیلتر در دفتر نمره دانش‌آموز پیدا نشد.</p>}
              </section>
              <div className="border-t border-slate-200" />
              <section aria-labelledby="official-report-cards-heading" className="space-y-3">
              <div><h3 id="official-report-cards-heading" className="font-bold text-slate-900">کارنامه‌های ثبت‌شده</h3><p className="mt-1 text-xs text-slate-600 leading-6">معدل و رتبه فقط از کارنامه ذخیره‌شده خوانده می‌شوند؛ دفتر نمره به‌صورت خودکار به معدل تبدیل نمی‌شود.</p></div>
              <label className="teaching-label">کارنامه کدام نوبت؟<select id="student-report-term" className="teacher-text-input" value={reportTerm} onChange={event=>setReportTerm(event.target.value as typeof reportTerm)}><option value="all">هر دو نوبت</option><option value="term1">نوبت اول</option><option value="term2">نوبت دوم</option></select></label>
              {reportCards.length > 0 ? (
                reportCards.map((rc, idx) => (
                  <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-xs text-teal-300 font-semibold mb-0.5">سال تحصیلی {toPersianDigits(rc.year)}</div>
                        <h4 className="font-bold text-base sm:text-lg">{rc.termTitle}</h4>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-left bg-white/10 px-3 py-1.5 rounded-xl">
                          <span className="text-[11px] text-slate-300 block">معدل کل</span>
                          <span className="text-lg font-black text-teal-300">{formatPersianScore(rc.gpa)}</span>
                        </div>
                        <div className="text-left bg-white/10 px-3 py-1.5 rounded-xl">
                          <span className="text-[11px] text-slate-300 block">رتبه کلاسی</span>
                          <span className="text-lg font-black text-white">{toPersianDigits(rc.rankInClass)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="md:hidden p-3 space-y-2">
                      {rc.subjects.map((sub, sIdx) => <article key={sIdx} className="p-3 rounded-xl border border-slate-200 bg-white space-y-2">
                        <div className="flex items-start justify-between gap-2"><h5 className="font-bold text-sm">{sub.name}</h5><span className="text-[11px] text-slate-600">{toPersianDigits(sub.unit)} واحد</span></div>
                        <div className="grid grid-cols-3 gap-2 text-center"><div className="bg-slate-50 rounded-lg p-2"><span className="block text-[10px] text-slate-500">مستمر</span><span className="font-bold text-xs">{formatPersianScore(sub.continuousScore)}</span></div><div className="bg-slate-50 rounded-lg p-2"><span className="block text-[10px] text-slate-500">پایانی</span><span className="font-bold text-xs">{formatPersianScore(sub.finalScore)}</span></div><div className="bg-teal-50 rounded-lg p-2"><span className="block text-[10px] text-teal-800">نهایی</span><span className="font-black text-xs text-teal-900">{formatPersianScore(sub.totalScore)}</span></div></div>
                        <div className="flex justify-between gap-2 text-xs text-slate-600"><span>{sub.status}</span><span className="text-left">{sub.teacherName}</span></div>
                      </article>)}
                      <p className="text-xs text-slate-600 px-1">نمره انضباط نوبت: {formatPersianScore(rc.disciplineScore)} • معدل: {formatPersianScore(rc.gpa)}</p>
                    </div>
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-right text-[13px] sm:text-sm">
                        <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 font-medium">
                          <tr>
                            <th className="p-3">ردیف</th>
                            <th className="p-3">عنوان درس</th>
                            <th className="p-3 text-center">واحد</th>
                            <th className="p-3 text-center">نمره مستمر</th>
                            <th className="p-3 text-center">نمره پایانی</th>
                            <th className="p-3 text-center font-bold">نمره نهایی</th>
                            <th className="p-3 text-center">وضعیت</th>
                            <th className="p-3 text-left">دبیر مربوطه</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rc.subjects.map((sub, sIdx) => (
                            <tr key={sIdx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3 font-mono text-slate-400">{toPersianDigits(sIdx + 1)}</td>
                              <td className="p-3 font-semibold text-slate-800">{sub.name}</td>
                              <td className="p-3 text-center font-mono">{toPersianDigits(sub.unit)}</td>
                              <td className="p-3 text-center font-mono font-medium text-slate-700">{formatPersianScore(sub.continuousScore)}</td>
                              <td className="p-3 text-center font-mono font-medium text-slate-700">{formatPersianScore(sub.finalScore)}</td>
                              <td className="p-3 text-center font-mono font-black text-teal-800 bg-teal-50/50">{formatPersianScore(sub.totalScore)}</td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  sub.status === 'قبول' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {sub.status}
                                </span>
                              </td>
                              <td className="p-3 text-left text-slate-500 text-xs">{sub.teacherName}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-800">
                          <tr>
                            <td colSpan={2} className="p-3">نمره انضباط نوبت: {formatPersianScore(rc.disciplineScore)}</td>
                            <td colSpan={4} className="p-3 text-center">معدل کل کارنامه: <span className="text-teal-700 text-base">{formatPersianScore(rc.gpa)}</span></td>
                            <td colSpan={2} className="p-3 text-left text-slate-600">وضعیت از کارنامه ثبت‌شده</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-500">
                  کارنامه رسمی برای نوبت انتخاب‌شده یافت نشد. ارزشیابی‌های دفتر نمره در بخش جداگانه بالا دیده می‌شوند.
                </div>
              )}
              </section>
            </div>
          )}

          {/* TAB 3: Attendance History */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center">
                  <div className="text-xs text-emerald-700 font-medium mb-1">روزهای حاضر</div>
                  <div className="text-2xl font-black text-emerald-800">
                    {toPersianDigits(student.attendanceStats?.presentDays || 0)}
                  </div>
                </div>
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-center">
                  <div className="text-xs text-rose-700 font-medium mb-1">غیبت غیرموجه</div>
                  <div className="text-2xl font-black text-rose-800">
                    {toPersianDigits(student.attendanceStats?.absentDays || 0)}
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-center">
                  <div className="text-xs text-amber-700 font-medium mb-1">تاخیر ورود</div>
                  <div className="text-2xl font-black text-amber-800">
                    {toPersianDigits(student.attendanceStats?.lateDays || 0)}
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-center">
                  <div className="text-xs text-blue-700 font-medium mb-1">غیبت موجه با گواهی</div>
                  <div className="text-2xl font-black text-blue-800">
                    {toPersianDigits(student.attendanceStats?.excusedDays || 0)}
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-800 text-sm mb-3">تاریخچه ثبت لحظه‌ای حضور و غیاب</h4>
                <p className="text-xs text-slate-500 mb-3 leading-6">آمار بر اساس روزهای دارای جلسه ثبت‌شده است. وجود غیبت در هر زنگ، آن روز را دارای غیبت محسوب می‌کند؛ هر روز فقط یک بار شمرده می‌شود.</p>
                <div id="student-attendance-history" className="space-y-2 text-[13px] sm:text-sm">
                  {!attendanceHistory.length && <p role="status" className="p-3 text-slate-500">جلسه‌ای برای این دانش‌آموز ثبت نشده است.</p>}
                  {attendanceHistory.map(({ session, row }) => <div key={session.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-bold">{toPersianDigits(session.date)} • زنگ {toPersianDigits(session.period)}</span><span className={`font-bold ${row.status === 'absent' ? 'text-rose-700' : row.status === 'late' ? 'text-amber-800' : 'text-slate-700'}`}>{attendanceLabel(row.status)}</span></div>
                    <p className="text-slate-600 break-words">{session.subject} • {session.teacherName}</p>
                    <p className="text-[11px] text-slate-500">آخرین ثبت: {toPersianDigits(session.updatedAt || session.submittedAt)}</p>
                    {row.note && <p className="text-slate-600 break-words">{row.note}</p>}
                  </div>)}
                </div>
                {!!student.legacyAttendanceStats?.totalDays && <details className="mt-3 p-3 border border-amber-200 rounded-xl bg-amber-50 text-xs text-amber-900">
                  <summary className="min-h-11 flex items-center cursor-pointer font-bold">خلاصه قدیمی محفوظ: {toPersianDigits(student.legacyAttendanceStats.totalDays)} روز</summary>
                  <p className="leading-6">حاضر: {toPersianDigits(student.legacyAttendanceStats.presentDays)} • غایب: {toPersianDigits(student.legacyAttendanceStats.absentDays)} • تأخیر: {toPersianDigits(student.legacyAttendanceStats.lateDays)} • موجه: {toPersianDigits(student.legacyAttendanceStats.excusedDays)}</p>
                  <p className="mt-2 leading-6">این خلاصه ریزجلسه کامل ندارد و برای جلوگیری از شمارش دوباره با آمار جلسات جمع نشده است.</p>
                </details>}

              </div>
            </div>
          )}

          {/* TAB 4: Disciplinary & Honors */}
          {activeTab === 'discipline' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 text-sm sm:text-base">سوابق انضباطی، تشویقی‌ها و تقدیرنامه‌ها</h4>
                {canManageDiscipline && (
                  <button
                    onClick={() => setShowAddDiscipline(!showAddDiscipline)}
                    className="text-xs bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    ثبت مورد جدید
                  </button>
                )}
              </div>

              {showAddDiscipline && (
                <form onSubmit={handleAddDiscipline} className="bg-teal-50/70 p-4 rounded-xl border border-teal-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">نوع مورد:</label>
                      <select
                        value={newDiscType}
                        onChange={(e) => setNewDiscType(e.target.value as typeof newDiscType)}
                        className="w-full text-[13px] sm:text-sm p-2 bg-white border border-slate-300 rounded-lg"
                      >
                        <option value="تشویقی">تشویقی و تقدیرنامه</option>
                        <option value="تذکر">تذکر شفاهی/کتبی</option>
                        <option value="تاخیر">ثبت تاخیر انضباطی</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">عنوان موضوع:</label>
                      <input
                        type="text"
                        placeholder="مثال: رتبه مسابقات علمی، تاخیر مکرر"
                        value={newDiscTitle}
                        onChange={(e) => setNewDiscTitle(e.target.value)}
                        className="w-full text-[13px] sm:text-sm p-2 bg-white border border-slate-300 rounded-lg"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">توضیحات و مصوبه شورا:</label>
                      <textarea
                        rows={2}
                        value={newDiscNote}
                        onChange={(e) => setNewDiscNote(e.target.value)}
                        placeholder="شرح کامل رویداد و اقدامات صورت گرفته..."
                        className="w-full text-[13px] sm:text-sm p-2 bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddDiscipline(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium"
                    >
                      ثبت در پرونده
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {student.disciplinaryRecords && student.disciplinaryRecords.length > 0 ? (
                  student.disciplinaryRecords.map((rec) => (
                    <div
                      key={rec.id}
                      className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                        rec.type === 'تشویقی'
                          ? 'bg-emerald-50/80 border-emerald-200'
                          : rec.type === 'تذکر'
                          ? 'bg-rose-50/80 border-rose-200'
                          : 'bg-amber-50/80 border-amber-200'
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-white shrink-0 shadow-2xs">
                        {rec.type === 'تشویقی' ? (
                          <Award className="w-5 h-5 text-emerald-600" />
                        ) : rec.type === 'تذکر' ? (
                          <ShieldAlert className="w-5 h-5 text-rose-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-slate-800 text-sm">{rec.title}</span>
                          <span className="text-xs text-slate-500 font-mono">{toPersianDigits(rec.date)}</span>
                        </div>
                        <p className="text-slate-600 text-xs leading-relaxed mb-1">{toPersianDigits(rec.note)}</p>
                        <span className="text-[11px] text-slate-400">ثبت‌کننده: {rec.recordedBy}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white p-6 text-center rounded-xl border border-slate-200 text-slate-500 text-xs">
                    مورد انضباطی یا تشویقی برای این دانش‌آموز ثبت نشده است.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: Past Academic Years */}
          {activeTab === 'pastYears' && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 text-sm mb-3">سوابق تحصیلی دوره‌ها و سال‌های قبل</h4>
              {student.pastYearHistory && student.pastYearHistory.length > 0 ? (
                student.pastYearHistory.map((py, pIdx) => (
                  <div key={pIdx} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                    <div>
                      <div className="text-xs font-semibold text-teal-700 mb-0.5">{toPersianDigits(py.year)} - {py.grade}</div>
                      <div className="font-bold text-slate-800 text-sm sm:text-base">{py.schoolName}</div>
                      <div className="text-xs text-slate-500 mt-1">وضعیت پایان دوره: <strong className={py.status === 'قبول خرداد' || py.status === 'قبول با رتبه ممتاز' ? 'text-emerald-700' : py.status === 'دارای تجدید' || py.status === 'نیازمند بررسی' ? 'text-amber-800' : 'text-slate-700'}>{py.status}</strong></div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-[11px] text-slate-400 block">معدل کارنامه</span>
                        <span className="text-base font-black text-teal-800">{formatPersianScore(py.gpa)}</span>
                      </div>
                      <div className="text-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-[11px] text-slate-400 block">انضباط</span>
                        <span className="text-base font-black text-emerald-800">{formatPersianScore(py.disciplineScore)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white p-6 text-center rounded-xl border border-slate-200 text-slate-500 text-xs">
                  اطلاعات دوره‌های گذشته هنوز بایگانی نشده است.
                </div>
              )}
            </div>
          )}

          {/* TAB 6: Financial and Tuition */}
          {activeTab === 'finances' && canViewFinances && (
            <StudentFinancialTab student={student} />
          )}
        </div>

        {/* Modal Footer */}
        <div className="student-sheet-footer shrink-0 border-t border-[#e5ebdd] bg-white px-4 pt-3 pb-4 sm:flex sm:items-center sm:justify-between sm:gap-3 sm:px-6">
          <div className="hidden text-[11px] text-[#98a38e] sm:block">
            سامانه هوشمند مدارس شهرستان • پرونده الکترونیک دانش‌آموز
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <button
              onClick={() => window.print()}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#dfe6d7] px-4 text-xs font-bold text-[#708363] hover:bg-[#f4f7ef]"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              چاپ این بخش
            </button>
            <button
              onClick={onClose}
              className="min-h-11 rounded-xl bg-[#245442] px-5 text-xs font-bold text-white transition-colors hover:bg-[#193e31]"
            >
              بستن
            </button>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
};
