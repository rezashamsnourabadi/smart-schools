import {useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {X,LockKeyhole} from 'lucide-react';
import {useAuth} from '../auth/AuthContext';
import {request} from '../api/client';
import {toEnglishDigits} from '../utils/persianUtils';

export function SecuritySettings({onClose}:{onClose:()=>void}) {
  const auth=useAuth(),client=useQueryClient();const [mode,setMode]=useState<'password'|'phone'>('password');
  const [current,setCurrent]=useState(''),[value,setValue]=useState(''),[code,setCode]=useState(''),[challengeId,setChallengeId]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const scope={membershipId:auth.member.id,csrf:auth.user.csrf};
  const reset=async()=>{await client.cancelQueries();client.removeQueries({predicate:q=>q.queryKey[0]!=='auth'});client.setQueryData(['auth'],null);};
  const submit=async(e:React.FormEvent)=>{e.preventDefault();if(busy)return;setBusy(true);setError('');try{
    if(mode==='password'){await request('/auth/password',{method:'POST',scope,body:{currentPassword:current,password:value}});await reset();}
    else if(!challengeId){const result=await request<{challengeId:string}>('/auth/phone',{method:'POST',scope,body:{currentPassword:current,phone:toEnglishDigits(value)}});setChallengeId(result.challengeId);}
    else{await request('/auth/verify',{method:'POST',scope,body:{challengeId,code:toEnglishDigits(code)}});await reset();}
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  return <div dir="rtl" className="fixed inset-0 z-[110] bg-[#19382e]/50 p-4 flex items-center justify-center"><section className="dana-dialog dana-profile-sheet overflow-y-auto bg-white rounded-3xl w-full max-w-lg p-5 sm:p-6"><header className="flex items-center justify-between mb-5"><h2 className="font-bold flex gap-2 items-center"><LockKeyhole className="size-5 text-[#7d9a64]"/>امنیت حساب</h2><button aria-label="بستن" className="min-h-11 min-w-11 rounded-xl bg-[#f0f5e8] flex items-center justify-center" onClick={onClose}><X className="size-5"/></button></header>
  <div className="flex gap-2 mb-4">{(['password','phone'] as const).map(v=><button key={v} onClick={()=>{setMode(v);setValue('');setChallengeId('');setError('');}} className={`min-h-11 px-3 rounded-xl text-sm ${mode===v?'bg-[#355e3c] text-white':'bg-[#f0f5e8]'}`}>{v==='password'?'تغییر رمز':'تغییر شماره بازیابی'}</button>)}</div>
  <form onSubmit={submit} className="space-y-3">{!challengeId&&<><label className="block text-sm">رمز فعلی<input required type="password" autoComplete="current-password" value={current} onChange={e=>setCurrent(e.target.value)} className="min-h-11 w-full border border-[#e0e8d6] rounded-xl px-3 mt-1"/></label><label className="block text-sm">{mode==='password'?'رمز جدید (حداقل دوازده نویسه)':'شماره همراه جدید'}<input required type={mode==='password'?'password':'tel'} minLength={mode==='password'?12:11} maxLength={mode==='password'?128:11} value={value} onChange={e=>setValue(e.target.value)} className="min-h-11 w-full border border-[#e0e8d6] rounded-xl px-3 mt-1"/></label></>}{challengeId&&<label className="block text-sm">کد ارسال‌شده به شماره جدید<input required inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={e=>setCode(e.target.value)} className="min-h-11 w-full border border-[#e0e8d6] rounded-xl px-3 mt-1"/></label>}
  {error&&<p role="alert" className="text-sm bg-rose-50 text-rose-800 p-3 rounded-xl">{error}</p>}<p className="text-xs text-slate-500">پس از تغییر، نشست‌های قبلی بسته می‌شوند و باید دوباره وارد شوید. شماره تماس پرونده فرزند مستقل است.</p><button disabled={busy} className="w-full min-h-11 bg-[#355e3c] rounded-xl text-white font-bold">{busy?'در حال بررسی…':mode==='phone'&&!challengeId?'دریافت کد':'ثبت تغییر'}</button></form></section></div>;
}
