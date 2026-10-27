import {useState} from 'react';
import {GraduationCap,LockKeyhole} from 'lucide-react';
import {request} from '../api/client';
import {toEnglishDigits} from '../utils/persianUtils';

export function LoginPage({onSuccess}:{onSuccess:()=>void}) {
  const [mode,setMode]=useState<'login'|'activate'|'recover'>('login');
  const [username,setUsername]=useState(''),[password,setPassword]=useState(''),[code,setCode]=useState(''),[challengeId,setChallengeId]=useState('');
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();if(busy)return;setBusy(true);setError('');setMessage('');
    try {
      if(challengeId){
        const result=await request<{authenticated:boolean;passwordChanged?:boolean}>('/auth/verify',{method:'POST',body:{challengeId,code:toEnglishDigits(code),...(mode!=='login'?{password}:{})}});
        if(result.authenticated)onSuccess();else {setChallengeId('');setMode('login');setPassword('');setMessage('رمز ثبت شد؛ اکنون وارد شوید.');}
      } else if(mode==='login') {
        const result=await request<{authenticated:boolean;challengeId?:string}>('/auth/login',{method:'POST',body:{username:toEnglishDigits(username),password}});
        if(result.authenticated)onSuccess();else setChallengeId(result.challengeId||'');
      } else {
        const result=await request<{challengeId:string}>('/auth/challenge',{method:'POST',body:{username:toEnglishDigits(username),purpose:mode}});setChallengeId(result.challengeId);setMessage('اگر حساب واجد شرایط باشد، کد به شماره تأییدشده آن ارسال می‌شود.');
      }
    }catch(e){setError(e instanceof Error?e.message:'ورود ممکن نشد.');}finally{setBusy(false);}
  };
  return <main dir="rtl" id="login-page" className="min-h-screen bg-slate-100/70 flex items-center justify-center p-4 text-slate-800"><section className="bg-white rounded-3xl border border-slate-200 shadow-sm w-full max-w-md p-6 sm:p-8">
    <div className="flex items-center gap-3 mb-7"><div className="size-12 rounded-2xl bg-teal-700 text-white flex items-center justify-center"><GraduationCap className="size-7"/></div><div><h1 className="font-black text-lg">سامانه هوشمند مدیریت مدارس</h1><p className="text-xs text-slate-500 mt-1">ورود به فضای اختصاصی مدرسه</p></div></div>
    <form onSubmit={submit} className="space-y-4">
      {!challengeId&&<label className="block text-sm font-bold">شناسه کاربری<input id="login-username" autoComplete="username" required dir="ltr" value={username} onChange={e=>setUsername(e.target.value)} className="mt-2 w-full min-h-12 border border-slate-200 rounded-xl px-3 bg-slate-50"/></label>}
      {((mode==='login'&&!challengeId)||(mode!=='login'&&!!challengeId))&&<label className="block text-sm font-bold">{mode==='login'?'رمز عبور':'رمز جدید (حداقل دوازده نویسه)'}<input id="login-password" type="password" autoComplete={mode==='login'?'current-password':'new-password'} minLength={mode==='login'?undefined:12} maxLength={128} required value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full min-h-12 border border-slate-200 rounded-xl px-3 bg-slate-50"/></label>}
      {!!challengeId&&<label className="block text-sm font-bold">کد تأیید پیامکی<input id="login-otp" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} value={code} onChange={e=>setCode(e.target.value)} className="mt-2 w-full min-h-12 border border-slate-200 rounded-xl px-3 bg-slate-50"/></label>}
      {error&&<p role="alert" className="text-sm bg-rose-50 text-rose-800 rounded-xl p-3">{error}</p>}{message&&<p role="status" className="text-sm text-teal-800">{message}</p>}
      <button id="login-submit" disabled={busy} className="min-h-12 w-full bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2"><LockKeyhole className="size-4"/>{busy?'در حال بررسی…':challengeId?'تأیید و ادامه':mode==='login'?'ورود':'دریافت کد تأیید'}</button>
    </form>
    <div className="flex flex-wrap mt-4 gap-2">{(['login','activate','recover'] as const).filter(v=>v!==mode).map(v=><button key={v} type="button" disabled={busy} onClick={()=>{setMode(v);setChallengeId('');setCode('');setError('');setMessage('');}} className="min-h-11 px-3 text-xs text-teal-800 font-bold">{v==='login'?'بازگشت به ورود':v==='activate'?'فعال‌سازی حساب':'فراموشی رمز'}</button>)}</div>
  </section></main>;
}
