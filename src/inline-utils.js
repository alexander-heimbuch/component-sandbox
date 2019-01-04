export function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/* eslint-disable-next-line */
export function safeParse(payload) {
  try {
    const result = JSON.parse(payload);
    return isPlainObject(result) ? result : {};
  } catch (e) {
    return {};
  }
}

export function listeners() {
  let listenerId = 0;
  const listeners = {};

  return {
    execute: data => {
      const { type, payload, source } = safeParse(data);
      const keys = Object.keys(listeners); // Prevent use of `Object.values` here to shim-free keep support for IE11
      keys.forEach(key => {
        const { evt, cb, src } = listeners[key];
        if (type === evt && (typeof src === 'undefined' || src === source)) {
          cb(payload, source);
        }
      });
    },
    add: (evt, cb, src) => {
      const id = listenerId++;
      listeners[id] = { evt, cb, src };

      return () => {
        delete listeners[id];
      };
    }
  };
}
