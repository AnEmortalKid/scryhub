# Implement the Check Protocol Message

The `scryhub.library.protocolCheck` request asks your extension for the version of `@scryhub/protocol` it currently supports.

The ScryHub extension tries to support protocol versions that match the `major` version, passivey handle `minor` and `incremental` differences.

The request will send an object with the following properties:

* `type`: "scryhub.library.protocolCheck"

The response to the `scryhub.library.protocolCheck` message can return either a success or error response. A successful response should return an object with the following properties:

* `ok`: `true` - the request succeeded
* `protocolVersion`: the semantic version of the protocol we support, example: `1.2.3`

If you're returning an error, respond with:

```javascript
{
    ok: false, 
    // optional error details
    error: "details why the request failed"
}
```

If you're returning a success, respond with:
```javascript
{
    ok: true,
    // what protocol you support
    protocolVersion: '1.1.2'
}
```

`ScryHub` will send a request via the Chrome messaging system, so you must handle things in `chrome.runtime.onMessageExternal`.

Your initial `background.js` may look something like this:

```javascript
// Take this from the docs / protocol package in case it changes
const MSG_GET_PROTOCOL = "scryhub.library.protocolCheck";

const protocolVersion = "0.1.0";

chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
    if(msg?.type === MSG_GET_PROTOCOL) {
         console.log('[Sample Library]', 'Protocol Check');
         sendResponse({
            ok: true, protocolVersion: protocolVersion
         });
    }

    // keep the channel open for an async call, it is not needed for the protocol response
    return true;
}); 
```

Test it out via the following:

1. Load your extension as an `unpacked` extension
2. Select the `service worker` for `ScryHub` via "Inspect Views, service worker"
  1. You must use the `ScryHub` service worker since it is an external message and that extension is allowed to send messages to yours.
3. Run this in the developer console
```javascript
const libraryId = "<your extension id from the page>";
chrome.runtime.sendMessage(libraryId, { type: "scryhub.library.protocolCheck" }, console.log);
```

You should see it print the protocol version!