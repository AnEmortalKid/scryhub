/**
 * Holds functions to communicate within our extension, from the content page to the background worker
 */

import { CardLookupDescriptor, CardLookupRequest, CardLookupResponse, CardLookupResult, ListStoresResponse, ProtocolCheckResponse } from "@scryhub/protocol";
import { Result } from "./library";

/**
 * Message type for our content page to ask for card information from the service worker
 */
export const SCRYHUB_LOOKUP_CARD = "hub.lookupSpecific";

/**
 * Message type for our options page to ask for store info from an LGSLibrary via the service worker
 */
export const SCRYHUB_LIST_STORES = "hub.getLibraryStores";

/**
 * Message type for our content/options pages to check protocol versions for a specific
 */
export const SCRYHUB_CHECK_LIBRARY_COMPAT = "hub.libraryProtocolCheck";

/**
 * Internal message type to request card info from a specific library and store
 */
export type ScryHubLookupCardMsg = {
  /**
   * type of message to match
   */
  type: typeof SCRYHUB_LOOKUP_CARD,
  /**
   * The identifier of the library (the chrome extension id to send messages to)
   */
  libraryId: string,
  /**
   * The identifier of the store, which store to ask the specific library for info from
   */
  storeKey: string,
  /**
   * Data about the card to lookup
   */
  descriptor: CardLookupDescriptor,
}

/**
 * Internal message type to request store info from a specific library
 */
export type ScryHubGetStoresMsg = {
  /**
   * type of message to match
   */
  type: typeof SCRYHUB_LIST_STORES,
  /**
   * The identifier of the library (the chrome extension id to send messages to)
   */
  libraryId: string,
}

/**
 * Internal message type to request store info from a specific library
 */
export type ScryHubCheckProtocolMsg = {
  /**
   * type of message to match
   */
  type: typeof SCRYHUB_CHECK_LIBRARY_COMPAT,
  /**
   * The identifier of the library (the chrome extension id to send messages to)
   */
  libraryId: string,
}

/**
 * Sends a message to our extension's background worker. 
 * @param payload the message request
 * @param timeoutMs how long to wait
 * @returns the result of the RPC call
 */
function sendToCore<T>(payload: any, timeoutMs = 5000): Promise<Result<T>> {
  return new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (done) {return;}
      done = true;
      resolve({ ok: false, error: "timeout" });
    }, timeoutMs);

    console.log('[ScryHub.sendToCore]', chrome.runtime.id);
    chrome.runtime.sendMessage(payload, (resp?: Result<T>) => {
      if (done) {return;}
      clearTimeout(timer);

      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(resp ?? { ok: false, error: "no response" });
    });
  });
}

/**
 * Retrieves card information from a specific store, for a given library
 * @param libraryId the id of the library
 * @param storeKey the id of the store
 * @param descriptor lookup information
 * @returns a result envelope with the response for the lookup
 */
export async function lookupCardFromLibraryAndStore(
  libraryId: string,
  storeKey: string,
  descriptor: CardLookupDescriptor
): Promise<Result<CardLookupResponse>> {

  const asInternalMessage : ScryHubLookupCardMsg = {
    type: SCRYHUB_LOOKUP_CARD,
    libraryId,
    storeKey,
    descriptor,
  }

  return sendToCore<CardLookupResponse>(asInternalMessage);
}

/**
 * Retrieves store information from a library
 * 
 * @param libraryId the id of the library
 * @returns a result envelope with the response for looking up the stores
 */
export async function getLibraryStores(
  libraryId: string
) : Promise<Result<ListStoresResponse>> {
  const asInternalMessage: ScryHubGetStoresMsg = {
    type: SCRYHUB_LIST_STORES,
    libraryId
  };

  return sendToCore<ListStoresResponse>(asInternalMessage);
}

/**
 * Retrieves protocol information from a library
 * @param libraryId the id of the library
 * @returns a result envelope with the response for looking up the protocol
 */
export async function getLibraryProtocol(libraryId: string) : Promise<Result<ProtocolCheckResponse>> {
  const asInternalMessage : ScryHubCheckProtocolMsg = {
    type: SCRYHUB_CHECK_LIBRARY_COMPAT,
    libraryId
  };

  console.log('[ScryHub]', 'sending to core', SCRYHUB_CHECK_LIBRARY_COMPAT);
  return sendToCore<ProtocolCheckResponse>(asInternalMessage);
}