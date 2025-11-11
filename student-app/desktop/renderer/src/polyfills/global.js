// Polyfill global object for browser-like environment
(function() {
  if (typeof global === 'undefined') {
    if (typeof window !== 'undefined') {
      window.global = window;
    } else if (typeof self !== 'undefined') {
      self.global = self;
    } else if (typeof globalThis !== 'undefined') {
      globalThis.global = globalThis;
    }
  }
})();

// Export global object
const globalObj = typeof global !== 'undefined'
  ? global
  : (typeof window !== 'undefined'
    ? window
    : (typeof self !== 'undefined'
      ? self
      : (typeof globalThis !== 'undefined' ? globalThis : {})));

module.exports = globalObj;
module.exports.default = globalObj;
