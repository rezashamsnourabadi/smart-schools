import {useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {X,UserPlus,ShieldCheck} from 'lucide-react';
import {useAuth} from '../auth/AuthContext';
import {useApp,useResource} from '../context/AppContext';
import {request} from '../api/client';
import {toEnglishDigits,toPersianDigits} from '../utils/persianUtils';

export function AccountsModal({onClose,initialSchoolId}:{onClose:()=>void;initialSchoolId?:string}) {
  const auth=useAuth(),client=useQueryClient();const app=useApp();useResource('teachers');useResource('vicePrincipals');
  const scope={membershipId:auth.member.id,csrf:auth.user.csrf,yearId:app.activeAcademicYearId||undefined};
  const [schoolId,setSchool]=useState(initialSchoolId||auth.member.school_id||app.schools[0]?.id||'');
  const [role,setRole]=useState(auth.member.role==='platform_admin'?'principal':'student');
  const [username,setUsername]=useState(''),[name,setName]=useState(''),[phone,setPhone]=useState(''),[recordId,setRecordId]=useState('');
  const [existing,setExisting]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('');
  const [offset,setOffset]=useState(0);
  const accounts=useQuery({queryKey:['accounts',auth.member.id,offset],queryFn:({signal})=>request<{items:{id:string;username:string;name:string;active:boolean;phone_verified:boolean}[]}>(`/accounts?limit=25&offset=${offset}`,{scope,signal})});
  const records=['student','parent'].includes(role)?app.students:role==='teacher'?app.teachers:role==='vice_principal'?app.vicePrincipals:[];
  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();if(busy)return;setBusy(true);setError('');setSuccess('');
    try {
      const fields={schoolId,role,...['student','parent'].includes(role)?{studentId:recordId}:['teacher','vice_principal'].includes(role)?{profileId:recordId}:{}};
      await request(existing?`/accounts/${existing}/memberships`:'/accounts',{method:'POST',scope,key:crypto.randomUUID(),body:existing?fields:{...fields,username:toEnglishDigits(username),name,phone:toEnglishDigits(phone).replace(/[^0-9]/g,'')}});
      setSuccess(existing?'دسترسی جدید به حساب افزوده شد.':'حساب ایجاد شد؛ کاربر از صفحه ورود، فعال‌سازی حساب را انتخاب کند.');setUsername('');setName('');setPhone('');await client.invalidateQueries({queryKey:['accounts']});
    }catch(e){setError((e as Error).message);}finally{setBusy(false);}
  };
  return <div dir="rtl" className="fixed inset-0 z-[100] bg-[#19382e]/50 p-4 flex items-center justify-center"><section id="accounts-modal" className="dana-dialog w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-4 sm:p-6"><header className="flex items-center justify-between mb-4"><h2 className="font-bold flex items-center gap-2"><ShieldCheck className="size-5 text-[#7d9a64]"/>حساب‌ها و دسترسی کاربران</h2><button className="min-h-11 min-w-11 rounded-xl bg-[#f0f5e8] flex items-center justify-center" aria-label="بستن" onClick={onClose}><X className="size-5"/></button></header>
    <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
      <label className="text-sm">حساب<select value={existing} onChange={e=>setExisting(e.target.value)} className="mt-1 w-full min-h-11 rounded-xl border border-[#e0e8d6] px-3"><option value="">ایجاد حساب جدید</option>{accounts.data?.items.map(a=><option key={a.id} value={a.id}>{a.name} — {a.username}</option>)}</select></label>
      {auth.member.role==='platform_admin'&&<label className="text-sm">مدرسه<select required value={schoolId} onChange={e=>setSchool(e.target.value)} className="mt-1 w-full min-h-11 rounded-xl border border-[#e0e8d6] px-3"><option value="">انتخاب مدرسه</option>{app.schools.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}
      {!existing&&<>{[{id:'username',label:'شناسه کاربری',value:username,set:setUsername},{id:'name',label:'نام کاربر',value:name,set:setName},{id:'phone',label:'شماره همراه بازیابی (دانش‌آموز: همراه ولی)',value:phone,set:setPhone}].map(field=><label key={field.id} className="text-sm">{field.label}<input id={`account-${field.id}`} required value={field.value} onChange={e=>field.set(e.target.value)} className="mt-1 w-full min-h-11 rounded-xl border border-[#e0e8d6] px-3"/></label>)}</>}
      <label className="text-sm">نقش<select value={role} onChange={e=>{setRole(e.target.value);setRecordId('');}} className="mt-1 w-full min-h-11 rounded-xl border border-[#e0e8d6] px-3">{(auth.member.role==='platform_admin'?[['principal','مدیر مدرسه']]:[['student','دانش‌آموز'],['parent','ولی'],['teacher','دبیر'],['vice_principal','معاون']]).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
      {role!=='principal'&&<label className="text-sm">پرونده یا پروفایل مرتبط<select required value={recordId} onChange={e=>setRecordId(e.target.value)} className="mt-1 w-full min-h-11 rounded-xl border border-[#e0e8d6] px-3"><option value="">انتخاب کنید</option>{records.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label>}
      <button id="create-account" disabled={busy} className="min-h-11 rounded-xl bg-[#355e3c] text-white font-bold flex items-center justify-center gap-2 sm:col-span-2"><UserPlus className="size-4"/>{busy?'در حال ثبت…':existing?'افزودن دسترسی':'ایجاد حساب'}</button>
    </form>{(error||accounts.error)&&<p role="alert" className="p-3 mt-3 bg-rose-50 text-rose-800 rounded-xl text-sm">{error||accounts.error?.message}</p>}{success&&<p role="status" className="p-3 mt-3 bg-teal-50 text-[#6e8a54] rounded-xl text-sm">{success}</p>}
    <div className="mt-5 divide-y divide-slate-100">{accounts.data?.items.map(a=><div key={a.id} className="flex flex-wrap items-center gap-3 py-2 text-sm"><span className="font-bold flex-1">{a.name}</span><span dir="ltr">{a.username}</span><span>{a.active?'فعال':'غیرفعال'} / {a.phone_verified?'تأییدشده':'نیازمند فعال‌سازی'}</span>{a.active&&<button className="min-h-11 px-3 rounded-xl bg-rose-50 text-rose-800" onClick={async()=>{setError('');try{await request(`/accounts/${a.id}/disable`,{method:'POST',scope,key:crypto.randomUUID(),body:{}});await client.invalidateQueries({queryKey:['accounts']});}catch(e){setError((e as Error).message);}}}>غیرفعال‌سازی</button>}</div>)}</div>
    <div className="flex items-center gap-3 mt-3 text-xs"><button disabled={!offset} onClick={()=>setOffset(Math.max(0,offset-25))} className="min-h-11 px-3 rounded-xl bg-[#f0f5e8]">قبلی</button><span>صفحه {toPersianDigits(offset/25+1)}</span><button disabled={(accounts.data?.items.length||0)<25} onClick={()=>setOffset(offset+25)} className="min-h-11 px-3 rounded-xl bg-[#f0f5e8]">بعدی</button></div>
  </section></div>;
}
