import iframeResizerContent from 'raw-loader!iframe-resizer/js/iframeResizer.contentWindow.min.js'
import InlineScripts from 'raw-loader!babel-loader?{"presets":["@babel/preset-env"]}!./inline-scripts';
import { iframeResizer } from 'iframe-resizer'

import { sendMessage, createListener, getDocument, getWindow } from './utils'

export const charset = () => '<meta charset="utf-8"></meta>'
export const base = (baseUrl) => `<base href="${ baseUrl ? baseUrl : '.' }"></base>`
export const resizer = () => `<script type="text/javascript">${iframeResizerContent}</script>`
export const resetStyle = () => `
  <style>
    body, html {
      padding: 0;
      margin: 0;
    }
  </style>
  `

export const iframeApi = () => `<script>${InlineScripts}</script>`

export const parentApi = (iframe) => {
  const win = getWindow(iframe)

  return {
    emit: sendMessage(win),
    listen: createListener(win)
  }
}


export const registerIframeResizer = ({ iframe, onLoad, onResize }) => {
  const api = parentApi(iframe)

  iframeResizer({
    checkOrigin: false,
    log: false,
    initCallback: () => {
      onLoad({
        node: iframe,
        ...api
      })
    },
    resizedCallback: ({ height, width }) => onResize({
      height,
      width,
      node: iframe
    })
  }, iframe)
}

export const sandboxContent = ({ iframe, content }) => {
  const doc = getDocument(iframe)
  doc.open()
  doc.write(`
    <!DOCTYPE html>
    <html>
      ${content}
    </html>
  `)
  doc.close()
}

export const registerErrorHandler = ({ iframe, onError }) => {
  const win = getWindow(iframe)
  win.onError = onError
}

