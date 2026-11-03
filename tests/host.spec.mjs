import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
const fixture = await readFile(new URL('./fixtures/slider.html', import.meta.url), 'utf8');
const engine = await readFile(new URL('../src/engine.js', import.meta.url), 'utf8');
const bundle = await build({ entryPoints: ['tests/fixtures/host.jsx'], bundle: true, write: false,
  define: { 'process.env.NODE_ENV': '"production"' }, format: 'iife' });

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setContent(fixture.match(/<style>[\s\S]*?<\/style>/)[0] + '<div id="app" role="menu" class="codexModelSelectMenu bre-model-menu-host"></div>');
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await expect(page.locator('input')).toHaveValue('2');
  await page.addScriptTag({ content: engine });
  await page.evaluate(() => window.__DSH_THOUGHT_SLIDER__.install());
  page.errors = errors;
});
test.afterEach(async ({ page }) => { expect(page.errors).toEqual([]); });

async function drag(page, from, to) {
  const box = await page.locator('input').boundingBox();
  await page.mouse.move(box.x + box.width * from, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * to, box.y + box.height / 2, { steps: 8 });
  return box;
}

for (const [name, from, to, expected] of [
  ['right', .25, .38, 2], ['left', .75, .62, 2], ['same landing from left', .25, .6, 3], ['same landing from right', .75, .6, 2], ['near upper stop', .75, .74, 3], ['near lower stop', .25, .26, 1], ['exact', .5, .75, 3], ['right endpoint', .5, 1.2, 4], ['left endpoint', .5, -.2, 0]
]) {
  test(`real host commits only once at the ${name} directional stop`, async ({ page }) => {
    await drag(page, from, to);
    await expect(page.locator('input')).toHaveValue(String(expected));
    expect(await page.evaluate(() => calls.length)).toBe(0);
    await page.mouse.up();
    await expect.poll(() => page.evaluate(() => calls.length)).toBe(1);
    expect(await page.evaluate(() => calls[0].reasoningEffort)).toBe('e' + expected);
    await expect(page.locator('input')).toHaveValue(String(expected));
    await expect(page.locator('.bre-effort-slider')).toHaveCSS('--dsh-thought-progress', expected * 25 + '%');
  });
}

test('weighted reversal intent and pointer cancellation preserve the host contract', async ({ page }) => {
  const box = await drag(page, .25, .6);
  await page.mouse.move(box.x + box.width * .55, box.y + box.height / 2);
  await expect(page.locator('input')).toHaveValue('2');
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => calls.length)).toBe(1);
  await drag(page, .5, .9);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.mouse.up();
  await expect(page.locator('input')).toHaveValue('2');
  expect(await page.evaluate(() => calls.length)).toBe(1);
});

test('a slight last-moment reversal does not override the overall movement', async ({ page }) => {
  const box = await drag(page, 0, .6);
  await page.mouse.move(box.x + box.width * .58, box.y + box.height / 2);
  await expect(page.locator('input')).toHaveValue('3');
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => calls.length)).toBe(1);
  expect(await page.evaluate(() => calls[0].reasoningEffort)).toBe('e3');
});

test('uninstall during a drag cancels selection without submitting', async ({ page }) => {
  await drag(page, .5, .9);
  await page.evaluate(() => window.__DSH_THOUGHT_SLIDER__.uninstall());
  await page.mouse.up();
  await expect(page.locator('input')).toHaveValue('2');
  expect(await page.evaluate(() => calls.length)).toBe(0);
  await expect(page.locator('.zcode-thought-pointer')).toHaveCount(0);
});

test('touch gestures use the same weighted stops and commit once', async ({ page, context }) => {
  const box = await page.locator('input').boundingBox();
  const session = await context.newCDPSession(page);
  const point = ratio => [{ x: box.x + box.width * ratio, y: box.y + box.height / 2, id: 1 }];
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point(.25) });
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: point(.6) });
  await expect(page.locator('input')).toHaveValue('3');
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.evaluate(() => calls.length)).toBe(1);
  expect(await page.evaluate(() => calls[0].reasoningEffort)).toBe('e3');
});

test('host refusal restores selection and visual progress', async ({ page }) => {
  await page.evaluate(() => { window.refuseNext = true; });
  await drag(page, .5, .9);
  await page.mouse.up();
  await expect(page.locator('.bre-model-error')).toContainText('refused');
  await expect(page.locator('input')).toHaveValue('2');
  await expect(page.locator('.bre-effort-slider')).toHaveCSS('--dsh-thought-progress', '50%');
});

test('disabled input rejects pointer gestures and keyboard still commits through the host', async ({ page }) => {
  await page.evaluate(() => { window.delay = 150; });
  await page.locator('input').focus();
  await page.locator('input').press('End');
  await expect(page.locator('input')).toBeDisabled();
  await page.locator('.bre-effort-slider').click({ position: { x: 4, y: 10 }, force: true });
  await expect(page.locator('input')).toBeEnabled();
  expect(await page.evaluate(() => calls.length)).toBe(1);
  await expect(page.locator('input')).toHaveValue('4');
});

test('pointer preview paints in the same event and does not scan the document on every move', async ({ page }) => {
  await drag(page, .25, .38);
  const result = await page.evaluate(() => {
    const surface = document.querySelector('.zcode-thought-pointer');
    const box = document.querySelector('input').getBoundingClientRect();
    let scans = 0;
    const original = document.querySelectorAll;
    document.querySelectorAll = function (...args) { scans++; return original.apply(this, args); };
    // Playwright mouse uses pointer id 1 in Chromium; preserve a physical gesture.
    surface.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 1, clientX: box.left + box.width * .6, clientY: box.top, buttons: 1 }));
    const progress = document.querySelector('.bre-effort-slider').style.getPropertyValue('--dsh-thought-progress');
    document.querySelectorAll = original;
    return { progress, scans };
  });
  expect(result).toEqual({ progress: '75%', scans: 0 });
  await page.mouse.up();
});
