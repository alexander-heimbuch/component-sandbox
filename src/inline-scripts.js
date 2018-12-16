window.onerror = function (msg, url, lineNo, columnNo, error) {
  onError(msg, url, lineNo, columnNo, error)
  return true
}

Object.defineProperty(window, 'onerror', {
  configurable: false,
  writable: false
})

Object.defineProperty(window, 'listen', {
  configurable: false,
  writable: false,
  enumerable: false,
  value: (evt, cb) => {
    if (!window) {
      console.warn(`not initialized, can't register listener for '${evt}'`)
      return
    }

    window.addEventListener('message', ({ data }) => {
      try {
        const { type, payload } = JSON.parse(data)

        if (type === evt) {
          cb(payload)
        }
      } catch (e) {}
    })
  }
})

Object.defineProperty(window, 'emit', {
  configurable: false,
  writable: false,
  enumerable: false,
  value: ({ type, payload }) => {
    if (!window) {
      console.warn(`not initialized, can't send message`, { type, payload })
      return
    }

    try {
      const message = JSON.stringify({ type, payload })
      window.postMessage(message, '*')
    } catch (e) {}
  }
})
