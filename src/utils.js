export { createMessageEventListener } from './inline-utils';

export function warn(message, ...optionalParams) {
  console.warn(`component-sandbox: ${message}`, ...optionalParams);
}

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
