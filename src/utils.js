export { ComponentSandbox } from './inline-utils';

export function warn(message, ...optionalParams) {
  console.warn(`component-sandbox: ${message}`, ...optionalParams);
}

export function setAttributes(el, attrs = {}) {
  Object.keys(attrs).forEach(property => {
    el.setAttribute(property, attrs[property]);
  });

  return el;
}

export function setStyles(el, styles = {}) {
  Object.keys(styles).forEach(property => {
    el.style[property] = styles[property];
  });

  return el;
}

export function createIframe({ attributes, styles }) {
  let iframe = document.createElement('iframe');
  setAttributes(iframe, attributes);
  setStyles(iframe, styles);

  return iframe;
}

export function isString(s) {
  return typeof s === 'string';
}
