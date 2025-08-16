import { CardLookupResp } from "@scryhub/protocol";
import { lookupCard, Result } from "./messaging";

/**
 * Passthrough from content page to ask a provider (one store at a time) for data
 */

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== "hub.lookupSpecific") return;
  (async () => {
    const { providerId, storeKey, cardName, opts } = msg;
    const resp : Result<CardLookupResp> = await lookupCard(providerId, storeKey, cardName, opts);
    // TODO might have to splat storeKey if not returned in meta
    sendResponse(resp);
  })();
  return true;
});
