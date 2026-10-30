import {useState} from 'react';
import {AnimatePresence} from 'motion/react';
import {Check,CheckCheck,FileText,Lock,Receipt,Send} from 'lucide-react';
import {useApp} from '../context/AppContext';
import type {Student} from '../types';
import {formatPersianCurrency,toEnglishDigits,toPersianDigits} from '../utils/persianUtils';
import {readFinancialSummary} from '../utils/financialLedger';
import {TeachingDialog,TeachingSection} from './TeachingDialog';

interface Props {isOpen:boolean;onClose:()=>void;student:Student;preselectedInstallmentId?:string}
export function ParentPaymentModal({isOpen,...props}:Props){
 return <AnimatePresence>{isOpen&&<ReceiptForm key={`${props.student.id}:${props.preselectedInstallmentId||'all'}`} {...props}/>}</AnimatePresence>;
}
function ReceiptForm({student,onClose,preselectedInstallmentId}:Omit<Props,'isOpen'>){
 const {currentSchool,currentUser,activeAcademicYear,isViewingNonCurrentYear,schoolReadOnly,recordStudentPayment}=useApp();
 const {summary,error:ledgerError}=readFinancialSummary(student.financialSummary);
 const financialError=ledgerError||(!student.financialSummary?'اطلاعات مالی پرونده دریافت نشده است. ابتدا دوباره اطلاعات را دریافت کنید.':'');
 const installment=summary.installments.find(item=>item.id===preselectedInstallmentId);
 const [amount,setAmount]=useState(String(installment?Math.max(0,installment.amount-installment.paidAmount):Math.min(summary.remainingDebt,5000000)));
 const [fee,setFee]=useState(installment?`قسط: ${installment.title}`:'قسط شهریه مصوب آموزشگاه');
 const [method,setMethod]=useState<'bank_receipt'|'card_to_card'>('bank_receipt');
 const [tracking,setTracking]=useState(''),[note,setNote]=useState(''),[error,setError]=useState(''),[saving,setSaving]=useState(false),[saved,setSaved]=useState(false);
 const canWrite=!schoolReadOnly&&!isViewingNonCurrentYear&&activeAcademicYear?.isCurrent&&activeAcademicYear.status==='active';
 const parsedAmount=Number(toEnglishDigits(amount).replace(/[,٬\s]/g,''));
 const validAmount=Number.isSafeInteger(parsedAmount)&&parsedAmount>0&&parsedAmount<=summary.remainingDebt;
 const submit=async(event:React.FormEvent)=>{
  event.preventDefault();if(saving||saved||financialError||!canWrite)return;
  if(!validAmount){setError('مبلغ را به تومان، صحیح و حداکثر برابر مانده حساب وارد کنید.');return;}
  if(!tracking.trim()){setError('شماره پیگیری واریزی را وارد کنید.');return;}
  setSaving(true);setError('');
  try{
   const result=await recordStudentPayment({studentId:student.id,studentName:student.name,schoolId:student.schoolId,amount:parsedAmount,trackingCode:toEnglishDigits(tracking.trim()),method,feeTitle:fee.trim(),note:note.trim()||`پرداخت توسط ولی دانش‌آموز (${currentUser.name})`,recordedBy:`ولی دانش‌آموز (${currentUser.name})`,status:'pending_verification'});
   if(!result.ok){setError(result.error);return;}setSaved(true);
  }catch{setError('رسید ثبت نشد؛ اطلاعات فرم محفوظ است. دوباره تلاش کنید.');}finally{setSaving(false);}
 };
 return <TeachingDialog id="parent-payment-dialog" title={saved?'رسید ثبت شد':'ثبت رسید واریزی'} description={`${student.name} · ${currentSchool?.name||'مدرسه'} · ${toPersianDigits(activeAcademicYear?.title||'')}`} icon={Receipt} onClose={onClose} busy={saving} notice={error||financialError?<p role="alert" className="teaching-error">{error||financialError}</p>:undefined} footer={saved?<button id="btn-close-payment-receipt" type="button" onClick={onClose} className="teaching-primary w-full">بستن و بازگشت به پرونده مالی</button>:<div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[10px] leading-7 text-[#a0ac92]">تأیید رسید توسط مدرسه انجام می‌شود.</p><button id="btn-parent-submit-payment" type="submit" form="parent-receipt-form" disabled={saving||!!financialError||!canWrite||!validAmount||!tracking.trim()} className="teaching-primary"><Send className="size-4" aria-hidden="true"/>{saving?'در حال ثبت…':'ثبت برای بررسی'}</button></div>}>
  {saved?<div id="parent-payment-receipt" className="space-y-4"><div className="rounded-2xl border border-[#dce8d1] bg-[#f0f6e8] p-5 text-center"><span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#e3efd7] text-[#8fab70]"><CheckCheck className="size-6" aria-hidden="true"/></span><h3 className="mt-4 text-sm font-bold leading-8 text-[#718f57]">رسید برای بررسی مدرسه ثبت شد</h3><p className="mt-2 text-[11px] leading-7 text-[#99ab85]">این ثبت به معنی تأیید پرداخت نیست؛ پس از تأیید مدرسه در مبلغ وصول‌شده محاسبه می‌شود.</p></div><dl className="space-y-3 rounded-2xl border border-[#e2e9d8] bg-white p-4">{[{label:'مبلغ واریزی',value:formatPersianCurrency(parsedAmount)},{label:'شماره پیگیری',value:toPersianDigits(tracking)},{label:'دانش‌آموز',value:student.name},{label:'وضعیت',value:'در انتظار بررسی مدرسه'}].map(item=><div key={item.label} className="flex flex-wrap items-start justify-between gap-2 border-b border-[#edf0e7] pb-3 last:border-0 last:pb-0"><dt className="text-[11px] leading-7 text-[#a6b198]">{item.label}</dt><dd className="break-all text-xs font-bold leading-7 text-[#81976b]">{item.value}</dd></div>)}</dl></div>:<form id="parent-receipt-form" onSubmit={submit} className="space-y-4"><fieldset disabled={saving||!!financialError||!canWrite} className="min-w-0 space-y-4">
   {!canWrite&&<p role="status" className="teaching-error">ثبت رسید نیازمند مدرسه فعال و سال تحصیلی جاری و فعال است.</p>}
   <TeachingSection title="حساب و مبلغ"><div className="rounded-2xl bg-[#f4f7ed] p-4"><p className="text-[11px] text-[#9eac8b]">مانده حساب این سال</p><strong className="mt-2 block break-words text-lg font-bold text-[#809769]">{financialError?'—':formatPersianCurrency(summary.remainingDebt)}</strong></div>
    {summary.installments.some(item=>item.status!=='paid')&&<div className="grid gap-2 sm:grid-cols-2">{summary.installments.filter(item=>item.status!=='paid').map(item=>{const remaining=Math.max(0,item.amount-item.paidAmount),selected=fee===`قسط: ${item.title}`&&parsedAmount===remaining;return <button key={item.id} type="button" disabled={remaining<=0} aria-pressed={selected} onClick={()=>{setFee(`قسط: ${item.title}`);setAmount(String(remaining));setError('');}} className={`min-h-20 rounded-2xl border p-3 text-right ${selected?'border-[#becfa9] bg-[#eff5e6]':'border-[#e1e8d8] bg-white'}`}><span className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-[#8da277]">{item.title}{selected&&<Check className="size-4" aria-hidden="true"/>}</span><span className="mt-2 block text-[11px] text-[#a0ae8e]">{formatPersianCurrency(remaining)}</span><span className="mt-1 block text-[10px] leading-6 text-[#a9b299]">{item.status==='overdue'?'قسط معوق':`سررسید: ${toPersianDigits(item.dueDate)}`}</span></button>;})}</div>}
    <label className="teaching-label">مبلغ واریزی (تومان)<input id="parent-payment-amount" required inputMode="numeric" value={amount} onChange={event=>{setAmount(event.target.value);setError('');}} aria-invalid={!!amount&&!validAmount}/></label>
    {validAmount&&<p className="text-[11px] leading-7 text-[#95a981]">{formatPersianCurrency(parsedAmount)}</p>}
    <button type="button" onClick={()=>{setAmount(String(summary.remainingDebt));setError('');}} className="teaching-secondary w-full"><Check className="size-4" aria-hidden="true"/>انتخاب کل مانده حساب</button>
    <label className="teaching-label">بابت<input maxLength={200} value={fee} onChange={event=>setFee(event.target.value)}/></label>
   </TeachingSection>
   <TeachingSection title="مشخصات واریزی" description="پس از واریز به حساب مورد تأیید مدرسه، شماره پیگیری را ثبت کنید."><fieldset><legend className="teaching-label mb-2">روش واریز</legend><div className="grid grid-cols-2 gap-2">{([{value:'card_to_card',title:'کارت به کارت'},{value:'bank_receipt',title:'فیش بانکی'}] as const).map(item=><button key={item.value} type="button" aria-pressed={method===item.value} onClick={()=>setMethod(item.value)} className={`teaching-choice ${method===item.value?'teaching-choice-active':''}`}><FileText className="size-4" aria-hidden="true"/>{item.title}</button>)}</div></fieldset><p className="rounded-xl bg-[#faf5e8] p-3 text-[11px] leading-7 text-[#ad9b70]">برای دریافت شماره حساب یا کارت معتبر با دفتر مدرسه هماهنگ کنید.</p><label className="teaching-label">شماره پیگیری / شماره ارجاع<input id="parent-payment-tracking" required maxLength={100} value={tracking} onChange={event=>{setTracking(event.target.value);setError('');}}/></label><label className="teaching-label">یادداشت ولی (اختیاری)<textarea rows={3} maxLength={2000} value={note} onChange={event=>setNote(event.target.value)} placeholder="توضیح تکمیلی درباره واریزی…"/></label></TeachingSection>
  </fieldset><div className="flex items-start gap-2 rounded-xl border border-[#e4e9dd] bg-white p-3 text-[10px] leading-7 text-[#a6b097]"><Lock className="mt-1 size-4 shrink-0" aria-hidden="true"/><p>پرداخت آنلاین تا اتصال درگاه در دسترس نیست. این فرم رسید واریز بانکی را ثبت می‌کند.</p></div></form>}
 </TeachingDialog>;
}
