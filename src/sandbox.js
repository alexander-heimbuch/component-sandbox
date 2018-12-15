import iframeResizerContent from 'raw-loader!iframe-resizer/js/iframeResizer.contentWindow.min.js'
import { iframeResizer } from 'iframe-resizer'
import { setAttributes } from './utils'

export const createIframe = (attributes) => {
  let iframe = document.createElement('iframe')
  return setAttributes(iframe, attributes)
}

export const bootstrapIframe = (iframe, baseUrl, content = '', onError, onLoad, onResize, listeners) => {
  const sandboxWindow = iframe.contentWindow
  const sandboxDocument = sandboxWindow.document

  const outputListeners = []
  const inputListeners = []

  sandboxWindow.onerror = onError

  Object.keys(listeners).forEach(type => inputListeners.push({
    type,
    cb: listeners[type]
  }))

  sandboxWindow.emit = ({ type, payload }) => outputListeners.forEach(listener => {
    if (listener.type !== type) {
      return
    }

    listener.cb && listener.cb(payload)
  })

  sandboxWindow.listen = (type, cb) => inputListeners.push({ type, cb })

  iframeResizer({
    checkOrigin: false,
    log: false,
    initCallback: () => {
      onLoad({
        node: iframe,
        window: sandboxWindow,
        emit: ({ type, payload }) => {
          inputListeners.forEach(listener => {
            if (listener.type !== type) {
              return
            }

            listener.cb && listener.cb(payload)
          })
        },
        listen: (type, cb) => {
          outputListeners.push({ type, cb })
        }
      })
    },
    resizedCallback: ({ height, width }) => onResize({
      height,
      width,
      node: iframe,
      window: sandboxWindow
    })
  }, iframe)

  const charset = '<meta charset="utf-8"></meta>'
  const base = `<base href="${ baseUrl ? baseUrl : '.' }"></base>`
  const resizer = `<script type="text/javascript">${iframeResizerContent}</script>`
  const resetStyle = `
    <style>
      body, html {
        padding: 0;
        margin: 0;
      }
    </style>
  `

  sandboxDocument.open()
  sandboxDocument.write(`
    <!DOCTYPE html>
    <html>
      <head>
        ${charset}
        ${base}
        ${resetStyle}
      </head>
      <body>
        ${resizer}
        ${content}
      </body>
    </html>
  `)
  sandboxDocument.close()
}
