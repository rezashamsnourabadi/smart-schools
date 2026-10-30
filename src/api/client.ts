export class RequestError extends Error {
  constructor(message:string,public status:number,public code:string){super(message);}
}
export interface RequestScope { membershipId:string; yearId?:string; csrf:string }
export async function request<T>(path:string,options:{method?:string;body?:unknown;scope?:RequestScope;signal?:AbortSignal;key?:string;headers?:Record<string,string>}={}):Promise<T> {
  let response:Response;
  try {
    response=await fetch(`/api/v1${path}`,{method:options.method||'GET',credentials:'same-origin',signal:options.signal,headers:{...(options.body instanceof FormData?{}:options.body!==undefined?{'Content-Type':'application/json'}:{}),...(options.scope?{'X-Membership-Id':options.scope.membershipId,'X-CSRF-Token':options.scope.csrf,...options.scope.yearId?{'X-Academic-Year-Id':options.scope.yearId}:{}}:{}),...(options.key?{'Idempotency-Key':options.key}:{}),...options.headers},body:options.body===undefined?undefined:options.body instanceof FormData?options.body:JSON.stringify(options.body)});
  } catch(e){if(e instanceof DOMException&&e.name==='AbortError')throw e;throw new RequestError('ارتباط برقرار نشد؛ اطلاعات فرم را نگه دارید و دوباره تلاش کنید.',0,'NETWORK');}
  const data=await response.json().catch(()=>null);
  if(!response.ok){if(['SCHOOL_READ_ONLY','SCHOOL_SUSPENDED'].includes(data?.error?.code)&&typeof window!=='undefined')window.dispatchEvent(new Event('school-access-changed'));if(response.status===401&&!path.startsWith('/auth/')&&typeof window!=='undefined')window.dispatchEvent(new Event('school-session-ended'));throw new RequestError(data?.error?.message||'انجام درخواست ممکن نشد.',response.status,data?.error?.code||'REQUEST_FAILED');}
  return data as T;
}
export async function uploadDataUrl(value:string,name:string,scope:RequestScope,query:Record<string,string>):Promise<string> {
  if(!value.startsWith('data:'))return value;
  const blob=await(await fetch(value)).blob();const form=new FormData();form.append('file',blob,name);
  return (await request<{url:string}>(`/files?${new URLSearchParams(query)}`,{method:'POST',body:form,scope})).url;
}
