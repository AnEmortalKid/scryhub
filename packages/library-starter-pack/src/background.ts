import { CardLookupRequest, CardLookupResponse, ListStoresResponse, MSG_LIST_STORES, MSG_LOOKUP, MSG_PROTOCOL_CHECK, PROTOCOL_VERSION, ProtocolCheckResponse, StoreMeta } from "@scryhub/protocol";
import { createLogger } from "./logger/factory";
import { StarCityGamesHandler } from "./stores/starcity-games";
import { StoreHandler } from "./stores/store-handler";

const logger = createLogger('[background]');

const handledProtocol = PROTOCOL_VERSION;


const storeHandlers: StoreHandler[] = [
    new StarCityGamesHandler()
];

// create a lookup map and an array for list stores
const handlersByStoreKey: Record<string, StoreHandler> = {}

const supportedStores: StoreMeta[] = storeHandlers.map(sh => sh.meta)

storeHandlers.forEach(sh => {
    handlersByStoreKey[sh.meta.key] = sh
});


function handleCheckProtocol(): ProtocolCheckResponse {
    logger.log('Protocol Check');
    const checkResponse: ProtocolCheckResponse = {
        ok: true, protocolVersion: handledProtocol
    }
    return checkResponse;
}

function handleListStores(): ListStoresResponse {
    logger.log('List Stores');

    const listResponse: ListStoresResponse = {
        ok: true, stores: supportedStores
    }
    return listResponse;
}

async function handleLookupCard(request: CardLookupRequest): Promise<CardLookupResponse> {
    logger.log('Lookup Card', 'store=' + request.storeKey, ' card name=\"' + request.descriptor.name + '\"');


    const handler = handlersByStoreKey[request.storeKey];
    if (!handler) {
        return { ok: false, error: 'Invalid store ' + request.storeKey } as CardLookupResponse;
    }

    const cardResult = await handler.lookupCard(request.descriptor);

    return { ok: true, result: cardResult } as CardLookupResponse;
}


chrome.runtime.onMessageExternal.addListener((msg, _sender, sendResponse) => {
    // use an IIFE for async support
    (async () => {
        if (msg?.type === MSG_PROTOCOL_CHECK) {
            sendResponse(handleCheckProtocol());
        }

        if (msg?.type === MSG_LIST_STORES) {
            sendResponse(handleListStores());
        }

        if (msg?.type === MSG_LOOKUP) {
            const lookupRequest = msg as CardLookupRequest;
            const response = await handleLookupCard(lookupRequest)
            sendResponse(response);
        }
    })();

    return true; // keep SW alive while we await
});