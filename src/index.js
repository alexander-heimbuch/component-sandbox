import { defaultAttributes, defaultStyles } from './defaults';

import { createIframe, warn } from './utils';
import { registerIframeResizer, sandboxContent, charset, base, resizer, resetStyle, iframeApi } from './sandbox';

const frame = (attributes = defaultAttributes, styles = defaultStyles) => createIframe({ attributes, styles });

const init = (iframe, content = '', { baseUrl } = {}) =>
  new Promise(resolve => {
    if (!iframe || !iframe.contentWindow) {
      warn(`initialised iframe is required`);
      return;
    }

    // Verify `sandbox` attribute if available
    const sandboxAttr = iframe.getAttribute('sandbox') || '';
    if (sandboxAttr.indexOf('allow-scripts') === -1) {
      warn(`sandbox restriction 'allow-scripts' needs to be set`);

      // Force availability of the `allow-scripts` sandbox restriction
      const sandboxRestrictions = sandboxAttr.trim().split(' ');
      sandboxRestrictions.push('allow-scripts');
      iframe.setAttribute('sandbox', sandboxRestrictions.join(' ').trim());
    }

    // Register the sandbox if the iframe was registered
    registerIframeResizer({ iframe, resolve });

    sandboxContent({
      iframe,
      head: `${charset()}
      ${base(baseUrl)}
      ${resetStyle()}
      ${iframeApi()}`,
      body: `${content}
      ${resizer()}`
    });
  });

export default { frame, init };
