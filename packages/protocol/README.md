# @scryhub/protocol

Defines the RPC protocol for the **ScryHub** Chrome extension to communicate with extensions that implement an **LGSLibrary** (Local Game Store Library).

This package exports the TypeScript types and message contracts that both Core and Library extensions use to talk to each other.

See [ScryHub](https://github.com/AnEmortalKid/scryhub) for more details about the overall project.


---

## Install

```bash
npm install @scryhub/protocol
```

## Example Usage

In your extension's background/service worker

```typescript
import type { CardLookupDescriptor, CardLookupResp } from "@scryhub/protocol";

chrome.runtime.onMessageExternal.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "scryhub.library.lookupCard") {
    const descriptor: CardLookupDescriptor = msg.descriptor;
    // …do lookup work…
    const resp: CardLookupResp = {
      storeKey: "my-store",
      found: true,
      cards: [{ title: "Example", url: "https://…" }]
    };
    sendResponse(resp);
  }
});
```

## Intended Audience

* **ScryHub Core** uses this package to validate messages and version checks
* **LGSLibrary Authors** use this package to implement the correct message types and response shapes


## License

MIT