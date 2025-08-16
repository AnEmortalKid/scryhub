import { CardLookupReq, CardLookupResp } from "@scryhub/protocol";
import { lookupCard, Result } from "./messaging";
import { ScryHubLookupCardMsg } from "./content";

/**
 * Passthrough from content page to ask a provider (one store at a time) for data
 */

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  
  if (msg?.type !== "hub.lookupSpecific") {
    return;
  }


  (async () => {
    console.log('[ScryHub] lookup specific:', msg);

    const lookupRequest = msg as ScryHubLookupCardMsg;
    const { libraryId, storeKey, descriptor } = lookupRequest;
    const resp : Result<CardLookupResp> = await lookupCard(libraryId, storeKey, descriptor);
    // TODO might have to splat storeKey if not returned in meta
    console.log(`[ScryHub] received: `, resp);
    sendResponse(resp);
  })();

  // we use an IIFE to await in chrome plugins
  return true;
});
