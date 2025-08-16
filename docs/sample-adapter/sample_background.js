

const MSG_LIST_STORES = "scryhub.adapter.listStores";
const MSG_LOOKUP = "scryhub.adapter.lookup";

const supportedStores = [
    {
        id: 'scryhub-sample-store', name: 'Scryhub Sample Rickroll'
    }
]

/**
 * @typedef {Object} Money
 * @property {number} amount
 * @property {string} currency
 */

/**
 * @typedef {Object} LookupResult
 * @property {boolean} found
 *   Whether the lookup succeeded.
 *   - If `false`: no other fields are present.
 *   - If `true`: the `product` field is set.
 * @property {{
 *   title: string,
 *   url: string,
 *   price?: Money,
 *   availability?: ("in_stock"|"out_of_stock"|"unknown")
 * }} [product]
 *   Product details (only present when `found === true`).
 */


/**
 * This is where you'd do your logic on a site/store api to lookup data about the card
 * @param {string} cardName the name of the card
 * @param {*} opts any options passed in
 * @return {LookupResult} a lookup result
 */
async function lookupCard(cardName, opts) {
    console.log('[ScryHub Sample]', 'Lookup: ', cardName);
    return {
        found: true,
        product: {
            title: 'Rick Astley - '+ cardName,
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            price: {
                amount: 3.99,
                currency: 'usd'
            },
            availability: "in_stock"
        }
    }
}


chrome.runtime.onMessageExternal.addListener((msg, _sender, sendResponse) => {
    (async () => {

        if (msg?.type === MSG_LIST_STORES) {
            console.log('[ScryHub Sample]', 'listing stores.');
            sendResponse({
                ok: true,
                stores: supportedStores
            });
            return;
        }

        if (msg?.type === MSG_LOOKUP) {
            // these keys should be here
            const { storeKey, cardName, opts } = msg;

            try {
                const result = await lookupCard(cardName, opts);
                // answer with the store that we "looked up" the card in
                sendResponse({ ok: true, result, storeMeta: storeKey });
            } catch (e) {
                sendResponse({ ok: false, error: String(e) });
            }
            return;
        }

    })();


    /**
     * We use an async IIFE to make chrome wait and return a quick response
     */
    return true;
});