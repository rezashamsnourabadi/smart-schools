import {useEffect,useState} from 'react';
import {ArrowRight,GraduationCap,LockKeyhole,MessageSquare} from 'lucide-react';
import {request} from '../api/client';
import {toEnglishDigits,toPersianDigits} from '../utils/persianUtils';

type Mode='login'|'activate'|'recover';
type Method='password'|'sms';

export function LoginPage({onSuccess}:{onSuccess:()=>void}) {
  const [mode,setMode]=useState<Mode>('login'),[method,setMethod]=useState<Method>('password');
  const [username,setUsername]=useState(''),[password,setPassword]=useState(''),[code,setCode]=useState(''),[challengeId,setChallengeId]=useState('');
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[resendIn,setResendIn]=useState(0);
  useEffect(()=>{
    if(!challengeId)return;
    const timer=setInterval(()=>setResendIn(value=>Math.max(0,value-1)),1000);
    return()=>clearInterval(timer);
  },[challengeId]);
  const resetChallenge=()=>{setChallengeId('');setCode('');setError('');setMessage('');setResendIn(0);};
  const requestCode=async()=>{
    const result=await request<{challengeId:string}>('/auth/challenge',{method:'POST',body:{username:toEnglishDigits(username),purpose:mode==='login'?'login':mode}});
    setChallengeId(result.challengeId);setCode('');setResendIn(60);
    setMessage('اگر حساب واجد شرایط باشد، کد به شماره تأییدشده آن ارسال می‌شود.');
  };
  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();if(busy)return;setBusy(true);setError('');setMessage('');
    try {
      if(challengeId){
        const result=await request<{authenticated:boolean;passwordChanged?:boolean}>('/auth/verify',{method:'POST',body:{challengeId,code:toEnglishDigits(code),...(mode!=='login'?{password}:{})}});
        if(result.authenticated)onSuccess();else {resetChallenge();setMode('login');setMethod('password');setPassword('');setMessage('رمز ثبت شد؛ اکنون وارد شوید.');}
      }else if(mode==='login'&&method==='password'){
        await request('/auth/login',{method:'POST',body:{username:toEnglishDigits(username),password}});onSuccess();
      }else await requestCode();
    }catch(e){setError(e instanceof Error?e.message:'ورود ممکن نشد.');}finally{setBusy(false);}
  };
  const resend=async()=>{
    if(busy||resendIn>0)return;setBusy(true);setError('');
    try{await requestCode();}catch(e){setError(e instanceof Error?e.message:'ارسال مجدد ممکن نشد.');}finally{setBusy(false);}
  };
  return <main dir="rtl" id="login-page" className="min-h-screen bg-slate-100/70 flex flex-col gap-5 items-center justify-center p-4 text-slate-800"><section className="bg-white rounded-3xl border border-slate-200 shadow-sm w-full max-w-md p-6 sm:p-8">
    <div className="flex items-center gap-3 mb-7"><div className="size-12 rounded-2xl bg-teal-700 text-white flex items-center justify-center"><GraduationCap className="size-7" aria-hidden="true"/></div><div><h1 className="font-black text-lg">سامانه هوشمند مدیریت مدارس</h1><p className="text-xs text-slate-500 mt-1">{mode==='login'?'ورود به فضای اختصاصی مدرسه':mode==='activate'?'فعال‌سازی حساب':'بازیابی رمز عبور'}</p></div></div>
    {mode==='login'&&!challengeId&&<div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1" role="group" aria-label="روش ورود">
      {(['password','sms'] as const).map(value=><button id={`login-method-${value}`} key={value} type="button" aria-pressed={method===value} disabled={busy} onClick={()=>{setMethod(value);setPassword('');resetChallenge();}} className={`min-h-11 rounded-xl px-2 text-xs font-bold flex items-center justify-center gap-2 ${method===value?'bg-white text-teal-800 shadow-sm':'text-slate-500 hover:text-slate-800'}`}>{value==='password'?<LockKeyhole className="size-4" aria-hidden="true"/>:<MessageSquare className="size-4" aria-hidden="true"/>}{value==='password'?'ورود با رمز':'ورود با پیامک'}</button>)}
    </div>}
    <form onSubmit={submit} className="space-y-4">
      {!challengeId&&<label className="block text-sm font-bold">شناسه کاربری<input id="login-username" autoComplete="username" required dir="ltr" value={username} onChange={e=>setUsername(e.target.value)} className="mt-2 w-full min-h-12 border border-slate-200 rounded-xl px-3 bg-slate-50"/></label>}
      {((mode==='login'&&method==='password'&&!challengeId)||(mode!=='login'&&!!challengeId))&&<label className="block text-sm font-bold">{mode==='login'?'رمز عبور':'رمز جدید (حداقل دوازده نویسه)'}<input id="login-password" type="password" autoComplete={mode==='login'?'current-password':'new-password'} minLength={mode==='login'?undefined:12} maxLength={128} required value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full min-h-12 border border-slate-200 rounded-xl px-3 bg-slate-50"/></label>}
      {!!challengeId&&<label className="block text-sm font-bold">کد تأیید پیامکی<input id="login-otp" inputMode="numeric" autoComplete="one-time-code" dir="ltr" required minLength={6} maxLength={6} value={code} onChange={e=>setCode(e.target.value)} className="mt-2 w-full min-h-12 border border-slate-200 rounded-xl px-3 bg-slate-50"/></label>}
      {error&&<p role="alert" className="text-sm bg-rose-50 text-rose-800 rounded-xl p-3">{error}</p>}{message&&<p role="status" className="text-xs leading-7 text-teal-800">{message}</p>}
      <button id="login-submit" disabled={busy} className="min-h-12 w-full bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2"><LockKeyhole className="size-4" aria-hidden="true"/>{busy?'در حال بررسی…':challengeId?(mode==='login'?'تأیید و ورود':'ثبت رمز جدید'):mode==='login'&&method==='password'?'ورود':'دریافت کد تأیید'}</button>
      {!!challengeId&&<div className="flex flex-wrap items-center justify-between gap-2 text-xs"><button id="login-resend" type="button" disabled={busy||resendIn>0} onClick={()=>void resend()} className="min-h-11 px-2 text-teal-800 disabled:text-slate-400">{resendIn>0?`ارسال مجدد تا ${toPersianDigits(resendIn)} ثانیه دیگر`:'ارسال مجدد کد'}</button><button type="button" disabled={busy} onClick={resetChallenge} className="min-h-11 px-2 text-slate-500">تغییر شناسه / روش ورود</button></div>}
    </form>
    <div className="flex flex-wrap mt-4 gap-2">{(['login','activate','recover'] as const).filter(value=>value!==mode).map(value=><button key={value} type="button" disabled={busy} onClick={()=>{setMode(value);resetChallenge();}} className="min-h-11 px-3 text-xs text-teal-800 font-bold">{value==='login'?'بازگشت به ورود':value==='activate'?'فعال‌سازی حساب':'فراموشی رمز'}</button>)}</div>
  </section><a id="login-back-home" href="/" className="inline-flex min-h-11 items-center gap-2 px-3 text-xs text-slate-500 hover:text-teal-800"><ArrowRight className="size-4" aria-hidden="true"/>بازگشت به صفحه اصلی</a></main>;
}
