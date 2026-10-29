import { useState } from 'react';
import { Award, Check, Clock3, Plus, Shield, Users } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useApp } from '../context/AppContext';
import { useAuth } from '../auth/AuthContext';
import { toPersianDigits } from '../utils/persianUtils';
import type { Student } from '../types';
import { ResourcePager } from './ResourcePager';
import { SchoolOperationsDashboard } from './SchoolOperationsDashboard';

interface Props {
  onOpenScheduleModal?: () => void;
  onOpenClassStudentModal?: () => void;
  onOpenClassModal?: () => void;
  onOpenStudentModal?: () => void;
  onOpenPostModal?: () => void;
  onOpenQuestionBank?: () => void;
  onOpenStudentDossier?: (student: Student) => void;
  onOpenFinanceModal?: () => void;
}

type RecordType = 'تشویقی' | 'تذکر' | 'تاخیر';
function DisciplinaryPanel({ active }: { active: boolean }) {
  const { students, classes, currentSchoolId, activeAcademicYearId, schoolClock, currentUser, activeVicePrincipalPermissions: permissions, isViewingNonCurrentYear, addDisciplinaryRecord, page } = useApp();
  const auth = useAuth(), client = useQueryClient();
  const [selected, setSelected] = useState<Student | null>(null);
  const [type, setType] = useState<RecordType>('تشویقی');
  const [title, setTitle] = useState(''), [note, setNote] = useState('');
  const [saving, setSaving] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState('');
  const state = page('students');
  const schoolStudents = students.filter(student => student.schoolId === currentSchoolId && (!student.status || student.status === 'active'));
  const allowed = permissions.canLogDisciplinary && !isViewingNonCurrentYear;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving || !allowed || !selected || !title.trim()) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const result = await addDisciplinaryRecord(selected.id, { type, title: title.trim(), note: note.trim(), date: schoolClock.date, recordedBy: currentUser.name });
      if (!result.ok) { setError(result.error || 'ثبت انجام نشد؛ دوباره تلاش کنید.'); return; }
      setTitle(''); setNote(''); setSuccess(`مورد ${type} برای ${selected.name} در پرونده ثبت شد.`);
    } catch { setError('ثبت انجام نشد؛ اطلاعات فرم محفوظ است. دوباره تلاش کنید.'); }
    finally { setSaving(false); }
  };
  const retry = () => { void client.invalidateQueries({ predicate: query => query.queryKey[0] === 'resource' && query.queryKey[1] === auth.member.id && query.queryKey[2] === activeAcademicYearId && query.queryKey[3] === 'students' }); };
  return <section id="vp-disciplinary-panel" className="space-y-4">
    <div className="flex items-start gap-3 rounded-2xl border border-[#e4e8db] bg-[#f8faf3] p-4"><Shield className="mt-1 size-5 shrink-0 text-[#91a77b]" aria-hidden="true"/><div><h3 className="text-xs font-bold leading-7 text-[#6a8157]">ثبت تشویق یا تذکر</h3><p className="mt-1 text-[11px] leading-7 text-[#91a080]">مورد در پرونده دانش‌آموز ثبت و درخواست اطلاع‌رسانی وارد صف می‌شود. تحویل پیام به وضعیت سرویس بستگی دارد.</p></div></div>
    {!allowed && <p role="status" className="principal-empty">ثبت در این سال یا با اختیارات فعلی مجاز نیست.</p>}
    <form id="vp-discipline-form" onSubmit={submit} className="space-y-4">
      <fieldset disabled={saving || !allowed} className="min-w-0 space-y-4 disabled:opacity-60">
        <div className="space-y-3 rounded-2xl border border-[#e1e8d7] bg-white p-4">
          <label className="teaching-label">دانش‌آموز
            <select id="vp-discipline-student" required value={selected?.id || ''} onChange={event => { setSelected(schoolStudents.find(student => student.id === event.target.value) || null); setSuccess(''); setError(''); }} className="teacher-text-input">
              <option value="">دانش‌آموز را انتخاب کنید</option>
              {selected && !schoolStudents.some(student => student.id === selected.id) && <option value={selected.id}>{selected.name}</option>}
              {schoolStudents.map(student => <option key={student.id} value={student.id}>{student.name} · {classes.find(group => group.id === student.classGroupId)?.name || student.grade} · {toPersianDigits(student.nationalCode)}</option>)}
            </select>
          </label>
          {selected && <p className="flex items-center gap-2 text-[11px] leading-7 text-[#81946d]"><Users className="size-4 shrink-0" aria-hidden="true"/>ثبت برای {selected.name}</p>}
          {active && <ResourcePager key={`${activeAcademicYearId}:discipline`} kind="students" appearance="sage" searchPlaceholder="جستجوی دانش‌آموز در مدرسه…"/>}
          {state.error && <p role="alert" className="teaching-error">{state.error}<button type="button" onClick={retry} className="min-h-11 px-3 font-bold">تلاش مجدد</button></p>}
          {!state.loading && !state.error && !schoolStudents.length && <p role="status" className="text-[11px] leading-7 text-[#a2ae94]">دانش‌آموز فعالی در نتیجه‌های این صفحه وجود ندارد؛ جستجو یا صفحه را تغییر دهید.</p>}
        </div>
        <div className="space-y-4 rounded-2xl border border-[#e1e8d7] bg-white p-4">
          <fieldset className="min-w-0"><legend className="teaching-label mb-2">نوع مورد</legend><div className="grid grid-cols-3 gap-2">{[{ value: 'تشویقی' as RecordType, label: 'تشویق', icon: Award }, { value: 'تذکر' as RecordType, label: 'تذکر', icon: Shield }, { value: 'تاخیر' as RecordType, label: 'تأخیر', icon: Clock3 }].map(({value,label,icon:Icon}) => <button id={`vp-discipline-type-${value}`} key={value} type="button" aria-pressed={type === value} onClick={() => {setType(value);setSuccess('');}} className={`teaching-choice ${type === value ? 'teaching-choice-active' : ''}`}><Icon className="size-4" aria-hidden="true"/>{label}</button>)}</div></fieldset>
          <label className="teaching-label">عنوان کوتاه<input id="vp-discipline-title" required maxLength={300} value={title} onChange={event => {setTitle(event.target.value);setSuccess('');}} placeholder={type === 'تشویقی' ? 'مثلاً همکاری در فعالیت‌های مدرسه' : 'موضوع مورد ثبت‌شده'} className="teacher-text-input"/></label>
          <label className="teaching-label">توضیحات<textarea id="vp-discipline-note" rows={3} maxLength={2000} value={note} onChange={event => setNote(event.target.value)} placeholder="جزئیات، دلیل یا توضیح تکمیلی…" className="teacher-text-input resize-y leading-7"/></label>
        </div>
      </fieldset>
      {error && <p role="alert" className="teaching-error">{error}</p>}
      {success && <p role="status" className="flex items-start gap-2 rounded-xl bg-[#edf5e6] p-3 text-xs leading-7 text-[#6a8654]"><Check className="mt-1 size-4 shrink-0" aria-hidden="true"/>{success}</p>}
      <button id="vp-save-discipline" type="submit" disabled={saving || !allowed || !selected || !title.trim()} className="teaching-primary w-full disabled:opacity-45 sm:w-auto"><Plus className="size-4" aria-hidden="true"/>{saving ? 'در حال ثبت…' : 'ثبت در پرونده دانش‌آموز'}</button>
    </form>
  </section>;
}

export function VicePrincipalDashboard(props: Props) {
  const { currentSchoolId, activeAcademicYearId } = useApp();
  return <SchoolOperationsDashboard {...props} disciplinePanel={active => <DisciplinaryPanel active={active} key={`${currentSchoolId}:${activeAcademicYearId}`}/>} />;
}
