import {useEffect,useRef,useState} from 'react';
import {Download} from 'lucide-react';
import {useAuth} from '../auth/AuthContext';
import type {DossierInspection,InspectionReceipt} from '../../shared/inspection';
export function InspectionReceiptDownloads({inspection,studentId}:{inspection:DossierInspection;studentId:string}){
 const auth=useAuth(),controller=useRef<AbortController|null>(null),[busy,setBusy]=useState<string|null>(null),[error,setError]=useState('');
 useEffect(()=>()=>controller.current?.abort(),[]);
 const download=async(file:InspectionReceipt)=>{
  if(busy)return;setBusy(file.id);setError('');controller.current=new AbortController();
  try{
   const response=await fetch(`/api/v1/platform/schools/${inspection.schoolId}/inspection/years/${inspection.yearId}/students/${studentId}/files/${file.id}`,{credentials:'same-origin',headers:{'X-Membership-Id':auth.member.id},signal:controller.current.signal});
   if(!response.ok){if(response.status===401)window.dispatchEvent(new Event('school-session-ended'));const body=await response.json().catch(()=>null);throw new Error(body?.error?.message||'دریافت فایل انجام نشد؛ دوباره تلاش کنید.');}
   const blob=await response.blob(),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=file.name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch(reason){if(!controller.current?.signal.aborted)setError(reason instanceof Error?reason.message:'ارتباط برقرار نشد؛ دوباره تلاش کنید.');}finally{setBusy(null);}
 };
 return <section id="inspection-receipt-downloads" className="mt-4 space-y-3 rounded-2xl border border-[#e1e8d8] bg-white p-4"><h3 className="text-xs font-bold leading-7 text-[#789066]">فایل رسیدهای همین پرونده و سال</h3>{error&&<p role="alert" className="teaching-error">{error}</p>}{inspection.receipts.length?inspection.receipts.map(file=><button key={file.id} type="button" disabled={!!busy} onClick={()=>void download(file)} className="teaching-secondary w-full"><Download className="size-4 shrink-0" aria-hidden="true"/><span className="min-w-0 break-words">{busy===file.id?'در حال دریافت…':file.name}</span></button>):<p className="text-[11px] leading-7 text-[#9cab8d]">فایل رسید خصوصیِ متصل به این پرونده ثبت نشده است.</p>}<p className="text-[10px] leading-7 text-[#a3ae96]">شروع دانلود در سوابق نظارت ثبت می‌شود.</p></section>;
}
