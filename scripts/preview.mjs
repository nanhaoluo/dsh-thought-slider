/** Real installed MTL component against a mock directory; never a live backend. */
import { chromium } from 'playwright';
import { build } from 'esbuild';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
const engine = await readFile('src/engine.js','utf8');
const harness = (await readFile('tests/fixtures/mtl-host.jsx','utf8'))
 .replace("reasoningEffort: 'e2'","reasoningEffort: 'e4'")
 .replace("name: 'Test Model'","name: '当前模型'")
 .replace("name: 'Level ' + i","name: ['关闭','轻度','均衡','深入','最高'][i]")
 .replace('t={key => key}', 't={key => ({effortRowLabel:"思考强度",modelRowLabel:"模型",modelSearchPlaceholder:"搜索模型..."})[key] || key}');
const bundle = await build({stdin:{contents:harness,resolveDir:'tests/fixtures',loader:'jsx'},bundle:true,write:false,format:'iife',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'mock-catalog',setup(b){b.onResolve({filter:/(configured-inputs|knowledge|capacity|provider-enabled|provider-order|model-order|effort-memory)\.js$/},()=>({path:path.resolve('tests/fixtures/mtl/helpers.js')}));}}]});
const html='<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>body{margin:24px;background:#f8f9fa;font:14px system-ui;color:#15171b}body[data-ds-dark-theme]{background:#202124;color:#ececec}.codexModelSelectMenu{width:340px;max-height:360px;overflow:hidden;border:1px solid #8883;border-radius:16px}#app{width:100%}</style><div class="codexModelSelectMenu bre-model-menu-host" role="menu"><div id="app"></div></div><script>'+bundle.outputFiles[0].text+'</script><script>'+engine+';window.__DSH_THOUGHT_SLIDER__.install();</script></html>';
await mkdir('dist',{recursive:true});await writeFile('dist/preview.html',html);
const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||(existsSync('/Applications/Google Chrome.app')?'chrome':undefined)});
try{
 const page=await browser.newPage({viewport:{width:400,height:540},deviceScaleFactor:2});
 await page.setContent(html);await page.locator('.zcode-thought-fill').waitFor();
 for(const dark of [false,true]){
  await page.evaluate(dark=>document.body.toggleAttribute('data-ds-dark-theme',dark),dark);
  await page.locator('.bre-menu-foot').screenshot({path:`dist/preview-${dark?'dark':'light'}.png`});
 }
}finally{await browser.close()}
