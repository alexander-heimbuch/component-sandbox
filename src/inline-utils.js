export function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function safeParse(payload) {
  try {
    const result = isPlainObject(payload) ? payload : JSON.parse(payload);
    return isPlainObject(result) ? result : {};
  } catch (e) {
    return {};
  }
}

export function toMessage({ type, payload, source, transfer: t }) {
  const transfer = typeof t === 'undefined' || t === null ? [] : Array.isArray(t) ? t : [t];
  const message = { ...JSON.parse(JSON.stringify({ type, payload })), source, transfer };
  return { message, transfer };
}

export function createMessageEventListener(port) {
  return (evt, cb, src) => {
    const listener = ({ data }) => {
      const { type, payload, source, transfer } = safeParse(data);
      if (type === evt && (typeof src === 'undefined' || src === source)) {
        cb(payload, { source, transfer });
      }
    };

    port.addEventListener('message', listener, false);

    // Return deregister handler
    return () => port.removeEventListener('message', listener, false);
  };
}
