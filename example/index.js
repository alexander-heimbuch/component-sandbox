import sandbox from 'component-sandbox'

const example = sandbox({
  content: `
  <script>
      listen('fromParent', () => {
        console.log('a message from outside')
        emit({ type: 'fromIframe' })
      })
    </script>
  `,
  baseUrl: 'http://todomvc.com/',
  onError: console.warn,
  onAction: (action) => console.log('action', action),
  onResize: console.log,
  onLoad: ({ emit, listen }) => {
    listen('fromIframe', () => {
      console.log('a message from inside')
    })

    emit({ type: 'fromParent' })
  }
})

window.addEventListener('load', () => {
  example.className = 'example'

  document.body.appendChild(example)
})

