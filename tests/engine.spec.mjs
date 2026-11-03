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
  await expect(page.locator('#modern .zcode-thought-bubble')).toHaveCount(20);
  await expect(page.locator('.bre-model-row')).toBeVisible();
  await expect(page.locator('#modern .bre-effort-knob')).toHaveCSS('width', '28px');
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
  await expect(page.locator('#legacy .zcode-thought-bubble')).toHaveCount(20);
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
  await expect(page.locator('#modern .zcode-thought-bubble')).toHaveCount(20);
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
  await expect(page.locator('#modern .zcode-thought-bubble')).toHaveCount(20);
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
  await page.emulateMedia({ reducedMotion: 'reduce' });
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
  expect(geometry.width).toBe(28);
  expect(geometry.height).toBe(28);
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

test('standalone caption preserves custom names without adding hints or ticks', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 480 });
  await install(page);
  await expect(page.locator('.zcode-thought-scale, .zcode-thought-ticks')).toHaveCount(0);
  const name = '自定义模型的超长思考强度名称 · 完整保留';
  await page.locator('#modern input').evaluate((input, name) => {
    input.setAttribute('aria-valuetext', name);
    input.max = '6';
    input.step = '2';
  }, name);
  await expect(page.locator('#modern .zcode-thought-caption-value')).toHaveText(name);
  await expect(page.getByText('更轻量', { exact: true })).toHaveCount(0);
  const caption = await page.locator('#modern .zcode-thought-caption').boundingBox();
  expect(caption.x).toBeGreaterThanOrEqual(0);
  expect(caption.x + caption.width).toBeLessThanOrEqual(320);
  await page.evaluate(() => window.__DSH_THOUGHT_SLIDER__.uninstall());
  await expect(page.locator('.zcode-thought-caption, .zcode-thought-ticks, .zcode-thought-scale')).toHaveCount(0);
});


test('existing model-menu heading and stop labels are preserved without duplication', async ({ page }) => {
  await page.setContent(fixture);
  await page.locator('#modern').evaluate(slider => {
    slider.insertAdjacentHTML('beforebegin', '<div class="bre-effort-slider-head"><span class="bre-effort-slider-head-label">思考等级</span><span class="bre-effort-slider-head-value">Max</span></div>');
    slider.insertAdjacentHTML('afterend', '<div class="bre-effort-slider-labels"><span>Off</span><span>Low</span><span>High</span><span>Max</span></div>');
  });
  const originalMenu = await page.locator('[role="menu"]').evaluate(el => {
    const style = getComputedStyle(el);
    return [style.borderRadius, style.backgroundColor, style.boxShadow];
  });
  await page.addScriptTag({ content: engineSource });
  await page.evaluate(() => window.__DSH_THOUGHT_SLIDER__.install());
  await expect(page.locator('.zcode-thought-caption, .zcode-thought-scale, .zcode-thought-ticks')).toHaveCount(0);
  await expect(page.locator('.bre-effort-slider-labels')).toHaveText('OffLowHighMax');
  await expect(page.locator('.bre-effort-slider-labels')).toBeVisible();
  expect(await page.locator('[role="menu"]').evaluate(el => {
    const style = getComputedStyle(el);
    return [style.borderRadius, style.backgroundColor, style.boxShadow];
  })).toEqual(originalMenu);
});


test('host can update and remove a slider in one render without observer errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await install(page);
  await page.evaluate(async () => {
    window.setHostProgress(2);
    document.querySelector('#modern').remove();
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
  });
  expect(errors).toEqual([]);
  await expect(page.locator('.zcode-thought-caption')).toHaveCount(0);
});

test('particles vary independently and only a minority fade before the left edge', async ({ page }) => {
  await install(page);
  const result = await page.locator('#modern .zcode-thought-bubbles').evaluate(container => {
    const particles = [...container.shadowRoot.querySelector('.zcode-thought-particles').children];
    const samples = particles.map(el => ({ top: parseFloat(el.style.top), duration: parseFloat(el.style.animationDuration),
      alpha: Number(el.style.getPropertyValue('--particle-alpha')), curve: el.style.animationTimingFunction }));
    const phases = [.25, .95].map(phase => particles.slice(0, 4).map(el => {
      for (const animation of el.getAnimations()) {
        animation.pause();
        const { delay, duration } = animation.effect.getTiming();
        animation.currentTime = delay + duration * phase;
      }
      return { x: el.getBoundingClientRect().x, alpha: Number(getComputedStyle(el).opacity) };
    }));
    return { samples, phases };
  });
  expect(new Set(result.samples.map(s => s.top)).size).toBeGreaterThan(8);
  expect(new Set(result.samples.map(s => s.duration)).size).toBeGreaterThan(8);
  expect(new Set(result.samples.map(s => s.alpha)).size).toBeGreaterThan(8);
  for (const s of result.samples) {
    expect(s.top).toBeGreaterThanOrEqual(16); expect(s.top).toBeLessThanOrEqual(84);
    expect(s.duration).toBeGreaterThanOrEqual(2.0); expect(s.duration).toBeLessThanOrEqual(3.6);
    expect(s.alpha).toBeGreaterThanOrEqual(.4); expect(s.alpha).toBeLessThanOrEqual(.7);
  }
  for (let i = 0; i < 4; i++) {
    expect(result.phases[0][i].alpha).toBeGreaterThan(.35);
    if(i===0) expect(result.phases[1][i].alpha).toBeLessThan(.01);
    else expect(result.phases[1][i].alpha).toBeGreaterThan(.35);
    expect(result.phases[1][i].x).toBeLessThan(result.phases[0][i].x);
  }
});

test('finished particles are destroyed and replaced without triggering a full-page scan',async({page})=>{
 await install(page);
 const r=await page.evaluate(async()=>{
  const host=document.querySelector('#modern .zcode-thought-bubbles');
  const container=host.shadowRoot.querySelector('.zcode-thought-particles');
  const old=container.firstElementChild;let scans=0,foreignWrites=0;
  const foreign=new MutationObserver(r=>foreignWrites+=r.length);foreign.observe(document.body,{childList:true,subtree:true});
  const original=document.querySelectorAll;
  document.querySelectorAll=function(...args){if(args[0]==='.bre-effort-slider')scans++;return original.apply(this,args)};
  old.dispatchEvent(new AnimationEvent('animationend',{bubbles:true,animationName:'zcode-thought-bubble-flow'}));
  await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
  document.querySelectorAll=original;
  foreign.disconnect();
  return {removed:!old.isConnected,count:container.children.length,scans,foreignWrites,minority:container.querySelectorAll('[data-fading="true"]').length};
 });
 expect(r).toEqual({removed:true,count:20,scans:0,foreignWrites:0,minority:4});
});

test('enhancement bypasses a foreign 150ms observer wrapper without changing the global',async({page})=>{
 await page.setContent(fixture);
 await page.evaluate(()=>{const Native=MutationObserver;function Wrapped(callback){return new Native(records=>setTimeout(()=>callback(records),150))}Wrapped.prototype=Native.prototype;window.MutationObserver=Wrapped;window.foreignObserver=Wrapped;});
 await page.addScriptTag({content:engineSource});
 await page.evaluate(()=>window.__DSH_THOUGHT_SLIDER__.install());
 const r=await page.evaluate(async()=>{
  const clone=document.querySelector('#legacy').cloneNode(true);clone.id='immediate';clone.style.cssText='';
  clone.removeAttribute('data-dsh-thought-slider');clone.removeAttribute('data-dsh-thought-max');
  clone.querySelectorAll('.zcode-thought-fill,.zcode-thought-pointer').forEach(n=>n.remove());
  document.body.append(clone);
  await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
  return {enhanced:clone.hasAttribute('data-dsh-thought-slider'),globalPreserved:MutationObserver===foreignObserver};
 });
 expect(r).toEqual({enhanced:true,globalPreserved:true});
});

test('cool gradients evolve gradually and max glow follows random continuous paths',async({page})=>{
 await install(page);
 const gradients=[];
 for(const value of [0,1,2,3,4]){await page.evaluate(value=>setHostProgress(value),value);gradients.push(await page.locator('#modern').evaluate(s=>s.style.getPropertyValue('--dsh-thought-gradient')))}
 expect(new Set(gradients).size).toBe(5);
 const glow=page.locator('#modern .zcode-thought-glow').first();
 const data=await glow.evaluate(node=>{const a=node.getAnimations()[0];return {frames:a.effect.getKeyframes().map(f=>f.transform),duration:a.effect.getTiming().duration,state:a.playState}});
 expect(data.frames).toHaveLength(5);expect(new Set(data.frames).size).toBe(5);
 const xs=data.frames.map(f=>Number(/translate\((-?[\d.]+)%/.exec(f)[1]));
 const steps=xs.slice(1).map((x,i)=>x-xs[i]);
 expect(steps.some(x=>x>0)).toBe(true);expect(steps.some(x=>x<0)).toBe(true);
 expect(Math.max(...xs)-Math.min(...xs)).toBeGreaterThan(17);
 expect(data.duration).toBeGreaterThanOrEqual(10000);expect(data.duration).toBeLessThanOrEqual(16000);expect(data.state).toBe('running');
 const continuity=await glow.evaluate(async node=>{const old=node.getAnimations()[0],frames=old.effect.getKeyframes(),end=frames[frames.length-1].transform;old.finish();await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);const next=node.getAnimations()[0];return {different:next!==old,start:next.effect.getKeyframes()[0].transform,end}});
 expect(continuity.different).toBe(true);expect(continuity.start).toBe(continuity.end);
 await page.evaluate(()=>setHostProgress(3));
 await expect.poll(()=>glow.evaluate(el=>el.getAnimations()[0].playState)).toBe('paused');
 await page.evaluate(()=>setHostProgress(4));await page.emulateMedia({reducedMotion:'reduce'});
 await expect.poll(()=>glow.evaluate(el=>el.getAnimations()[0].playState)).toBe('paused');
});
