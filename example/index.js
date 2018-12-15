import sandbox from 'component-sandbox'

const onLoad = (iframe) => {
  // iframe.window.document.documentElement.addEventListener('foo', () => console.log('bar'))
  iframe.listen('foo', () => {
    console.log('a message from inside')
  })

  iframe.emit({ type: 'foo' })
}

const example = sandbox({
  content: `
    <script>
      console.log('loaded iframe')
      listen('foo', () => {
        console.log('a message from outside')

        emit({ type: 'foo' })
      })
    </script>
  `,
  baseUrl: 'http://todomvc.com/',
  onError: () => console.log('error'),
  onLoad,
  onAction: (action) => console.log('action', action),
  onResize: console.log,
  listeners: {
    foo: () => console.log('a default listener!')
  }
})

window.addEventListener('load', () => {
  example.className = 'example'
  document.body.appendChild(example)
})

