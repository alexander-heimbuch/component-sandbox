/* global getTargetOrigin safeParse*/
import 'script-loader!./inline-utils';

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

export const sendMessage = win => ({ type, payload, source }) => {
  if (!win) {
    console.warn(`not initialized, can't send message`, { type, payload });
    return;
  }

  const message = JSON.stringify({ type, payload, source });
  win.postMessage(message, getTargetOrigin(win.origin));
};

export const createListener = (win, iframe) => (evt, cb, src) => {
  if (!win) {
    console.warn(`not initialized, can't register listener for '${evt}'`);
    return;
  }

  win.addEventListener('message', ({ origin, data, source: eventSource }) => {
    if (origin !== win.origin || eventSource !== iframe.contentWindow) {
      return;
    }

    const { type, payload, source } = safeParse(data);
    if (type === evt && (typeof src === 'undefined' || src === source)) {
      cb(payload, source);
    }
  });
};
