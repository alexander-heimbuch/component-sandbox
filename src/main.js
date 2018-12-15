import { defaultAttributes, defaultErrorHandler, defaultResizeHandler, defaultLoadHandler } from './defaults'

import { createIframe } from './utils'
import { registerIframeResizer, sandboxContent, charset, base, resizer, resetStyle, iframeApi, registerErrorHandler } from './sandbox'

export default function ({
  onError = defaultErrorHandler,
  onResize = defaultResizeHandler,
  onLoad = defaultLoadHandler,
  content = '',
  baseUrl,
  attributes = defaultAttributes,
} = {}) {
  const iframe = createIframe(attributes)

  // Register the sandbox if the iframe was registered
  iframe.addEventListener('DOMNodeInserted', () => {
    registerIframeResizer({ iframe, onLoad, onResize })
    registerErrorHandler({ iframe, onError })

    sandboxContent({ iframe, content: `
      <head>
        ${charset()}
        ${base(baseUrl)}
        ${resetStyle()}
      </head>
      <body>
        ${iframeApi()}
        ${resizer()}
        ${content}
      </body>
    `})
  }, false)

  return iframe
}
