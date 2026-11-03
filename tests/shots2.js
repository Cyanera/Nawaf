const { chromium } = require('playwright'); const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html'); const OUT='/tmp/claude-0/-home-user-Nawaf/585e9f38-2fd5-5cbd-bf15-a8d20aff6242/scratchpad/';
(async()=>{const b=await chromium.launch(); const errs=[];
 const p=await (await b.newContext({viewport:{width:900,height:800},deviceScaleFactor:1})).newPage();
 p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/Failed to load/.test(m.text()))errs.push(m.text())});
 await p.goto(URL);
 for (const id of ['L1','L2','L3','L4','L5','L6','L7','L8','L9','L10','L11','L12','L13','L14','L15']) {
   await p.evaluate(i=>location.hash='#lesson-'+i,id); await p.waitForTimeout(80);
   const el=p.locator('.dg-fig'); if(!(await el.count())) {errs.push('no diagram '+id);continue;}
   await el.first().screenshot({path:OUT+'dg-'+id+'.png'});
   const vids=await p.locator('.vids a').count(); if(id!=='L10' && !vids) errs.push('no videos '+id);
 }
 await p.evaluate(()=>location.hash='#subnet'); await p.waitForTimeout(100);
 console.log(await p.locator('#sn-out').innerText());
 await p.evaluate(()=>location.hash='#progress'); await p.waitForTimeout(100);
 await p.screenshot({path:OUT+'progress.png',fullPage:true});
 console.log('errors:',errs); await b.close();})();
