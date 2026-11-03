/** Render the real upstream component against its test directory, never a live backend. */
import { chromium } from 'playwright';
import { build } from 'esbuild';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
const fixture = await readFile('tests/fixtures/slider.html', 'utf8');
const css = fixture.match(/<style>[\s\S]*?<\/style>/)[0];
const engine = await readFile('src/engine.js', 'utf8');
const harness = (await readFile('tests/fixtures/host.jsx', 'utf8'))
  .replace("name: 'Test Model'", "name: '当前模型'")
  .replace("name: 'Level ' + i", "name: ['关闭', '轻度', '均衡', '深入', '最高'][i]");
const bundle = await build({ stdin: { contents: harness, resolveDir: 'tests/fixtures', loader: 'jsx' }, bundle: true,
  write: false, format: 'iife', define: { 'process.env.NODE_ENV': '"production"' } });
await mkdir('dist', { recursive: true });
const html = '<!doctype html><html lang="zh-CN"><meta charset="utf-8">' + css +
  '<style>body{margin:32px;background:#f7f7f8}body[data-ds-dark-theme]{background:#17181a}.codexModelSelectMenu{width:312px}</style>' +
  '<div id="app" role="menu" class="codexModelSelectMenu bre-model-menu-host"></div>' +
  '<script>' + bundle.outputFiles[0].text + '</script><script>' + engine +
  ';window.__DSH_THOUGHT_SLIDER__.install();</script></html>';
await writeFile('dist/preview.html', html);
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || (existsSync('/Applications/Google Chrome.app') ? 'chrome' : undefined) });
try {
  const page = await browser.newPage({ viewport: { width: 380, height: 230 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  await page.setContent(html);
  await page.locator('.zcode-thought-caption').waitFor();
  for (const dark of [false, true]) {
    await page.evaluate(dark => document.body.toggleAttribute('data-ds-dark-theme', dark), dark);
    await page.screenshot({ path: `dist/preview-${dark ? 'dark' : 'light'}.png` });
  }
} finally { await browser.close(); }
