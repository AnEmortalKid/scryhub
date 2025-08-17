import { CardLookupResponse, ListStoresResponse } from "@scryhub/protocol";
import { SCRYHUB_LIST_STORES, SCRYHUB_LOOKUP_CARD, ScryHubGetStoresMsg, ScryHubLookupCardMsg } from "./messaging/internal";
import { listStores, lookupCard, Result } from "./messaging/library";


/**
 * Performs the lookup card action against the desired library and store
 * @param msg a result envelope
 */
async function lookupExternal(msg: ScryHubLookupCardMsg): Promise<Result<CardLookupResponse>> {
  console.log('[ScryHub] lookup specific:', msg);
  const { libraryId, storeKey, descriptor } = msg;
  const resp: Result<CardLookupResponse> = await lookupCard(libraryId, storeKey, descriptor);
  console.log(`[ScryHub] received: `, resp);
  return resp;
}

/**
 * Performs the list stores action against the desired library
 * @param msg a result envelope
 */
async function listStoresExternal(msg: ScryHubGetStoresMsg): Promise<Result<ListStoresResponse>> {
  console.log('[ScryHub] lookup stores:', msg);
  const { libraryId } = msg;
  const resp: Result<ListStoresResponse> = await listStores(libraryId);
  console.log(`[ScryHub] received: `, resp);
  return resp;
}

/**
 * Passthrough from content page to ask a provider (one store at a time) for data
 */

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  // wrong event ignore
  if (!msg || !msg.type) {
    return;
  }

  (async () => {
    switch (msg.type) {
      case SCRYHUB_LOOKUP_CARD:
        const lookupEnvelope = await lookupExternal(msg as ScryHubLookupCardMsg);
        sendResponse(lookupEnvelope);
        break;
      case SCRYHUB_LIST_STORES:
        const listStoresEnvelpoe = await listStoresExternal(msg as ScryHubGetStoresMsg);
        sendResponse(listStoresEnvelpoe);
        break;
      default:
        sendResponse({ ok: false, error: 'unknown message ' + msg });
        break;
    }
  })();

  // we use an IIFE to await in chrome plugins
  return true;
});
