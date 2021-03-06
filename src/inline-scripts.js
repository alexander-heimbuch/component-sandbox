/* global ComponentSandbox */
(() => {
  const { createMessageEventListener, isPlainObject, safeParse, toMessage } = ComponentSandbox;

  let LISTENER_ID = 0;
  let LISTENER_BUFFER = {};
  let LISTENER_DEREGS = {};
  let EVENT_BUFFER = [];
  let CALLBACK_ID = 0;
  let CALLBACK_BUFFER = {};
  let MESSAGE_PORT;
  let MESSAGE_EVENT_LISTENER;

  function subscribe(evt, cb, src) {
    if (!MESSAGE_EVENT_LISTENER) {
      // The message port hasn't been provided yet by the host => Create proxy listener and deregister handler
      const id = LISTENER_ID++;
      LISTENER_BUFFER[id] = { evt, cb, src };
      return () => {
        if (LISTENER_DEREGS && LISTENER_DEREGS[id]) {
          LISTENER_DEREGS[id]();
          delete LISTENER_DEREGS[id];
        }
        if (LISTENER_BUFFER && LISTENER_BUFFER[id]) {
          delete LISTENER_BUFFER[id];
        }
      };
    } else {
      // Register listener and return deregister handler
      return MESSAGE_EVENT_LISTENER(evt, cb, src);
    }
  }

  function emit(obj, cb) {
    if (!MESSAGE_PORT) {
      EVENT_BUFFER.push({ obj, cb });
    } else {
      const { message, transfer } = toMessage(obj);

      let callbackId;
      if (typeof cb === 'function') {
        // Generate a unique callback ID and store the callback in a buffer
        // Pass the callback ID to the recipient/host as part of the message
        callbackId = `c${Date.now()}${++CALLBACK_ID}`;
        CALLBACK_BUFFER[callbackId] = cb;
      }

      MESSAGE_PORT.postMessage(callbackId ? { ...message, callback: callbackId } : message, transfer);
    }
  }

  // Prevent modifications to global `listen`, `subscribe` and `emit`
  Object.defineProperty(window, 'listen', {
    configurable: false,
    writable: false,
    enumerable: false,
    value: subscribe
  });

  Object.defineProperty(window, 'subscribe', {
    configurable: false,
    writable: false,
    enumerable: false,
    value: subscribe
  });

  Object.defineProperty(window, 'emit', {
    configurable: false,
    writable: false,
    enumerable: false,
    value: emit
  });

  // Prevent modifications to global `ComponentSandbox`
  [isPlainObject, safeParse, toMessage, createMessageEventListener].forEach(fn => {
    Object.defineProperty(ComponentSandbox, fn.name, {
      configurable: false,
      writable: false
    });
  });

  Object.defineProperty(window, 'ComponentSandbox', {
    configurable: false,
    writable: false
  });

  function syncEventListener({ data, ports }) {
    const { type } = safeParse(data);
    if (type === 'SBX:SYN' && !MESSAGE_PORT && Array.isArray(ports) && ports[0]) {
      window.removeEventListener('message', syncEventListener, false);

      MESSAGE_PORT = ports[0];
      MESSAGE_EVENT_LISTENER = createMessageEventListener(MESSAGE_PORT);
      MESSAGE_PORT.start();

      // Send `SBX:ACK` event
      window.emit({ type: 'SBX:ACK' });

      // Flush listener buffer
      const keys = Object.keys(LISTENER_BUFFER); // Prevent use of `Object.values` here to shim-free keep support for IE11
      keys.forEach(key => {
        const { evt, cb, src } = LISTENER_BUFFER[key];
        LISTENER_DEREGS[key] = MESSAGE_EVENT_LISTENER(evt, cb, src);
      });

      // Flush event buffer
      EVENT_BUFFER.forEach(({ obj, cb }) => window.emit(obj, cb));

      // Remove buffers
      LISTENER_BUFFER = null;
      EVENT_BUFFER = null;
    }
  }

  function focusEventListener() {
    setTimeout(() => {
      window.emit({
        type: 'SBX:FOCUS',
        payload: {
          isDocumentElement: document.activeElement === document.documentElement
        }
      });
    });
  }

  function blurEventListener() {
    setTimeout(() => {
      window.emit({ type: 'SBX:BLUR' });
    });
  }

  window.addEventListener('message', syncEventListener, false);

  window.addEventListener('focus', focusEventListener, false);

  window.addEventListener('blur', blurEventListener, false);

  window.onerror = (msg, url, lineNo, columnNo, error) => {
    window.emit({ type: 'SBX:ERROR', payload: { msg, url, lineNo, columnNo, error } });
    return true;
  };

  Object.defineProperty(window, 'onerror', {
    configurable: false,
    writable: false
  });

  window.listen('SBX:ECHO', ({ type, payload, source, transfer }) => {
    window.emit({ type, payload, source, transfer });
  });

  window.listen('SBX:CBK', (payload, { callback, source, transfer }) => {
    if (typeof callback === 'string' && CALLBACK_BUFFER[callback]) {
      // Invoke a certain stored callback and remove it immediately after its invocation
      CALLBACK_BUFFER[callback](payload, { source, transfer });
      delete CALLBACK_BUFFER[callback];
    }
  });

  // Remove security relevant properties from the sandboxed `window` object
  function safeDelete(property) {
    try {
      delete window[property];
    } catch (e) {
      // Intentionally empty
    }
  }

  safeDelete('parent');
  safeDelete('top');
  safeDelete('frameElement');
  safeDelete('opener');
})();
