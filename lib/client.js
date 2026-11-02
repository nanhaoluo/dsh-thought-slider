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
     * dsh-thought-slider — browser enhancement engine.
     *
     * Implements the authentic ZCode / Codex reasoning-effort slider:
     * - Thinner, refined pill track (20px) with elegant side margins (12px)
     * - Complete solid white circular knob (24px) that floats on top without being clipped
     * - Dynamic color transition: shifts with effort from vibrant emerald green to rich blue-purple
     * - High-speed / Max level effect: Codex 12-particle thought bubbles flow across the track
     *   ONLY when pulled to the maximum level
     * - Clean "思考强度" header, strictly preserving original configured level names
     * - Keyboard shortcut badge "Ctrl+T"
     * - Shields against container clipping and duplicate item interference
     */

    (function (root) {
      'use strict';

      if (root === undefined || root === null) return;
      if (root.__DSH_THOUGHT_SLIDER__ !== undefined) return;

      var STYLE_KEY = 'dsh-thought-slider/styles';

      /** The 12-bubble particle spec from ZCode / Codex */
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

      var SLIDER_CSS = [
        '/* ====== ZCode / Codex Reasoning Effort Slider ====== */',
        '',
        '/* Menu container size & layout adjustments */',
        '.codexModelSelectMenu.bre-model-menu-host > button[role="menuitem"],',
        '.codexModelSelectMenu.bre-model-menu-host > .codexModelSelectCell {',
        '  display: none !important;',
        '}',
        '.codexModelSelectMenu.bre-model-menu-host {',
        '  max-height: min(520px, calc(100vh - 96px)) !important;',
        '  height: auto !important;',
        '  width: max-content !important;',
        '  min-width: min(380px, calc(100vw - 32px)) !important;',
        '  max-width: min(460px, calc(100vw - 32px)) !important;',
        '  overflow: visible !important;',
        '}',
        '.bre-model-menu-host .bre-providers {',
        '  width: 128px !important;',
        '}',
        '.bre-card {',
        '  padding-bottom: 6px !important;',
        '}',
        '',
        '/* Header row: "思考强度" + value + Ctrl+T badge */',
        '.bre-effort-slider-head {',
        '  display: flex !important;',
        '  align-items: center !important;',
        '  justify-content: flex-start !important;',
        '  gap: 8px !important;',
        '  margin-bottom: 8px !important;',
        '  padding: 0 4px !important;',
        '}',
        '.bre-effort-slider-head-label {',
        '  font-size: 13px !important;',
        '  font-weight: 500 !important;',
        '  color: var(--dsw-alias-label-secondary, #9aa0a6) !important;',
        '}',
        '.bre-effort-slider-head-value {',
        '  font-size: 14px !important;',
        '  font-weight: 600 !important;',
        '  color: var(--dsw-alias-label-primary, #ffffff) !important;',
        '}',
        '.bre-effort-slider-head::after {',
        '  content: "Ctrl+T";',
        '  margin-left: auto;',
        '  font-size: 11px;',
        '  line-height: 16px;',
        '  padding: 1px 6px;',
        '  border-radius: 4px;',
        '  background: var(--dsw-alias-bg-hover, rgba(255, 255, 255, 0.08));',
        '  color: var(--dsw-alias-label-tertiary, #80868b);',
        '  font-weight: 500;',
        '  letter-spacing: 0.02em;',
        '}',
        '',
        '/* Track wrapper: side margins for breathing space, thinner 20px pill */',
        '.bre-effort-slider {',
        '  position: relative !important;',
        '  height: 20px !important;',
        '  margin: 4px 6px 6px 6px !important;',
        '  border-radius: 9999px !important;',
        '  background: rgba(255, 255, 255, 0.08) !important;',
        '  border: 1px solid rgba(255, 255, 255, 0.12) !important;',
        '  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.25) !important;',
        '  cursor: pointer !important;',
        '  touch-action: none !important;',
        '  overflow: visible !important; /* Allow thumb to float unclipped on top */',
        '}',
        'body:not([data-ds-dark-theme]) .bre-effort-slider {',
        '  background: rgba(0, 0, 0, 0.06) !important;',
        '  border-color: rgba(0, 0, 0, 0.08) !important;',
        '}',
        '.bre-effort-slider::before {',
        '  display: none !important;',
        '}',
        '.bre-effort-slider:focus-visible {',
        '  outline: none !important;',
        '  box-shadow: 0 0 0 2px var(--dsw-alias-brand-primary, #4d6bfe) !important;',
        '}',
        '',
        '/* Fill: dynamic green-to-blue-purple gradient with inner pill clipping */',
        '.bre-effort-slider-fill {',
        '  position: absolute !important;',
        '  inset: -1px !important; /* expand to cover border smoothly */',
        '  height: calc(100% + 2px) !important;',
        '  border-radius: 9999px !important;',
        '  transform: none !important;',
        '  pointer-events: none !important;',
        '  overflow: hidden !important; /* clip internal bubbles inside fill */',
        '  transition: clip-path 0.12s ease-out !important;',
        '  background: var(--zcode-slider-gradient, linear-gradient(90deg, #10b981 0%, #06b6d4 100%)) !important;',
        '}',
        '',
        '/* The cool Codex bubbles container: only visible when data-max="true" */',
        '.zcode-thought-bubbles {',
        '  position: absolute;',
        '  inset: 0;',
        '  border-radius: inherit;',
        '  pointer-events: none;',
        '  overflow: hidden;',
        '  opacity: 0;',
        '  transition: opacity 0.25s ease-out;',
        '}',
        '.bre-effort-slider[data-max="true"] .zcode-thought-bubbles {',
        '  opacity: 1;',
        '}',
        '.zcode-thought-bubble {',
        '  position: absolute;',
        '  inset-x: 0;',
        '  opacity: 0;',
        '  animation: zcode-thought-bubble-flow linear infinite;',
        '  display: block;',
        '  pointer-events: none;',
        '}',
        '.zcode-thought-bubble > span {',
        '  display: block;',
        '  border-radius: 50%;',
        '  background: #ffffff;',
        '  box-shadow: 0 0 5px rgba(255, 255, 255, 0.9), 0 0 2px rgba(255, 255, 255, 1);',
        '}',
        '@keyframes zcode-thought-bubble-flow {',
        '  0% {',
        '    opacity: 0;',
        '    transform: translateX(104%);',
        '  }',
        '  15%, 80% {',
        '    opacity: 0.75;',
        '  }',
        '  100% {',
        '    opacity: 0;',
        '    transform: translateX(-6%);',
        '  }',
        '}',
        '',
        '/* Stop ticks inside the track */',
        '.bre-effort-slider-tick {',
        '  position: absolute !important;',
        '  top: 50% !important;',
        '  width: 4px !important;',
        '  height: 4px !important;',
        '  margin-left: -2px !important;',
        '  margin-top: -2px !important;',
        '  border-radius: 50% !important;',
        '  background: rgba(255, 255, 255, 0.45) !important;',
        '  box-shadow: 0 0 2px rgba(0, 0, 0, 0.2) !important;',
        '  pointer-events: none !important;',
        '  z-index: 2 !important;',
        '}',
        '',
        '/* Thumb: crisp solid pure-white circular knob floating on top */',
        '.bre-effort-slider-thumb {',
        '  position: absolute !important;',
        '  top: 50% !important;',
        '  width: 24px !important;',
        '  height: 24px !important;',
        '  border-radius: 50% !important;',
        '  transform: translate(-50%, -50%) !important;',
        '  background: #ffffff !important;',
        '  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4), 0 0 1px rgba(0, 0, 0, 0.25) !important;',
        '  pointer-events: none !important;',
        '  z-index: 10 !important; /* Always on top of track and fill */',
        '  transition: left 0.12s ease-out !important;',
        '}',
        '.bre-effort-slider[data-bre-dragging="true"] .bre-effort-slider-thumb,',
        '.bre-effort-slider[data-bre-dragging="true"] .bre-effort-slider-fill {',
        '  transition: none !important;',
        '}',
        '',
        '/* Hide redundant bottom labels */',
        '.bre-effort-slider-labels {',
        '  display: none !important;',
        '}',
        '.bre-menu-foot {',
        '  padding-top: 10px !important;',
        '  padding-bottom: 2px !important;',
        '}'
      ].join('\n');

      var styleElement = null;
      var observer = null;
      var active = false;

      function installStyles() {
        if (typeof document === 'undefined') return;
        if (styleElement && styleElement.isConnected) return;
        styleElement = document.createElement('style');
        styleElement.dataset.plugin = 'dsh-thought-slider';
        styleElement.dataset.pluginCss = STYLE_KEY;
        styleElement.textContent = SLIDER_CSS;
        document.head.appendChild(styleElement);
      }

      function uninstallStyles() {
        if (styleElement) {
          styleElement.remove();
          styleElement = null;
        }
      }

      function harmonizeHead(head) {
        if (!head) return;
        var label = head.querySelector('.bre-effort-slider-head-label');
        if (label && label.textContent === '思考等级') {
          label.textContent = '思考强度';
        }
      }

      /**
       * Determine gradient color according to progress (0% - 100%):
       * Low: Emerald Green -> Teal
       * Medium: Emerald Green -> Cyan -> Sky Blue
       * High: Emerald Green -> Cyan -> Sky Blue -> Blue
       * Max: Emerald Green -> Cyan -> Sky Blue -> Purple (with cool bubbles)
       */
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

      function ensureBubblesInFill(fill) {
        if (!fill) return null;
        var bubbles = fill.querySelector('.zcode-thought-bubbles');
        if (bubbles) return bubbles;

        bubbles = document.createElement('div');
        bubbles.className = 'zcode-thought-bubbles';

        for (var i = 0; i < BUBBLE_SPEC.length; i++) {
          var item = BUBBLE_SPEC[i];
          var bubbleSpan = document.createElement('span');
          bubbleSpan.className = 'zcode-thought-bubble';
          bubbleSpan.style.top = item.top + 'px';
          bubbleSpan.style.animationDuration = item.duration + 's';
          bubbleSpan.style.animationDelay = item.delay + 's';

          var dot = document.createElement('span');
          dot.style.width = item.size + 'px';
          dot.style.height = item.size + 'px';
          bubbleSpan.appendChild(dot);
          bubbles.appendChild(bubbleSpan);
        }
        fill.appendChild(bubbles);
        return bubbles;
      }

      function harmonizeSlider(slider) {
        if (!slider) return;
        var thumb = slider.querySelector('.bre-effort-slider-thumb');
        var fill = slider.querySelector('.bre-effort-slider-fill');
        if (!thumb || !fill) return;

        // Read current progress percentage
        var rawLeft = thumb.style.left || '';
        var pct = 0.5;
        var m = /^([\d.]+)%$/.exec(rawLeft.trim());
        if (m) {
          pct = Math.max(0, Math.min(1, parseFloat(m[1]) / 100));
          // Re-map thumb position so it floats on top inside the 20px track without edge clipping
          thumb.style.left = 'calc(12px + (100% - 24px) * ' + pct + ')';
        }

        var isMax = pct >= 0.95;
        slider.setAttribute('data-max', isMax ? 'true' : 'false');
        fill.setAttribute('data-max', isMax ? 'true' : 'false');

        // Update dynamic gradient according to progress
        fill.style.setProperty('--zcode-slider-gradient', gradientForProgress(pct));

        // Ensure bubble DOM elements exist for max level
        ensureBubblesInFill(fill);

        // Map tick marks
        var ticks = slider.querySelectorAll('.bre-effort-slider-tick');
        for (var i = 0; i < ticks.length; i++) {
          var tick = ticks[i];
          var tLeft = tick.style.left || '';
          var tm = /^([\d.]+)%$/.exec(tLeft.trim());
          if (tm) {
            var tpct = parseFloat(tm[1]) / 100;
            tick.style.left = 'calc(12px + (100% - 24px) * ' + tpct + ')';
          }
        }
      }

      function scanAndHarmonize() {
        if (typeof document === 'undefined') return;
        var heads = document.querySelectorAll('.bre-effort-slider-head');
        for (var i = 0; i < heads.length; i++) harmonizeHead(heads[i]);
        var sliders = document.querySelectorAll('.bre-effort-slider');
        for (var j = 0; j < sliders.length; j++) harmonizeSlider(sliders[j]);
      }

      function installObserver() {
        if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') return;
        if (!document.body) return;
        if (observer) return;
        observer = new MutationObserver(function () {
          scanAndHarmonize();
        });
        observer.observe(document.body, { childList: true, subtree: true });
        scanAndHarmonize();
      }

      function uninstallObserver() {
        if (observer) {
          observer.disconnect();
          observer = null;
        }
      }

      function install() {
        if (active) return;
        if (typeof document === 'undefined') return;
        active = true;
        installStyles();
        if (document.body) {
          installObserver();
        } else {
          document.addEventListener('DOMContentLoaded', function onReady() {
            document.removeEventListener('DOMContentLoaded', onReady);
            if (active) installObserver();
          });
        }
      }

      function uninstall() {
        if (!active) return;
        active = false;
        uninstallObserver();
        uninstallStyles();
      }

      var engine = {
        version: '1.0.0',
        install: install,
        uninstall: uninstall,
        scanAndHarmonize: scanAndHarmonize,
        CSS: SLIDER_CSS
      };

      root.__DSH_THOUGHT_SLIDER__ = engine;
    })(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);

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
