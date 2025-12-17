// src/polyfills.js
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = class TextDecoder {
    constructor(encoding = 'utf-8') {
      this.encoding = encoding;
    }
    decode(buffer) {
      if (buffer instanceof Uint8Array) {
        let str = '';
        for (let i = 0; i < buffer.length; i++) {
          str += String.fromCharCode(buffer[i]);
        }
        return str;
      }
      return String(buffer || '');
    }
  };
} else {
  const OriginalTextDecoder = global.TextDecoder;
  global.TextDecoder = class TextDecoder extends OriginalTextDecoder {
    constructor(encoding = 'utf-8', options) {
      // on ignore latin1 et autres, on force utf-8 pour Hermes
      super('utf-8', options);
    }
  };
}
