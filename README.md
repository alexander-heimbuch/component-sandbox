# component-sandbox

JavaScript Component Sandbox based on [iFrameResizer](https://github.com/davidjbradshaw/iframe-resizer) with adaptive height and messaging abstraction.

The goal of this project is to create a secure sandbox around UI components to support a seamless integration of custom components/code inside a host application. The sandbox internally uses the [iFrameResizer](https://github.com/davidjbradshaw/iframe-resizer) to automatically resize the iFrame whenever a mutation of the sandboxed contents is detected.

Furthermore the Component Sandbox establishes a simple [postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) based pub/sub communication channel between the host and the sandbox via globally registered `listen` and `emit` functions.

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

2. Create a iframe node and attatch it to the document

```javascript
// helper with base attributes for iframe, you can also create an iframe node by yourself
const frame = sandbox.frame();

document.body.appendChild(frame)
```

3. Initialise the sandbox

```javascript
// Any valid html markup can be used, content is injected into the iframe body
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

## API

### Frame Creation

```javascript
/**
 * attributes:  Object => List of attributes to be added to the iframe
 * styles:      Object => List of inline styles to be added to the iframe
 * 
 * returns iframe node
 */
sandbox.create(attributes?, styles?)
```

### Sandbox initialization

```javascript
/**
 * iframe:   Node => iFrame node that is already appended to the document
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

```javascript
listen('resize', ({ width, height }) => {})
```

### Error Handling

```javascript
listen('error', ({ msg, url, lineNo, columnNo, error }) => {})
```
