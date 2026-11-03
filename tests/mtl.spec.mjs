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
 await drag(page,from,to);await expect(page.locator('.bre-effort-slider')).toHaveCSS('--dsh-thought-progress',index*25+'%');
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
 expect(d).toEqual({value:'75%',scans:0,calls:0});await page.mouse.up();
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
 await expect(page.locator('.bre-effort-slider')).toHaveCSS('--dsh-thought-progress','75%');
 await page.mouse.up();await expect.poll(()=>page.evaluate(()=>calls.length)).toBe(1);
 expect(await page.evaluate(()=>calls[0].reasoningEffort)).toBe('e3');
});


test('foreign menu restorers cannot display duplicate host cells over the model picker',async({page})=>{
 await page.locator('.codexModelSelectMenu').evaluate(menu=>{const old=document.createElement('button');old.className='codexModelSelectCell';old.setAttribute('role','menuitem');old.textContent='old host cell';old.style.display='block';menu.appendChild(old)});
 await expect(page.getByText('old host cell')).toBeHidden();
 await expect(page.locator('.bre-provider').first()).toBeVisible();
 await expect(page.locator('.bre-option').first()).toBeVisible();
});
