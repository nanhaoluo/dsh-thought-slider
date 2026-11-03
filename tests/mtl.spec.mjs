import {test,expect} from '@playwright/test';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const engine=await readFile('src/engine.js','utf8');
const bundle=await build({entryPoints:['tests/fixtures/mtl-host.jsx'],bundle:true,write:false,format:'iife',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'catalog-stubs',setup(b){b.onResolve({filter:/(configured-inputs|knowledge|capacity|provider-enabled|provider-order|model-order|effort-memory)\.js$/},()=>({path:path.resolve('tests/fixtures/mtl/helpers.js')}));}}]});
test.beforeEach(async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.errors=errors;
 await page.setContent('<html lang="zh-CN"><style>body{font:14px system-ui;margin:32px}.codexModelSelectMenu{width:400px;max-height:360px;overflow:hidden;display:flex;flex-direction:column;padding:4px}#app{width:100%}*{corner-shape:superellipse(1.5)}.bre-effort-slider{min-height:30px}</style><div class="codexModelSelectMenu bre-model-menu-host" role="menu"><div id="app"></div></div>');
 await page.addScriptTag({content:bundle.outputFiles[0].text});
 await expect(page.locator('.bre-effort-slider')).toHaveAttribute('aria-valuenow','2');
 await page.addScriptTag({content:engine});await page.evaluate(()=>window.__DSH_THOUGHT_SLIDER__.install());
});
test.afterEach(async({page})=>expect(page.errors).toEqual([]));
async function drag(page,from,to){const r=await page.locator('.bre-effort-slider').boundingBox();await page.mouse.move(r.x+r.width*from,r.y+r.height/2);await page.mouse.down();await page.mouse.move(r.x+r.width*to,r.y+r.height/2,{steps:8});return r;}
for(const [from,to,index] of [[.25,.6,3],[.75,.6,2],[.5,1,4]])test(`MTL real handlers snap ${from} to ${to} and submit once`,async({page})=>{
 if(index===2){await page.locator('.bre-effort-slider').focus();await page.keyboard.press('End');await expect(page.locator('.bre-effort-slider')).toHaveAttribute('aria-valuenow','4');await expect(page.locator('.bre-effort-slider')).not.toHaveAttribute('aria-disabled','true');await page.evaluate(()=>{calls.length=0})}
 await drag(page,from,to);expect(await page.locator('.bre-effort-slider').evaluate(s=>parseFloat(s.style.getPropertyValue('--dsh-thought-progress')))).toBeCloseTo(to*100,3);
 await expect(page.locator('.bre-effort-slider-head-value')).toHaveText('Level '+index);
 expect(await page.evaluate(()=>calls.length)).toBe(0);
 await page.mouse.up();await expect.poll(()=>page.evaluate(()=>calls.length)).toBe(1);
 expect(await page.evaluate(()=>calls[0].reasoningEffort)).toBe('e'+index);
 await expect(page.locator('.bre-effort-slider')).toHaveAttribute('aria-valuenow',String(index));
});
test('MTL cancellation never reaches its cancel-as-commit handler',async({page})=>{
 await drag(page,.5,.9);await page.evaluate(()=>dispatchEvent(new Event('blur')));await page.mouse.up();
 expect(await page.evaluate(()=>calls.length)).toBe(0);
 await expect(page.locator('.bre-effort-slider')).toHaveCSS('--dsh-thought-progress','50%');
 await expect(page.locator('.bre-effort-slider-head-value')).toHaveText('Level 2');
});
test('MTL refusal rolls back and keyboard stays native',async({page})=>{
 await page.evaluate(()=>{refuseNext=true});await drag(page,.5,.9);await page.mouse.up();
 await expect(page.locator('.bre-model-error')).toContainText('refused');
 await expect(page.locator('.bre-effort-slider')).toHaveCSS('--dsh-thought-progress','50%');
 await page.locator('.bre-effort-slider').focus();await page.keyboard.press('End');
 await expect(page.locator('.bre-effort-slider')).toHaveAttribute('aria-valuenow','4');
});
test('MTL geometry survives global squircle and minimum-height overrides',async({page})=>{
 await page.addStyleTag({content:'html body .bre-effort-slider{min-height:30px!important}html body .bre-effort-slider-thumb{corner-shape:superellipse(1.5)!important}'});
 await expect(page.locator('.bre-effort-slider')).toHaveCSS('height','24px');
 await expect(page.locator('.bre-effort-slider-thumb')).toHaveCSS('corner-shape',/^(round|superellipse\(1\))$/);
 await expect(page.locator('.bre-effort-slider-thumb')).toHaveCSS('border-radius','50%');
 await expect(page.locator('.bre-effort-slider-thumb')).toHaveCSS('width','28px');
 await expect(page.locator('.bre-effort-slider-thumb')).toHaveCSS('height','28px');
});
test('MTL preview paints synchronously without host React work per move',async({page})=>{
 const box=await drag(page,.25,.38);
 const d=await page.evaluate(box=>{const s=document.querySelector('.bre-effort-slider'),p=s.querySelector('.zcode-thought-pointer');let scans=0;const original=document.querySelectorAll;document.querySelectorAll=function(...args){scans++;return original.apply(this,args)};
 p.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:1,buttons:1,clientX:box.x+box.width*.6,clientY:box.y}));
 const value=s.style.getPropertyValue('--dsh-thought-progress');document.querySelectorAll=original;return {value,scans,calls:calls.length};},box);
 expect(d).toEqual({value:'60%',scans:0,calls:0});await page.mouse.up();
});


test('MTL footer remains completely inside a formerly 360px clipped menu',async({page})=>{
 const geometry=await page.locator('.codexModelSelectMenu').evaluate(menu=>({menu:menu.getBoundingClientRect().bottom,label:menu.querySelector('.bre-effort-slider-labels').getBoundingClientRect().bottom}));
 expect(geometry.menu-geometry.label).toBeGreaterThanOrEqual(4);
});

test('MTL short viewport shrinks the list instead of clipping stop labels',async({page})=>{
 await page.setViewportSize({width:440,height:300});
 await page.addStyleTag({content:'body{margin:8px}.codexModelSelectMenu{position:absolute;left:8px;top:8px}'});
 await expect.poll(()=>page.locator('.codexModelSelectMenu').evaluate(menu=>{const m=menu.getBoundingClientRect(),l=menu.querySelector('.bre-effort-slider-labels').getBoundingClientRect(),p=menu.querySelector('.bre-panel-models').getBoundingClientRect();return {labelInside:l.bottom<=m.bottom-2,menuInside:m.bottom<=innerHeight,listShrank:p.height<196}})).toEqual({labelInside:true,menuInside:true,listShrank:true});
});

test('foreign footer resizing during a drag cannot cancel the gesture',async({page})=>{
 const box=await drag(page,.25,.38);
 await page.locator('.bre-menu-foot').evaluate(el=>el.style.setProperty('padding-bottom','15px','important'));
 await page.evaluate(async()=>{await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame)});
 await page.mouse.move(box.x+box.width*.6,box.y+box.height/2,{steps:4});
 expect(await page.locator('.bre-effort-slider').evaluate(s=>parseFloat(s.style.getPropertyValue('--dsh-thought-progress')))).toBeCloseTo(60,3);
 await page.mouse.up();await expect.poll(()=>page.evaluate(()=>calls.length)).toBe(1);
 expect(await page.evaluate(()=>calls[0].reasoningEffort)).toBe('e3');
});


test('foreign menu restorers cannot display duplicate host cells over the model picker',async({page})=>{
 await page.locator('.codexModelSelectMenu').evaluate(menu=>{const old=document.createElement('button');old.className='codexModelSelectCell';old.setAttribute('role','menuitem');old.textContent='old host cell';old.style.display='block';menu.appendChild(old)});
 await expect(page.getByText('old host cell')).toBeHidden();
 await expect(page.locator('.bre-provider').first()).toBeVisible();
 await expect(page.locator('.bre-option').first()).toBeVisible();
});

test('MTL thumb continuously follows small movements within the same stop interval',async({page})=>{
 const box=await drag(page,.25,.35);
 const positions=[];
 for(const ratio of [.36,.37,.38,.39,.40]){
  await page.mouse.move(box.x+box.width*ratio,box.y+box.height/2);
  positions.push(await page.locator('.bre-effort-slider').evaluate(s=>{const r=s.getBoundingClientRect(),k=s.querySelector('.bre-effort-slider-thumb').getBoundingClientRect();return (k.x+k.width/2-r.x)/r.width}));
 }
 for(let i=0;i<positions.length;i++)expect(positions[i]).toBeCloseTo(.36+i*.01,3);
 expect(new Set(positions).size).toBe(5);
 expect(await page.evaluate(()=>calls.length)).toBe(0);
 await page.mouse.up();
 await expect(page.locator('.bre-effort-slider')).toHaveAttribute('aria-valuenow','2');
 await expect(page.locator('.bre-effort-slider')).toHaveCSS('--dsh-thought-progress','50%');
 await expect(page.locator('.bre-effort-slider')).toHaveAttribute('data-dsh-thought-settling','false');
});

test('MTL grabbing the edge of a thumb preserves its initial position',async({page})=>{
 const box=await page.locator('.bre-effort-slider-thumb').boundingBox();
 await page.mouse.move(box.x+3,box.y+box.height/2);await page.mouse.down();
 expect(await page.locator('.bre-effort-slider').evaluate(s=>parseFloat(s.style.getPropertyValue('--dsh-thought-progress')))).toBeCloseTo(50,3);
 await page.mouse.move(box.x+13,box.y+box.height/2);
 const delta=await page.locator('.bre-effort-slider-thumb').evaluate((k,b)=>k.getBoundingClientRect().x-b.x,box);
 expect(delta).toBeCloseTo(10,1);
 await page.evaluate(()=>dispatchEvent(new Event('blur')));await page.mouse.up();
 expect(await page.evaluate(()=>calls.length)).toBe(0);
});

test('MTL click paints immediately and retains the chosen stop through a slow commit',async({page})=>{
 await page.evaluate(()=>{delay=300});
 const r=await page.locator('.bre-effort-slider').boundingBox();
 await page.mouse.move(r.x+r.width*.74,r.y+r.height/2);await page.mouse.down();
 await expect(page.locator('.bre-effort-slider')).toHaveCSS('--dsh-thought-progress','75%');
 await expect(page.locator('.bre-effort-slider-head-value')).toHaveText('Level 3');
 await page.mouse.up();
 const values=await page.evaluate(async()=>{const values=[];for(let i=0;i<8;i++){await new Promise(requestAnimationFrame);values.push(parseFloat(document.querySelector('.bre-effort-slider').style.getPropertyValue('--dsh-thought-progress')))}return values});
 expect(values.every(v=>v===75)).toBe(true);
 await expect(page.locator('.bre-effort-slider')).not.toHaveAttribute('aria-disabled','true');
 expect(await page.evaluate(()=>calls.length)).toBe(1);
});

async function clickRatio(page,ratio){const b=await page.locator('.bre-effort-slider').boundingBox();await page.mouse.click(b.x+b.width*ratio,b.y+b.height/2)}

test('MTL rapid busy clicks keep the latest intent and submit it after unlocking',async({page})=>{
 await page.evaluate(()=>{delay=500});
 await clickRatio(page,.25);
 await expect(page.locator('.bre-effort-slider')).toHaveAttribute('aria-disabled','true');
 await clickRatio(page,.75);await clickRatio(page,1);await clickRatio(page,0);
 await expect(page.locator('.bre-effort-slider')).toHaveCSS('--dsh-thought-progress','0%');
 await expect(page.locator('.bre-effort-slider-head-value')).toHaveText('Level 0');
 expect(await page.evaluate(()=>calls.length)).toBe(1);
 const positions=await page.evaluate(async()=>{const r=[];for(let i=0;i<38;i++){await new Promise(requestAnimationFrame);r.push(parseFloat(document.querySelector('.bre-effort-slider').style.getPropertyValue('--dsh-thought-progress')))}return r});
 expect(positions.every(v=>v===0)).toBe(true);
 await expect(page.locator('.bre-effort-slider')).not.toHaveAttribute('aria-disabled','true');
 expect(await page.evaluate(()=>calls.map(c=>c.reasoningEffort))).toEqual(['e1','e0']);
});

test('MTL remains draggable while saving and applies the latest released stop',async({page})=>{
 await page.evaluate(()=>{delay=400});await clickRatio(page,.25);
 await expect(page.locator('.bre-effort-slider')).toHaveAttribute('aria-disabled','true');
 await drag(page,.1,.6);
 expect(await page.locator('.bre-effort-slider').evaluate(s=>parseFloat(s.style.getPropertyValue('--dsh-thought-progress')))).toBeCloseTo(60,3);
 await page.mouse.up();
 await expect(page.locator('.bre-effort-slider')).toHaveCSS('--dsh-thought-progress','75%');
 await expect(page.locator('.bre-effort-slider')).not.toHaveAttribute('aria-disabled','true');
 expect(await page.evaluate(()=>calls.map(c=>c.reasoningEffort))).toEqual(['e1','e3']);
});

test('MTL cancelling a new gesture preserves the previously queued click',async({page})=>{
 await page.evaluate(()=>{delay=500});await clickRatio(page,.25);await clickRatio(page,.75);
 await drag(page,.75,.95);await page.evaluate(()=>dispatchEvent(new Event('blur')));await page.mouse.up();
 await expect(page.locator('.bre-effort-slider')).toHaveCSS('--dsh-thought-progress','75%');
 await expect(page.locator('.bre-effort-slider')).not.toHaveAttribute('aria-disabled','true');
 expect(await page.evaluate(()=>calls.map(c=>c.reasoningEffort))).toEqual(['e1','e3']);
});

test('MTL remains interactive under a foreign disabled pointer-events rule',async({page})=>{
 await page.addStyleTag({content:'[aria-disabled="true"]{pointer-events:none!important}'});
 await page.evaluate(()=>{delay=500});
 await clickRatio(page,.25);
 await expect(page.locator('.bre-effort-slider')).toHaveAttribute('aria-disabled','true');
 await clickRatio(page,.75);
 await expect(page.locator('.bre-effort-slider')).toHaveCSS('--dsh-thought-progress','75%');
 await expect(page.locator('.bre-effort-slider')).not.toHaveAttribute('aria-disabled','true');
 expect(await page.evaluate(()=>calls.map(c=>c.reasoningEffort))).toEqual(['e1','e3']);
});

test('MTL continues across foreign pointer capture and release outside the slider',async({page})=>{
 const b=await drag(page,.25,.4);
 await page.evaluate(()=>document.body.setPointerCapture(1));
 await page.mouse.move(b.x+b.width*.9,b.y+b.height/2);
 expect(await page.locator('.bre-effort-slider').evaluate(s=>parseFloat(s.style.getPropertyValue('--dsh-thought-progress')))).toBeCloseTo(90,3);
 await page.mouse.up();
 await expect(page.locator('.bre-effort-slider')).toHaveAttribute('aria-valuenow','4');
 await clickRatio(page,.25);
 await expect(page.locator('.bre-effort-slider')).toHaveAttribute('aria-valuenow','1');
 expect(await page.evaluate(()=>calls.map(c=>c.reasoningEffort))).toEqual(['e4','e1']);
});

test('MTL a fresh gesture recovers a missed release with a different pointer id',async({page})=>{
 await page.locator('.bre-effort-slider').evaluate(s=>{
  const p=s.querySelector('.zcode-thought-pointer'),b=s.getBoundingClientRect();
  const fire=(type,id,ratio)=>p.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:id,isPrimary:true,button:0,buttons:type==='pointerup'?0:1,clientX:b.x+b.width*ratio,clientY:b.y+b.height/2}));
  fire('pointerdown',42,.25);fire('pointermove',42,.4);
  fire('pointerdown',43,.25);fire('pointermove',43,.9);fire('pointerup',43,.9);
 });
 await expect(page.locator('.bre-effort-slider')).toHaveAttribute('aria-valuenow','4');
 expect(await page.evaluate(()=>calls.map(c=>c.reasoningEffort))).toEqual(['e4']);
});

test('MTL highest intent starts aurora before the thumb reaches the endpoint',async({page})=>{
 const b=await drag(page,.5,.92);
 await expect(page.locator('.bre-effort-slider')).toHaveAttribute('data-dsh-thought-max','true');
 await expect(page.locator('.bre-effort-slider-head-value')).toHaveText('Level 4');
 expect(await page.locator('.bre-effort-slider').evaluate(s=>parseFloat(s.style.getPropertyValue('--dsh-thought-progress')))).toBeCloseTo(92,3);
 await page.mouse.move(b.x+b.width*.75,b.y+b.height/2);
 await expect(page.locator('.bre-effort-slider')).toHaveAttribute('data-dsh-thought-max','false');
 await page.mouse.up();
});

test('MTL synchronizes while held and serializes the latest reversed stop',async({page})=>{
 await page.evaluate(()=>{delay=500});const b=await drag(page,.5,.92);
 await expect.poll(()=>page.evaluate(()=>calls.map(c=>c.reasoningEffort))).toEqual(['e4']);
 await page.mouse.move(b.x+b.width*.05,b.y+b.height/2,{steps:4});
 expect(await page.locator('.bre-effort-slider').evaluate(s=>parseFloat(s.style.getPropertyValue('--dsh-thought-progress')))).toBeCloseTo(5,3);
 await expect(page.locator('.bre-effort-slider-head-value')).toHaveText('Level 0');
 await expect.poll(()=>page.evaluate(()=>calls.map(c=>c.reasoningEffort))).toEqual(['e4','e0']);
 await expect(page.locator('.bre-effort-slider')).not.toHaveAttribute('aria-disabled','true');
 expect(await page.locator('.bre-effort-slider').evaluate(s=>parseFloat(s.style.getPropertyValue('--dsh-thought-progress')))).toBeCloseTo(5,3);
 await page.mouse.up();
 await expect(page.locator('.bre-effort-slider')).toHaveCSS('--dsh-thought-progress','0%');
 expect(await page.evaluate(()=>calls.map(c=>c.reasoningEffort))).toEqual(['e4','e0']);
});

test('MTL click and release animate toward a stop while dragging stays direct',async({page})=>{
 const s=page.locator('.bre-effort-slider');
 await clickRatio(page,1);
 const positions=await s.evaluate(async s=>{const a=[];for(let i=0;i<16;i++){await new Promise(requestAnimationFrame);const b=s.getBoundingClientRect(),k=s.querySelector('.bre-effort-slider-thumb').getBoundingClientRect();a.push((k.x+k.width/2-b.x)/b.width)}return a});
 expect(positions[0]).toBeLessThan(.98);expect(positions[0]).toBeGreaterThanOrEqual(.5);
 expect(positions.at(-1)).toBeCloseTo(1,3);
 expect(positions.every((v,i)=>!i||v>=positions[i-1]-.001)).toBe(true);
 await drag(page,.25,.6);await page.mouse.up();
 const snapped=await s.evaluate(async s=>{const a=[];for(let i=0;i<16;i++){await new Promise(requestAnimationFrame);const b=s.getBoundingClientRect(),k=s.querySelector('.bre-effort-slider-thumb').getBoundingClientRect();a.push((k.x+k.width/2-b.x)/b.width)}return a});
 expect(snapped[0]).toBeLessThan(.745);expect(snapped.at(-1)).toBeCloseTo(.75,3);
});

test('MTL twelve rapid reversals all paint their intent and persist the last one',async({page})=>{
 await page.evaluate(()=>{delay=500});
 for(const index of [1,3,0,4,0,2,1,4,1,0,3,1]){
  await clickRatio(page,index/4);
  await expect(page.locator('.bre-effort-slider')).toHaveCSS('--dsh-thought-progress',index*25+'%');
 }
 await expect(page.locator('.bre-effort-slider')).not.toHaveAttribute('aria-disabled','true');
 await expect(page.locator('.bre-effort-slider')).toHaveAttribute('aria-valuenow','1');
 expect((await page.evaluate(()=>calls.at(-1))).reasoningEffort).toBe('e1');
});

test('MTL waits for the preceding optimistic preview to clear before handing off',async({page})=>{
 await page.evaluate(()=>{delay=350});await clickRatio(page,.25);await clickRatio(page,.75);
 await page.locator('.bre-effort-slider').evaluate(s=>s.removeAttribute('aria-disabled'));
 // Other plugins can remove the disabled flag before MTL clears its own preview.
 await expect(page.locator('.bre-effort-slider')).toHaveAttribute('data-bre-dragging','true');
 await expect.poll(()=>page.evaluate(()=>calls.map(c=>c.reasoningEffort))).toEqual(['e1','e3']);
 await expect(page.locator('.bre-effort-slider')).not.toHaveAttribute('data-bre-dragging','true');
 await expect(page.locator('.bre-effort-slider')).toHaveAttribute('aria-valuenow','3');
});
