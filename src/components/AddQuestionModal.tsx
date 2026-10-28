import React,{useState} from 'react';
import {AnimatePresence} from 'motion/react';
import {BookOpen,Check,Plus} from 'lucide-react';
import {useApp} from '../context/AppContext';
import {toPersianDigits} from '../utils/persianUtils';
import {TeachingDialog,TeachingSection} from './TeachingDialog';

interface Props {isOpen:boolean;onClose:()=>void;defaultSubject?:string;defaultGrade?:string}
export const AddQuestionModal:React.FC<Props>=({isOpen,onClose,defaultSubject='ریاضی',defaultGrade='پایه دهم'})=>{
  const {addQuestionBankItem,currentUser,currentSchool}=useApp();
  const [title,setTitle]=useState(''),[content,setContent]=useState('');
  const [subject,setSubject]=useState(defaultSubject),[grade,setGrade]=useState(defaultGrade);
  const [difficulty,setDifficulty]=useState<'آسان'|'متوسط'|'دشوار'>('متوسط');
  const [type,setType]=useState<'تستی'|'تشریحی'>('تستی');
  const [options,setOptions]=useState(['','','','']),[correct,setCorrect]=useState('');
  const [saving,setSaving]=useState(false),[error,setError]=useState('');
  const reset=()=>{setTitle('');setContent('');setOptions(['','','','']);setCorrect('');setError('');onClose();};
  const save=async(event:React.FormEvent)=>{
    event.preventDefault();if(saving)return;setError('');
    const choices=options.map(value=>value.trim()).filter(Boolean);
    if(type==='تستی'&&(choices.length<2||!choices.includes(correct.trim()))){setError('حداقل دو گزینه بنویسید و پاسخ درست را از میان گزینه‌ها انتخاب کنید.');return;}
    setSaving(true);
    try{
      const result=await addQuestionBankItem({title:title.trim(),content:content.trim(),subject:subject.trim()||'عمومی',grade,difficulty,type,options:type==='تستی'?choices:undefined,correctAnswer:correct.trim(),authorName:currentUser.name,authorSchool:currentSchool?.name||'مدارس شهرستان',isSharedRegional:true,tags:[subject.trim()||'عمومی',grade,'طراحی همکاران منطقه']});
      if(!result.ok){setError(result.error);return;}reset();
    }catch(error){setError(error instanceof Error?error.message:'ذخیره سؤال ممکن نشد؛ دوباره تلاش کنید.');}finally{setSaving(false);}
  };
  return <AnimatePresence>{isOpen&&<TeachingDialog id="add-question-modal-card" title="یک سؤال تازه" description="طراحی سؤال برای بانک مشترک مدارس منطقه" icon={BookOpen} onClose={()=>{if(!saving)onClose();}} busy={saving} notice={error?<p role="alert" className="teaching-error">{error}</p>:undefined} footer={<div className="flex items-center gap-2"><button id="btn-save-question" type="submit" form="add-question-form" disabled={saving} className="teaching-primary flex-1"><Plus className="size-4" aria-hidden="true"/>{saving?'در حال ذخیره…':'ثبت در بانک سؤال'}</button><button type="button" disabled={saving} onClick={onClose} className="teaching-secondary">بعداً ادامه می‌دهم</button></div>}>
    <form id="add-question-form" onSubmit={save} className="space-y-4">
      <fieldset disabled={saving} className="min-w-0 space-y-4">
        <TeachingSection title="مشخصات سؤال" description="ابتدا درس، پایه و نوع سؤال را مشخص کنید.">
          <div className="grid grid-cols-2 gap-3"><label className="teaching-label">درس<input id="question-subject" required value={subject} onChange={event=>setSubject(event.target.value)}/></label><label className="teaching-label">پایه<select id="question-grade" value={grade} onChange={event=>setGrade(event.target.value)}>{['پایه هفتم','پایه هشتم','پایه نهم','پایه دهم','پایه یازدهم','پایه دوازدهم'].map(value=><option key={value}>{value}</option>)}</select></label></div>
          <div role="group" aria-label="نوع سؤال" className="grid grid-cols-2 gap-2">{(['تستی','تشریحی'] as const).map(value=><button key={value} type="button" aria-pressed={type===value} onClick={()=>{setType(value);setCorrect('');setError('');}} className={`teaching-choice ${type===value?'teaching-choice-active':''}`}>{value==='تستی'?'تستی و گزینه‌ای':'تشریحی و حل مسئله'}</button>)}</div>
          <label className="teaching-label">سطح سؤال<select id="question-difficulty" value={difficulty} onChange={event=>setDifficulty(event.target.value as typeof difficulty)}>{['آسان','متوسط','دشوار'].map(value=><option key={value}>{value}</option>)}</select></label>
        </TeachingSection>
        <TeachingSection title="صورت سؤال">
          <label className="teaching-label">عنوان یا مبحث<input id="question-title" required value={title} onChange={event=>setTitle(event.target.value)} placeholder="مثلاً: ریشه‌های معادله درجه دو"/></label>
          <label className="teaching-label">متن کامل سؤال<textarea id="question-content" required rows={5} value={content} onChange={event=>setContent(event.target.value)} placeholder="متن سؤال و توضیحات لازم را بنویسید…"/></label>
        </TeachingSection>
        <TeachingSection title={type==='تستی'?'گزینه‌ها و پاسخ درست':'کلید و راهنمای حل'} description={type==='تستی'?'پس از نوشتن گزینه‌ها، دایره کنار پاسخ درست را انتخاب کنید.':undefined}>
          {type==='تستی'?<div className="space-y-2">{options.map((value,index)=><div key={index} className={`flex items-center gap-2 rounded-2xl border p-2 ${value.trim()&&correct===value?'border-[#b8cda8] bg-[#f1f6e9]':'border-[#e6eadf] bg-[#fbfcf9]'}`}><button id={`question-correct-${index}`} type="button" disabled={!value.trim()} aria-label={`انتخاب گزینه ${toPersianDigits(index+1)} به‌عنوان پاسخ درست`} aria-pressed={!!value.trim()&&correct===value} onClick={()=>setCorrect(value)} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-[#75965c] disabled:opacity-40">{value.trim()&&correct===value?<Check className="size-5" aria-hidden="true"/>:<span className="size-5 rounded-full border border-[#c4cfb8]"/>}</button><input aria-label={`گزینه ${toPersianDigits(index+1)}`} value={value} onChange={event=>{const next=event.target.value;if(value.trim()&&correct===value)setCorrect(next);setOptions(previous=>previous.map((item,i)=>i===index?next:item));}} placeholder={`گزینه ${toPersianDigits(index+1)}`} className="min-w-0 flex-1"/></div>)}</div>:<label className="teaching-label">پاسخ و توضیح حل<textarea id="question-answer" rows={4} value={correct} onChange={event=>setCorrect(event.target.value)} placeholder="پاسخ تشریحی یا مراحل حل…"/></label>}
        </TeachingSection>
      </fieldset>
      <p className="px-1 text-[10px] leading-7 text-[#9aa68e]">فرم پس از پاسخ موفق سرور بسته می‌شود؛ در صورت خطا، نوشته‌ها حفظ می‌شوند.</p>
    </form>
  </TeachingDialog>}</AnimatePresence>;
};
