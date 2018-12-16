/* global describe it expect beforeEach afterEach */
import sandbox from 'component-sandbox'
import { getWindow, getDocument } from 'component-sandbox/utils'

describe('component-sandbox', () => {
  let testSandbox
  let testbed
  let frame

  beforeEach(() => {
    testSandbox = sinon.createSandbox()
    testSandbox.stub(console, 'warn')
    testbed = document.getElementById('testbed')
    frame = sandbox.frame()
    testbed.appendChild(frame)
  })

  afterEach(() => {
    testSandbox.restore()
    while(testbed.firstChild && testbed.removeChild(testbed.firstChild));
  })

  describe('interface', () => {
    it('should export a frame function', () => {
      expect(typeof sandbox.frame).to.equal('function')
    })

    it('should export a init function', () => {
      expect(typeof sandbox.init).to.equal('function')
    })
  })

  describe('frame', () => {
    it('should create a frame node', () => {
      expect(sandbox.frame().tagName).to.equal('IFRAME')
    })

    describe('attributes', () => {
      const defaultAttributes = {
        'min-width': '100%',
        seamless: '',
        scrolling: 'no',
        frameborder: '0'
      }

      Object.keys(defaultAttributes).forEach(attribute => {
        it(`should add default attribute ${attribute}`, () => {
          expect(sandbox.frame().getAttribute(attribute)).to.equal(defaultAttributes[attribute])
        })
      })

      it('should add custom attributes when provided', () => {
        expect(sandbox.frame({ height: '100px' }).getAttribute('height')).to.equal('100px')
      })
    })

    describe('styles', () => {
      it(`shouldn't add styles by default`, () => {
        expect(sandbox.frame().style.width).to.equal('')
      })

      it(`should add custom styles`, () => {
        expect(sandbox.frame({}, { width: '100%' }).style.width).to.equal('100%')
      })
    })
  })

  describe('init', () => {
    describe('sandbox defaults', () => {
      it(`sets the document type to html`, done => {
        sandbox.init(frame).then(({ node }) => {
          expect(getDocument(node).doctype.name).to.equal('html')
          done()
        })
      })

      it(`sets the charset to utf8`, done => {
        sandbox.init(frame).then(({ node }) => {
          const result = getDocument(node).querySelectorAll('meta[charset="utf-8"]')

          expect(result.length).to.equal(1)
          done()
        })
      })

      it(`applies reset styles`, done => {
        sandbox.init(frame).then(({ node }) => {
          const style = getDocument(node).querySelectorAll('style')

          expect(style.length).to.equal(1)
          done()
        })
      })
    })

    describe(`parent api`, () => {
      it(`requires an iframe that is appended to the dom`, () => {
        sandbox.init()
        expect(console.warn).to.have.been.calledWith('initialised iframe is required')
      })

      it(`returns the initialized sandbox node in a promise`, () => {
        sandbox.init(frame).then(({ node }) => {
          expect(node.tagName).to.equal('IFRAME')
          done()
        })
      })

      it(`returns the event listener in a promise`, () => {
        sandbox.init(frame).then(({ listen }) => {
          expect(typeof listen).to.equal('function')
          done()
        })
      })

      it(`returns the event emitter in a promise`, () => {
        sandbox.init(frame).then(({ emit }) => {
          expect(typeof emit).to.equal('function')
          done()
        })
      })
    })

    describe(`sandbox api`, () => {
      it(`defines a listen function on sandbox scope`, done => {
        sandbox.init(frame).then(({ node }) => {
          const win = getWindow(node)

          expect(typeof win.listen).to.equal('function')
          done()
        })
      })

      it(`defines an emit function on sandbox scope`, done => {
        sandbox.init(frame).then(({ node }) => {
          const win = getWindow(node)

          expect(typeof win.emit).to.equal('function')
          done()
        })
      })

      it(`defines an error function on sandbox scope`, done => {
        sandbox.init(frame).then(({ node }) => {
          const win = getWindow(node)

          expect(typeof win.onError).to.equal('function')
          done()
        })
      })
    })

    describe(`resizing`, () => {
      it(`sets the frame node to it's content`, (done) => {
        sandbox.init(frame, { content: '<div style="height: 100px"></div>' }).then(({ node }) => {
          expect(node.offsetHeight).to.equal(100)
          done()
        })
      })

      it(`resizes the frame if it's content changes`, (done) => {
        sandbox.init(frame, { content: '<div id="test-node"></div>' }).then(({ node }) => {
          const testNode = getDocument(frame).getElementById('test-node')

          testNode.style.height = '100px'

          setTimeout(() => {
            expect(node.offsetHeight).to.equal(100)
            done()
          }, 50)
        })
      })

      it(`provides an resize handler`, (done) => {
        let calls = 0

        sandbox.init(frame, { content: '<div id="test-node"></div>', onResize: ({ height }) => {
          calls = calls + 1

          if (calls === 1) {
            expect(height).to.equal('0')
          } else {
            expect(height).to.equal('100')
            done()
          }
        }}).then(({ node }) => {
          const testNode = getDocument(node).getElementById('test-node')
          testNode.style.height = '100px'
        })
      })
    })
  })

  describe('messaging', () => {
    it('communicating with the sandbox', done => {
      sandbox.init(frame, { content: `
        <script>
          listen('ping', function () {
            emit({ type: 'pong', payload: 'some foo' })
          })
        </script>
      ` }).then(({ listen, emit }) => {
        listen('pong', (payload) => {
          expect(payload).to.equal(payload)
          done()
        })

        emit({ type: 'ping' })
      })
    })

    it('can send objects as payloads', () => {
      sandbox.init(frame, { content: `
        <script>
          listen('ping', function (payload) {
            emit({ type: 'pong', payload: payload })
          })
        </script>
      ` }).then(({ listen, emit }) => {
        const message = { some: 'payload' }

        listen('pong', (payload) => {
          expect(payload).to.equal(message)
          done()
        })

        emit({ type: 'ping', payload: message })
      })
    })
  })

  describe('error handling', () => {
    it('has a hook to add a custom error handler', (done) => {
      sandbox.init(frame, { content: `
        <script>
          throw new Error('foo')
        </script>
      ` , onError: (error) => {
        expect(error).to.equal('Uncaught Error: foo')
        done()
      }})
    })
  })

  describe('content location', () => {
    it(`sets the base url to "." if nothing is provided`, (done) => {
      sandbox.init(frame).then(({ node }) => {
        const [ base ] = getDocument(node).querySelectorAll('base')
        expect(base.getAttribute('href')).to.equal('.')
        done()
      })
    })

    it(`sets the base url to a custom value if provided`, (done) => {
      sandbox.init(frame, { baseUrl: 'http://foo.bar' }).then(({ node }) => {
        const [ base ] = getDocument(node).querySelectorAll('base')
        expect(base.getAttribute('href')).to.equal('http://foo.bar')
        done()
      })
    })
  })
})
