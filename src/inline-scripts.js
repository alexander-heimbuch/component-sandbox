let INITIALIZED = false;
const EVENT_BUFFER = [];

function getTargetOrigin(win) {
  let remoteHost = win.location.origin;
  remoteHost = typeof remoteHost === 'string' ? remoteHost.trim() : null;
  return !remoteHost.trim() || remoteHost.indexOf('file://') === 0 ? '*' : remoteHost;
}

function safeParse(payload) {
  try {
    return JSON.parse(payload);
  } catch (e) {
    return {};
  }
}

Object.defineProperty(window, 'listen', {
  configurable: false,
  writable: false,
  enumerable: false,
  value: (evt, cb) => {
    if (!window) {
      console.warn(`not initialized, can't register listener for '${evt}'`);
      return;
    }

    window.addEventListener('message', ({ origin, data }) => {
      if (origin !== window.parent.location.origin) {
        return;
      }

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
    window.postMessage(message, getTargetOrigin(window.parent));
  }
});

window.onerror = function(msg, url, lineNo, columnNo, error) {
  window.emit({ type: 'error', payload: { msg, url, lineNo, columnNo, error } });
  return true;
};

Object.defineProperty(window, 'onerror', {
  configurable: false,
  writable: false
});

window.listen('BOOTSTRAP', () => {
  INITIALIZED = true;
  EVENT_BUFFER.forEach(window.emit);
});

window.listen('ECHO', ({ type, payload }) => {
  window.emit({ type, payload });
});
