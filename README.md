# component-sandbox

JavaScript Component Sandbox based on [iFrameResizer](https://github.com/davidjbradshaw/iframe-resizer) with adaptive height and messaging abstraction.

The goal of this project is to create a secure sandbox around UI components to support a seamless integration of custom components/code inside a host application. The sandbox internally uses the [iFrameResizer](https://github.com/davidjbradshaw/iframe-resizer) to automatically resize the IFrame whenever a mutation of the sandboxed contents is detected.

## Browser Compatibility

The `component-sandbox` has been tested with:

* **IE:** 10 and 11 (older versions won't work due to the internal use of the [Channel Messaging API](https://developer.mozilla.org/en-US/docs/Web/API/Channel_Messaging_API))
* **Edge:** 13 - 18
* **Chrome:** 26 - 71
* **Firefox:** 41 - 64
* **Safari:** 8 - 12
* **Opera:** 56 and 57

This given browser matrix doesn't mean that the code isn't compatible with earlier browser versions, it just means that we weren't able to test it in earlier versions so far.

## Security

Every sandboxed IFrame mandatorily gets initialised with the [`sandbox` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-sandbox) in place. Also the availability of the `allow-scripts` restriction lift is required and enforced. Besides that you are free to lift all other sandbox restrictions if required for your use case, including the `allow-same-origin` restriction.

**Exception:** As usual Internet Explorer 10 and 11 require some special treatment as unfortunately cross-domain communication is [broken in IE](https://caniuse.com/#feat=x-doc-messaging) since the very beginning and got fixed in Edge only. For us this means that for these legacy browsers we need to weaken the sandbox by lifting the `allow-same-domain` restriction mandatorily. This is the bullet we have to bite in order to get the inter-frame communication to run in these browsers.

## Inter-Frame Communication

The `component-sandbox` establishes a simple pub/sub communication channel between the host and the sandbox via globally available `listen` and `emit` functions. The [Channel Messaging API](https://developer.mozilla.org/en-US/docs/Web/API/Channel_Messaging_API) is used under the hood to directly communicate between the host window and the sandboxed IFrame's `contentWindow`. As described [here](https://developer.mozilla.org/en-US/docs/Web/API/Channel_Messaging_API/Using_channel_messaging), the [`Window.postMessage()` API](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) is utilized to establish the direct connection.

## Installation

```bash
npm install component-sandbox --save
```

or

```bash
yarn add component-sandbox
```

## Usage

1. Import the component-sandbox lib

```javascript
import sandbox from 'component-sandbox';
```

2. Create a IFrame node and attach it to the document

```javascript
// helper with base attributes for IFrame, you can also create an IFrame node by yourself
const frame = sandbox.frame();

document.body.appendChild(frame);
```

3. Initialise the sandbox

```javascript
// Any valid html markup can be used, content is injected into the IFrame body
sandbox.init(frame, `<script>
  listen('ping', function (payload) {
    console.log('ping', payload);
    emit({ type: 'pong', payload: { outer: 'payload' } });
  });
</script>`).then(({ emit, listen, node }) => {
  listen('pong', (payload) => {
    console.log('pong', payload);
  });

  emit({ type: 'ping', payload: { inner: 'payload' } });
})
```

**Note**

The `init` method returns an [`HTMLIFrameElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLIFrameElement). Usually this element is the original IFrame element that got passed to the method as the first argument. But under certain circumstances a clone of the original IFrame element is returned that was used internally to replace the existing (already attached) IFrame element. The reason for this behavior are several sanity checks inside the `init` method that are required to ensure the availability of the `sandbox` attribute and the compatibility with legacy browsers (like IE 10 and 11). Once the original IFrame is attached to the DOM, changes to the `sandbox` attribute aren't reflected anymore, so we need to replace the original IFrame with a slightly modified clone in order to make the whole `component-sandbox` work.

**TL;DR**

In order to prevent subtle issues that in the worst case only occur in certain legacy browsers, the safest way is to always store and use the `HTMLIFrameElement` that gets passed as `node` property once the `init` method's returned promise gets resolved.
 
## API

### Frame Creation

```javascript
/**
 * attributes:  Object => List of attributes to be added to the IFrame
 * styles:      Object => List of inline styles to be added to the IFrame
 * 
 * returns IFrame node
 */
sandbox.create(attributes?, styles?)
```

### Sandbox initialization

```javascript
/**
 * iframe:   Node => IFrame node that is already appended to the document
 * content:  String => HTML markup injected into the sandbox body
 * options:  Object => { baseUrl: '.' } custom meta attributes for the sandbox
 * returns Promise<{node, listen, emit}>
 */
sandbox.init(iframe, content?, options?).then(({ node, listen, emit }) => {})
```

### Messaging

To communicate between the parent and the sandbox a messaging API is available. The `listen` and `emit` methods to communicate from the parent to the sandbox are available in the resolved `sandbox.init` call. Inside the sandbox the `emit` and `listen` methods are available on the global scope.

```javascript
emit({ type: String, payload: any, source?: any})
```

```javascript
listen(type: String, callback: (payload: any, source?: any) => void , source?: any)
```

## Default Events

Some default events for different use cases are available on the parent API:

### Frame Resizing

This event is called after the IFrame resized. Passes in a message data object containing the `height`, `width` and the `type` of the event that triggered the IFrame to resize.

```javascript
listen('SBX:RESIZE', ({ width, height, type }) => {})
```

### Error Handling

```javascript
listen('SBX:ERROR', ({ msg, url, lineNo, columnNo, error }) => {})
```
