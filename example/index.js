import sandbox from 'component-sandbox';

const frame1 = sandbox.frame();
const frame2 = sandbox.frame();

const content = `<div id="foo" style="width: 100px; height: 100px; transition: all 500ms;"></div>
<script>
var foo = document.getElementById('foo');
listen('set-size', function (size) {
  foo.style.height = size;
  foo.style.width = size;
});

listen('set-color', function (color) {
  foo.style.backgroundColor = color;
});
</script>`;

const handler = ({ listen, emit }) => {
  listen('SBX:ERROR', console.log.bind(console));
  listen('SBX:RESIZE', console.log.bind(console));

  setInterval(() => {
    emit({ type: 'set-color', payload: '#' + ((Math.random() * 0xffffff) << 0).toString(16) });
  }, 1500);

  setInterval(() => {
    emit({ type: 'set-size', payload: `${Math.floor(Math.random() * 300) + 50}px` });
  }, 3000);
};

window.addEventListener('load', () => {
  frame1.className = 'example';
  frame2.className = 'example';

  document.body.appendChild(frame1);
  document.body.appendChild(frame2);

  sandbox.init(frame1, content).then(handler);
  sandbox.init(frame2, content).then(handler);
});
