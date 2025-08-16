# Adapters

Implementation notes to make your own adapter to lookup cards at your local game store!


An _adapter_ is just a Chrome Extension with a background worker that handles RPC style messages with ScryHub.

Your adapter knows how to search your local game store (whether it be an API, or you're html scraping), ScryHub
will simply ask you to search for a card on it's behalf. 


At a minimum, your adapter must implement 2 messages:


## scryhub.adapter.listStores

The `scryhub.adapter.listStores` request is used to tell ScryHub what store's your adapter can lookup information in.

You should respond with metadata about at least 1 game store your adapter can handle:

* `id`: a unique identifier across your extension you use to distinguish this store
* `name`: A human displayed name for the store , most likely your Local Game Store
* TODO others

* Called when an extension is first registered with ScryHub


TODO sample handler

## scryhub.adapter.lookup

The `scryhub.adapter.lookup` is used to lookup availability and pricing information for a particular card, at a given store.

TODO request, response

```
export type LookupResult =
  | { found: false }
  | {
      found: true;
      product: {
        title: string;
        url: string;
        price?: Money;
        availability?: "in_stock" | "out_of_stock" | "unknown";
      };
    };
```