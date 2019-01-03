import iframeResizerContent from 'base64-inline-loader!iframe-resizer/js/iframeResizer.contentWindow.min.js';
import InlineUtils from 'base64-inline-loader!babel-loader?{"presets":[["@babel/preset-env", {"modules": "cjs"}]]}!./inline-utils';
import InlineScripts from 'base64-inline-loader!babel-loader?{"presets":[["@babel/preset-env", {"modules": "cjs"}]]}!./inline-scripts';
import { iframeResizer } from 'iframe-resizer';

import { listeners, warn } from './utils';

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
  const channel = new MessageChannel();
  const l = listeners();
  channel.port1.onmessage = ({ data }) => l.execute(data);

  const listen = (evt, cb, src) => {
    // Register listener and return deregister handler
    return l.add(evt, cb, src);
  };
  const emit = ({ type, payload, source }) => {
    channel.port1.postMessage(JSON.stringify({ type, payload, source }));
  };

  iframeResizer(
    {
      checkOrigin: false,
      log: false,
      initCallback: () => {
        const data = { type: 'SBX:SYN' };
        iframe.contentWindow.postMessage(JSON.stringify(data), '*', [channel.port2]);
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
      warn(`cannot initialise component sandbox due to browser or Content Security Policy (CSP) compatibility issues`);
    }
  }
};
