import sandbox from 'component-sandbox';

const frame = sandbox.frame();

window.addEventListener('load', () => {
  frame.className = 'example';

  document.body.appendChild(frame);

  sandbox
    .init(
      frame,
      `<div id="foo" style="width: 100px; height: 100px; transition: all 500ms;"></div>
    <script>
      const foo = document.getElementById('foo')
      listen('set-size', (size) => {
        foo.style.height = size
        foo.style.width = size
      })

      listen('set-color', (color) => {
        foo.style.backgroundColor = color
      })
      </script>
    `,
      { baseUrl: 'http://todomvc.com/' }
    )
    .then(({ listen, emit }) => {
      listen('error', console.log);
      listen('resize', console.log);

      setInterval(() => {
        emit({ type: 'set-color', payload: '#' + ((Math.random() * 0xffffff) << 0).toString(16) });
      }, 1500);

      setInterval(() => {
        emit({ type: 'set-size', payload: `${Math.floor(Math.random() * 500) + 50}px` });
      }, 3000);
    });
});
