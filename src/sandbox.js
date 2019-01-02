import iframeResizerContent from 'base64-inline-loader!iframe-resizer/js/iframeResizer.contentWindow.min.js';
import InlineUtils from 'base64-inline-loader!babel-loader?{"presets":[["@babel/preset-env", {"modules": "cjs"}]]}!./inline-utils';
import InlineScripts from 'base64-inline-loader!babel-loader?{"presets":[["@babel/preset-env", {"modules": "cjs"}]]}!./inline-scripts';
import { iframeResizer } from 'iframe-resizer';

import { createListener, guid, sendMessage, warn } from './utils';

export const charset = () => '<meta charset="utf-8">';
export const base = baseUrl => `<base href="${baseUrl || '.'}">`;
export const resizer = () => `<script src="${iframeResizerContent}"></script>`;
export const resetStyle = () => `<style>
body, html {
  padding: 0;
  margin: 0;
}
</style>`;

export const iframeApi = () => `<script>var exports = {}; </script>
<script type="text/javascript" src="${InlineUtils}"></script>
<script type="text/javascript" src="${InlineScripts}"></script>`;

export const registerIframeResizer = ({ iframe, resolve }) => {
  const uuid = guid();
  const listen = createListener(window, uuid);
  const emit = sendMessage(iframe.contentWindow, uuid);

  iframeResizer(
    {
      checkOrigin: false,
      log: false,
      initCallback: () => {
        emit({ type: 'SBX:SYN' });
        resolve({ node: iframe, listen, emit });
      },
      resizedCallback: ({ height, width, type }) => {
        emit({
          type: 'SBX:ECHO',
          payload: {
            type: 'SBX:RESIZE',
            payload: { height, width, type }
          }
        });
      }
    },
    iframe
  );
};

export const sandboxContent = ({ iframe, head, body }) => {
  const iframeContent = `<!DOCTYPE html>
<html lang="en">
<head>${head}</head>
<body>${body}</body>
</html>`;

  if ('srcdoc' in document.createElement('iframe')) {
    // Use `srcdoc` attribute in modern browsers
    iframe.setAttribute('srcdoc', iframeContent);
  } else {
    // Provide fallback for legacy browsers
    try {
      iframe.setAttribute('src', `data:text/html;charset=utf-8,${iframeContent}`);
    } catch (e) {
      warn(`cannot initialize component sandbox either due to browser, or Content Security Policy (CSP) compatibility issues`);
    }
  }
};
