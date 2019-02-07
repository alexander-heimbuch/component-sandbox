/* global sinon describe it expect beforeEach afterEach */
import sandbox from 'component-sandbox';
import { createMessageEventListener } from '../src/utils';
import { defaultAttributes, defaultStyles } from '../src/defaults';

function allowSameOrigin(iframe) {
  const sandboxAttr = iframe.getAttribute('sandbox') || '';
  const sandboxRestrictions = sandboxAttr.trim().split(' ');
  sandboxRestrictions.push('allow-same-origin');
  iframe.setAttribute('sandbox', sandboxRestrictions.join(' ').trim());
}

function disallowScripts(iframe) {
  const sandboxAttr = iframe.getAttribute('sandbox') || '';
  const sandboxRestrictions = sandboxAttr
    .trim()
    .split(' ')
    .filter(restriction => restriction !== 'allow-scripts');
  iframe.setAttribute('sandbox', sandboxRestrictions.join(' ').trim());
}

function getDocument(iframe) {
  return iframe.contentDocument;
}

describe('component-sandbox', () => {
  let testSandbox;
  let testbed;
  let frame;

  beforeEach(() => {
    testSandbox = sinon.createSandbox();
    testSandbox.stub(console, 'warn');
    testbed = document.getElementById('testbed');
    frame = sandbox.frame();
    testbed.appendChild(frame);
  });

  afterEach(() => {
    testSandbox.restore();
    while (testbed.firstChild && testbed.removeChild(testbed.firstChild));
  });

  describe('interface', () => {
    it(`should export a 'frame' function`, () => {
      expect(typeof sandbox.frame).to.equal('function');
    });

    it(`should export an 'init' function`, () => {
      expect(typeof sandbox.init).to.equal('function');
    });
  });

  describe('frame', () => {
    it('should create a frame node', () => {
      expect(sandbox.frame().tagName).to.equal('IFRAME');
    });

    describe('attributes', () => {
      Object.keys(defaultAttributes).forEach(attribute => {
        it(`should add default attribute '${attribute}'`, () => {
          expect(sandbox.frame().getAttribute(attribute)).to.equal(defaultAttributes[attribute]);
        });
      });

      it('should add custom attributes when provided', () => {
        expect(sandbox.frame({ height: '100px' }).getAttribute('height')).to.equal('100px');
      });
    });

    describe('styles', () => {
      Object.keys(defaultStyles).forEach(key => {
        it(`should add default style '${key}'`, () => {
          expect(sandbox.frame().style[key]).to.equal(defaultStyles[key]);
        });
      });

      it(`should add custom styles`, () => {
        expect(sandbox.frame({}, { width: '100%' }).style.width).to.equal('100%');
      });
    });
  });

  describe('init', () => {
    describe('sandbox defaults', () => {
      it(`sets the document type to html`, done => {
        allowSameOrigin(frame);
        sandbox.init(frame).then(({ node }) => {
          expect(getDocument(node).doctype.name).to.equal('html');
          expect(node).to.equal(frame);
          done();
        });
      });

      it(`sets the charset to utf8`, done => {
        allowSameOrigin(frame);
        sandbox.init(frame).then(({ node }) => {
          const result = getDocument(node).querySelectorAll('meta[charset="utf-8"]');
          expect(result.length).to.equal(1);
          expect(node).to.equal(frame);
          done();
        });
      });

      it(`applies reset styles`, done => {
        allowSameOrigin(frame);
        sandbox.init(frame).then(({ node }) => {
          const style = getDocument(node).querySelectorAll('style');
          expect(style.length).to.equal(1);
          expect(node).to.equal(frame);
          done();
        });
      });

      it(`applies the 'allow-scripts' sandbox restriction lift`, done => {
        allowSameOrigin(frame);
        disallowScripts(frame);

        sandbox.init(frame).then(({ node }) => {
          expect(node).not.to.equal(frame);
          expect(node.getAttribute('sandbox')).to.contain('allow-scripts');
          done();
        });
      });

      it(`applies the 'allow-same-origin' sandbox restriction lift`, done => {
        // Mimic an IE 10
        const hasDocumentMode = 'documentMode' in document;
        const documentMode = document.documentMode;
        document.documentMode = 10;

        sandbox.init(frame).then(({ node }) => {
          hasDocumentMode ? (document.documentMode = documentMode) : delete document.documentMode;

          expect(node).not.to.equal(frame);
          expect(node.getAttribute('sandbox')).to.contain('allow-same-origin');
          done();
        });
      });
    });

    describe(`parent api`, () => {
      it(`requires an iframe passed as first argument`, () => {
        sandbox.init();
        expect(console.warn).to.have.been.calledWith('component-sandbox: initialised iframe is required');
      });

      it(`requires an iframe that is appended to the DOM`, () => {
        sandbox.init(document.createElement('iframe'));
        expect(console.warn).to.have.been.calledWith('component-sandbox: initialised iframe is required');
      });

      it(`requires an iframe that has a 'sandbox' attribute set`, () => {
        const iframe = document.createElement('iframe');
        testbed.appendChild(iframe);

        sandbox.init(iframe);
        expect(console.warn).to.have.been.calledWith(`component-sandbox: attribute 'sandbox' needs to be present at given IFrame element`);
      });

      it(`returns the initialised sandbox node in a promise`, done => {
        sandbox.init(frame).then(({ node }) => {
          expect(node.tagName).to.equal('IFRAME');
          done();
        });
      });

      it(`returns the event listener in a promise`, done => {
        sandbox.init(frame).then(({ listen }) => {
          expect(typeof listen).to.equal('function');
          done();
        });
      });

      it(`returns the event emitter in a promise`, done => {
        sandbox.init(frame).then(({ emit }) => {
          expect(typeof emit).to.equal('function');
          done();
        });
      });
    });

    describe(`sandbox api`, () => {
      it(`defines a 'listen' function on sandbox scope`, done => {
        allowSameOrigin(frame);

        sandbox.init(frame).then(({ node }) => {
          expect(typeof node.contentWindow.listen).to.equal('function');
          done();
        });
      });

      it(`sandboxes the 'listen' function on sandbox scope`, done => {
        sandbox.init(frame).then(({ node }) => {
          expect(() => node.contentWindow.listen).to.throw();
          done();
        });
      });

      it(`defines an 'emit' function on sandbox scope`, done => {
        allowSameOrigin(frame);

        sandbox.init(frame).then(({ node }) => {
          expect(typeof node.contentWindow.emit).to.equal('function');
          done();
        });
      });

      it(`sandboxes the 'emit' function on sandbox scope`, done => {
        sandbox.init(frame).then(({ node }) => {
          expect(() => node.contentWindow.emit).to.throw();
          done();
        });
      });
    });

    describe(`resizing`, () => {
      it(`sets the frame node to its content`, done => {
        sandbox.init(frame, '<div style="height: 100px"></div>').then(({ node }) => {
          expect(node.offsetHeight).to.equal(100);
          done();
        });
      });

      it(`resizes the frame if its content changes`, done => {
        let testCount = 0;

        allowSameOrigin(frame);

        sandbox.init(frame, '<div id="test-node"></div>').then(({ node, listen }) => {
          const testNode = getDocument(frame).getElementById('test-node');

          listen('SBX:RESIZE', () => {
            testCount = testCount + 1;

            if (testCount === 1) {
              expect(node.offsetHeight).to.equal(0);
            }

            if (testCount === 2) {
              expect(node.offsetHeight).to.equal(100);
              done();
            }
          });

          testNode.style.height = '100px';
        });
      });
    });
  });

  describe('messaging', () => {
    it('communicating with the sandbox', done => {
      sandbox
        .init(
          frame,
          `
            <script>
              listen('ping', payload => {
                emit({ type: 'pong', payload });
              });
            </script>
        `
        )
        .then(({ listen, emit }) => {
          let counter = 0;
          listen('pong', payload => {
            counter++;
            expect(payload).to.equal(`ping${counter}`);
          });
          listen('done', () => {
            expect(counter).to.equal(2);
            done();
          });

          emit({ type: 'ping', payload: 'ping1' });
          emit({ type: 'ping', payload: 'ping2' });
          emit({
            type: 'SBX:ECHO',
            payload: {
              type: 'done'
            }
          });
        });
    });

    it('can pass Transferable objects through the communication channel', done => {
      sandbox
        .init(
          frame,
          `
            <script>
              listen('ping', (payload, { source, transfer }) => {
                if (payload === 'ping1') {
                  transfer[0].postMessage({ type: 'pong', payload });
                } else {
                  emit({ type: 'pong', payload, transfer });
                }
              });
            </script>
        `
        )
        .then(({ listen, emit }) => {
          const channel = new MessageChannel();
          channel.port1.start();
          channel.port2.start();

          const listenChannel = createMessageEventListener(channel.port1);
          const transferData = { foo: 'foo', sub: { bar: 'bar' }, num: 666 };
          const uint8Array = new TextEncoder().encode(JSON.stringify(transferData));

          listenChannel('pong', payload => {
            expect(payload).to.equal(`ping1`);
            emit({ type: 'ping', payload: 'ping2', transfer: [uint8Array.buffer] });
          });

          listen('pong', (payload, { transfer }) => {
            expect(payload).to.equal(`ping2`);
            expect(transfer).to.be.an('array');
            expect(transfer).to.have.lengthOf(1);

            const data = new TextDecoder('utf-8').decode(transfer[0]);
            expect(data).to.equal(JSON.stringify(transferData));

            emit({
              type: 'SBX:ECHO',
              payload: {
                type: 'done'
              }
            });
          });

          listen('done', () => {
            done();
          });

          emit({ type: 'ping', payload: 'ping1', transfer: [channel.port2] });
        });
    });

    it('provides deregistration handlers for event listeners on the host', done => {
      sandbox
        .init(
          frame,
          `
            <script>
              listen('ping', () => {
                emit({ type: 'pong' });
              });
            </script>
        `
        )
        .then(({ listen, emit }) => {
          let counter = 0;
          const deregFn = listen('pong', () => {
            deregFn(); // First invocation triggers deregistration
            counter++;
          });

          listen('done', () => {
            expect(counter).to.equal(1);
            done();
          });

          emit({ type: 'ping' });
          emit({ type: 'ping' });

          emit({
            type: 'SBX:ECHO',
            payload: {
              type: 'done'
            }
          });
        });
    });

    it('provides deregistration handlers for event listeners inside the sandboxed contentWindow', done => {
      sandbox
        .init(
          frame,
          `
            <script>
              let counter = 0;
              const deregFn = listen('ping', () => {
                deregFn(); // First invocation triggers deregistration
                counter++;
              });
              listen('done', () => {
                emit({ type: 'done', payload: counter });
              });
            </script>
        `
        )
        .then(({ listen, emit }) => {
          listen('done', payload => {
            expect(payload).to.equal(1);
            done();
          });

          emit({ type: 'ping' });
          emit({ type: 'ping' });
          emit({ type: 'done' });
        });
    });

    it('can send objects as payloads', done => {
      sandbox
        .init(
          frame,
          `
        <script>
          listen('ping', (payload) => {
            emit({ type: 'pong', payload: payload })
          });
        </script>
      `
        )
        .then(({ listen, emit }) => {
          const message = { some: 'payload' };

          listen('pong', payload => {
            expect(payload).to.deep.equal(message);
            done();
          });

          emit({ type: 'ping', payload: message });
        });
    });

    it(`can send sourced events`, done => {
      sandbox
        .init(
          frame,
          `
        <script>
          listen('ping', (payload, { source }) => {
            emit({ type: 'pong', payload: payload + 10, source: source })
          }, 'foo');
          listen('ping', (payload, { source }) => {
            emit({ type: 'pong', payload: payload + 100, source: source })
          }, 'bar');
        </script>
      `
        )
        .then(({ listen, emit }) => {
          listen(
            'pong',
            payload => {
              expect(payload).to.equal(10);
            },
            'foo'
          );
          listen(
            'pong',
            payload => {
              expect(payload).to.equal(100);
              done();
            },
            'bar'
          );

          emit({ type: 'ping', payload: 0, source: 'foo' });
          emit({ type: 'ping', payload: 0, source: 'bar' });
        });
    });

    it(`can only send messages between dedicated parents and children`, done => {
      const frame2 = sandbox.frame();
      testbed.appendChild(frame2);

      const promise1 = new Promise(resolve => {
        sandbox
          .init(
            frame,
            `
        <script>
          listen('ping', (payload) => {
            emit({ type: 'pong', payload: payload + 10 })
          });
          listen('from2', () => {
            throw new Error('unexpected');
          });
        </script>
      `
          )
          .then(({ listen, emit }) => {
            listen('pong', payload => {
              expect(payload).to.equal(10);
              resolve();
            });

            emit({ type: 'from1' });
            emit({ type: 'ping', payload: 0 });
          });
      });

      const promise2 = new Promise(resolve => {
        sandbox
          .init(
            frame2,
            `
        <script>
          listen('ping', (payload) => {
            emit({ type: 'pong', payload: payload + 100 })
          });
          listen('from1', () => {
            throw new Error('unexpected');
          });
        </script>
      `
          )
          .then(({ listen, emit }) => {
            listen('pong', payload => {
              expect(payload).to.equal(100);
              resolve();
            });

            emit({ type: 'from2' });
            emit({ type: 'ping', payload: 0 });
          });
      });

      Promise.all([promise1, promise2]).then(() => done());
    });
  });

  describe('content location', () => {
    it(`sets the base url to '.' if nothing is provided`, done => {
      allowSameOrigin(frame);
      sandbox.init(frame).then(({ node }) => {
        const [base] = getDocument(node).querySelectorAll('base');
        expect(base.getAttribute('href')).to.equal('.');
        done();
      });
    });

    it(`sets the base url to a custom value if provided`, done => {
      allowSameOrigin(frame);
      sandbox.init(frame, '', { baseUrl: 'http://foo.bar' }).then(({ node }) => {
        const [base] = getDocument(node).querySelectorAll('base');
        expect(base.getAttribute('href')).to.equal('http://foo.bar');
        done();
      });
    });
  });

  describe('events', () => {
    describe('SBX:ERROR', () => {
      it('fires an error event in root scope', done => {
        sandbox.init(frame, `<script>throw new Error('my-custom-test-error')</script>`).then(({ listen }) => {
          listen('SBX:ERROR', ({ msg }) => {
            expect(msg).to.have.string('my-custom-test-error');
            done();
          });
        });
      });

      it('fires an error event in a sub scope', done => {
        sandbox
          .init(
            frame,
            `<script>
          listen('ping', () => {
            throw new Error('my-custom-test-error')
          })
        </script>`
          )
          .then(({ listen, emit }) => {
            listen('SBX:ERROR', ({ msg }) => {
              expect(msg).to.have.string('my-custom-test-error');
              done();
            });

            emit({ type: 'ping' });
          });
      });
    });

    describe('SBX:RESIZE', () => {
      it('fires a resize event on init', done => {
        sandbox.init(frame, '<div style="height: 100px;"></div>').then(({ listen }) => {
          listen('SBX:RESIZE', ({ height, type }) => {
            expect(height).to.equal('100');
            expect(type).to.equal('init');
            done();
          });
        });
      });

      it('fires a resize event when the size changes', done => {
        sandbox
          .init(
            frame,
            `
          <div style="height: 100px;" id="test"></div>
          <script>
            listen('ping', () => {
              document.getElementById('test').style.height = '500px';
            });
          </script>
        `
          )
          .then(({ listen, emit }) => {
            let testCount = 0;

            listen('SBX:RESIZE', ({ height, type }) => {
              testCount = testCount + 1;
              if (testCount === 1) {
                expect(height).to.equal('100');
                expect(type).to.equal('init');
              }

              if (testCount === 2) {
                expect(height).to.equal('500');
                expect(type).to.equal('mutationObserver');
                done();
              }
            });

            emit({ type: 'ping' });
          });
      });
    });

    describe('SBX:FOCUS', () => {
      it(`fires a focus event if an element inside the IFrame received the focus`, done => {
        sandbox
          .init(
            frame,
            `
<input type="text">
<script>
listen('focus', () => {
  document.querySelector('input').focus();
});
</script>
`
          )
          .then(({ listen, emit }) => {
            listen('SBX:FOCUS', ({ isDocumentElement }) => {
              expect(isDocumentElement).to.equal(false);
              done();
            });

            emit({ type: 'focus' });
          });
      });

      it(`fires a focus event if the IFrame's "documentElement" received the focus`, done => {
        sandbox
          .init(
            frame,
            `
<script>
// Force the 'document.activeElement' to equal the 'document.documentElement'
Object.defineProperty(document, 'activeElement', {
  get: () => document.documentElement,
});
</script>
`
          )
          .then(({ listen }) => {
            listen('SBX:FOCUS', ({ isDocumentElement }) => {
              expect(isDocumentElement).to.equal(true);
              done();
            });

            frame.contentWindow.focus();
          });
      });
    });

    describe('SBX:BLUR', () => {
      it(`fires a focus event when the IFrame loses the focus`, done => {
        // Add a button to the testbed to have a focusable element outside the IFrame
        const buttonEl = document.createElement('button');
        buttonEl.setAttribute('tabindex', 0);
        buttonEl.innerText = 'Outside Button';
        testbed.appendChild(buttonEl);

        sandbox.init(frame).then(({ listen }) => {
          listen('SBX:FOCUS', () => buttonEl.focus());
          listen('SBX:BLUR', () => done());

          frame.contentWindow.focus();
        });
      });
    });
  });
});
