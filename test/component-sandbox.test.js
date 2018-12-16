/* global describe it expect beforeEach afterEach */
import sandbox from 'component-sandbox'

describe('component-sandbox', () => {
  let testSandbox

  beforeEach(() => {
    testSandbox = sinon.createSandbox()
    testSandbox.stub(console, 'warn')
  })

  afterEach(() => {
    testSandbox.restore()
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
    it(`requires an iframe that is appended to the dom`, () => {
      sandbox.init()
      expect(console.warn).to.have.been.calledWith('initialised iframe is required')
    })
  })
})
