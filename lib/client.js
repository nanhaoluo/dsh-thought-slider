/**
 * dsh-thought-slider — web client bundle.
 */
window.__ModuleLoader__.load({
  id: 'dsh-thought-slider',
  factory: function (require) {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

    ;
    /**
     * Visual enhancement for current and legacy dsh-better-reasoning-effort sliders.
     * The host owns selection, pointer/keyboard handling and progress. Never rewrite
     * its positions or range values: those are also inputs to its next render.
     */
    (function (root) {
      'use strict';
      if (!root || root.__DSH_THOUGHT_SLIDER__) return;

      var BUBBLE_SPEC = [
        { top: 2, size: 2, duration: 2.6, delay: -0.4 },
        { top: 11, size: 3, duration: 3.2, delay: -2.1 },
        { top: 5, size: 3.5, duration: 2.8, delay: -1.1 },
        { top: 13, size: 2, duration: 3.6, delay: -0.8 },
        { top: 3, size: 3, duration: 3.0, delay: -2.5 },
        { top: 9, size: 2, duration: 3.4, delay: -1.7 },
        { top: 4, size: 3, duration: 3.1, delay: -0.9 },
        { top: 12, size: 3.5, duration: 2.9, delay: -2.3 },
        { top: 7, size: 2, duration: 3.5, delay: -0.2 },
        { top: 1, size: 2, duration: 2.7, delay: -1.8 },
        { top: 10, size: 3, duration: 3.3, delay: -1.2 },
        { top: 6, size: 3, duration: 3.6, delay: -3.1 }
      ];

      var SLIDER_CSS = `
    /* Keep model-selection rows visible; the host owns switching menu panes. */
    .codexModelSelectMenu.bre-model-menu-host:has([data-dsh-thought-slider]) {
      max-height: min(520px, calc(100dvh - 32px)) !important;
      overflow-y: auto !important;
    }
    .bre-model-menu-host:has([data-dsh-thought-slider]) .bre-providers {
      width: 128px !important;
      flex-shrink: 0;
    }
    .bre-effort-slider-head:has(+ [data-dsh-thought-slider]) {
      display: flex;
      align-items: center;
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
      height: 20px !important;
      margin: 4px 12px 6px !important;
      border: 0 !important;
      border-radius: 999px !important;
      background: rgba(255, 255, 255, .08) !important;
      box-shadow: inset 0 0 0 1px rgba(128, 128, 128, .2) !important;
      overflow: visible !important;
    }
    body:not([data-ds-dark-theme]) .bre-effort-slider[data-dsh-thought-slider] {
      background: rgba(0, 0, 0, .06) !important;
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
      border-radius: inherit;
      background: var(--dsh-thought-gradient);
      overflow: hidden;
      pointer-events: none;
      z-index: 1;
    }
    .bre-effort-slider[data-dsh-thought-slider] :is(.bre-effort-slider-thumb, .bre-effort-knob) {
      position: absolute !important;
      box-sizing: border-box !important;
      top: 50% !important;
      left: clamp(12px, var(--dsh-thought-progress), calc(100% - 12px)) !important;
      width: 24px !important;
      height: 24px !important;
      border: 0 !important;
      border-radius: 50% !important;
      transform: translate(-50%, -50%) !important;
      background: #fff !important;
      box-shadow: 0 2px 6px rgba(0, 0, 0, .35), 0 0 1px rgba(0, 0, 0, .25) !important;
      pointer-events: none !important;
      z-index: 4 !important;
      transition: none !important;
    }
    .bre-effort-slider[data-dsh-thought-slider] .bre-effort-input {
      z-index: 5 !important;
    }
    .bre-effort-slider[data-dsh-thought-slider] .bre-effort-slider-tick {
      position: absolute !important;
      top: 50% !important;
      width: 4px !important;
      height: 4px !important;
      margin-left: -2px !important;
      margin-top: -2px !important;
      border-radius: 50% !important;
      background: rgba(255, 255, 255, .45) !important;
      pointer-events: none !important;
      z-index: 2 !important;
    }
    .bre-effort-slider[data-dsh-thought-slider] .zcode-thought-bubbles {
      position: absolute;
      inset: 0;
      overflow: hidden;
      border-radius: inherit;
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
      animation: zcode-thought-bubble-flow linear infinite;
      animation-play-state: paused;
    }
    .bre-effort-slider[data-dsh-thought-max="true"] .zcode-thought-bubble {
      animation-play-state: running;
    }
    .bre-effort-slider[data-dsh-thought-slider] .zcode-thought-bubble > span {
      display: block;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 0 5px rgba(255, 255, 255, .9);
    }
    @keyframes zcode-thought-bubble-flow {
      0% { opacity: 0; transform: translateX(104%); }
      15%, 80% { opacity: .75; }
      100% { opacity: 0; transform: translateX(-6%); }
    }
    @media (prefers-reduced-motion: reduce) {
      .bre-effort-slider[data-dsh-thought-slider] .zcode-thought-bubble {
        animation: none !important;
      }
    }
    `;

      var styleElement = null;
      var observer = null;
      var frame = null;
      var active = false;
      var sliders = new Map();
      var labels = new Map();
      var marker = 'data-dsh-thought-slider';
      var maxMarker = 'data-dsh-thought-max';
      var observerOptions = {
        childList: true, subtree: true, characterData: true, attributes: true,
        attributeFilter: ['style', 'class', 'aria-valuenow', 'aria-valuemin',
          'aria-valuemax', 'min', 'max', 'value']
      };

      function gradientForProgress(pct) {
        if (pct >= 0.95) {
          // Max level: rich green to cyan to blue to vibrant purple
          return 'linear-gradient(90deg, #10b981 0%, #06b6d4 30%, #3b82f6 65%, #8b5cf6 88%, #a855f7 100%)';
        } else if (pct >= 0.65) {
          // High level: green to cyan to royal blue
          return 'linear-gradient(90deg, #10b981 0%, #06b6d4 35%, #0ea5e9 70%, #3b82f6 100%)';
        } else if (pct >= 0.35) {
          // Medium level: green to cyan to sky blue
          return 'linear-gradient(90deg, #10b981 0%, #06b6d4 60%, #0ea5e9 100%)';
        } else {
          // Low level: pure emerald green to soft teal
          return 'linear-gradient(90deg, #10b981 0%, #14b8a6 100%)';
        }
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

      function setStyle(element, state, name, value) {
        if (!state.styles.has(name)) {
          state.styles.set(name, {
            original: element.style.getPropertyValue(name),
            priority: element.style.getPropertyPriority(name),
            applied: null
          });
        }
        if (element.style.getPropertyValue(name) !== value) element.style.setProperty(name, value);
        state.styles.get(name).applied = value;
      }

      function createFill() {
        var fill = document.createElement('div');
        fill.className = 'zcode-thought-fill';
        fill.setAttribute('aria-hidden', 'true');
        var bubbles = document.createElement('div');
        bubbles.className = 'zcode-thought-bubbles';
        BUBBLE_SPEC.forEach(function (item) {
          var bubble = document.createElement('span');
          bubble.className = 'zcode-thought-bubble';
          bubble.style.top = item.top + 'px';
          bubble.style.animationDuration = item.duration + 's';
          bubble.style.animationDelay = item.delay + 's';
          var dot = document.createElement('span');
          dot.style.width = item.size + 'px';
          dot.style.height = item.size + 'px';
          bubble.appendChild(dot);
          bubbles.appendChild(bubble);
        });
        fill.appendChild(bubbles);
        return fill;
      }

      function restoreSlider(slider, state) {
        state.fill.remove();
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

      function harmonizeSlider(slider, value) {
        var state = sliders.get(slider);
        if (!state) {
          state = {
            fill: createFill(), styles: new Map(),
            originalStyle: slider.getAttribute('style'), originalCss: slider.style.cssText,
            attributes: new Map([[marker, slider.getAttribute(marker)], [maxMarker, slider.getAttribute(maxMarker)]])
          };
          sliders.set(slider, state);
        }
        // A host rerender can replace children without replacing the slider itself.
        if (state.fill.parentNode !== slider) slider.appendChild(state.fill);
        setAttribute(slider, marker, value.kind);
        setAttribute(slider, maxMarker, value.progress === 1 ? 'true' : 'false');
        setStyle(slider, state, '--dsh-thought-progress', String(value.progress * 100) + '%');
        setStyle(slider, state, '--dsh-thought-gradient', gradientForProgress(value.progress));
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
        if (sliders.has(element)) return true;
        if (element && element.closest('.bre-effort-slider, .bre-effort-slider-head')) return true;
        if (record.type !== 'childList') return false;
        return Array.from(record.addedNodes).concat(Array.from(record.removedNodes)).some(function (node) {
          return node.nodeType === 1 && (node.matches('.bre-effort-slider, .bre-effort-slider-head') ||
            node.querySelector('.bre-effort-slider, .bre-effort-slider-head'));
        });
      }

      function onInput(event) {
        if (event.target.matches && event.target.matches('.bre-effort-input')) scheduleScan();
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
          observer = new MutationObserver(function (records) {
            if (records.some(relevantMutation)) scheduleScan();
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
        sliders.forEach(function (state, slider) { restoreSlider(slider, state); });
        labels.forEach(function (original, label) { restoreLabel(label, original); });
        if (styleElement) styleElement.remove();
        styleElement = null;
      }

      root.__DSH_THOUGHT_SLIDER__ = {
        version: '1.0.0', install: install, uninstall: uninstall,
        scanAndHarmonize: scanAndHarmonize, CSS: SLIDER_CSS
      };
    })(typeof globalThis !== 'undefined' ? globalThis : this);

    var engine = globalThis.__DSH_THOUGHT_SLIDER__;

    function apply(ctx) {
      ctx.effect(function () {
        if (engine && typeof engine.install === 'function') {
          engine.install();
        }
        return function () {
          if (engine && typeof engine.uninstall === 'function') {
            engine.uninstall();
          }
        };
      }, 'dsh-thought-slider: lifecycle');
    }

    exports.apply = apply;
    exports.inject = [];
    exports.name = 'dsh-thought-slider';
    return module.exports;
  }
});
