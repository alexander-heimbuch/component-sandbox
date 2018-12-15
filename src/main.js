import { defaultAttributes, defaultErrorHandler, defaultResizeHandler, defaultMessageHandler, defaultLoadHandler } from './defaults'
import { createIframe, bootstrapIframe } from './sandbox'

export default function ({
  onMessage = defaultMessageHandler,
  onError = defaultErrorHandler,
  onResize = defaultResizeHandler,
  onLoad = defaultLoadHandler,
  content = '',
  baseUrl,
  attributes = defaultAttributes,
  listeners = {}
} = {}) {
  const iframe = createIframe(attributes)
  iframe.addEventListener('DOMNodeInserted', () => bootstrapIframe(iframe, baseUrl, content, onError, onLoad, onResize, listeners), false)

  return iframe
}
