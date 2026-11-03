/** Preview the screenshot's existing model-menu DOM contract, without a backend. */
import { chromium } from 'playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
const engine = await readFile('src/engine.js', 'utf8');
const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8">
<style>
  body { margin: 24px; color: #15171b; background: #f8f9fa; font: 14px system-ui; }
  body[data-ds-dark-theme] { color: #ececec; background: #202124; }
  .bre-effort-slider-head { display: flex; justify-content: space-between; margin-bottom: 16px; }
  .bre-effort-slider { position: relative; height: 30px; margin: 0 14px; }
  .bre-effort-slider-thumb { position: absolute; left: 100%; }
  .bre-effort-slider-labels { display: flex; justify-content: space-between; margin-top: 12px; color: #72767b; font-size: 12px; }
  body[data-ds-dark-theme] .bre-effort-slider-labels { color: #a0a4aa; }
  .bre-effort-slider-labels .is-active { color: #365aab; font-weight: 600; }
  body[data-ds-dark-theme] .bre-effort-slider-labels .is-active { color: #a4baff; }
</style>
<div class="bre-effort-section">
  <div class="bre-effort-slider-head"><span class="bre-effort-slider-head-label">思考等级</span><span class="bre-effort-slider-head-value">Max</span></div>
  <div class="bre-effort-slider" role="slider" tabindex="0" aria-label="思考强度" aria-valuemin="0" aria-valuemax="3" aria-valuenow="3" aria-valuetext="Max">
    <div class="bre-effort-slider-fill"></div><span class="bre-effort-slider-thumb" style="left:100%"></span>
  </div>
  <div class="bre-effort-slider-labels"><span>Off</span><span>Low</span><span>High</span><span class="is-active">Max</span></div>
</div>
<script>${engine};window.__DSH_THOUGHT_SLIDER__.install();</script></html>`;
await mkdir('dist', { recursive: true });
await writeFile('dist/preview.html', html);
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || (existsSync('/Applications/Google Chrome.app') ? 'chrome' : undefined) });
try {
  const page = await browser.newPage({ viewport: { width: 400, height: 140 }, deviceScaleFactor: 2 });
  await page.setContent(html);
  await page.locator('.zcode-thought-fill').waitFor();
  // Freeze the decorative particles for repeatable preview images only.
  await page.evaluate(() => { for(const host of document.querySelectorAll('.zcode-thought-bubbles')) { const style=document.createElement('style');style.textContent='.zcode-thought-bubble { animation-play-state: paused !important; }';host.shadowRoot?.appendChild(style); } });
  for (const dark of [false, true]) {
    await page.evaluate(dark => document.body.toggleAttribute('data-ds-dark-theme', dark), dark);
    await page.screenshot({ path: `dist/preview-${dark ? 'dark' : 'light'}.png` });
  }
} finally { await browser.close(); }
