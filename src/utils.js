export const setAttributes = (el, attrs = {}) => {
  Object.keys(attrs).forEach(property => {
    el.setAttribute(property, attrs[property]);
  });

  return el;
};

export const setStyles = (el, styles = {}) => {
  Object.keys(styles).forEach(property => {
    el.style[property] = styles[property];
  });

  return el;
};

export const createIframe = ({ attributes, styles }) => {
  let iframe = document.createElement('iframe');
  setAttributes(iframe, attributes);
  setStyles(iframe, styles);

  return iframe;
};

export const getWindow = iframe => iframe.contentWindow;
export const getDocument = iframe => getWindow(iframe).document;
export const safeParse = payload => {
  try {
    return JSON.parse(payload);
  } catch (e) {
    return {};
  }
};

export const getTargetOrigin = win => {
  let remoteHost = win.location.origin;
  remoteHost = typeof remoteHost === 'string' ? remoteHost.trim() : null;
  return !remoteHost.trim() || remoteHost.indexOf('file://') === 0 ? '*' : remoteHost;
};

export const sendMessage = win => ({ type, payload }) => {
  if (!win) {
    console.warn(`not initialized, can't send message`, { type, payload });
    return;
  }

  const message = JSON.stringify({ type, payload });
  win.postMessage(message, getTargetOrigin(win.parent));
};

export const createListener = win => (evt, cb) => {
  if (!win) {
    console.warn(`not initialized, can't register listener for '${evt}'`);
    return;
  }

  win.addEventListener('message', ({ origin, data }) => {
    if (origin !== win.parent.location.origin) {
      return;
    }

    const { type, payload } = safeParse(data);
    if (type === evt) {
      cb(payload);
    }
  });
};
