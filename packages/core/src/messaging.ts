import { MSG_LOOKUP, MSG_LIST_STORES, type CardLookupReq, type CardLookupResp, ProtocolCheckReq, ProtocolCheckResp, MSG_PROTOCOL_CHECK, ListStoresReq, ListStoresResp, CardLookupDescriptor } from "@scryhub/protocol";

/**
 * Result envelope to have stronger typings
 */
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error?: string };

/**
 * Define map of operations with their corersponding request response objects for more typing safety
 */
type Operations = {
  [MSG_PROTOCOL_CHECK]: {
    request: ProtocolCheckReq;
    response: ProtocolCheckResp;
  };
  [MSG_LIST_STORES]: {
    request: ListStoresReq,
    response: ListStoresResp;
  },
  [MSG_LOOKUP]: {
    request: CardLookupReq,
    response: CardLookupResp;
  }
};

/**
 * Get valid operations
 */
type OperationKey = keyof Operations;
type AnyRequest = Operations[OperationKey]["request"];

/**
 * Sends a request to a chrome extension (LGSLibrary) that hosts 1 to many LGSProviders
 * @param libraryId the extension identifier for the LGSLibrary extension
 * @param payload the request we are sending
 * @param timeoutMs how long to wait for a response
 * @returns the response type we expect
 */
export function sendToLibraryExtension<P extends AnyRequest>(
  libraryId: string,
  payload: P,
  timeoutMs = 5000
): Promise<Result<Operations[P["type"]]["response"]>> {
  return new Promise((resolve) => {
    let done = false;

    const t = setTimeout(() => {
      if (!done) {
        done = true;
        resolve({ ok: false, error: "timeout" });
      }
    }, timeoutMs);

    chrome.runtime.sendMessage(libraryId, payload, (resp) => {
      if (done) return;
      clearTimeout(t);

      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }

      resolve({ ok: true, data: resp as Operations[P["type"]]["response"] });
    });
  });
}

/**
 * 
* @param libraryId the extension identifier for the LGSLibrary extension
 * @returns 
 */
export function checkProtocol(libraryId: string): Promise<Result<ProtocolCheckResp>> {
  const request: ProtocolCheckReq = { type: MSG_PROTOCOL_CHECK };
  return sendToLibraryExtension(libraryId, request);
}

/**
 * Asks a store provider for its stores
 * @param libraryId the extension identifier for the LGSLibrary extension
 * @returns the list of stores
 */
export function listStores(libraryId: string): Promise<Result<ListStoresResp>> {
  const request: ListStoresReq = { type: MSG_LIST_STORES };
  return sendToLibraryExtension<ListStoresReq>(libraryId, request);
}

/**
 * Attempts to lookup information about a given card from a specific store
 * @param libraryId the extension identifier for the LGSLibrary extension
 * @param storeKey the key for the store we want info from (LGSLibrary extensions define this for each LGSProvider)
 * @param cardName the name of the card to lookup
 * @param opts additional params
 * @returns the response with the result of the lookup
 */
export function lookupCard(libraryId: string, storeKey: string, descriptor: CardLookupDescriptor): Promise<Result<CardLookupResp>> {
  const request: CardLookupReq = { type: MSG_LOOKUP, storeKey, descriptor };
  return sendToLibraryExtension<CardLookupReq>(libraryId, request);
}