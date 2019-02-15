import iframeResizerContent from 'base64-inline-loader!iframe-resizer/js/iframeResizer.contentWindow.min.js';
import InlineUtils from 'base64-inline-loader!babel-loader?{"presets":[["@babel/preset-env", {"modules": "cjs"}]]}!./inline-utils';
import InlineScripts from 'base64-inline-loader!babel-loader?{"presets":[["@babel/preset-env", {"modules": "cjs"}]]}!./inline-scripts';
import { iframeResizer } from 'iframe-resizer';

import { createMessageEventListener, toMessage } from './utils';

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
  channel.port1.start();

  const emit = obj => {
    const { message, transfer } = toMessage(obj);
    channel.port1.postMessage(message, transfer);
  };

  iframeResizer(
    {
      checkOrigin: false,
      log: false,
      initCallback: () => {
        const listen = createMessageEventListener(channel.port1);
        const onDestroy = () => {
          const instance = iframe.iFrameResizer;
          instance && instance.removeListeners();
        };

        const data = { type: 'SBX:SYN' };
        iframe.contentWindow.postMessage(JSON.stringify(data), '*', [channel.port2]);
        resolve({ node: iframe, listen, emit, onDestroy });
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

export const sandboxContentFallback = (iframe, html, rand) => {
  const scriptContent = `<script>
function messageHandler(event) {
  var data = event.data;
  var token = '${rand}::';
  if (typeof data === 'string' && data.indexOf(token) === 0) {
    window.removeEventListener('message', messageHandler, false);
    document.write(data.substr(token.length));
    document.close();
  }
}

window.addEventListener('message', messageHandler, false);
</script>`;

  const iFrameLoadHandler = () => {
    iframe.removeEventListener('load', iFrameLoadHandler);
    iframe.contentWindow.postMessage(`${rand}::${html}`, '*');
  };
  iframe.addEventListener('load', iFrameLoadHandler);
  iframe.setAttribute('src', `data:text/html;charset=utf-8,${scriptContent}`);
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
    // Fallback for legacy browsers
    try {
      // First try if there is direct access to the IFrame's `contentDocument`
      const doc = iframe.contentDocument;
      doc.open();
      doc.write(iframeContent);
      doc.close();
    } catch (e) {
      // Most-likely issues due to existing `sandbox` attribute, or Content Security Policy (CSP) incompatibility
      // Provide last resort fallback using the `Window.postMessage()` API
      const rand = Math.random() * 1000;
      sandboxContentFallback(iframe, iframeContent, rand);
    }
  }
};
