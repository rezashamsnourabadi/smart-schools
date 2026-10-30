import {CommunityPanel} from './CommunityPanel';
import React, {useEffect, useRef, useState} from 'react';
import {AnimatePresence, motion, useReducedMotion} from 'motion/react';
import {
  ArrowUpLeft, Award, BookOpen, CalendarDays, Check, CheckCircle2,
  ChevronLeft, ClipboardList, Clock3, FileText, GraduationCap, LayoutDashboard,
  Megaphone, MessageSquare, Paperclip, Pin, Send, Sparkles, Trash2, UploadCloud,
  Wallet, X, type LucideIcon,
} from 'lucide-react';
import {useApp} from '../context/AppContext';
import type {HomeworkItem, HomeworkSubmission, ScheduleSlot, Student} from '../types';
import {attendanceLabel, isSlotLive} from '../utils/attendance';
import {formatPersianScore, toPersianDigits} from '../utils/persianUtils';
import {MAX_LOCAL_ATTACHMENT_BYTES, MAX_LOCAL_ATTACHMENT_LABEL} from '../utils/localAttachments';
import {SponsorBannerCard} from './SponsorBannerCard';
import {ResourcePager} from './ResourcePager';
import {DanaPlusSection} from './DanaPlusSection';

type View = 'overview' | 'homework' | 'schedule' | 'announcements';
type DossierTab = 'profile' | 'reportCards' | 'attendance' | 'discipline' | 'pastYears' | 'finances';
interface Attachment {name: string; size: string; url: string; type: 'image' | 'pdf'}
interface Draft {text: string; attachment?: Attachment; error?: string}
interface Props {onOpenQuestionBank: () => void; onOpenStudentDossier?: (student: Student, tab?: DossierTab) => void}

function SectionHeading({icon: Icon, title, subtitle, action}: {icon: LucideIcon; title: string; subtitle?: string; action?: React.ReactNode}) {
  return <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center student-section-icon rounded-2xl bg-[#eef3e9] text-[#64825d]"><Icon className="size-5" strokeWidth={1.6} aria-hidden="true"/></span><div className="min-w-0"><h2 className="text-sm font-bold text-[#24463c] sm:text-base">{title}</h2>{subtitle&&<p className="mt-1 text-[11px] leading-5 text-slate-500">{subtitle}</p>}</div></div>{action}</div>;
}
function EmptyState({children, icon: Icon = BookOpen}: {children: React.ReactNode; icon?: LucideIcon}) {
  return <div role="status" className="rounded-2xl border border-dashed border-[#dce5d7] bg-[#fafbf8] px-4 py-7 text-center"><Icon className="mx-auto mb-3 size-6 text-[#9bab8e]" strokeWidth={1.5} aria-hidden="true"/><p className="text-xs leading-7 text-slate-500">{children}</p></div>;
}
function FileLinks({files}: {files?: {name: string; url?: string}[]}) {
  return files?.some(file=>file.url)?<div className="flex flex-wrap gap-2">{files.map((file,index)=>file.url&&<a key={`${file.name}-${index}`} href={file.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs text-teal-800"><Paperclip className="size-3.5 shrink-0" aria-hidden="true"/><span className="min-w-0 break-all">{file.name}</span><ArrowUpLeft className="size-3 shrink-0" aria-hidden="true"/></a>)}</div>:null;
}
function Lesson({slot, live = false}: {slot: ScheduleSlot; live?: boolean}) {
  return <div className={`flex items-start gap-3 rounded-2xl border p-3.5 ${live?'border-[#aac8ad] bg-[#f0f6ec]':'border-[#e5eae0] bg-white'}`}>
    <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${live?'bg-[#1e5041] text-white':'bg-[#f1f4ed] text-[#7b8c70]'}`}>{toPersianDigits(slot.period)}</span>
    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="break-words text-sm font-bold text-slate-800">{slot.subject}</h3>{live&&<span className="rounded-full bg-[#dcebd5] px-2 py-0.5 text-[10px] text-[#426b3e]">اکنون</span>}</div><p className="mt-1.5 break-words text-[11px] text-slate-500">{slot.teacherName}</p><p className="mt-2 inline-flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500"><Clock3 className="size-3" aria-hidden="true"/><span dir="ltr">{toPersianDigits(slot.startTime)} – {toPersianDigits(slot.endTime)}</span></p></div>
  </div>;
}
function HomeworkCard({item, submission, responsesComplete, responsesLoading, onSubmit}: {item: HomeworkItem; submission?: HomeworkSubmission; responsesComplete: boolean; responsesLoading: boolean; onSubmit: (item: HomeworkItem) => void}) {
  return <article id={`student-homework-${item.id}`} className="min-w-0 overflow-hidden rounded-2xl border border-[#e1e7dc] bg-white p-4 sm:p-5">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><span className="rounded-lg bg-[#edf3e7] px-2.5 py-1 text-[10px] font-bold text-[#617c51]">{item.subject}</span><span className="inline-flex items-center gap-1 text-[10px] text-slate-500"><Clock3 className="size-3" aria-hidden="true"/>تا {toPersianDigits(item.dueDate)}</span></div>
    <h3 className="break-words text-sm font-bold leading-7 text-[#29463b]">{item.title}</h3><p className="mt-2 whitespace-pre-wrap break-words text-xs leading-7 text-slate-500">{item.description}</p>
    {!!item.attachments?.length&&<div className="mt-3"><FileLinks files={item.attachments}/></div>}
    <div className="mt-4 border-t border-[#edf0e8] pt-3">
      {submission?<div className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4f7d52]"><CheckCircle2 className="size-4 shrink-0" aria-hidden="true"/>پاسخ ارسال شده</span><span className="rounded-lg bg-[#f2f5ed] px-2 py-1 text-[10px] text-slate-500">{submission.status==='graded'?`نمره: ${formatPersianScore(submission.teacherScore)} از ${toPersianDigits(20)}`:'در انتظار بررسی دبیر'}</span></div>
        <p className="text-[10px] text-slate-400">تاریخ ارسال: {toPersianDigits(submission.submissionDate)}</p>
        {submission.teacherFeedback&&<p className="flex items-start gap-2 rounded-xl bg-[#f6f8f2] p-3 text-xs leading-7 text-[#51634c]"><MessageSquare className="mt-1 size-4 shrink-0" aria-hidden="true"/><span><strong>بازخورد دبیر: </strong>{submission.teacherFeedback}</span></p>}
        <details className="rounded-xl border border-slate-100 px-3"><summary className="flex min-h-11 cursor-pointer items-center gap-2 text-[11px] text-slate-500"><FileText className="size-3.5" aria-hidden="true"/>مشاهده پاسخ ارسالی من</summary><div className="space-y-3 pb-3"><p className="whitespace-pre-wrap break-words text-xs leading-7 text-slate-600">{submission.textContent}</p><FileLinks files={submission.attachments}/></div></details>
      </div>:<div className="flex flex-wrap items-center justify-between gap-2"><span className="text-[11px] text-[#9a825a]">{responsesLoading?'در حال دریافت وضعیت پاسخ…':responsesComplete?'هنوز پاسخی نفرستاده‌ای':'پاسخ این تکلیف در صفحه فعلی پاسخ‌ها نیست'}</span><button id={`submit-homework-${item.id}`} type="button" disabled={responsesLoading} onClick={()=>onSubmit(item)} className="disabled:opacity-50 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#205343] px-4 text-xs font-bold text-white transition-colors hover:bg-[#173f34]"><Send className="size-3.5" aria-hidden="true"/>ارسال پاسخ</button></div>}
    </div>
  </article>;
}

export const StudentDashboard: React.FC<Props> = ({onOpenQuestionBank, onOpenStudentDossier}) => {
  const {schedule, questionBank, homework, homeworkSubmissions, submitHomework, exams, currentStudent, announcements, openStudentDossier, schoolClock, classes, page, activeMobileTab, setActiveMobileTab} = useApp();
  const reducedMotion=useReducedMotion();
  const [scheduleDay,setScheduleDay]=useState(schoolClock.dayOfWeek);
  const view:View=activeMobileTab==='homework'||activeMobileTab==='schedule'||activeMobileTab==='announcements'?activeMobileTab:'overview';
  const setView=(next:View)=>setActiveMobileTab(next==='overview'?'dashboard':next);
  const sampleQuestion=questionBank[0];
  const [selectedOption,setSelectedOption]=useState<string|null>(null),[answerShown,setAnswerShown]=useState(false);
  const [activeHomework,setActiveHomework]=useState<HomeworkItem|null>(null),[drafts,setDrafts]=useState<Record<string,Draft>>({});
  const [sending,setSending]=useState(false),[sendError,setSendError]=useState('');
  const closeHomeworkRef=useRef<HTMLButtonElement>(null);
  useEffect(()=>{setSelectedOption(null);setAnswerShown(false);},[sampleQuestion?.id]);
  useEffect(()=>{
    if(!activeHomework)return;
    const previousFocus=document.activeElement;
    document.body.classList.add('student-submit-open');closeHomeworkRef.current?.focus();
    return()=>{document.body.classList.remove('student-submit-open');if(previousFocus instanceof HTMLElement&&previousFocus.isConnected)previousFocus.focus();};
  },[activeHomework?.id]);
  if(!currentStudent)return <div id="student-no-linked-record"><EmptyState icon={GraduationCap}>پرونده‌ای برای این حساب در مدرسه انتخاب‌شده یافت نشد.</EmptyState></div>;

  const openDossier=(tab:DossierTab='profile')=>{
    if(onOpenStudentDossier)onOpenStudentDossier(currentStudent,tab);else openStudentDossier(currentStudent,tab);
  };
  const openHomework=(item:HomeworkItem)=>{setSendError('');setActiveHomework(item);};
  const draft:Draft=activeHomework?drafts[activeHomework.id]||{text:''}:{text:''};
  const updateDraft=(change:Partial<Draft>)=>{if(activeHomework)setDrafts(previous=>({...previous,[activeHomework.id]:{...previous[activeHomework.id]||{text:''},...change}}));};
  const readFile=(event:React.ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0],homeworkId=activeHomework?.id;if(!file||!homeworkId)return;
    const setFileError=(error:string)=>setDrafts(previous=>({...previous,[homeworkId]:{...previous[homeworkId]||{text:''},error}}));
    if(file.size>MAX_LOCAL_ATTACHMENT_BYTES){setFileError(`حداکثر اندازه پیوست ${MAX_LOCAL_ATTACHMENT_LABEL} است.`);event.target.value='';return;}
    if(!file.type.startsWith('image/')&&file.type!=='application/pdf'){setFileError('یک تصویر یا فایل PDF انتخاب کنید.');event.target.value='';return;}
    const reader=new FileReader();reader.onerror=()=>setFileError('خواندن فایل ممکن نشد؛ دوباره انتخاب کنید.');
    reader.onload=()=>{
      if(typeof reader.result!=='string'){setFileError('خواندن فایل ممکن نشد؛ دوباره انتخاب کنید.');return;}
      const attachment:Attachment={name:file.name,size:`${toPersianDigits((file.size/1024/1024).toFixed(1))} مگابایت`,url:reader.result,type:file.type.startsWith('image/')?'image':'pdf'};
      setDrafts(previous=>({...previous,[homeworkId]:{...previous[homeworkId]||{text:''},attachment,error:undefined}}));
    };reader.readAsDataURL(file);
  };
  const sendHomework=async(event:React.FormEvent)=>{
    event.preventDefault();if(!activeHomework||!draft.text.trim()||sending)return;setSending(true);setSendError('');
    const id=activeHomework.id;
    try{
      const result=await submitHomework({homeworkId:id,studentId:currentStudent.id,studentName:currentStudent.name,textContent:draft.text.trim(),attachments:draft.attachment?[{name:draft.attachment.name,type:draft.attachment.type,url:draft.attachment.url}]:[]});
      if(!result.ok){setSendError(result.error);return;}
      setDrafts(previous=>{const next={...previous};delete next[id];return next;});setActiveHomework(null);
    }catch(error){setSendError(error instanceof Error?error.message:'ارسال ممکن نشد؛ دوباره تلاش کنید.');}finally{setSending(false);}
  };
  const studentAnnouncements=announcements.filter(item=>item.target==='all'||item.target==='students');
  const todayLessons=schedule.filter(slot=>slot.dayOfWeek===schoolClock.dayOfWeek).slice().sort((a,b)=>a.period-b.period);
  const selectedLessons=schedule.filter(slot=>slot.dayOfWeek===scheduleDay).slice().sort((a,b)=>a.period-b.period);
  const studentClass=classes.find(item=>item.id===currentStudent.classGroupId);
  const tabs:{id:View;title:string;icon:LucideIcon}[]=[{id:'overview',title:'خانه',icon:LayoutDashboard},{id:'homework',title:'تکلیف و آزمون',icon:BookOpen},{id:'schedule',title:'برنامه کلاس',icon:CalendarDays},{id:'announcements',title:'اطلاعیه‌ها',icon:Megaphone}];
  const activeHomeworks=view==='overview'?homework.slice(0,2):homework;
  const visibleAnnouncements=view==='overview'?studentAnnouncements.slice(0,2):studentAnnouncements;
  const smallAction=(target:View)=><button type="button" onClick={()=>setView(target)} className="inline-flex min-h-11 items-center gap-1 text-[11px] font-bold text-[#6d8561]">مشاهده همه<ChevronLeft className="size-3.5" aria-hidden="true"/></button>;

  return <div id="student-dashboard-view" className="student-dashboard min-w-0 space-y-4 sm:space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#64765a]"><h1 className="font-bold text-[#34543e]">میز کار من · {studentClass?.name||currentStudent.grade}</h1><button id="student-today-attendance" type="button" onClick={()=>openDossier('attendance')} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2"><Clock3 className="size-4" aria-hidden="true"/>حضور امروز: {attendanceLabel(currentStudent.todayStatus)}<ChevronLeft className="size-3" aria-hidden="true"/></button></div>

    <section aria-label="دسترسی‌های شخصی" className="grid grid-cols-4 gap-2 sm:gap-3">
      {([{id:'profile',label:'پرونده من',icon:GraduationCap,tone:'bg-[#e8f1e4] text-[#6c8b53]'},{id:'reportCards',label:'کارنامه',icon:Award,tone:'bg-[#fcf0d8] text-[#b18a43]'},{id:'attendance',label:'حضور و غیاب',icon:ClipboardList,tone:'bg-[#e6f0f5] text-[#688fa1]'},{id:'finances',label:'امور مالی',icon:Wallet,tone:'bg-[#f2e9f3] text-[#9878a0]'}] as const).map(({id,label,icon:Icon,tone})=><button id={`student-open-${id}`} key={id} type="button" onClick={()=>openDossier(id)} className="student-personal-link flex min-h-[92px] min-w-0 flex-col items-center justify-center gap-2.5 rounded-2xl border border-[#e2e8dc] bg-white px-1 py-3 text-[10px] font-bold leading-5 text-[#5b6b52] transition-colors hover:border-[#9eb690] hover:bg-[#f8faf5] sm:min-h-[90px] sm:text-xs"><span className={`flex size-10 items-center justify-center rounded-2xl ${tone}`}><Icon className="size-5" strokeWidth={1.6} aria-hidden="true"/></span><span className="break-words text-center">{label}</span></button>)}
    </section>

    <nav aria-label="بخش‌های صفحه دانش‌آموز" className="grid grid-cols-4 gap-1 rounded-2xl border border-[#e2e8dc] bg-white p-1" role="group">{tabs.map(({id,title,icon:Icon})=><button id={`student-tab-${id}`} key={id} aria-pressed={view===id} aria-controls="student-workspace-panel" type="button" onClick={()=>setView(id)} className={`flex min-h-16 min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl px-1 text-[10px] font-bold transition-colors sm:min-h-12 sm:flex-row sm:gap-2 sm:text-xs ${view===id?'bg-[#eaf1e4] text-[#3c6344]':'text-slate-400 hover:bg-[#f7f9f3] hover:text-[#66805a]'}`}><Icon className="size-4 shrink-0" aria-hidden="true"/><span className="break-words text-center leading-5">{title}</span></button>)}</nav>

    <SponsorBannerCard audienceFilter="students" variant="compact"/>
    <CommunityPanel compact/>

    <div id="student-workspace-panel" role="region" aria-labelledby={`student-tab-${view}`} className="min-w-0 space-y-5 sm:space-y-6">
      {view==='schedule'&&<section id="student-weekly-schedule" className="space-y-5 rounded-3xl border border-[#e2e8dc] bg-white p-4 sm:p-6"><SectionHeading icon={CalendarDays} title="برنامه هفتگی کلاس" subtitle="روز موردنظر را انتخاب کن."/><label className="flex flex-wrap items-center gap-3 text-xs text-slate-500">روز هفته<select id="student-schedule-day" value={scheduleDay} onChange={event=>setScheduleDay(event.target.value)} className="min-h-12 min-w-0 flex-1 rounded-xl border border-[#dfe6d8] bg-[#f8faf5] px-3 text-sm text-[#39583f]">{['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'].map(day=><option key={day} value={day}>{day}{day===schoolClock.dayOfWeek?' (امروز)':''}</option>)}</select></label><div className="grid gap-3 md:grid-cols-2">{selectedLessons.map(slot=><Lesson key={slot.id} slot={slot} live={isSlotLive(slot,schoolClock)}/>)}</div>{!selectedLessons.length&&<EmptyState icon={CalendarDays}>{page('schedule').loading?'در حال دریافت برنامه…':'برای این روز در فهرست فعلی برنامه‌ای ثبت نشده است.'}</EmptyState>}<ResourcePager kind="schedule"/></section>}

      {(view==='overview'||view==='homework')&&<div className={`grid min-w-0 gap-5 ${view==='overview'?'xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]':''}`}>
        <section id="student-homework-list" className="min-w-0 space-y-4 rounded-3xl border border-[#e2e8dc] bg-[#fbfcf9] p-4 sm:p-6"><SectionHeading icon={BookOpen} title="تکلیف‌های من" subtitle="تمرین‌ها، پاسخ‌ها و بازخورد دبیر" action={view==='overview'?smallAction('homework'):undefined}/>{!homework.length&&<EmptyState>{page('homework').loading?'در حال دریافت تکلیف‌ها…':'تکلیفی در این فهرست ثبت نشده است.'}</EmptyState>}<div className={`grid gap-3 ${view==='homework'?'lg:grid-cols-2':''}`}>{activeHomeworks.map(item=><HomeworkCard key={item.id} item={item} responsesLoading={page('homeworkSubmissions').loading} responsesComplete={page('homeworkSubmissions').total<=homeworkSubmissions.length} submission={homeworkSubmissions.find(submission=>submission.homeworkId===item.id&&submission.studentId===currentStudent.id)} onSubmit={openHomework}/>)}</div>{view==='homework'&&<><ResourcePager kind="homework"/>{page('homeworkSubmissions').total>25&&<div className="space-y-2"><p className="text-[11px] text-slate-500">صفحه پاسخ‌های ثبت‌شده</p><ResourcePager kind="homeworkSubmissions"/></div>}</>}</section>
        {view==='overview'&&<section id="student-today-schedule" className="min-w-0 space-y-4 rounded-3xl border border-[#e2e8dc] bg-white p-4 sm:p-6"><SectionHeading icon={CalendarDays} title="برنامه امروز" subtitle={schoolClock.dayOfWeek} action={smallAction('schedule')}/>{todayLessons.length?<div className="space-y-2.5">{todayLessons.map(slot=><Lesson key={slot.id} slot={slot} live={isSlotLive(slot,schoolClock)}/>)}</div>:<EmptyState icon={CalendarDays}>{page('schedule').loading?'در حال دریافت برنامه…':'در فهرست فعلی برای امروز کلاسی ثبت نشده است.'}<button type="button" onClick={()=>setView('schedule')} className="mx-auto mt-2 flex min-h-11 items-center gap-1 font-bold text-[#5d7b52]">دیدن برنامه هفته<ChevronLeft className="size-3" aria-hidden="true"/></button></EmptyState>}</section>}
        <section id="student-exam-list" className={`min-w-0 space-y-4 rounded-3xl border border-[#e2e8dc] bg-white p-4 sm:p-6 ${view==='overview'?'xl:col-span-2':''}`}><SectionHeading icon={ClipboardList} title="آزمون‌های پیش‌رو" subtitle="زمان‌بندی آزمون‌های ثبت‌شده مدرسه" action={view==='overview'?smallAction('homework'):undefined}/>{!exams.length?<EmptyState icon={ClipboardList}>{page('exams').loading?'در حال دریافت زمان‌بندی آزمون‌ها…':'آزمونی در این فهرست برنامه‌ریزی نشده است.'}</EmptyState>:<div className="grid gap-3 md:grid-cols-2">{(view==='overview'?exams.slice(0,2):exams).map(exam=><article key={exam.id} className="min-w-0 rounded-2xl border border-[#e5e9df] bg-[#f8faf4] p-4"><span className="text-[10px] font-bold text-[#8b9877]">{exam.subject}</span><h3 className="mt-2 break-words text-sm font-bold leading-7 text-[#35513d]">{exam.title}</h3><p className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500"><CalendarDays className="size-3.5" aria-hidden="true"/>{toPersianDigits(exam.examDate)}<span dir="ltr">{toPersianDigits(exam.startTime)}</span><span>· {toPersianDigits(exam.durationMinutes)} دقیقه</span></p><p className="mt-3 border-t border-[#e6ecde] pt-3 text-[10px] leading-6 text-slate-400">{toPersianDigits(exam.questions.length)} سؤال ثبت‌شده · شرکت آنلاین فعال نیست.</p></article>)}</div>}{view==='homework'&&<ResourcePager kind="exams"/>}</section>
      </div>}


      {(view==='overview'||view==='announcements')&&<section id="student-announcements" className="space-y-4 rounded-3xl border border-[#e2e8dc] bg-white p-4 sm:p-6"><SectionHeading icon={Megaphone} title="خبرهای مدرسه" subtitle="اطلاعیه‌ها و رویدادهای مرتبط با شما" action={view==='overview'?smallAction('announcements'):undefined}/>{!visibleAnnouncements.length&&<EmptyState icon={Megaphone}>{page('announcements').loading?'در حال دریافت اطلاعیه‌ها…':'هنوز اطلاعیه‌ای برای نمایش وجود ندارد.'}</EmptyState>}<div className="grid gap-3 lg:grid-cols-2">{visibleAnnouncements.map(item=><article key={item.id} className={`min-w-0 rounded-2xl border p-4 ${item.isPinned?'border-[#d4dfbf] bg-[#f7f9f0]':'border-slate-100 bg-[#fafbf8]'}`}><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><span className="inline-flex items-center gap-1 text-[10px] text-[#7e906a]">{item.isPinned&&<><Pin className="size-3" aria-hidden="true"/>سنجاق‌شده</>}</span><span className="text-[10px] text-slate-400">{toPersianDigits(item.date)}</span></div><div className="flex flex-wrap items-start gap-2"><h3 className="min-w-0 break-words text-sm font-bold leading-7 text-slate-800">{item.title}</h3>{item.priority==='urgent'&&<span className="rounded-md bg-rose-50 px-2 py-1 text-[10px] text-rose-700">فوری</span>}</div><p className="mt-2 whitespace-pre-wrap break-words text-xs leading-7 text-slate-500">{item.content}</p>{item.eventDate&&<p className="mt-3 text-[11px] text-slate-500">زمان رویداد: {toPersianDigits(item.eventDate)}{item.eventLocation&&<> · {item.eventLocation}</>}</p>}{!!item.attachments?.length&&<div className="mt-3"><FileLinks files={item.attachments}/></div>}<p className="mt-3 border-t border-[#e9ede3] pt-3 text-[10px] text-slate-400">از طرف {item.senderName}</p></article>)}</div>{view==='announcements'&&<ResourcePager kind="announcements"/>}</section>}


      {view==='overview'&&<section id="student-practice" className="space-y-5 rounded-3xl border border-[#dce5d3] bg-[#f1f5ea] p-4 sm:p-6"><SectionHeading icon={Sparkles} title="یک تمرین کوتاه" subtitle="از بانک سؤال شهرستان" action={<button id="student-open-question-bank" onClick={onOpenQuestionBank} className="inline-flex min-h-11 items-center gap-1 text-[11px] font-bold text-[#5c7b4e]">بانک سؤال<ArrowUpLeft className="size-3.5" aria-hidden="true"/></button>}/>{sampleQuestion?<div className="space-y-4"><div className="flex flex-wrap gap-2 text-[10px] text-[#799366]"><span>{sampleQuestion.subject}</span><span>· {sampleQuestion.difficulty}</span></div><h3 className="break-words text-sm font-bold leading-7 text-[#36523d]">{sampleQuestion.title}</h3><p className="whitespace-pre-wrap break-words text-xs leading-8 text-[#63715c]">{sampleQuestion.content}</p>{sampleQuestion.options&&<><p className="text-[11px] text-[#7e8d70]">یک گزینه را انتخاب کن تا پاسخ تمرینی را ببینی.</p><div className="grid gap-2 sm:grid-cols-2">{sampleQuestion.options.map((option,index)=>{const correct=option===sampleQuestion.correctAnswer,chosen=option===selectedOption;return <button key={index} type="button" aria-pressed={chosen} onClick={()=>{setSelectedOption(option);setAnswerShown(true);}} className={`flex min-h-12 items-center gap-3 rounded-xl border p-3 text-right text-xs leading-6 transition-colors ${answerShown&&correct?'border-[#91b48b] bg-[#e5efd9] text-[#385f34]':answerShown&&chosen?'border-rose-200 bg-rose-50 text-rose-700':'border-[#dee6d3] bg-white/80 text-slate-600 hover:border-[#9db78a]'}`}><span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-black/[0.03] text-[10px]">{toPersianDigits(index+1)}</span><span className="min-w-0 break-words">{option}</span>{answerShown&&correct&&<Check className="ms-auto size-4 shrink-0" aria-hidden="true"/>}</button>;})}</div>{answerShown&&<div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/70 p-3 text-xs leading-7 text-[#516d44]"><span>پاسخ تمرینی: <strong>{sampleQuestion.correctAnswer}</strong></span><button type="button" onClick={()=>{setSelectedOption(null);setAnswerShown(false);}} className="min-h-11 px-2 font-bold">تلاش دوباره</button></div>}<p className="text-[10px] leading-6 text-[#8c997f]">طراح: {sampleQuestion.authorName} · این تمرین، نتیجه آزمون ثبت نمی‌کند.</p></>}</div>:<EmptyState>{page('questionBank').loading?'در حال دریافت تمرین…':'هنوز سؤالی در بانک قابل نمایش نیست.'}</EmptyState>}</section>}
    </div>

    {view==='overview'&&<DanaPlusSection/>}

    <AnimatePresence>{activeHomework&&<motion.div id="student-homework-modal" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reducedMotion?0:0.16}} className="fixed inset-0 z-[85] flex items-end justify-center bg-[#16382c]/45 sm:items-center sm:p-4"><motion.section role="dialog" aria-modal="true" aria-labelledby="student-homework-modal-title" initial={{y:reducedMotion?0:18}} animate={{y:0}} exit={{y:reducedMotion?0:18}} className="student-homework-sheet flex w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-[#e2e8dc] bg-white shadow-2xl sm:rounded-3xl">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#edf0e8] p-4 sm:px-6"><div className="min-w-0"><p className="mb-1 text-[10px] text-[#8b9b7c]">{activeHomework.subject}</p><h2 id="student-homework-modal-title" className="break-words text-sm font-bold text-[#31513c]">ارسال پاسخ تکلیف</h2></div><button id="student-close-homework" ref={closeHomeworkRef} type="button" disabled={sending} onClick={()=>setActiveHomework(null)} aria-label="بستن فرم تکلیف" className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-[#f4f6ef] text-slate-500 disabled:opacity-40"><X className="size-5" aria-hidden="true"/></button></header>
      <form onSubmit={sendHomework} className="flex min-h-0 flex-1 flex-col"><div className="min-h-0 space-y-5 overflow-y-auto overscroll-contain p-4 sm:p-6"><div className="space-y-2 rounded-2xl border border-[#e4eadd] bg-[#f7f9f3] p-4"><h3 className="break-words text-sm font-bold text-[#3f5b43]">{activeHomework.title}</h3><p className="whitespace-pre-wrap break-words text-xs leading-7 text-slate-500">{activeHomework.description}</p><p className="flex flex-wrap justify-between gap-2 text-[10px] text-[#94a087]"><span>{activeHomework.teacherName}</span><span>تا {toPersianDigits(activeHomework.dueDate)}</span></p><FileLinks files={activeHomework.attachments}/></div>
      <label htmlFor="student-homework-answer" className="block text-xs font-bold text-[#4c6350]">پاسخ و توضیحات تو<textarea id="student-homework-answer" required rows={5} value={draft.text} onChange={event=>updateDraft({text:event.target.value})} placeholder="پاسخ و مراحل حل تمرین را اینجا بنویس…" className="mt-2 w-full resize-y rounded-2xl border border-[#dce4d4] bg-[#fcfdfb] p-3 text-sm font-normal leading-8 text-slate-700 outline-none focus:border-[#8ca77b] focus:ring-2 focus:ring-[#edf3e6]"/></label>
      <div className="space-y-2"><p className="text-xs font-bold text-[#4c6350]">پیوست پاسخ <span className="font-normal text-slate-400">(اختیاری)</span></p><input id="student-solution-upload" type="file" accept="image/*,application/pdf" onChange={readFile} className="peer sr-only"/><label htmlFor="student-solution-upload" className="flex min-h-20 cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed border-[#b8c9aa] bg-[#f8faf5] p-4 text-xs text-[#7a9068] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal-700"><UploadCloud className="size-5 shrink-0" aria-hidden="true"/><span>انتخاب تصویر یا PDF<br/><span className="mt-1 block text-[10px] text-slate-400">حداکثر {MAX_LOCAL_ATTACHMENT_LABEL}</span></span></label>{draft.attachment&&<div className="flex items-center gap-3 rounded-xl border border-[#dce7d2] bg-[#f5f9ef] p-3">{draft.attachment.type==='image'?<img src={draft.attachment.url} alt="پیش‌نمایش پیوست پاسخ" className="size-10 shrink-0 rounded-lg object-cover"/>:<FileText className="size-7 shrink-0 text-[#7a9568]" aria-hidden="true"/>}<div className="min-w-0 flex-1 text-xs"><p className="break-all font-bold text-[#536d47]">{draft.attachment.name}</p><p className="mt-1 text-[10px] text-slate-400">{draft.attachment.size}</p></div><button type="button" onClick={()=>updateDraft({attachment:undefined,error:undefined})} aria-label="حذف پیوست" className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-rose-600 hover:bg-rose-50"><Trash2 className="size-4" aria-hidden="true"/></button></div>}{draft.error&&<p role="alert" className="text-xs leading-6 text-rose-700">{draft.error}</p>}</div>
      {sendError&&<p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs leading-7 text-rose-700">{sendError}</p>}<p className="text-[10px] leading-6 text-slate-400">پاسخ تا زمان ارسال موفق در همین صفحه حفظ می‌شود. پیوست همراه پاسخ در سرور ذخیره خواهد شد.</p></div>
      <footer className="student-sheet-footer flex shrink-0 items-center gap-2 border-t border-[#e7ecdf] bg-white px-4 pt-3 pb-4 sm:px-6"><button type="submit" disabled={sending||!draft.text.trim()||!!draft.error} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#205343] px-3 text-xs font-bold text-white transition-colors hover:bg-[#173e33] disabled:opacity-50"><Send className="size-4" aria-hidden="true"/>{sending?'در حال ارسال…':'ارسال پاسخ به دبیر'}</button><button type="button" disabled={sending} onClick={()=>setActiveHomework(null)} className="min-h-12 rounded-xl px-4 text-xs text-slate-500 disabled:opacity-40">بعداً ارسال می‌کنم</button></footer></form>
    </motion.section></motion.div>}</AnimatePresence>
  </div>;
};
