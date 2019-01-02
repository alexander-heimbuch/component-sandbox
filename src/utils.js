import { safeParse, warn } from './inline-utils';

export { warn } from './inline-utils';

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

export const guid = () => {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
};

export const sendMessage = (win, origin) => ({ type, payload, source }) => {
  if (!win) {
    warn(`not initialized, can't send message`, { type, payload });
    return;
  }

  const message = JSON.stringify({ type, payload, source, origin });
  win.postMessage(message, '*');
};

export const createListener = (win, _origin) => (evt, cb, src) => {
  if (!win) {
    warn(`not initialized, can't register listener for '${evt}'`);
    return;
  }

  const listener = ({ data }) => {
    const { type, payload, source, origin } = safeParse(data);
    if (type === evt && origin === _origin && (typeof src === 'undefined' || src === source)) {
      cb(payload, source, origin);
    }
  };

  win.addEventListener('message', listener);

  // Return deregister handler
  return () => win.removeEventListener('message', listener);
};
