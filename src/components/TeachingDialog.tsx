import {useEffect,useRef,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {motion,useReducedMotion} from 'motion/react';
import {X,type LucideIcon} from 'lucide-react';

let openDialogs=0;
const dialogStack: HTMLElement[] = [];
interface Props {id:string;title:ReactNode;description:string;icon:LucideIcon;onClose:()=>void;busy?:boolean;children:ReactNode;footer?:ReactNode;notice?:ReactNode;className?:string;overlayClassName?:string}
export function TeachingDialog({id,title,description,icon:Icon,onClose,busy=false,children,footer,notice,className='',overlayClassName=''}:Props){
  const reduced=useReducedMotion(),dialog=useRef<HTMLElement>(null),close=useRef<HTMLButtonElement>(null);
  useEffect(()=>{
    const previous=document.activeElement;
    const element=dialog.current;
    if(element)dialogStack.push(element);
    openDialogs++;document.body.classList.add('teaching-dialog-open');close.current?.focus();
    return()=>{if(element){const index=dialogStack.indexOf(element);if(index>=0)dialogStack.splice(index,1);}if(--openDialogs===0)document.body.classList.remove('teaching-dialog-open');if(previous instanceof HTMLElement&&previous.isConnected)previous.focus();};
  },[]);
  return createPortal(<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reduced?0:0.15}} className={`fixed inset-0 z-[105] flex items-end justify-center bg-[#1f392e]/45 sm:items-center sm:p-5 ${overlayClassName}`}>
    <motion.section ref={dialog} id={id} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} initial={{y:reduced?0:16}} animate={{y:0}} transition={{duration:reduced?0:0.18}} className={`teaching-dialog dana-dialog flex w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-[#e0e7d9] bg-[#fafbf7] shadow-2xl sm:rounded-3xl ${className}`} onKeyDown={event=>{
      if(dialogStack.at(-1)!==dialog.current)return;
      if(event.key==='Escape'){event.stopPropagation();if(!busy)onClose();}
      if(event.key==='Tab'){
        const nodes=Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex="0"]')||[]).filter(node=>node.getClientRects().length);
        const first=nodes[0],last=nodes[nodes.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    }}>
      <header className="flex shrink-0 items-start gap-3 border-b border-[#e3e9dc] bg-white px-4 py-4 sm:px-6 sm:py-5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1e2] text-[#7e9866]"><Icon className="size-5" strokeWidth={1.5} aria-hidden="true"/></span>
        <div className="min-w-0 flex-1"><h2 id={`${id}-title`} className="text-sm font-bold leading-7 text-[#36543d] sm:text-base">{title}</h2><p id={`${id}-description`} className="mt-1 text-[11px] leading-6 text-[#929d88]">{description}</p></div>
        <button ref={close} type="button" onClick={onClose} disabled={busy} aria-label="بستن پنجره" className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f3f6ed] text-[#93a184] disabled:opacity-50"><X className="size-4" aria-hidden="true"/></button>
      </header>
      {notice&&<div className="shrink-0 px-4 pt-3 sm:px-6">{notice}</div>}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">{children}</div>
      {footer&&<footer className="student-sheet-footer shrink-0 border-t border-[#e3e9dc] bg-white px-4 pt-3 pb-4 sm:px-6">{footer}</footer>}
    </motion.section>
  </motion.div>,document.body);
}
export function TeachingSection({title,description,children}:{title:string;description?:string;children:ReactNode}){
  return <section className="space-y-4 rounded-2xl border border-[#e4e9dc] bg-white p-4 sm:p-5"><div><h3 className="text-xs font-bold leading-6 text-[#667e54]">{title}</h3>{description&&<p className="mt-1 text-[11px] leading-6 text-[#9aa38e]">{description}</p>}</div>{children}</section>;
}
