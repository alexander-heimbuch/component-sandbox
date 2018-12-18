import { defaultAttributes, defaultStyles } from './defaults';

import { createIframe, getWindow } from './utils';
import { registerIframeResizer, sandboxContent, charset, base, resizer, resetStyle, iframeApi } from './sandbox';

const frame = (attributes = defaultAttributes, styles = defaultStyles) => createIframe({ attributes, styles });

const init = (iframe, content = '', { baseUrl } = {}) =>
  new Promise(resolve => {
    if (!iframe || !getWindow(iframe)) {
      console.warn(`initialised iframe is required`);
      return;
    }

    // Register the sandbox if the iframe was registered
    registerIframeResizer({ iframe, resolve });

    sandboxContent({
      iframe,
      head: `${charset()}
      ${base(baseUrl)}
      ${resetStyle()}
      ${iframeApi()}
      ${resizer()}`,
      body: content
    });
  });

export default { frame, init };
