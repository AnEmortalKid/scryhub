import { CardLookupResponse, ListStoresResponse, ProtocolCheckResponse } from "@scryhub/protocol";
import { SCRYHUB_CHECK_LIBRARY_COMPAT, SCRYHUB_LIST_STORES, SCRYHUB_LOOKUP_CARD, ScryHubCheckProtocolMsg, ScryHubGetStoresMsg, ScryHubLookupCardMsg } from "./messaging/internal";
import { checkProtocol, listStores, lookupCard, Result } from "./messaging/library";


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

async function lookupProtocolExternal(msg: ScryHubCheckProtocolMsg): Promise<Result<ProtocolCheckResponse>> {
  console.log('[ScryHub] check protocol:', msg);
  const { libraryId } = msg;
  const resp: Result<ProtocolCheckResponse> = await checkProtocol(libraryId);
  console.log(`[ScryHub] received: `, resp);
  return resp;
}

// TODO have background support a "UPDATE_COMPATS or CHECK_ALL_COMPATS"

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
      case SCRYHUB_CHECK_LIBRARY_COMPAT:
        const compatEnvelope = await lookupProtocolExternal(msg as ScryHubCheckProtocolMsg);
        sendResponse(compatEnvelope)
        break;
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
