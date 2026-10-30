import React,{useState} from 'react';
import {Award,Check,ChevronDown,MessageSquare,Minus,Plus,RotateCcw,Save,Search,Settings2} from 'lucide-react';
import {useApp,useResource,useClassRoster} from '../context/AppContext';
import {getSchoolDate,toEnglishDigits,toPersianDigits} from '../utils/persianUtils';
import {parseGradeScore} from '../utils/gradeUtils';
import type {TeachingContext,TeacherGrade} from '../types/teacher';
import {useTeacherWrite} from '../api/teacher';
import {TeachingDialog,TeachingSection} from './TeachingDialog';

interface Props {onClose:()=>void;initialContext?:TeachingContext;initialGrade?:TeacherGrade}
interface GradeDraft {scores:Record<string,string>;notes:Record<string,string>}
const categories={continuous:'نمره مستمر کلاسی',term1:'امتحان نوبت اول دی‌ماه',term2:'امتحان نوبت دوم خرداد',quiz:'کوییز و آزمون کلاسی'};
export const TeacherGradeEntryModal:React.FC<Props>=({onClose,initialContext,initialGrade})=>{
  const write=useTeacherWrite();
  useResource('grades',!initialContext);useResource('classes',!initialContext);
  const {classes,currentSchoolId,addGradeItem,currentUser,activeAcademicYear,schoolReadOnly}=useApp();
  const [selectedClass,setSelectedClass]=useState(initialContext?.classId||'');
  const classId=selectedClass||classes[0]?.id||'';
  const [subject,setSubject]=useState(initialContext?.subject||currentUser.teachingSubjects?.[0]||'');
  const [category,setCategory]=useState<keyof typeof categories>(initialGrade?.category||'continuous');
  const [title,setTitle]=useState(initialGrade?.title||'ارزشیابی مستمر کلاسی و حل تمرین'),[maxScore,setMaxScore]=useState(initialGrade?.maxScore||20);
  const [configOpen,setConfigOpen]=useState(false),[search,setSearch]=useState('');
  const [drafts,setDrafts]=useState<Record<string,GradeDraft>>(()=>initialGrade?{[initialGrade.classGroupId]:{scores:Object.fromEntries(initialGrade.scores.map(row=>[row.studentId,String(row.score)])),notes:Object.fromEntries(initialGrade.scores.map(row=>[row.studentId,row.note||'']))}}:{}),[noteOpen,setNoteOpen]=useState<Record<string,boolean>>({});
  const [error,setError]=useState(''),[saving,setSaving]=useState(false);
  const roster=useClassRoster(classId);
  const students=initialGrade?initialGrade.scores.map(row=>roster.data?.items.find(student=>student.id===row.studentId)||{id:row.studentId,name:'دانش‌آموز سابق کلاس',studentNumber:'',nationalCode:''}):roster.data?.items||[];
  const [correctionReason,setCorrectionReason]=useState('');
  const draft=drafts[classId]||{scores:{},notes:{}};
  const update=(values:Partial<GradeDraft>)=>setDrafts(previous=>({...previous,[classId]:{...previous[classId]||{scores:{},notes:{}},...values}}));
  const setScore=(id:string,value:string)=>{update({scores:{...draft.scores,[id]:value}});setError('');};
  const adjust=(id:string,delta:number)=>{const parsed=parseGradeScore(draft.scores[id]||'0',maxScore);if(parsed.ok)setScore(id,String(Math.max(0,Math.min(maxScore,parsed.value+delta))));};
  const fill=(value:number)=>{update({scores:Object.fromEntries(students.map(student=>[student.id,String(value)]))});setError('');};
  const filtered=students.filter(student=>student.name.includes(search.trim())||toEnglishDigits(student.studentNumber).includes(toEnglishDigits(search).trim())||toEnglishDigits(student.nationalCode).includes(toEnglishDigits(search).trim()));
  const gradedCount=students.filter(student=>parseGradeScore(draft.scores[student.id]||'',maxScore).ok).length;
  const enabled=!schoolReadOnly&&!!activeAcademicYear?.isCurrent&&activeAcademicYear.status==='active';
  const save=async(event:React.FormEvent)=>{
    event.preventDefault();if(saving||roster.isPending||roster.error)return;
    if(!students.length){setError('دانش‌آموز فعالی برای این کلاس وجود ندارد.');return;}
    if(!subject.trim()||!title.trim()||!Number.isFinite(maxScore)||maxScore<5||maxScore>100){setError('درس، عنوان و سقف نمره بین پنج تا صد را مشخص کنید.');setConfigOpen(true);return;}
    const parsed=students.map(student=>({student,result:parseGradeScore(draft.scores[student.id]||'',maxScore)}));
    const invalid=parsed.find(item=>!item.result.ok);
    if(invalid&&!invalid.result.ok){setError(`${invalid.student.name}: ${invalid.result.error}`);return;}
    setSaving(true);setError('');
    try{
      const payload={schoolId:currentSchoolId,classGroupId:classId,subject:subject.trim(),title:title.trim(),category,categoryTitle:categories[category],date:initialGrade?.date||getSchoolDate(),maxScore,scores:parsed.flatMap(({student,result})=>result.ok?[{studentId:student.id,score:result.value,note:draft.notes[student.id]||undefined}]:[])};
      const result=initialGrade?(await write(`/teacher/grades/${initialGrade.id}`,{version:initialGrade.version,reason:correctionReason,grade:{...payload,schoolId:undefined}},'PATCH',initialContext),{ok:true as const}):await addGradeItem(payload);
      if(!result.ok){setError(result.error);return;}onClose();
    }catch(error){setError(error instanceof Error?error.message:'ذخیره نمرات ممکن نشد؛ دوباره تلاش کنید.');}finally{setSaving(false);}
  };
  return <TeachingDialog id="teacher-grade-entry-dialog" title="دفتر نمره کلاس" description="ارزشیابی، ثبت نمره و یادداشت آموزشی دانش‌آموزان" icon={Award} onClose={onClose} busy={saving} notice={error?<p id="grade-entry-error" role="alert" className="teaching-error">{toPersianDigits(error)}</p>:undefined} footer={<div className="flex flex-wrap items-center justify-between gap-2"><p role="status" className="text-[11px] text-[#8b997b]">{toPersianDigits(gradedCount)} از {toPersianDigits(students.length)} نمره آماده است</p><button id="btn-save-grades-submit" type="submit" form="teacher-grade-form" disabled={saving||roster.isPending||!!roster.error||!students.length||!enabled} className="teaching-primary"><Save className="size-4" aria-hidden="true"/>{saving?'در حال ذخیره…':'ذخیره نمرات'}</button></div>}>
    <form id="teacher-grade-form" onSubmit={save} className="space-y-4">
      {initialGrade&&<label className="teaching-label">علت اصلاح<input required minLength={3} value={correctionReason} onChange={event=>setCorrectionReason(event.target.value)} className="teacher-text-input"/></label>}
      <fieldset disabled={saving} className="min-w-0 space-y-4">
        <TeachingSection title="کلاس و ارزشیابی">
          <label className="teaching-label">کلاس آموزشی<select id="grade-class-select" disabled={!!initialContext} value={classId} onChange={event=>{setSelectedClass(event.target.value);setSearch('');setError('');}}>{!classes.length&&<option value="">کلاسی در دسترس نیست</option>}{initialContext&&!classes.some(group=>group.id===initialContext.classId)&&<option value={initialContext.classId}>{initialContext.className}</option>}{classes.map(group=><option key={group.id} value={group.id}>{group.name}</option>)}</select></label>
<label className="teaching-label">نوع ارزشیابی / نوبت امتحان<select id="grade-category" value={category} onChange={event=>setCategory(event.target.value as typeof category)}>{Object.entries(categories).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><p className="text-[10px] leading-7 text-[#9aa58b]">این انتخاب فقط برای همین ارزشیابی است؛ به نوبت جاری مدرسه وابسته نیست.</p>
          <div className="rounded-2xl border border-[#eee4cb] bg-[#fffbf1] p-4"><p className="text-xs font-bold leading-7 text-[#8b784e]">{title}</p><div className="mt-2 flex flex-wrap gap-2 text-[10px] leading-6 text-[#a39470]"><span>{subject||'درس تعیین نشده'}</span><span>· {categories[category]}</span><span>· از {toPersianDigits(maxScore)}</span></div></div>
          <button id="btn-toggle-grade-config" type="button" aria-expanded={configOpen} aria-controls="grade-evaluation-settings" onClick={()=>setConfigOpen(!configOpen)} className="flex min-h-11 w-full items-center gap-2 text-[11px] font-bold text-[#87986f]"><Settings2 className="size-4" aria-hidden="true"/>تنظیم ارزشیابی<ChevronDown className={`ms-auto size-4 transition-transform ${configOpen?'rotate-180':''}`} aria-hidden="true"/></button>
          {configOpen&&<div id="grade-evaluation-settings" className="grid grid-cols-2 gap-3 border-t border-[#edf0e6] pt-4"><label className="teaching-label">درس<input id="grade-subject" readOnly={!!initialContext} value={subject} onChange={event=>setSubject(event.target.value)}/></label><label className="teaching-label">سقف نمره<input id="grade-max-score" type="number" min={5} max={100} value={maxScore} onChange={event=>setMaxScore(Number(event.target.value))}/></label><label className="teaching-label col-span-2">عنوان ارزشیابی<input id="grade-title" value={title} onChange={event=>setTitle(event.target.value)}/></label></div>}
        </TeachingSection>
        <TeachingSection title="نمره‌های دانش‌آموزان" description="نمره را وارد کنید؛ برای هر دانش‌آموز می‌توانید یادداشت جداگانه بنویسید.">
          <label className="flex items-center gap-2 rounded-xl border border-[#e0e7d6] bg-[#fafcf7] px-3"><Search className="size-4 shrink-0 text-[#a0ad92]" aria-hidden="true"/><input id="grade-student-search" aria-label="جستجوی دانش‌آموز با نام یا شماره" value={search} onChange={event=>setSearch(event.target.value)} placeholder="نام، شماره دانش‌آموزی یا کد ملی…" className="border-0! bg-transparent! px-0!"/></label>
          <div className="flex flex-wrap items-center gap-2"><span className="text-[10px] text-[#9aa58c]">ثبت سریع برای همه:</span><button id="btn-grade-fill-max" type="button" onClick={()=>fill(maxScore)} disabled={!students.length} className="teaching-secondary">{toPersianDigits(maxScore)}</button><button id="btn-grade-fill-one-below" type="button" onClick={()=>fill(Math.max(0,maxScore-1))} disabled={!students.length} className="teaching-secondary">{toPersianDigits(Math.max(0,maxScore-1))}</button><button id="btn-grade-clear-values" type="button" onClick={()=>fill(0)} disabled={!students.length} className="teaching-secondary">همه صفر</button><button type="button" aria-label="پاک کردن نمره‌های واردشده" onClick={()=>{update({scores:{}});setError('');}} className="teaching-secondary"><RotateCcw className="size-4" aria-hidden="true"/></button></div>
          {roster.isPending?<p role="status" className="teaching-empty">در حال دریافت فهرست کلاس…</p>:roster.error?<div role="alert" className="teaching-error">{roster.error.message}<button type="button" onClick={()=>void roster.refetch()} className="block min-h-11 font-bold">تلاش مجدد</button></div>:<div className="space-y-3">{filtered.map((student,index)=>{
            const score=draft.scores[student.id]||'',parsed=parseGradeScore(score,maxScore),showNote=noteOpen[student.id]||!!draft.notes[student.id];
            return <article key={student.id} id={`grade-student-card-${student.id}`} className="rounded-2xl border border-[#e4e9dd] bg-[#fcfdfb] p-3 sm:p-4">
              <div className="flex items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#eef2e6] text-[11px] font-bold text-[#879c6d]">{toPersianDigits(index+1)}</span><div className="min-w-0 flex-1"><h4 className="break-words text-xs font-bold leading-6 text-[#516347]">{student.name}</h4><p className="mt-1 text-[10px] text-[#a2ac96]">شماره {toPersianDigits(student.studentNumber)}</p></div>{parsed.ok&&<Check className="size-4 shrink-0 text-[#8ba573]" aria-label="نمره معتبر"/>}</div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><button type="button" id={`btn-grade-note-${student.id}`} aria-expanded={!!showNote} aria-label={`یادداشت برای ${student.name}`} onClick={()=>setNoteOpen(previous=>({...previous,[student.id]:!showNote}))} className="teaching-secondary gap-1.5"><MessageSquare className="size-4" aria-hidden="true"/><span>یادداشت</span></button><div className="flex items-center gap-1.5" dir="ltr"><button type="button" id={`btn-grade-decrease-${student.id}`} aria-label={`کاهش نیم نمره ${student.name}`} onClick={()=>adjust(student.id,-0.5)} className="teaching-secondary"><Minus className="size-4" aria-hidden="true"/></button><input id={`grade-score-${student.id}`} aria-label={`نمره ${student.name} از ${toPersianDigits(maxScore)}`} aria-invalid={!!score.trim()&&!parsed.ok} inputMode="decimal" value={score} onChange={event=>setScore(student.id,event.target.value)} placeholder={toPersianDigits(maxScore)} className="w-20! text-center text-base! font-bold"/><button type="button" id={`btn-grade-increase-${student.id}`} aria-label={`افزایش نیم نمره ${student.name}`} onClick={()=>adjust(student.id,0.5)} className="teaching-secondary"><Plus className="size-4" aria-hidden="true"/></button></div></div>
              {!!score.trim()&&!parsed.ok&&<p className="mt-2 text-[10px] leading-6 text-rose-700">{toPersianDigits(parsed.error)}</p>}
              {showNote&&<label className="teaching-label mt-3">یادداشت آموزشی<textarea rows={2} value={draft.notes[student.id]||''} onChange={event=>update({notes:{...draft.notes,[student.id]:event.target.value}})} placeholder="نکته‌ای درباره عملکرد این دانش‌آموز…"/></label>}
            </article>;
          })}{!filtered.length&&<p role="status" className="teaching-empty">{students.length?'دانش‌آموزی با این جستجو پیدا نشد.':'این کلاس هنوز دانش‌آموزی ندارد.'}</p>}</div>}
        </TeachingSection>
      </fieldset>
      {!enabled&&<p role="status" className="teaching-error">ثبت نمره فقط در سال تحصیلی جاری و فعال ممکن است.</p>}
    </form>
  </TeachingDialog>;
};
