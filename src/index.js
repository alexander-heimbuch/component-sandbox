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

    // Verify `sandbox` attribute
    const hasSandboxAttr = iframe.hasAttribute('sandbox');
    if (!hasSandboxAttr) {
      warn(`attribute 'sandbox' needs to be present at given IFrame element`);
    }

    const sandboxAttr = iframe.getAttribute('sandbox') || '';
    const missingSandboxRestrictions = [];

    // Verify availability of the `allow-scripts` sandbox restriction lift
    if (sandboxAttr.indexOf('allow-scripts') === -1) {
      missingSandboxRestrictions.push('allow-scripts');
      warn(`sandbox restriction lift 'allow-scripts' needs to be set`);
    }

    // Verify availability of the `allow-same-origin` sandbox restriction lift in legacy IE browsers
    // @see https://caniuse.com/#feat=x-doc-messaging
    // @see https://stackoverflow.com/questions/16226924/is-cross-origin-postmessage-broken-in-ie10
    const isIE = document.documentMode === 10 || document.documentMode === 11;
    if (isIE && sandboxAttr.indexOf('allow-same-origin') === -1) {
      missingSandboxRestrictions.push('allow-same-origin');
      warn(`discouraged sandbox restriction lift 'allow-same-origin' needed to be set in order to support legacy IE browser`);
    }

    if (missingSandboxRestrictions.length > 0) {
      const sandboxRestrictions = sandboxAttr.trim().split(' ');
      const clonedIframe = iframe.cloneNode(true);
      clonedIframe.setAttribute('sandbox', [...sandboxRestrictions, ...missingSandboxRestrictions].join(' ').trim());
      iframe.parentElement.replaceChild(clonedIframe, iframe);
      iframe = clonedIframe;
    }

    // Register the `iframeResizer` once the IFrame is registered
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
