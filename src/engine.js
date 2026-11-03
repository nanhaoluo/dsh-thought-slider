/**
 * Visual enhancement for current and legacy dsh-better-reasoning-effort sliders.
 * The host owns selection, keyboard handling and progress. Pointer coordinates
 * are snapped to its declared stops before forwarding. Never rewrite
 * its positions or range values: those are also inputs to its next render.
 */
(function (root) {
  'use strict';
  if (!root) return;
  if (root.__DSH_THOUGHT_SLIDER__) {
    if (root.__DSH_THOUGHT_SLIDER__.version === '1.0.5') return;
    root.__DSH_THOUGHT_SLIDER__.uninstall();
  }

  var BUBBLE_COUNT = 20;
  function randomBetween(low, high) { return low + Math.random() * (high - low); }

  var SLIDER_CSS = `
/* Foreign menu restorers must not re-show the host's duplicate cells over MTL. */
.codexModelSelectMenu:has(.bre-menu-slider > .bre-effort-slider[data-dsh-thought-slider]) > button[role="menuitem"],
.codexModelSelectMenu:has(.bre-menu-slider > .bre-effort-slider[data-dsh-thought-slider]) > .codexModelSelectCell {
  display: none !important;
}
/* Repair only the enhanced menu: reserve the complete footer, scroll the model list. */
.codexModelSelectMenu:has(.bre-effort-slider[data-dsh-thought-slider]) {
  max-height: min(520px, calc(100dvh - 24px)) !important;
  height: auto !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}
.codexModelSelectMenu:has(.bre-effort-slider[data-dsh-thought-slider]) > div:has(.bre-slider-body) {
  display: flex !important;
  flex-direction: column !important;
  flex: 1 1 auto !important;
  min-height: 0 !important;
}
.codexModelSelectMenu .bre-slider-body:has(.bre-effort-slider[data-dsh-thought-slider]),
.codexModelSelectMenu .bre-card:has(.bre-effort-slider[data-dsh-thought-slider]) {
  display: flex !important;
  flex-direction: column !important;
  flex: 1 1 auto !important;
  min-height: 0 !important;
}
.codexModelSelectMenu .bre-slider-body:has(.bre-effort-slider[data-dsh-thought-slider]) { overflow: hidden !important; }
.codexModelSelectMenu:has(.bre-effort-slider[data-dsh-thought-slider]) :is(.bre-menu-head, .bre-menu-search, .bre-menu-foot) { flex-shrink: 0 !important; }
.codexModelSelectMenu:has(.bre-effort-slider[data-dsh-thought-slider]) .bre-panel-models {
  flex: 0 1 196px !important;
  min-height: 40px !important;
}
.codexModelSelectMenu:has(.bre-effort-slider[data-dsh-thought-slider]) .bre-menu-foot { padding-bottom: 4px !important; }
.codexModelSelectMenu:has(.bre-effort-slider[data-dsh-thought-slider]) .bre-effort-slider-labels {
  flex: 0 0 18px !important;
  height: 18px !important;
  min-height: 18px !important;
  margin-top: 8px !important;
  margin-bottom: 2px !important;
}
/* Enhance only the reasoning control; keep the host model menu layout. */
.bre-effort:has(> [data-dsh-thought-slider="current"] > .zcode-thought-caption) {
  box-sizing: border-box !important;
  height: 64px !important;
  padding: 28px 0 0 !important;
}
.bre-effort-slider-head:has(+ [data-dsh-thought-slider]) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  padding: 0 4px;
}
.bre-effort-slider-head:has(+ [data-dsh-thought-slider]) .bre-effort-slider-head-label {
  color: var(--dsw-alias-label-secondary, inherit);
  font-size: 13px;
}
.bre-effort-slider-head:has(+ [data-dsh-thought-slider]) .bre-effort-slider-head-value {
  color: var(--dsw-alias-label-primary, inherit);
  font-size: 14px;
  font-weight: 600;
}
.bre-effort-slider[data-dsh-thought-slider] {
  position: relative !important;
  box-sizing: border-box !important;
  width: auto !important;
  min-width: 24px;
  height: 24px !important;
  margin: 4px 14px 6px !important;
  border: 0 !important;
  border-radius: 999px !important;
  corner-shape: round !important;
  background: #3c3e42 !important;
  box-shadow: inset 0 0 2px rgba(0, 0, 0, .18) !important;
  overflow: visible !important;
}
body:not([data-ds-dark-theme]) .bre-effort-slider[data-dsh-thought-slider] {
  background: #f3f3f3 !important;
}
.bre-effort-slider[data-dsh-thought-slider]::before,
.bre-effort-slider[data-dsh-thought-slider] .bre-effort-track,
.bre-effort-slider[data-dsh-thought-slider] .bre-effort-fx,
.bre-effort-slider[data-dsh-thought-slider] .bre-effort-slider-fill {
  display: none !important;
}
.bre-effort-slider[data-dsh-thought-slider]:focus-visible,
.bre-effort-slider[data-dsh-thought-slider]:has(.bre-effort-input:focus-visible) {
  outline: 2px solid var(--dsw-static-blue-400, #4d6bfe) !important;
  outline-offset: 3px;
}
.bre-effort-slider[data-dsh-thought-slider] .zcode-thought-fill {
  position: absolute;
  top: 0;
  left: 0;
  width: var(--dsh-thought-progress);
  height: 100%;
  border-radius: 999px 0 0 999px;
  corner-shape: round !important;
  background: var(--dsh-thought-gradient);
  overflow: hidden;
  pointer-events: none;
  z-index: 1;
}
.bre-effort-slider[data-dsh-thought-slider] :is(.bre-effort-slider-thumb, .bre-effort-knob) {
  position: absolute !important;
  box-sizing: border-box !important;
  top: 50% !important;
  left: var(--dsh-thought-progress) !important;
  width: 28px !important;
  height: 28px !important;
  min-width: 28px !important;
  max-width: 28px !important;
  min-height: 28px !important;
  max-height: 28px !important;
  aspect-ratio: 1 !important;
  padding: 0 !important;
  margin: 0 !important;
  flex: none !important;
  overflow: hidden !important;
  scale: none !important;
  rotate: none !important;
  border: .5px solid rgba(0, 0, 0, .2) !important;
  border-radius: 50% !important;
  corner-shape: round !important;
  transform: translate(-50%, -50%) !important;
  background: #fff !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, .14) !important;
  pointer-events: none !important;
  z-index: 4 !important;
  transition: none !important;
  animation: none !important;
}
.bre-effort-slider[data-dsh-thought-slider] :is(.bre-effort-slider-thumb, .bre-effort-knob)::before,
.bre-effort-slider[data-dsh-thought-slider] :is(.bre-effort-slider-thumb, .bre-effort-knob)::after {
  display: none !important;
}
.bre-effort-slider[data-dsh-thought-slider] .zcode-thought-pointer {
  position: absolute;
  inset: -8px -14px;
  z-index: 6;
  touch-action: none;
  cursor: grab;
}
.bre-effort-slider[data-dsh-thought-slider] .zcode-thought-pointer:active { cursor: grabbing; }
.bre-effort-slider[data-dsh-thought-slider]:has(input:disabled) .zcode-thought-pointer { pointer-events: none; }
.bre-effort-slider[data-dsh-thought-slider] .bre-effort-input {
  z-index: 5 !important;
}
.zcode-thought-caption {
  position: absolute;
  top: -30px;
  left: -14px;
  right: -14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  pointer-events: none;
  line-height: 20px;
  font: inherit;
}
.zcode-thought-caption-label { color: var(--dsw-alias-label-secondary, #737373); white-space: nowrap; }
.zcode-thought-caption-value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  color: var(--dsw-alias-label-primary, #262626);
}
body[data-ds-dark-theme] .zcode-thought-caption-label { color: var(--dsw-alias-label-secondary, #a0a0a0); }
body[data-ds-dark-theme] .zcode-thought-caption-value { color: var(--dsw-alias-label-primary, #ececec); }
.bre-effort-slider[data-dsh-thought-slider] .bre-effort-slider-tick {
  position: absolute !important;
  top: 50% !important;
  width: 4px !important;
  height: 4px !important;
  margin-left: -2px !important;
  margin-top: -2px !important;
  border-radius: 50% !important;
  corner-shape: round !important;
  background: rgba(255, 255, 255, .45) !important;
  pointer-events: none !important;
  z-index: 2 !important;
}
.bre-effort-slider[data-dsh-thought-slider] .zcode-thought-bubbles {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: inherit;
  corner-shape: round !important;
  pointer-events: none;
  opacity: 0;
}
.bre-effort-slider[data-dsh-thought-max="true"] .zcode-thought-bubbles {
  opacity: 1;
}
.bre-effort-slider[data-dsh-thought-slider] .zcode-thought-bubble {
  position: absolute;
  left: 0;
  right: 0;
  opacity: 0;
  animation-name: zcode-thought-bubble-flow, zcode-thought-bubble-fade-0;
  animation-iteration-count: 1;
  animation-fill-mode: both;
  animation-timing-function: linear, ease-in-out;
  animation-play-state: paused;
}
.bre-effort-slider[data-dsh-thought-max="true"] .zcode-thought-bubble {
  animation-play-state: running;
}
.bre-effort-slider[data-dsh-thought-slider] .zcode-thought-bubble > span {
  display: block;
  transform: translateY(-50%);
  corner-shape: round !important;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 5px rgba(255, 255, 255, .9);
}
@keyframes zcode-thought-bubble-flow {
  from { transform: translateX(104%); }
  to { transform: translateX(-6%); }
}
@keyframes zcode-thought-bubble-solid {
  0% { opacity: 0; }
  9%, 100% { opacity: var(--particle-alpha); }
}
@keyframes zcode-thought-bubble-fade-0 {
  0%, 84%, 100% { opacity: 0; }
  12%, 36% { opacity: var(--particle-alpha); }
  61% { opacity: calc(var(--particle-alpha) * .42); }
}
@keyframes zcode-thought-bubble-fade-1 {
  0%, 91%, 100% { opacity: 0; }
  18%, 47% { opacity: var(--particle-alpha); }
  72% { opacity: calc(var(--particle-alpha) * .36); }
}
@keyframes zcode-thought-bubble-fade-2 {
  0%, 79%, 100% { opacity: 0; }
  9%, 29% { opacity: var(--particle-alpha); }
  54% { opacity: calc(var(--particle-alpha) * .5); }
}
@keyframes zcode-thought-bubble-fade-3 {
  0%, 94%, 100% { opacity: 0; }
  15%, 55% { opacity: var(--particle-alpha); }
  77% { opacity: calc(var(--particle-alpha) * .3); }
}
@media (prefers-reduced-motion: reduce) {
  .bre-effort-slider[data-dsh-thought-slider] .zcode-thought-bubble {
    animation: none !important;
  }
}
`;

  var styleElement = null;
  var observer = null;
  var menuObserver = null;
  var menuFrame = null;
  var menuHeights = new Map();
  var menuNeedsPlacement = false;
  var frame = null;
  var pointerSequence = -1000;
  var active = false;
  var sliders = new Map();
  var labels = new Map();
  var marker = 'data-dsh-thought-slider';
  var maxMarker = 'data-dsh-thought-max';
  var observerOptions = {
    childList: true, subtree: true, characterData: true, attributes: true,
    attributeFilter: ['style', 'class', 'aria-valuenow', 'aria-valuemin',
      'aria-valuemax', 'aria-valuetext', 'aria-disabled', 'min', 'max', 'step', 'disabled', 'value']
  };

  function gradientForProgress(pct) {
    if (pct === 1) return 'linear-gradient(90deg, #10b981 0%, #06b6d4 30%, #3b82f6 65%, #8b5cf6 88%, #a855f7 100%)';
    if (pct >= .65) return 'linear-gradient(90deg, #10b981 0%, #06b6d4 35%, #0ea5e9 70%, #3b82f6 100%)';
    if (pct >= .35) return 'linear-gradient(90deg, #10b981 0%, #06b6d4 60%, #0ea5e9 100%)';
    return 'linear-gradient(90deg, #10b981 0%, #14b8a6 100%)';
  }

  function percentage(value) {
    var match = /^(-?(?:\d+(?:\.\d*)?|\.\d+))%$/.exec((value || '').trim());
    return match ? Math.max(0, Math.min(1, Number(match[1]) / 100)) : null;
  }

  function numericAttribute(element, name, fallback) {
    var value = element.getAttribute(name);
    return value === null || value.trim() === '' ? fallback : Number(value);
  }

  function rangeProgress(element, nativeInput) {
    var min = numericAttribute(element, nativeInput ? 'min' : 'aria-valuemin', 0);
    var max = numericAttribute(element, nativeInput ? 'max' : 'aria-valuemax', nativeInput ? 100 : NaN);
    var value = nativeInput ? Number(element.value) : numericAttribute(element, 'aria-valuenow', NaN);
    if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max) || max <= min) return null;
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  function readSlider(slider) {
    if (slider.querySelector('.bre-effort-knob') && slider.querySelector('.bre-effort-track')) {
      // --bre-progress is the host's optimistic preview, including rollback.
      var progress = percentage(slider.style.getPropertyValue('--bre-progress'));
      var input = slider.querySelector('input.bre-effort-input[type="range"]');
      if (progress === null && input) progress = rangeProgress(input, true);
      return progress === null ? null : { kind: 'current', progress: progress };
    }
    var thumb = slider.querySelector('.bre-effort-slider-thumb');
    if (!thumb || !slider.querySelector('.bre-effort-slider-fill')) return null;
    var progress = percentage(thumb.style.left);
    if (progress === null) progress = rangeProgress(slider, false);
    return progress === null ? null : { kind: 'legacy', progress: progress };
  }

  function setAttribute(element, name, value) {
    if (element.getAttribute(name) !== value) element.setAttribute(name, value);
  }

  function setStyle(element, state, name, value, priority) {
    priority = priority || '';
    if (!state.styles.has(name)) {
      state.styles.set(name, {
        original: element.style.getPropertyValue(name),
        priority: element.style.getPropertyPriority(name),
        applied: null
      });
    }
    if (element.style.getPropertyValue(name) !== value || element.style.getPropertyPriority(name) !== priority) element.style.setProperty(name, value, priority);
    state.styles.get(name).applied = element.style.getPropertyValue(name);
  }

  function createFill() {
    var fill = document.createElement('div');
    fill.className = 'zcode-thought-fill';
    fill.setAttribute('aria-hidden', 'true');
    var bubbles = document.createElement('div');
    bubbles.className = 'zcode-thought-bubbles';
    var particles = bubbles;
    if (bubbles.attachShadow) {
      var shadow = bubbles.attachShadow({ mode: 'open' });
      var shadowStyle = document.createElement('style');
      var motionCss = SLIDER_CSS.slice(SLIDER_CSS.indexOf('.bre-effort-slider[data-dsh-thought-slider] .zcode-thought-bubble {'));
      motionCss = motionCss.split('.bre-effort-slider[data-dsh-thought-slider] ').join('')
        .split('.bre-effort-slider[data-dsh-thought-max="true"] ').join(':host([data-running="true"]) ');
      shadowStyle.textContent = '.zcode-thought-particles{position:absolute;inset:0;overflow:hidden;border-radius:inherit;corner-shape:round}' + motionCss;
      particles = document.createElement('div');
      particles.className = 'zcode-thought-particles';
      shadow.append(shadowStyle, particles);
    }
    function particle(index, stagger) {
      var bubble = document.createElement('span');
      bubble.className = 'zcode-thought-bubble';
      var duration = randomBetween(2.0, 3.6);
      var size = randomBetween(1.2, 3.0);
      bubble.style.top = randomBetween(16, 84) + '%';
      bubble.style.setProperty('--particle-alpha', String(randomBetween(.4, .7)));
      // Four in five travel beyond the left clip; only one in five fades early.
      var fading = index % 5 === 0;
      bubble.dataset.fading = String(fading);
      bubble.dataset.slot = String(index);
      bubble.style.animationName = 'zcode-thought-bubble-flow, ' + (fading ? 'zcode-thought-bubble-fade-' + (index % 4) : 'zcode-thought-bubble-solid');
      bubble.style.animationDuration = duration + 's';
      bubble.style.animationDelay = (stagger ? -Math.random() * duration : 0) + 's';
      bubble.style.animationTimingFunction = 'linear, cubic-bezier(' + randomBetween(.2, .4) + ', 0, ' + randomBetween(.5, .8) + ', 1)';
      var dot = document.createElement('span');
      dot.style.width = size + 'px'; dot.style.height = size + 'px';
      bubble.appendChild(dot);
      return bubble;
    }
    for (var i = 0; i < BUBBLE_COUNT; i++) particles.appendChild(particle(i, true));
    particles.addEventListener('animationend', function (event) {
      // One replacement per life, never per frame. The old particle is removed.
      if (event.animationName !== 'zcode-thought-bubble-flow' || event.target.parentNode !== particles) return;
      var old = event.target;
      old.replaceWith(particle(Number(old.dataset.slot), false));
    });
    fill.appendChild(bubbles);
    return fill;
  }

  function restoreKnob(state) {
    if (!state.knob) return;
    var knob = state.knob;
    knob.state.styles.forEach(function (value, name) {
      if (knob.node.style.getPropertyValue(name) !== value.applied) return;
      if (value.original) knob.node.style.setProperty(name, value.original, value.priority);
      else knob.node.style.removeProperty(name);
    });
    if (knob.node.style.cssText === knob.css) {
      var current = knob.node.getAttribute('style');
      if (knob.original === null) { if (current !== null) knob.node.removeAttribute('style'); }
      else if (current !== knob.original) knob.node.setAttribute('style', knob.original);
    }
    state.knob = null;
  }

  function syncGeometry(slider, state) {
    setStyle(slider, state, 'height', '24px', 'important');
    setStyle(slider, state, 'min-height', '24px', 'important');
    setStyle(slider, state, 'max-height', '24px', 'important');
    setStyle(slider, state, 'border-radius', '999px', 'important');
    setStyle(slider, state, 'corner-shape', 'round', 'important');
    var node = slider.querySelector('.bre-effort-knob, .bre-effort-slider-thumb');
    if (state.knob && state.knob.node !== node) restoreKnob(state);
    if (!node) return;
    if (!state.knob) state.knob = { node: node, original: node.getAttribute('style'), css: node.style.cssText, state: { styles: new Map() } };
    var values = { width: '28px', height: '28px', 'min-width': '28px', 'max-width': '28px',
      'min-height': '28px', 'max-height': '28px', 'border-radius': '50%', 'box-sizing': 'border-box',
      'corner-shape': 'round', 'aspect-ratio': '1 / 1', padding: '0px', margin: '0px', transform: 'translate(-50%, -50%)', top: '50%' };
    Object.keys(values).forEach(function (name) { setStyle(node, state.knob.state, name, values[name], 'important'); });
  }

  function restoreSlider(slider, state) {
    if (state.pointer) state.pointer.dispose();
    restoreKnob(state);
    state.fill.remove();
    if (state.presentation) state.presentation.nodes.forEach(function (node) { node.remove(); });
    state.attributes.forEach(function (value, name) {
      if (value === null) slider.removeAttribute(name);
      else slider.setAttribute(name, value);
    });
    state.styles.forEach(function (value, name) {
      // Preserve a newer host edit if it happens to use the same property.
      if (slider.style.getPropertyValue(name) !== value.applied) return;
      if (value.original) slider.style.setProperty(name, value.original, value.priority);
      else slider.style.removeProperty(name);
    });
    if (slider.style.cssText === state.originalCss) {
      if (state.originalStyle === null) {
        // Flush deferred CSSOM serialization before removing an empty attribute.
        if (slider.getAttribute('style') !== null) slider.removeAttribute('style');
      } else slider.setAttribute('style', state.originalStyle);
    }
    sliders.delete(slider);
  }

  function restoreLabel(label, original) {
    if (label.textContent === '思考强度') label.textContent = original;
    labels.delete(label);
  }

  function createPointer(slider, input, state) {
    var legacy = input === slider;
    function disabled() { return input.disabled || input.getAttribute('aria-disabled') === 'true'; }
    var surface = document.createElement('div');
    surface.className = 'zcode-thought-pointer';
    surface.setAttribute('aria-hidden', 'true');
    var drag = null;
    var api = { input: input, surface: surface, progress: null, dispose: dispose, cancel: cancel };

    function forward(type, progress, original) {
      var bounds = input.getBoundingClientRect();
      input.dispatchEvent(new PointerEvent(type, {
        bubbles: true, cancelable: true, composed: true,
        pointerId: drag.forwardId, pointerType: drag.pointerType, isPrimary: true,
        button: 0, buttons: type === 'pointerup' || type === 'pointercancel' ? 0 : 1,
        clientX: bounds.left + bounds.width * progress,
        clientY: original ? original.clientY : bounds.top + bounds.height / 2
      }));
    }

    function stopIndex(event) {
      var delta = event.clientX - drag.lastX;
      // Ignore subpixel pointer jitter but remember the last real direction.
      if (Math.abs(delta) >= 1) {
        // Smooth the recent movement vector so a tiny reverse movement at
        // release does not outweigh the rest of the gesture.
        drag.recentVector = drag.recentVector * 0.5 + delta;
        drag.lastX = event.clientX;
      }
      var raw = Math.max(0, Math.min(drag.count, (event.clientX - drag.bounds.left) / drag.bounds.width * drag.count));
      var nearest = Math.round(raw);
      if (Math.abs(raw - nearest) < 1e-6) return nearest;
      var interval = drag.bounds.width / drag.count;
      var clamp = function (value) { return Math.max(-1, Math.min(1, value)); };
      var overall = clamp((event.clientX - drag.startX) / interval);
      var recent = clamp(drag.recentVector / (interval * 0.25));
      // Three votes for the upper of the two neighbouring stops. Distance is
      // primary (55%), start-to-release displacement 30%, recent vector 15%.
      // With no movement the two vector votes are neutral: click = nearest.
      var lower = Math.floor(raw);
      var vote = 0.55 * (raw - lower) + 0.30 * (overall + 1) / 2 + 0.15 * (recent + 1) / 2;
      return lower + (vote >= 0.5 ? 1 : 0);
    }

    function preview(index) {
      api.progress = index / drag.count;
      paintSlider(slider, state, api.progress);
      if (legacy && drag.header && drag.names[index]) drag.header.textContent = drag.names[index];
    }

    function down(event) {
      if (disabled()) { event.preventDefault(); event.stopPropagation(); return; }
      if (drag || event.button !== 0 || event.isPrimary === false) return;
      var count = stopCount(input);
      var bounds = input.getBoundingClientRect();
      if (!Number.isFinite(count) || count < 1 || count > 1000 || !Number.isInteger(count) || bounds.width <= 0) return;
      event.preventDefault();
      event.stopPropagation();
      drag = { id: event.pointerId, forwardId: --pointerSequence, pointerType: event.pointerType,
        count: count, bounds: bounds, recentVector: 0, startX: event.clientX, lastX: event.clientX, index: -1 };
      if (legacy) {
        drag.header = slider.parentElement.querySelector('.bre-effort-slider-head-value');
        drag.savedHeader = drag.header && drag.header.textContent;
        drag.names = Array.from(slider.parentElement.querySelectorAll('.bre-effort-slider-label')).map(function (node) { return node.textContent; });
      }
      surface.setPointerCapture(event.pointerId);
      drag.index = stopIndex(event);
      preview(drag.index);
      // A distinct pointer id keeps the host's window capture listeners from
      // processing the unsnapped physical gesture as well as this forwarded one.
      if (!legacy) forward('pointerdown', api.progress, event);
    }

    function move(event) {
      if (!drag || event.pointerId !== drag.id) return;
      event.preventDefault();
      event.stopPropagation();
      if (disabled() || !input.isConnected || stopCount(input) !== drag.count) { cancel(); return; }
      var index = stopIndex(event);
      if (index === drag.index) return;
      drag.index = index;
      preview(index);
      if (!legacy) forward('pointermove', api.progress, event);
    }

    function finish(event) {
      if (!drag || event.pointerId !== drag.id) return;
      move(event);
      if (!drag) return;
      if (legacy) forward('pointerdown', api.progress, event);
      forward('pointerup', api.progress, event);
      clear();
    }

    function clear() {
      var id = drag.id;
      if (legacy && drag.header) drag.header.textContent = drag.savedHeader;
      drag = null;
      api.progress = null;
      if (surface.hasPointerCapture(id)) surface.releasePointerCapture(id);
      // Host state, including refusal/rollback, is authoritative after release.
      queueMicrotask(function () { if (active && slider.isConnected) refreshSlider(slider); if (menuNeedsPlacement) requestMenuPlacement(); });
    }

    function cancel(event) {
      if (!drag || (event && event.pointerId !== undefined && event.pointerId !== drag.id)) return;
      if (!legacy) forward('pointercancel', api.progress);
      clear();
    }

    function dispose() {
      cancel();
      root.removeEventListener('blur', cancel);
      root.removeEventListener('resize', cancel);
      surface.remove();
    }

    surface.addEventListener('pointerdown', down);
    surface.addEventListener('pointermove', move);
    surface.addEventListener('pointerup', finish);
    surface.addEventListener('pointercancel', cancel);
    surface.addEventListener('lostpointercapture', cancel);
    root.addEventListener('blur', cancel);
    root.addEventListener('resize', cancel);
    return api;
  }

  function paintSlider(slider, state, progress) {
    setAttribute(slider, maxMarker, progress === 1 ? 'true' : 'false');
    setAttribute(state.fill.querySelector('.zcode-thought-bubbles'), 'data-running', progress === 1 ? 'true' : 'false');
    setStyle(slider, state, '--dsh-thought-progress', String(progress * 100) + '%');
    setStyle(slider, state, '--dsh-thought-gradient', gradientForProgress(progress));
    updatePresentation(slider, state, progress);
  }

  function stopCount(input) {
    if (input.matches('[role="slider"]')) return numericAttribute(input, 'aria-valuemax', NaN) - numericAttribute(input, 'aria-valuemin', 0);
    return (numericAttribute(input, 'max', 100) - numericAttribute(input, 'min', 0)) / numericAttribute(input, 'step', 1);
  }

  function updatePresentation(slider, state, progress) {
    var input = slider.querySelector('input.bre-effort-input[type="range"]');
    // Existing model-menu controls already own their heading and stop labels.
    // Only supply a compact heading for the older standalone range component.
    var head = slider.parentElement.querySelector('.bre-effort-slider-head');
    if (!input || head) {
      if (state.presentation) state.presentation.nodes.forEach(function (node) { node.remove(); });
      state.presentation = null;
      return;
    }
    var ui = state.presentation;
    if (!ui) {
      var caption = document.createElement('div');
      caption.className = 'zcode-thought-caption';
      var label = document.createElement('span');
      label.className = 'zcode-thought-caption-label';
      var value = document.createElement('span');
      value.className = 'zcode-thought-caption-value';
      caption.append(label, value);
      ui = state.presentation = { nodes: [caption], label: label, value: value };
      ui.nodes.forEach(function (node) { node.setAttribute('aria-hidden', 'true'); });
    }
    ui.nodes.forEach(function (node) { if (node.parentNode !== slider) slider.appendChild(node); });
    function text(node, value) { if (node.textContent !== value) node.textContent = value; }
    var chinese = !document.documentElement.lang || /^zh/i.test(document.documentElement.lang);
    text(ui.label, chinese ? '思考强度' : 'Reasoning effort');
    var name = input.getAttribute('aria-valuetext') || input.value;
    text(ui.value, name);
    if (ui.value.title !== name) ui.value.title = name;
  }

  function syncPointer(slider, state) {
    var input = slider.querySelector('input.bre-effort-input[type="range"]');
    if (!input && slider.matches('[role="slider"][aria-valuemax]')) input = slider;
    var count = input ? stopCount(input) : NaN;
    if (!Number.isInteger(count) || count < 1 || count > 1000) input = null;
    if (state.pointer && state.pointer.input !== input) { state.pointer.dispose(); state.pointer = null; }
    if (input && !state.pointer) state.pointer = createPointer(slider, input, state);
    if (state.pointer) {
      if (input.disabled || input.getAttribute('aria-disabled') === 'true') state.pointer.cancel();
      if (state.pointer.surface.parentNode !== slider) slider.appendChild(state.pointer.surface);
    }
  }

  function refreshSlider(slider) {
    var state = sliders.get(slider);
    if (!state) return;
    if (!slider.isConnected) { restoreSlider(slider, state); return; }
    var value = readSlider(slider);
    if (!value) { restoreSlider(slider, state); return; }
    syncGeometry(slider, state);
    syncPointer(slider, state);
    paintSlider(slider, state, state.pointer && state.pointer.progress !== null ? state.pointer.progress : value.progress);
  }

  function updateMutations(records) {
    var changed = new Set();
    records.forEach(function (record) {
      if (!relevantMutation(record)) return;
      // Structural changes need discovery/cleanup. Progress writes need only
      // the affected control, synchronously in this pre-paint microtask.
      if (record.type !== 'attributes' || record.attributeName === 'class') { scheduleScan(); return; }
      var slider = record.target.closest('.bre-effort-slider');
      if (slider && sliders.has(slider)) changed.add(slider);
    });
    changed.forEach(refreshSlider);
  }

  function harmonizeSlider(slider, value) {
    var state = sliders.get(slider);
    if (!state) {
      slider.querySelectorAll(':scope > .zcode-thought-fill, :scope > .zcode-thought-pointer, :scope > .zcode-thought-caption, :scope > .zcode-thought-scale, :scope > .zcode-thought-ticks').forEach(function (node) { node.remove(); });
      state = {
        fill: createFill(), styles: new Map(),
        originalStyle: slider.getAttribute('style'), originalCss: slider.style.cssText,
        attributes: new Map([[marker, slider.getAttribute(marker)], [maxMarker, slider.getAttribute(maxMarker)]])
      };
      sliders.set(slider, state);
    }
    syncGeometry(slider, state);
    syncPointer(slider, state);
    // A host rerender can replace children without replacing the slider itself.
    if (state.fill.parentNode !== slider) slider.appendChild(state.fill);
    setAttribute(slider, marker, value.kind);
    paintSlider(slider, state, state.pointer && state.pointer.progress !== null ? state.pointer.progress : value.progress);
  }

  function requestMenuPlacement() {
    if (menuFrame !== null) return;
    menuFrame = root.requestAnimationFrame(function () {
      menuFrame = null;
      var dragging = false;
      sliders.forEach(function (state) { if (state.pointer && state.pointer.progress !== null) dragging = true; });
      if (active && menuNeedsPlacement && !dragging) {
        menuNeedsPlacement = false;
        root.dispatchEvent(new Event('resize'));
      }
    });
  }

  function syncMenus() {
    var current = new Set();
    sliders.forEach(function (_, slider) { var menu = slider.closest('.codexModelSelectMenu'); if (menu) current.add(menu); });
    if (!menuObserver && typeof root.ResizeObserver === 'function') menuObserver = new root.ResizeObserver(function (entries) {
      var changed = false;
      entries.forEach(function (entry) {
        var height = entry.target.getBoundingClientRect().height;
        if (Math.abs(height - (menuHeights.get(entry.target) || 0)) > .5) { menuHeights.set(entry.target, height); changed = true; }
      });
      if (changed) { menuNeedsPlacement = true; requestMenuPlacement(); }
    });
    menuHeights.forEach(function (_, menu) { if (!current.has(menu)) { if (menuObserver) menuObserver.unobserve(menu); menuHeights.delete(menu); } });
    current.forEach(function (menu) { if (!menuHeights.has(menu)) { menuHeights.set(menu, 0); if (menuObserver) menuObserver.observe(menu); } });
  }

  function scanAndHarmonize() {
    if (!active || typeof document === 'undefined') return;
    // Do not observe our own decoration writes. Host changes are observed again
    // immediately after this synchronous pass, without a feedback loop.
    if (observer) observer.disconnect();
    try {
      var current = new Set();
      document.querySelectorAll('.bre-effort-slider').forEach(function (slider) {
        var value = readSlider(slider);
        if (!value) return;
        current.add(slider);
        harmonizeSlider(slider, value);
      });
      sliders.forEach(function (state, slider) {
        if (!current.has(slider)) restoreSlider(slider, state);
      });
      syncMenus();
      labels.forEach(function (original, label) {
        if (!label.isConnected) restoreLabel(label, original);
      });
      document.querySelectorAll('.bre-effort-slider-head-label').forEach(function (label) {
        if (label.textContent !== '思考等级' || label.children.length) return;
        labels.set(label, label.textContent);
        label.textContent = '思考强度';
      });
    } finally {
      if (observer && document.body) observer.observe(document.body, observerOptions);
    }
  }

  function scheduleScan() {
    if (!active || frame !== null) return;
    frame = root.requestAnimationFrame(function () {
      frame = null;
      scanAndHarmonize();
    });
  }

  function relevantMutation(record) {
    var element = record.target.nodeType === 1 ? record.target : record.target.parentElement;
    if (element && element.closest('.zcode-thought-fill, .zcode-thought-pointer, .zcode-thought-caption, .zcode-thought-scale, .zcode-thought-ticks')) return false;
    if (sliders.has(element)) return true;
    if (element && element.closest('.bre-effort-slider, .bre-effort-slider-head')) return true;
    if (record.type !== 'childList') return false;
    return Array.from(record.addedNodes).concat(Array.from(record.removedNodes)).some(function (node) {
      return node.nodeType === 1 && (node.matches('.bre-effort-slider, .bre-effort-slider-head') ||
        node.querySelector('.bre-effort-slider, .bre-effort-slider-head'));
    });
  }

  function onInput(event) {
    var slider = event.target.closest && event.target.closest('.bre-effort-slider');
    if (slider && sliders.has(slider)) refreshSlider(slider);
  }

  function onReady() {
    document.removeEventListener('DOMContentLoaded', onReady);
    if (!active) return;
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.dataset.plugin = 'dsh-thought-slider';
      styleElement.textContent = SLIDER_CSS;
      (document.head || document.documentElement).appendChild(styleElement);
    }
    if (!observer && typeof MutationObserver !== 'undefined' && document.body) {
      var NativeObserver = root.MutationObserver.prototype.constructor;
      if (!/\[native code\]/.test(Function.prototype.toString.call(NativeObserver))) NativeObserver = root.MutationObserver;
      observer = new NativeObserver(function (records) {
        updateMutations(records);
      });
    }
    scanAndHarmonize();
  }

  function install() {
    if (active || typeof document === 'undefined') return;
    active = true;
    document.addEventListener('input', onInput, true);
    document.addEventListener('change', onInput, true);
    if (document.body) onReady();
    else document.addEventListener('DOMContentLoaded', onReady);
  }

  function uninstall() {
    if (!active) return;
    active = false;
    document.removeEventListener('DOMContentLoaded', onReady);
    document.removeEventListener('input', onInput, true);
    document.removeEventListener('change', onInput, true);
    if (frame !== null) root.cancelAnimationFrame(frame);
    frame = null;
    if (observer) observer.disconnect();
    observer = null;
    if (menuObserver) menuObserver.disconnect();
    menuObserver = null; menuHeights.clear();
    if (menuFrame !== null) root.cancelAnimationFrame(menuFrame);
    menuFrame = null; menuNeedsPlacement = false;
    sliders.forEach(function (state, slider) { restoreSlider(slider, state); });
    labels.forEach(function (original, label) { restoreLabel(label, original); });
    if (styleElement) styleElement.remove();
    styleElement = null;
  }

  root.__DSH_THOUGHT_SLIDER__ = {
    version: '1.0.5', install: install, uninstall: uninstall,
    scanAndHarmonize: scanAndHarmonize, CSS: SLIDER_CSS
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
