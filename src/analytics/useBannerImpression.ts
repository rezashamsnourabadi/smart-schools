import {useEffect,useRef} from 'react';
import {useAnalytics} from './AnalyticsProvider';
export function useBannerImpression(bannerId:string|undefined,variant:string){
 const node=useRef<HTMLElement|null>(null),track=useAnalytics();
 useEffect(()=>{
  const element=node.current;if(!element||!bannerId||!('IntersectionObserver' in window))return;
  let visible=false,timer:ReturnType<typeof setTimeout>|undefined,recorded=false;
  const cancel=()=>{if(timer)clearTimeout(timer);timer=undefined;};
  const start=()=>{cancel();if(recorded||!visible||document.visibilityState!=='visible')return;timer=setTimeout(()=>{timer=undefined;if(visible&&document.visibilityState==='visible'&&element.isConnected&&!document.querySelector('[aria-modal="true"]')){recorded=true;track('banner_impression',bannerId);}},1000);};
  const observer=new IntersectionObserver(entries=>{visible=entries.some(entry=>entry.isIntersecting&&entry.intersectionRatio>=0.5);start();},{threshold:[0,0.5,1]});observer.observe(element);
  document.addEventListener('visibilitychange',start);
  return()=>{cancel();observer.disconnect();document.removeEventListener('visibilitychange',start);};
 },[bannerId,variant,track]);
 return node;
}
