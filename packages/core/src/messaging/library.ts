/**
 * Hosts functions for communicating with external chrome extensions, aka LGSLibrary extensions
 */
import { MSG_LOOKUP, MSG_LIST_STORES, type CardLookupRequest, type CardLookupResult, ProtocolCheckResponse, ProtocolCheckRequest, MSG_PROTOCOL_CHECK, ListStoresRequest, ListStoresResponse, CardLookupDescriptor, CardLookupResponse } from "@scryhub/protocol";


/**
 * Define map of operations with their corersponding request response objects for more typing safety
 */
type Operations = {
  [MSG_PROTOCOL_CHECK]: {
    request: ProtocolCheckRequest;
    response: ProtocolCheckResponse;
  };
  [MSG_LIST_STORES]: {
    request: ListStoresRequest,
    response: ListStoresResponse;
  },
  [MSG_LOOKUP]: {
    request: CardLookupRequest,
    response: CardLookupResponse;
  }
};

/**
 * Get valid operations
 */
type OperationKey = keyof Operations;
type AnyRequest = Operations[OperationKey]["request"];

/**
 * A failed result possibly containing the error for the invocation
 * 
 * This indicates that the message may not have reached the extension properly, or the extension
 * returned something we were not expecting.
 */
export type FailedResult = {
  /**
   * Whether this call succeeded
   */
  ok: false,
  /**
   * Any information about an error
   */
  error?: string;
}

/**
 * Indicates our call succeeded and the extension responded with the right stuff,
 * it is possible for an extension to return a response successfully (it understood it) but
 * that call to have failed downstream (an api failed for example)
 */
export type SuccessfulResult<T> = {
  /**
   * Whether this call succeeded
   */
  ok: true,
  /**
   * The actual response object from the extension
   */
  data: T
}

/**
 * Result envelope that wraps the response from an extension
 * 
 * Extensions are just responsible for returning the responses based on the spec
 */
export type Result<T> = FailedResult | SuccessfulResult<T>;

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
): 
// from Operations, key with the current request type and get that exact response type
Promise<Result<Operations[P["type"]]["response"]>> {
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
export function checkProtocol(libraryId: string): Promise<Result<ProtocolCheckResponse>> {
  const request: ProtocolCheckRequest = { type: MSG_PROTOCOL_CHECK };
  return sendToLibraryExtension(libraryId, request);
}

/**
 * Asks a store provider for its stores
 * @param libraryId the extension identifier for the LGSLibrary extension
 * @returns the list of stores
 */
export function listStores(libraryId: string): Promise<Result<ListStoresResponse>> {
  const request: ListStoresRequest = { type: MSG_LIST_STORES };
  return sendToLibraryExtension<ListStoresRequest>(libraryId, request);
}

/**
 * Attempts to lookup information about a given card from a specific store
 * @param libraryId the extension identifier for the LGSLibrary extension
 * @param storeKey the key for the store we want info from (LGSLibrary extensions define this for each LGSProvider)
 * @param cardName the name of the card to lookup
 * @param opts additional params
 * @returns the response with the result of the lookup
 */
export function lookupCard(libraryId: string, storeKey: string, descriptor: CardLookupDescriptor): Promise<Result<CardLookupResponse>> {
  const request: CardLookupRequest = { type: MSG_LOOKUP, storeKey, descriptor };
  return sendToLibraryExtension<CardLookupRequest>(libraryId, request);
}