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

export function createMessageEventListener(port) {
  return (evt, cb, src) => {
    const listener = ({ data }) => {
      const { type, payload, source } = safeParse(data);
      if (type === evt && (typeof src === 'undefined' || src === source)) {
        cb(payload, source);
      }
    };

    port.addEventListener('message', listener, false);

    // Return deregister handler
    return () => port.removeEventListener('message', listener, false);
  };
}
