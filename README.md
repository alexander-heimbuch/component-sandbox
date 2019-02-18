# component-sandbox

JavaScript Component Sandbox based on [`iFrameResizer`](https://github.com/davidjbradshaw/iframe-resizer) with adaptive height and messaging abstraction.

The goal of this project is to create a secure sandbox around UI components to support a seamless integration of custom components/code inside a host application. The sandbox internally uses the [`iFrameResizer`](https://github.com/davidjbradshaw/iframe-resizer) to automatically resize the IFrame whenever a mutation of the sandboxed contents is detected.

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

## Inter-Sandbox Communication

It's possible to define one or more [`Transferable`](https://developer.mozilla.org/en-US/docs/Web/API/Transferable) objects that can be passed via the `emit` and extracted by the `listen` method. Utilizing this feature paves the way for any kind of mediators/services to establish direct connections between several sandboxes.

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
sandbox
  .init(frame, `
<script>
  listen('ping', function (payload) {
    console.log('ping', payload);
    emit({ type: 'pong', payload: { outer: 'payload' } });
  });
</script>`)
  .then(({ node, emit, listen, onDestroy }) => {
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
 * attributes: Object => List of attributes to be added to the IFrame
 * styles:     Object => List of inline styles to be added to the IFrame
 * 
 * returns IFrame node
 */
sandbox.create(attributes?, styles?);
```

### Sandbox initialization

```javascript
/**
 * iframe:  Node => IFrame node that is already appended to the document
 * content: string | { head?: string, body?: string } => HTML markup injected into the sandbox body and/or head
 * options: { baseUrl: string = '.' } => Custom meta attributes for the sandbox
 * returns Promise<{ node, listen, emit, onDestroy }>
 */
sandbox
  .init(iframe, content?, options?)
  .then(({ node, listen, emit, onDestroy }) => {});
```

### Messaging

To communicate between the parent and the sandbox a messaging API is available. The `listen` and `emit` methods to communicate from the parent to the sandbox are available in the resolved `sandbox.init` call. Inside the sandbox the `emit` and `listen` methods are available on the global scope.

```javascript
emit({
  type: string,
  payload: any,
  source?: any,
  transfer?: Transferable | Transferable[]
});
```

```javascript
listen(
  type: string,
  callback: (
    payload: any,
    context?: {
      source?: any,
      transfer?: Transferable[]
    }
  ) => void,
  source?: any
);
```

## Default Events

Some default events for different use cases are available on the parent API:

### Frame Resizing

This event is called after the IFrame resized. Passes in a message data object containing the `height`, `width` and the `type` of the event that triggered the IFrame to resize.

```javascript
/**
 * width:  number => The new width of the IFrame
 * height: number => The new height of the IFrame
 * type:   string => The type of event that triggered the IFrame to resize
 */
listen('SBX:RESIZE', ({ width, height, type }) => { ... });
```

### Frame Focus

The two focus-related events `SBX:FOCUS` and `SBX:BLUR` are called whenever the IFrame either received or lost focus. These events mainly exist for convenience reasons to enable implementors to enhance and align their user experience and accessibility across different browsers. IE and Firefox for instance provide extra tab stops for IFrames, while Chrome and Safari do not. These extra tab stops break the user's expected tab order though.

##### `SBX:FOCUS`

Utilizing the `SBX:FOCUS` event enables implementors to listen to these extra tab stops and instead delegate the focus immediately to a certain focusable element inside the IFrame.

In order to be able to distinguish between a *normal* focus event and one that *most-likely* marks such an extra tab stop, the payload contains a boolean property `isDocumentElement` which is set to `true` if the currently focused element is the IFrame's `documentElement`.

```javascript
/**
 * isDocumentElement: boolean => Whether the currently focused element is the IFrame's documentElement
 */
listen('SBX:FOCUS', ({ isDocumentElement }) => { ... });
```

##### `SBX:BLUR`

This event is the counterpart of the `SBX:FOCUS` event. It can be used to explicitly get notified when an IFrame loses its focus.

```javascript
listen('SBX:BLUR', () => { ... });
```

### Error Handling

The `SBX:ERROR` event essentially passes on the error information as they are caught by a [`window.onerror`](https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onerror) handler that gets registered on the IFrame's `contentWindow`.

By default the `component-sandbox` creates or prepares an IFrame element in a way that it behaves like a cross-origin IFrame, as the default `sandbox` attribute that gets applied to the IFrame element lacks the `allow-same-origin` restriction lift.

So it's important to know that when an error occurs in a script, loaded from a [different origin](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy), the details of the error are not reported to prevent leaking information. Instead the error reported is simply **`"Script error."`**. This behavior can be overriden in some browsers using the [`crossorigin`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#attr-crossorigin) attribute on [`<script>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script) and having the server send the appropriate [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) HTTP response headers. A workaround is to isolate **`"Script error."`** and handle it knowing that the error detail is only viewable in the browser console and not accessible via JavaScript.

```javascript
/**
 * msg:      string => The error message
 * url:      string => URL of the script where the error was raised
 * lineNo:   number => Line number where error was raised
 * columnNo: number => Column number for the line where the error occurred
 * error:    Object => The error object
 */
listen('SBX:ERROR', ({ msg, url, lineNo, columnNo, error }) => { ... });
```

### Component Destruction & Cleanup

Even though the underlying [`iFrameResizer`](https://github.com/davidjbradshaw/iframe-resizer) library is kind of smart and aware of situations where the sandboxed IFrame element gets removed from the host, you cannot fully rely on its built-in detection mechanisms in all possible (dynamic) scenarios. In order to provide an explicit way to tell the sandbox that it's about to be destroyed, an `onDestroy` callback method can be extracted from the `sandbox.init`'s promise response.

The `onDestroy` callback method enables a consumer to explicitly inform the `component-sandbox` that a certain sandbox is about to be destroyed now. Internally this helps the library to deregister certain listeners the [`iFrameResizer`](https://github.com/davidjbradshaw/iframe-resizer) library adds to both the host and the sandboxed IFrame instance and therefore free up resources and prevent possible memory leaks.

```javascript
class MyComponent {
  onInit() {
    sandbox
      .init(frame)
      .then(({ onDestroy }) => {
        this.state.onDestroy = onDestroy;
      });
  }

  onDestroy() {
    this.state.onDestroy();
  }
}
```
