/* global sinon describe it expect beforeEach afterEach */
import sandbox from 'component-sandbox';

function allowSameOrigin(iframe) {
  const sandboxAttr = iframe.getAttribute('sandbox') || '';
  const sandboxRestrictions = sandboxAttr.trim().split(' ');
  sandboxRestrictions.push('allow-same-origin');
  iframe.setAttribute('sandbox', sandboxRestrictions.join(' ').trim());
}

function getDocument(iframe) {
  return iframe.contentWindow.document;
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
      const defaultAttributes = {
        'min-width': '100%',
        seamless: '',
        scrolling: 'no',
        frameborder: '0'
      };

      Object.keys(defaultAttributes).forEach(attribute => {
        it(`should add default attribute ${attribute}`, () => {
          expect(sandbox.frame().getAttribute(attribute)).to.equal(defaultAttributes[attribute]);
        });
      });

      it('should add custom attributes when provided', () => {
        expect(sandbox.frame({ height: '100px' }).getAttribute('height')).to.equal('100px');
      });
    });

    describe('styles', () => {
      it(`shouldn't add styles by default`, () => {
        expect(sandbox.frame().style.width).to.equal('');
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
          done();
        });
      });

      it(`sets the charset to utf8`, done => {
        allowSameOrigin(frame);
        sandbox.init(frame).then(({ node }) => {
          const result = getDocument(node).querySelectorAll('meta[charset="utf-8"]');

          expect(result.length).to.equal(1);
          done();
        });
      });

      it(`applies reset styles`, done => {
        allowSameOrigin(frame);
        sandbox.init(frame).then(({ node }) => {
          const style = getDocument(node).querySelectorAll('style');

          expect(style.length).to.equal(1);
          done();
        });
      });
    });

    describe(`parent api`, () => {
      it(`requires an iframe that is appended to the DOM`, () => {
        sandbox.init();
        expect(console.warn).to.have.been.calledWith('component-sandbox: initialized iframe is required');
      });

      it(`returns the initialized sandbox node in a promise`, done => {
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
              listen('ping', function () {
                emit({ type: 'pong', payload: 'some foo' })
              })
            </script>
        `
        )
        .then(({ listen, emit }) => {
          listen('pong', payload => {
            expect(payload).to.equal(payload);
            done();
          });
          emit({ type: 'ping' });
        });
    });

    it('can send objects as payloads', done => {
      sandbox
        .init(
          frame,
          `
        <script>
          listen('ping', function (payload) {
            emit({ type: 'pong', payload: payload })
          })
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
          listen('ping', function (payload, source) {
            emit({ type: 'pong', payload: payload + 10, source: source })
          }, 'foo')
          listen('ping', function (payload, source) {
            emit({ type: 'pong', payload: payload + 100, source: source })
          }, 'bar')
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
          listen('ping', function (payload) {
            emit({ type: 'pong', payload: payload + 10 })
          });
          listen('from2', function () {
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
          listen('ping', function (payload) {
            emit({ type: 'pong', payload: payload + 100 })
          });
          listen('from1', function () {
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
  });
});
