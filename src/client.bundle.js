/**
 * dsh-thought-slider — web client bundle.
 */
window.__ModuleLoader__.load({
  id: 'dsh-thought-slider',
  factory: function (require) {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

    // __ENGINE_SOURCE__

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
