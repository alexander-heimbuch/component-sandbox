import { defaultAttributes, defaultErrorHandler, defaultResizeHandler } from './defaults'

import { createIframe, getWindow } from './utils'
import { registerIframeResizer, sandboxContent, charset, base, resizer, resetStyle, iframeApi, registerErrorHandler } from './sandbox'

const frame = (attributes = defaultAttributes) => createIframe(attributes)

const init = (iframe, {
  onError = defaultErrorHandler,
  onResize = defaultResizeHandler,
  content = '',
  baseUrl
} = {}) => new Promise(resolve => {
  if (!iframe || !getWindow(iframe)) {
    console.warn(`initialised iframe is needed`)
    return
  }

  // Register the sandbox if the iframe was registered
  registerErrorHandler({ iframe, onError })
  registerIframeResizer({ iframe, onLoad: resolve, onResize })

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

})

export default { frame, init }
