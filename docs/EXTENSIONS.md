# Extensions

`ScryHub` expects _other_ chrome extensions to be responsible for looking up information from a store, for a few reasons:

1. Trying to manage a large inventory of stores could get unwieldy quickly
2. Supporting new stores could become the bottleneck for usage

`ScryHub` was designed to let _anyone_ implement an `LGSLibrary` that provides info for their local game store. 

:robot: With the availability of AI tools, it should be possible to get ChatGPT to generate a chrome extension and get you data
for your preferred store, provided they have a web storefront.


## LGS Library

A [Chrome Extension](https://developer.chrome.com/docs/extensions) that uses the [Message Passing](https://developer.chrome.com/docs/extensions/develop/concepts/messaging) system to return data to `ScryHub`.


An `LGSLibrary` communicates with its set of `LGSProvider`'s to retrieve purchase information for an MTG Card, from a particular "Local Game Store".

The library has two responsibilities:

1. Tell `ScryHub` what `LGSProvider`(s) this library can get information for
2. Retrieve information from a specific `LGSProvider` when `ScryHub` requests it

`ScryHub` will communicate using the `chrome.runtime.sendMessage` protocol and send direct RPC calls to your Library.

## LGS Provider

An implementation of a class/function that can take a search request for an MTG Card and return:

* Whether the card is available at a given store
* What the price for the card is at that store.

Each provider is responsible for looking up information from a single store. You can think of the logic somewhat like this.

```javascript
class MyLgsProvider {
    /**
     * Retrieves purchasing info for the given card from a specific store
     * 
     * This would use an API, or web scraping from your local game store to find:
     * - if the card is available at the store (in stock or out of stock)
     * - the price for the card
     */
    async function lookupCard(descriptor) {
        const cardName = descriptor.name;
        return {
                found: true,
                card: {
                    title: cardName,
                    url: 'linkToBuyHere',
                    price: {
                        amount: 0.99,
                        currency: 'USD'
                    },
                    availability: "in_stock"
                }
        };
    }
}
```

See [Make Your Own Extension](./guide-steps/README.md) for steps on how to make and use your own.