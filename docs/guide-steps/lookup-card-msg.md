# Implement the Lookup card message handling

The `scryhub.library.lookupCard` requests asks your extension to lookup card availability and price information from a specific store. A library could provide multiple stores, so you'll get a request for the store based on the `key` you defined in the `listStores` response.

The `scryhub.library.lookupCard` operation can seem complicated, so we will walk through it.

At a high level, the request will send the following properties:

* `type`: "scryhub.library.lookupCard"
* `storeKey`: the key you identify this store as
* `descriptor`: An object that gives you information about the card to lookup, with the following properties
  * `name`: name of the card as it is displayed on scryfall
  * `finishTreatments`: an array of treatments for the card to lookup, from `nonfoil` and `foil`, if the card comes in multiple treatments
  * `scryfallTitle`: _if available_ the formatted title of the card, taken from the image of the card
  * `setCode`: _if available_ the magic set code, like "FIN" or "EOE"
  * `collectorNumber`: _if available_ the number within the set code
  * `borderTreatment`: _if available_ the type of border as displayed on scryfall (black/gray/borderless)

Handling the request can be done in multiple ways:

1. If the message did not match what you expect or you ran into an error, return:
```javascript
{
    ok: false, 
    // optional error details
    error: "details why the request failed"
}
```

1. If the message matched what you got and you could process the request, you can respond with a `CardLookupResult` that indicates:
  1. I found 1 or more cards (whether in stock or not)
  1. I looked but found no cards, this is handled as a successful response with an inner 'not found' result.


For a successfully looked but found nothing response, return:

```javascript
{
    // i was able to perform the action
    ok: true,
    // the identifier for your store
    storeKey: 'some-internal-key';
    // did not find it in the store
    result: {
        found: false
    };
}
```

For successful results where you found 1 or more cards, return the information for each card found in inventory in a `FoundCardInformation` object, which will have a similar shape.

```javascript
{
    // i was able to perform the action
    ok: true,
    // the identifier for your store
    storeKey: 'some-internal-key';
    // found something on the store
    result: {
        found: true,
        // info about the cards i found
        cards: [ { 
            // properties here
        }]
    };
}
```

Each `FoundCardInformation` object should have the following properties:

  * `url`: A direct URL that would take a user to purchase this card
  * `title`: The title of the card on the store (if its formatted differently)
  * `price`: _if available_ An object that defines the price of the card
    * `amount`: numeric amount in decimal format `3.99`
    * `currency`: the currency code for the amount
  * `availability`: whether the card is in stock or not, if the store does not have enough info to detemrine this, return `unknown`
  * `finishTreatment`: the treatment finish on the card, `foil` or `nonfoil`
  * `match`: how close the search matches the required card, if you were able to match by set and number and believe its the exact version, return `exact` , if you think it matches by name but it may be a different version, return `loose`. 
    * ScryHub believes that users are trying to find a card based on what it does and not necessarily what set it came from, so it decorates the result based on this qualification.

Successful responses expect a `CardLookupResult` object which determines whether:

1. The card can be found at the store (it may exist but be out of stock temporarily)
2. The price of the card at the store
3. If it is out of stock or not


The response to the `scryhub.library.lookupCard` message can return either a success or error response.

If you're returning an error, respond with:

```javascript
{
    ok: false, 
    // optional error details
    error: "details why the request failed"
}
```

If you're returning a success, respond with a `CardLookupResult` and the following properties:
```javascript
{
    ok: true,
    // the identifier for your store
    storeKey: 'some-internal-key';
    // data for the lookup operation, not finding a card can still be considered successful
    result: CardLookupResult;
}
```

The `CardLookupResult` object indicates whether the card was found at the store or not, and if it was found, what information the store has.

It can either be:

* `found`: `false`
  * for times when the card isn't even listed on the store

* `found`: `true`
  * when the card is listed on the store, regardless of availability
* `card`: More details about the card
  * `url`: A direct URL that would take a user to purchase this card
  * `title`: The title of the card on the store (if its formatted differently)
  * `price`: _if available_ An object that defines the price of the card
    * `amount`: numeric amount in decimal format `3.99`
    * `currency`: the currency code for the amount
  * `availability`: whether the card is in stock or not, if the store does not have enough info to detemrine this, return `unknown`

Possible responses you may have can be:

```javascript
{
    ok: true,
    storeKey: 'some-internal-key';
    // did not find it in the store
    result: {
        found: false
    };
}
```

```javascript
{
    ok: true,
    storeKey: 'some-internal-key';
    // did not find it in the store
    result: {
        found: true,
        card: {
            url: 'http://buyithere/thecard.html',
            title: 'the card you looked for',
            price: { amount: 3.99, currency: 'eur' },
            availability: 'in_stock'
        }
    };
}
```

Your updated `background.js` may look something like this:

1. Make an `async` function that will lookup the card from your store
  1. Here is where you would call an API or get data from the store in some fashion
```javascript
async function lookupCardFromSite(cardSearch) {
    const name = cardSearch.scryfallTitle || cardSearch.name;
    return {
        found: true,
        card: {
            title: name,
            url: 'https://github.com/AnEmortalKid/scryhub',
            price: {
                amount: 0.99,
                currency: 'USD'
            },
            availability: "in_stock"
        }
    }
}
```
2. Update the listener to call this function based on message type
```javascript
    if(msg?.type === MSG_LOOKUP_CARD) {
        console.log('[Sample Library]', 'Looking up card');
        lookupCardFromSite(msg.descriptor).then((cardInfo) => {
            sendResponse(
                {ok: true, storeKey: sampleStore.key, result:cardInfo }
            );
        });
    }
```

The full version can be found here:
```javascript
// Take this from the docs / protocol package in case it changes
const MSG_LIST_STORES = "scryhub.library.listStores";
const MSG_LOOKUP_CARD = "scryhub.library.lookupCard";

const sampleStore = {
    key: 'sample-lgs-provider',
    name: 'Sample LGS Provider'
}

async function lookupCardFromSite(cardSearch) {
    return {
        found: true,
        card: {
            title: cardSearch.name,
            url: 'https://github.com/AnEmortalKid/scryhub',
            price: {
                amount: 0.99,
                currency: 'usd'
            },
            availability: "in_stock"
        }
    }
}

chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
    if(msg?.type === MSG_LIST_STORES) {
         console.log('[Sample Library]', 'Listing Stores');
         sendResponse({
            ok: true, stores: [sampleStore]
         });
    }

    if(msg?.type === MSG_LOOKUP_CARD) {
        console.log('[Sample Library]', 'Looking up card');
        lookupCardFromSite(msg.descriptor).then((cardInfo) => {
            sendResponse(
                {ok: true, storeKey: sampleStore.key, result:cardInfo }
            );
        });
    }

    // keep the channel open for the async call
    return true;
}); 
```

Test it out via the following:

1. Load your extension as an `unpacked` extension
2. Select the `service worker` for `ScryHub` via "Inspect Views, service worker"
3. Run this in the developer console
```javascript
const libraryId = "<your extension id from the page>";
chrome.runtime.sendMessage(libraryId, 
{ 
    type: "scryhub.library.lookupCard", 
    storeKey: "sample-lgs-provider", 
    descriptor: { 
        name: "Bello, Bard of the Brambles",
        setCode: "BLC",
        collectorNumber: "1",
        scryfallTitle: "Bello, Bard of the Brambles (Bloomburrow Commander #1)",
        borderTreatment: "border-borderless"
    }
}, 
console.log);
```

You should see it print the card info!