export function TeacherRecordPager({offset,total,onChange}:{offset:number;total:number;onChange:(offset:number)=>void}){
 return total>25?<div className="flex items-center justify-between gap-2"><button type="button" disabled={!offset} onClick={()=>onChange(Math.max(0,offset-25))} className="teaching-secondary disabled:opacity-40">قبلی</button><button type="button" disabled={offset+25>=total} onClick={()=>onChange(offset+25)} className="teaching-secondary disabled:opacity-40">بعدی</button></div>:null;
}
