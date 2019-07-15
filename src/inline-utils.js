export const ComponentSandbox = (() => {
  function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function safeParse(payload) {
    try {
      const result = isPlainObject(payload) ? payload : JSON.parse(payload);
      return isPlainObject(result) ? result : {};
    } catch (e) {
      return {};
    }
  }

  function toMessage({ type, payload, source, transfer: t, callback }) {
    const transfer = typeof t === 'undefined' || t === null ? [] : Array.isArray(t) ? t : [t];
    const message = { ...JSON.parse(JSON.stringify({ type, payload, callback })), source, transfer };
    return { message, transfer };
  }

  function createMessageEventListener(port) {
    return (evt, cb, src) => {
      const listener = ({ data }) => {
        const { type, payload, source, transfer, callback } = safeParse(data);
        if (type === evt && (typeof src === 'undefined' || src === source)) {
          cb(payload, { source, transfer, callback });
        }
      };

      port.addEventListener('message', listener, false);

      // Return deregister handler
      return () => port.removeEventListener('message', listener, false);
    };
  }

  return {
    createMessageEventListener,
    isPlainObject,
    safeParse,
    toMessage
  };
})();
