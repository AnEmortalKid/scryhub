// Take this from the docs / protocol package in case it changes
const MSG_LIST_STORES = "scryhub.library.listStores";
const MSG_LOOKUP_CARD = "scryhub.library.lookupCard";

const sampleStore = {
    key: 'sample-lgs-provider',
    name: 'Sample LGS Provider'
}

/**
 * Looks up the card at your given store, this may make use of an API or HTML Scraping,
 * the implementation is up to you!
 * 
 * @param {Object} cardSearch an object containing a name, set code, collector number
 * @returns whether the card is found, and the details if so
 */
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

    // keep the channel open for sendResponse
    return true;
}); 