# Implement the List Stores Message

The `scryhub.library.listStores` request asks your extension for an array of `Store` references.

The request for `scryhub.library.listStores` will send an object with the following properties:

* `type`: "scryhub.library.listStores"

The response to the `scryhub.library.listStores` message can return either a success or error response.

A successful response should return the following properties:

* `ok`: `true` - the request succeeded
* `stores`: An array of store objects with specific keys.

Each `Store` object must have the following properties:

* `key`: a unique identifier within your library to distinguish it from other stores, within your library
* `name`: A human displayable name to identify this store, this will show up under the ScryHub section

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
    // array of stores you support, can be empty if they're disabled on your end
    stores: [
        {
            key: 'some-internal-key',
            name: 'a friendly name',
        }
    ]
}
```

`ScryHub` will send a request via the Chrome messaging system, so you must handle things in `chrome.runtime.onMessageExternal`.

Your updated `background.js` may look something like this:

```javascript
// Take this from the docs / protocol package in case it changes
const MSG_GET_PROTOCOL = "scryhub.library.protocolCheck";
const MSG_LIST_STORES = "scryhub.library.listStores";

const protocolVersion = "0.1.0";

const sampleStore = {
    key: 'sample-lgs-provider',
    name: 'Sample LGS Provider'
}

chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
     if(msg?.type === MSG_GET_PROTOCOL) {
         console.log('[Sample Library]', 'Protocol Check');
         sendResponse({
            ok: true, protocolVersion: protocolVersion
         });
    }
    
    if(msg?.type === MSG_LIST_STORES) {
         console.log('[Sample Library]', 'Listing Stores');
         sendResponse({
            ok: true, stores: [sampleStore]
         });
    }

    // keep the channel open for sendResponse
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
chrome.runtime.sendMessage(libraryId, { type: "scryhub.library.listStores" }, console.log);
```

You should see it print the store!