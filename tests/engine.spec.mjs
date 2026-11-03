import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const fixture = await readFile(new URL('./fixtures/slider.html', import.meta.url), 'utf8');
const engineSource = await readFile(process.env.THOUGHT_SLIDER_ENGINE || new URL('../src/engine.js', import.meta.url), 'utf8');

async function install(page) {
  await page.setContent(fixture);
  await page.addScriptTag({ content: engineSource });
  await page.evaluate(() => window.__DSH_THOUGHT_SLIDER__.install());
}

test('enhances the current host DOM without hiding model selection', async ({ page }) => {
  await install(page);
  await expect(page.locator('#modern .zcode-thought-bubble')).toHaveCount(12);
  await expect(page.locator('.bre-model-row')).toBeVisible();
  await expect(page.locator('#modern .bre-effort-knob')).toHaveCSS('width', '24px');
  await expect(page.locator('#modern input')).toHaveAttribute('aria-valuetext', '自定义最高');
});

test('maximum survives repeated scans and unrelated DOM changes', async ({ page }) => {
  await install(page);
  await page.evaluate(() => {
    for (let i = 0; i < 3; i++) window.__DSH_THOUGHT_SLIDER__.scanAndHarmonize();
    document.body.appendChild(document.createElement('p'));
  });
  await expect(page.locator('#legacy')).toHaveAttribute('data-dsh-thought-max', 'true');
  expect(await page.locator('#legacy .bre-effort-slider-thumb').evaluate(el => el.style.left)).toBe('100%');
  await expect(page.locator('#legacy .zcode-thought-bubble')).toHaveCount(12);
});

test('style-only host updates refresh both current and legacy sliders', async ({ page }) => {
  await install(page);
  await page.evaluate(() => {
    window.setHostProgress(0);
    document.querySelector('#legacy .bre-effort-slider-thumb').style.left = '0%';
  });
  for (const id of ['modern', 'legacy']) {
    await expect(page.locator('#' + id)).toHaveAttribute('data-dsh-thought-max', 'false');
  }
  await page.evaluate(() => {
    window.setHostProgress(4);
    document.querySelector('#legacy .bre-effort-slider-thumb').style.left = '100%';
  });
  for (const id of ['modern', 'legacy']) {
    await expect(page.locator('#' + id)).toHaveAttribute('data-dsh-thought-max', 'true');
  }
});

test('only the exact highest stop runs particles', async ({ page }) => {
  await install(page);
  await page.locator('#legacy .bre-effort-slider-thumb').evaluate(el => { el.style.left = '96%'; });
  await expect(page.locator('#legacy')).toHaveAttribute('data-dsh-thought-max', 'false');
  await expect(page.locator('#legacy .zcode-thought-bubble').first()).toHaveCSS('animation-play-state', 'paused');
});

test('dragging and keyboard changes preserve host selection and align fill with knob', async ({ page }) => {
  await install(page);
  const input = page.locator('#modern input');
  const box = await input.boundingBox();
  await page.mouse.move(box.x + box.width - 1, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 4, box.y + box.height / 2, { steps: 6 });
  await page.mouse.up();
  await expect(input).toHaveValue('1');
  expect(await page.evaluate(() => window.committedValue)).toBe('1');
  await expect(page.locator('#modern')).toHaveAttribute('data-dsh-thought-max', 'false');
  await input.focus();
  await input.press('End');
  await expect(input).toHaveValue('4');
  await expect(page.locator('#modern')).toHaveAttribute('data-dsh-thought-max', 'true');
  await input.press('Home');
  await expect(input).toHaveValue('0');
  await expect(page.locator('#modern')).toHaveAttribute('data-dsh-thought-max', 'false');
  await page.evaluate(() => window.setHostProgress(1));
  await expect(page.locator('#modern')).toHaveCSS('--dsh-thought-progress', '25%');
  await expect(page.locator('#modern .zcode-thought-fill')).toHaveCSS('width', /px$/);
  const positions = await page.locator('#modern').evaluate(slider => {
    const track = slider.getBoundingClientRect();
    const knob = slider.querySelector('.bre-effort-knob').getBoundingClientRect();
    const fill = slider.querySelector('.zcode-thought-fill').getBoundingClientRect();
    return { center: knob.x + knob.width / 2, expected: track.x + track.width / 4, fill: fill.right };
  });
  expect(Math.abs(positions.center - positions.expected)).toBeLessThan(2);
  expect(Math.abs(positions.center - positions.fill)).toBeLessThan(2);
});

test('uninstall restores host DOM and allows reinstall', async ({ page }) => {
  await page.setContent(fixture);
  const before = await page.locator('body').innerHTML();
  await page.evaluate(source => { (0, eval)(source); }, engineSource);
  await page.evaluate(() => {
    window.__DSH_THOUGHT_SLIDER__.install();
    window.__DSH_THOUGHT_SLIDER__.uninstall();
  });
  expect(await page.locator('body').innerHTML()).toBe(before);
  await expect(page.locator('style[data-plugin="dsh-thought-slider"]')).toHaveCount(0);
  await page.evaluate(() => window.__DSH_THOUGHT_SLIDER__.install());
  await expect(page.locator('#modern .zcode-thought-bubble')).toHaveCount(12);
});

test('menus can be recreated and host children replaced without duplicate decoration', async ({ page }) => {
  await install(page);
  await page.locator('#modern').evaluate(slider => {
    slider.replaceChildren(...Array.from(slider.children).filter(child => !child.classList.contains('zcode-thought-fill')));
  });
  await expect(page.locator('#modern .zcode-thought-fill')).toHaveCount(1);
  await page.locator('#modern').evaluate(slider => {
    const replacement = slider.cloneNode(true);
    replacement.querySelector('.zcode-thought-fill').remove();
    replacement.removeAttribute('data-dsh-thought-slider');
    replacement.removeAttribute('data-dsh-thought-max');
    replacement.style.cssText = '--bre-progress: 0%';
    slider.replaceWith(replacement);
  });
  await expect(page.locator('#modern')).toHaveAttribute('data-dsh-thought-max', 'false');
  await expect(page.locator('#modern .zcode-thought-bubble')).toHaveCount(12);
});

test('uninstall cancels pending scans and preserves newer host state', async ({ page }) => {
  await install(page);
  await page.evaluate(async () => {
    window.setHostProgress(2);
    await Promise.resolve();
    window.__DSH_THOUGHT_SLIDER__.uninstall();
    await new Promise(requestAnimationFrame);
    window.__DSH_THOUGHT_SLIDER__.scanAndHarmonize();
  });
  await expect(page.locator('.zcode-thought-fill')).toHaveCount(0);
  expect(await page.locator('#modern').evaluate(el => el.style.getPropertyValue('--bre-progress'))).toBe('50%');
  await expect(page.locator('#modern input')).toHaveValue('2');
  await expect(page.locator('#modern')).not.toHaveAttribute('data-dsh-thought-slider');
});

test('observer reaches idle and repeated scans do not mutate the DOM', async ({ page }) => {
  await install(page);
  const writes = await page.evaluate(async () => {
    let writes = 0;
    const observer = new MutationObserver(records => { writes += records.length; });
    observer.observe(document.body, { attributes: true, childList: true, subtree: true, characterData: true });
    for (let i = 0; i < 5; i++) window.__DSH_THOUGHT_SLIDER__.scanAndHarmonize();
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    observer.disconnect();
    return writes;
  });
  expect(writes).toBe(0);
});

test('range and ARIA fallbacks handle nonzero bounds without inventing invalid progress', async ({ page }) => {
  await install(page);
  await page.evaluate(() => {
    const modern = document.querySelector('#modern');
    modern.style.removeProperty('--bre-progress');
    const input = modern.querySelector('input');
    input.min = '2'; input.max = '6'; input.value = '6';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const legacy = document.querySelector('#legacy');
    legacy.querySelector('.bre-effort-slider-thumb').style.left = '';
    legacy.setAttribute('aria-valuemin', '10');
    legacy.setAttribute('aria-valuemax', '20');
    legacy.setAttribute('aria-valuenow', '15');
  });
  await expect(page.locator('#modern')).toHaveAttribute('data-dsh-thought-max', 'true');
  await expect(page.locator('#legacy')).toHaveCSS('--dsh-thought-progress', '50%');
  await page.locator('#modern input').evaluate(input => {
    input.value = '2';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(page.locator('#modern')).toHaveAttribute('data-dsh-thought-max', 'false');
  await page.locator('#legacy').evaluate(el => el.setAttribute('aria-valuemax', '10'));
  await expect(page.locator('#legacy')).not.toHaveAttribute('data-dsh-thought-slider');
});

test('particles span the fill, pause below maximum, and respect reduced motion', async ({ page }) => {
  await install(page);
  const bubble = page.locator('#modern .zcode-thought-bubble').first();
  await expect(bubble).toHaveCSS('animation-play-state', 'running');
  const fillBox = await page.locator('#modern .zcode-thought-fill').boundingBox();
  const bubbleBox = await bubble.boundingBox();
  expect(Math.abs(fillBox.width - bubbleBox.width)).toBeLessThan(1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(bubble).toHaveCSS('animation-name', 'none');
});

for (const dark of [false, true]) {
  test(`endpoints remain contained and model row visible on a narrow ${dark ? 'dark' : 'light'} menu`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 480 });
    await install(page);
    if (dark) await page.locator('body').evaluate(el => el.setAttribute('data-ds-dark-theme', ''));
    for (const value of [0, 4]) {
      await page.evaluate(value => window.setHostProgress(value), value);
      await expect(page.locator('#modern')).toHaveCSS('--dsh-thought-progress', value ? '100%' : '0%');
      const geometry = await page.locator('#modern').evaluate(slider => {
        const track = slider.getBoundingClientRect();
        const knob = slider.querySelector('.bre-effort-knob').getBoundingClientRect();
        const menu = slider.closest('[role="menu"]').getBoundingClientRect();
        return { inside: knob.left >= menu.left && knob.right <= menu.right, visible: knob.top >= menu.top && knob.bottom <= menu.bottom, menuRight: menu.right, width: knob.width, height: knob.height };
      });
      expect(geometry.inside).toBe(true);
      expect(geometry.visible).toBe(true);
      expect(geometry.menuRight).toBeLessThanOrEqual(320);
      expect(geometry.width).toBe(geometry.height);
    }
    await expect(page.locator('.bre-model-row')).toBeVisible();
  });
}

test('knob remains a true circle and covers the complete right end of the track', async ({ page }) => {
  await install(page);
  await page.addStyleTag({ content: '.bre-effort-knob { padding: 8px !important; min-width: 60px !important; min-height: 16px !important; }' });
  const geometry = await page.locator('#modern').evaluate(slider => {
    const track = slider.getBoundingClientRect();
    const knob = slider.querySelector('.bre-effort-knob').getBoundingClientRect();
    const fill = slider.querySelector('.zcode-thought-fill').getBoundingClientRect();
    return { width: knob.width, height: knob.height, center: knob.x + knob.width / 2, edge: track.right,
      overlap: knob.right - fill.right, radius: getComputedStyle(slider.querySelector('.bre-effort-knob')).borderRadius };
  });
  expect(geometry.width).toBe(24);
  expect(geometry.height).toBe(24);
  expect(geometry.radius).toBe('50%');
  expect(Math.abs(geometry.center - geometry.edge)).toBeLessThan(1);
  expect(geometry.overlap).toBeGreaterThanOrEqual(11.5);
});

test('unknown continuous ranges keep their original input accessible', async ({ page }) => {
  await install(page);
  await page.locator('#modern input').evaluate(input => input.setAttribute('step', 'any'));
  await expect(page.locator('#modern .zcode-thought-pointer')).toHaveCount(0);
  await page.locator('#modern input').evaluate(input => input.setAttribute('step', '1'));
  await expect(page.locator('#modern .zcode-thought-pointer')).toHaveCount(1);
});
