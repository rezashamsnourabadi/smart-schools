import {resolve} from 'node:path';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {cpus,totalmem} from 'node:os';
import {chromium} from '@playwright/test';
import staticFiles from '@fastify/static';

process.env.NODE_ENV='test';process.env.DATABASE_URL=process.env.TEST_DATABASE_URL||'postgres://school_app:local-app-password@127.0.0.1:55432/schools';process.env.REDIS_URL=process.env.TEST_REDIS_URL||'redis://127.0.0.1:56379';
const {createApp}=await import('../server/app');const {pool}=await import('../server/db');
const app=await createApp();await app.register(staticFiles,{root:resolve('dist'),maxAge:'1y',immutable:true});
const origin=await app.listen({host:'127.0.0.1',port:0});const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
const runs:{lcpMs:number;eventP95Ms:number;resourceBytes:number}[]=[];
try {
  for(let index=0;index<3;index++){
    const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage();const cdp=await context.newCDPSession(page);
    await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:100000,connectionType:'cellular3g'});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
    await page.addInitScript(()=>{const metrics={lcp:0,events:[] as number[]};Object.assign(window,{schoolMetrics:metrics});new PerformanceObserver(list=>{for(const entry of list.getEntries())metrics.lcp=entry.startTime;}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(list=>{for(const entry of list.getEntries())metrics.events.push(entry.duration);}).observe({type:'event',buffered:true,durationThreshold:16} as PerformanceObserverInit & {durationThreshold:number});});
    await page.goto(origin);await page.locator('#login-page').waitFor();await page.waitForTimeout(300);
    const lcpMs=await page.evaluate(()=>(window as unknown as {schoolMetrics:{lcp:number}}).schoolMetrics.lcp);
    for(let click=0;click<5;click++){await page.getByRole('button',{name:'فعال‌سازی حساب',exact:true}).click();await page.getByRole('button',{name:'بازگشت به ورود',exact:true}).click();}
    const values=await page.evaluate(()=>{const metrics=(window as unknown as {schoolMetrics:{events:number[]}}).schoolMetrics;return {events:metrics.events,bytes:performance.getEntriesByType('resource').reduce((sum,entry)=>sum+(entry as PerformanceResourceTiming).transferSize,0)};});
    values.events.sort((a,b)=>a-b);runs.push({lcpMs:Math.round(lcpMs),eventP95Ms:values.events[Math.floor(values.events.length*.95)]||0,resourceBytes:values.bytes});
    await mkdir('.local/screens',{recursive:true});await page.screenshot({path:`.local/screens/login-performance-${index+1}.png`});await context.close();
  }
  const html=await readFile('dist/index.html','utf8');const entry=html.match(/src="([^"]+\.js)"/)?.[1];if(!entry)throw new Error('Missing entry script');const gzipBytes=gzipSync(await readFile(resolve('dist',entry.replace(/^\//,'')))).byteLength;
  const report={at:new Date().toISOString(),network:{downloadMbps:1.6,latencyMs:150,cpuSlowdown:4},entryGzipBytes:gzipBytes,runs,hardware:{cpu:cpus()[0].model,cpus:cpus().length,memoryGiB:Math.round(totalmem()/1024**3)},note:'Cold production assets in installed Edge; event timing of local login form interactions. Lab measurements, not field INP or guaranteed performance on every phone.'};await writeFile('.local/performance.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
  if(gzipBytes>150*1024||runs.some(run=>run.lcpMs>3500||run.eventP95Ms>200))process.exitCode=1;
}finally{await browser.close();await app.close();await pool.end();}
