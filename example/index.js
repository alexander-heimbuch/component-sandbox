import sandbox from 'component-sandbox'

const frame = sandbox.frame()

window.addEventListener('load', () => {
  frame.className = 'example'

  document.body.appendChild(frame)

  sandbox.init(frame, {
    content: `
    <script>
        listen('ping', () => {
          console.log('ping')
          emit({ type: 'pong' })
        })
      </script>
    `,
    baseUrl: 'http://todomvc.com/',
    onError: console.warn,
    onResize: console.log
  }).then(({ listen, emit }) => {
    listen('pong', () => {
      console.log('pong')
    })
    emit({ type: 'ping' })
  })
})

