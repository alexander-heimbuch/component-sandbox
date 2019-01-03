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

export function warn(message, ...optionalParams) {
  console.warn(`component-sandbox: ${message}`, ...optionalParams);
}

export function listeners() {
  let listenerId = 0;
  const listeners = {};

  return {
    execute: data => {
      const { type, payload, source } = safeParse(data);
      Object.values(listeners).forEach(({ evt, cb, src }) => {
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
