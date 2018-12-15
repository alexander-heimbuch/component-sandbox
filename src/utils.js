export const setAttributes = (el, attrs = {}) => {
  Object.keys(attrs).forEach(property => {
    el.setAttribute(property, attrs[property])
  })

  return el
}

export const createScript = (content = '') => {
  const script = document.createElement('script')
  script.text = content
}

export const createIframe = (attributes) => {
  let iframe = document.createElement('iframe')
  return setAttributes(iframe, attributes)
}

export const getWindow = iframe => iframe.contentWindow

export const getDocument = iframe => getWindow(iframe).document

export const sendMessage = win => ({ type, payload }) => {
  if (!win) {
    console.warn(`not initialized, can't send message`, { type, payload })
    return
  }

  try {
    const message = JSON.stringify({ type, payload })
    win.postMessage(message, '*')
  } catch (e) {}
}

export const createListener = win => (evt, cb) => {
  if (!win) {
    console.warn(`not initialized, can't register listener for '${evt}'`)
    return
  }

  win.addEventListener('message', ({ data }) => {
    try {
      const { type, payload } = JSON.parse(data)

      if (type === evt) {
        cb(payload)
      }
    } catch (e) {}
  })
}
