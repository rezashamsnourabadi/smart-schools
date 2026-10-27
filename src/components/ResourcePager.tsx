import {useState,useEffect} from 'react';
import {useApp} from '../context/AppContext';
import {toPersianDigits} from '../utils/persianUtils';

export function ResourcePager({kind}:{kind:string}) {
  const {page,setPage}=useApp();const current=page(kind);const [search,setSearch]=useState(current.search);
  useEffect(()=>{const timer=setTimeout(()=>{if(search!==current.search)setPage(kind,{search,offset:0});},350);return()=>clearTimeout(timer);},[search,current.search,kind,setPage]);
  return <div id={`pager-${kind}`} className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 border-y border-slate-200 text-xs">
    <input aria-label="جستجو در فهرست" placeholder="جستجو در فهرست…" value={search} onChange={e=>setSearch(e.target.value)} className="min-h-11 px-3 rounded-xl border border-slate-200 bg-white flex-1 min-w-32"/>
    <span role="status">{current.loading?'در حال دریافت…':`${toPersianDigits(current.total)} مورد`}</span>
    <button disabled={current.loading||current.offset===0} onClick={()=>setPage(kind,{offset:Math.max(0,current.offset-25)})} className="min-h-11 px-3 bg-white rounded-xl border border-slate-200 disabled:opacity-40">قبلی</button>
    <button disabled={current.loading||current.offset+25>=current.total} onClick={()=>setPage(kind,{offset:current.offset+25})} className="min-h-11 px-3 bg-white rounded-xl border border-slate-200 disabled:opacity-40">بعدی</button>
  </div>;
}
