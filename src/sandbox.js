import iframeResizerContent from 'base64-inline-loader!iframe-resizer/js/iframeResizer.contentWindow.min.js';
import InlineScripts from 'base64-inline-loader!babel-loader?{"presets":["@babel/preset-env"]}!./inline-scripts';
import { iframeResizer } from 'iframe-resizer';

import { sendMessage, createListener, getWindow, getDocument } from './utils';

export const charset = () => '<meta charset="utf-8">';
export const base = baseUrl => `<base href="${baseUrl || '.'}">`;
export const resizer = () => `<script src="${iframeResizerContent}"></script>`;
export const resetStyle = () => `
  <style>
    body, html {
      padding: 0;
      margin: 0;
    }
  </style>
  `;

export const iframeApi = () => `<script type="text/javascript" src="${InlineScripts}"></script>`;

export const parentApi = iframe => {
  const win = getWindow(iframe);

  return {
    emit: sendMessage(win),
    listen: createListener(win)
  };
};

export const registerIframeResizer = ({ iframe, resolve }) => {
  const { listen, emit } = parentApi(iframe);

  iframeResizer(
    {
      checkOrigin: false,
      log: false,
      initCallback: () => {
        emit({ type: 'BOOTSTRAP' });
        resolve({ node: iframe, listen, emit });
      },
      resizedCallback: ({ height, width }) =>
        emit({
          type: 'ECHO',
          payload: {
            type: 'resize',
            payload: { height, width }
          }
        })
    },
    iframe
  );
};

export const sandboxContent = ({ iframe, head, body }) => {
  const doc = getDocument(iframe).cloneNode(true);
  doc.head.insertAdjacentHTML('afterbegin', head);
  doc.body.insertAdjacentHTML('beforeend', body);

  const iframeContent = `<!DOCTYPE html>
${doc.documentElement.innerHTML}`;

  if ('srcdoc' in document.createElement('iframe')) {
    // Use `srcdoc` attribute in modern browsers
    iframe.setAttribute('srcdoc', iframeContent);
  } else {
    // Provide fallback for legacy browsers
    const doc = getDocument(iframe);
    doc.open('text/html');
    doc.write(iframeContent);
    doc.close();
  }
};
