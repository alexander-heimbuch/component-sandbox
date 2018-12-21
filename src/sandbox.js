import iframeResizerContent from 'base64-inline-loader!iframe-resizer/js/iframeResizer.contentWindow.min.js';
import InlineUtils from 'base64-inline-loader!babel-loader?{"presets":["@babel/preset-env"]}!./inline-utils';
import InlineScripts from 'base64-inline-loader!babel-loader?{"presets":["@babel/preset-env"]}!./inline-scripts';
import { iframeResizer } from 'iframe-resizer';

import { createListener, guid, sendMessage } from './utils';

export const charset = () => '<meta charset="utf-8">';
export const base = baseUrl => `<base href="${baseUrl || '.'}">`;
export const resizer = () => `<script src="${iframeResizerContent}"></script>`;
export const resetStyle = () => `<style>
body, html {
  padding: 0;
  margin: 0;
}
</style>`;

export const iframeApi = () => `<script type="text/javascript" src="${InlineUtils}"></script>
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
        emit({ type: 'SYN' });
        resolve({ node: iframe, listen, emit });
      },
      resizedCallback: ({ height, width }) => {
        emit({
          type: 'ECHO',
          payload: {
            type: 'resize',
            payload: { height, width }
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
    iframe.setAttribute('src', `data:text/html;charset=utf-8,${iframeContent}`);
  }
};
