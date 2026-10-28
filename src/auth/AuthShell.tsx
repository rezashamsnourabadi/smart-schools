import {lazy,Suspense,useCallback,useEffect,useState} from 'react';
import {request,RequestError} from '../api/client';
import type {AuthState} from './AuthContext';
import {Status} from './Status';
import {LoginPage} from './LoginPage';
import {showLoginPath} from './navigation';
const ConnectedApp=lazy(()=>import('../ConnectedApp'));

/** Authentication boots before loading the dashboard query/cache runtime. */
export function AuthShell(){
  const [session,setSession]=useState<AuthState|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const read=useCallback(async(signal?:AbortSignal)=>{
    setLoading(true);setError('');try{setSession(await request<AuthState>('/auth/me',{signal}));}
    catch(e){if(e instanceof DOMException&&e.name==='AbortError')return;if(e instanceof RequestError&&e.status===401)setSession(null);else setError((e as Error).message);}
    finally{if(!signal?.aborted)setLoading(false);}
  },[]);
  useEffect(()=>{const controller=new AbortController();void read(controller.signal);return()=>controller.abort();},[read]);
  useEffect(()=>{if(!loading&&!error&&!session)showLoginPath();},[loading,error,session]);
  if(loading)return <Status text="در حال بررسی ورود…"/>;
  if(error)return <Status text={error} onRetry={()=>void read()}/>;
  if(!session)return <LoginPage onSuccess={()=>void read()}/>;
  return <Suspense fallback={<Status text="در حال بارگذاری میز کار…"/>}><ConnectedApp initialSession={session}/></Suspense>;
}
