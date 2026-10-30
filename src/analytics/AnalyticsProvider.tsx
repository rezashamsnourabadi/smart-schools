import {createContext,useCallback,useContext,useEffect,useRef,type ReactNode} from 'react';
import {useAuth} from '../auth/AuthContext';
import type {AnalyticsEvent,AnalyticsKind} from '../../shared/analytics';
const Context=createContext<(kind:AnalyticsKind,bannerId?:string)=>void>(()=>{});
export const useAnalytics=()=>useContext(Context);
export function AnalyticsProvider({children}:{children:ReactNode}){
 const auth=useAuth(),enqueue=useRef<(kind:AnalyticsKind,bannerId?:string)=>void>(()=>{});
 const track=useCallback((kind:AnalyticsKind,bannerId?:string)=>enqueue.current(kind,bannerId),[]);
 useEffect(()=>{
  if(auth.member.role==='platform_admin')return;
  let closed=false,busy=false,timer:ReturnType<typeof setTimeout>|undefined;
  const attempts=new Set<string>();
  const queue:AnalyticsEvent[]=[],seen=new Map<string,string>(),controller=new AbortController();
  const day=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tehran'}).format(new Date());
  const schedule=(delay=800)=>{if(!closed&&!timer)timer=setTimeout(()=>{timer=undefined;void flush();},delay);};
  const flush=async()=>{
   if(closed||busy||!queue.length)return;busy=true;const events=queue.splice(0,20);
   try{
    const send=()=>fetch('/api/v1/analytics/events',{method:'POST',credentials:'same-origin',keepalive:true,signal:controller.signal,headers:{'Content-Type':'application/json','X-Membership-Id':auth.member.id,'X-CSRF-Token':auth.user.csrf},body:JSON.stringify({events})});
    const result=await send();if(result.status===401){queue.length=0;closed=true;}if(result.status>=500)throw new Error('Analytics unavailable');for(const item of events)attempts.delete(item.id);
   }catch{if(!closed&&!controller.signal.aborted){const retry=events.filter(item=>!attempts.has(item.id)).slice(0,Math.max(0,100-queue.length));for(const item of events)attempts.delete(item.id);for(const item of retry)attempts.add(item.id);queue.unshift(...retry);if(retry.length)schedule(5000);}}
   finally{busy=false;if(queue.length&&!closed)schedule(5000);}
  };
  // Best effort only: one retry per event, no persistent browser history and no UI dependency.
  const boundedFlush=flush;
  enqueue.current=(kind,bannerId)=>{
   if(closed||queue.length>=100)return;
   const bucket=kind==='activity'?day():String(Math.floor(Date.now()/(kind==='banner_click'?2000:1800000))),key=`${kind}:${bannerId||''}`;
   if(seen.get(key)===bucket)return;seen.set(key,bucket);
   queue.push({id:crypto.randomUUID(),kind,...bannerId?{bannerId}:{}});schedule(kind==='banner_click'?0:800);
  };
  const activity=()=>{if(document.visibilityState==='visible')enqueue.current('activity');};
  const visibility=()=>{if(document.visibilityState==='visible')activity();else void boundedFlush();};
  document.addEventListener('visibilitychange',visibility);activity();const midnightCheck=setInterval(activity,60000);
  return()=>{closed=true;enqueue.current=()=>{};controller.abort();if(timer)clearTimeout(timer);clearInterval(midnightCheck);document.removeEventListener('visibilitychange',visibility);queue.length=0;attempts.clear();};
 },[auth.member.id,auth.user.csrf]);
 return <Context.Provider value={track}>{children}</Context.Provider>;
}
