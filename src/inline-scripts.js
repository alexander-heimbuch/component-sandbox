let INITIALIZED = false;
const EVENT_BUFFER = [];

const safeParse = payload => {
  try {
    return JSON.parse(payload);
  } catch (e) {
    return {};
  }
};

Object.defineProperty(window, 'listen', {
  configurable: false,
  writable: false,
  enumerable: false,
  value: (evt, cb) => {
    if (!window) {
      console.warn(`not initialized, can't register listener for '${evt}'`);
      return;
    }

    window.addEventListener('message', ({ data }) => {
      const { type, payload } = safeParse(data);

      if (type === evt) {
        cb(payload);
      }
    });
  }
});

Object.defineProperty(window, 'emit', {
  configurable: false,
  writable: false,
  enumerable: false,
  value: ({ type, payload }) => {
    if (!window) {
      console.warn(`not initialized, can't send message`, { type, payload });
      return;
    }

    if (!INITIALIZED) {
      EVENT_BUFFER.push({ type, payload });
      return;
    }

    const message = JSON.stringify({ type, payload });
    window.postMessage(message, '*');
  }
});

window.onerror = function(msg, url, lineNo, columnNo, error) {
  emit({ type: 'error', payload: { msg, url, lineNo, columnNo, error } });
  return true;
};

Object.defineProperty(window, 'onerror', {
  configurable: false,
  writable: false
});

listen('BOOTSTRAP', () => {
  INITIALIZED = true;
  EVENT_BUFFER.forEach(emit);
});

listen('ECHO', ({ type, payload }) => {
  emit({ type, payload });
});
