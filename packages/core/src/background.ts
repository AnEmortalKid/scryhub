import { CardLookupResponse, ListStoresResponse, ProtocolCheckResponse } from "@scryhub/protocol";
import { addLibrary, fetchStoredLibraries, recheckCompatibility, refreshStores, removeLibrary, toggleStore } from "./background/options-messages";
import { SCRYHUB_CHECK_LIBRARY_COMPAT, SCRYHUB_LIST_STORES, SCRYHUB_LOOKUP_CARD, ScryHubCheckProtocolMsg, ScryHubGetStoresMsg, ScryHubLookupCardMsg } from "./messaging/internal";
import { checkProtocolFromExtension, listStoresFromExtension, lookupCardFromExtension, Result } from "./messaging/library";
import { OptionsApiMessages, OptionsAddLibraryRequest, OptionsGetLibraryRequest, OptionsGetLibraryResponse, OptionsRemoveLibraryRequest, OptionsRefreshStoresRequest, OptionsCheckLibraryCompatibilityRequest, OptionsToggleStoreRequest } from "./messaging/options-api";
import { createLogger } from "./logger/factory";


const backgroundLogger = createLogger("[ScryHub.Background]");

/**
 * Performs the lookup card action against the desired library and store
 * @param msg a result envelope
 */
async function lookupExternal(msg: ScryHubLookupCardMsg): Promise<Result<CardLookupResponse>> {
  backgroundLogger.log('lookup specific card', msg);
  const { libraryId, storeKey, descriptor } = msg;
  const resp: Result<CardLookupResponse> = await lookupCardFromExtension(libraryId, storeKey, descriptor);
  backgroundLogger.log('received response from extension', resp);
  return resp;
}

/**
 * Performs the list stores action against the desired library
 * @param msg a result envelope
 */
async function listStoresExternal(msg: ScryHubGetStoresMsg): Promise<Result<ListStoresResponse>> {
  backgroundLogger.log('looking up stores', msg);
  const { libraryId } = msg;
  const resp: Result<ListStoresResponse> = await listStoresFromExtension(libraryId);
  backgroundLogger.log('received response from extension', resp);
  return resp;
}

async function lookupProtocolExternal(msg: ScryHubCheckProtocolMsg): Promise<Result<ProtocolCheckResponse>> {
  backgroundLogger.log('checking library protocol', msg);
  const { libraryId } = msg;
  const resp: Result<ProtocolCheckResponse> = await checkProtocolFromExtension(libraryId);
  backgroundLogger.log('received response from extension', resp);
  return resp;
}

// TODO have background support a "UPDATE_COMPATS or CHECK_ALL_COMPATS"


// Apis that support the Options page

/**
 * Passthrough from content page to ask a provider (one store at a time) for data
 */

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  // wrong event ignore
  if (!msg || !msg.type) {
    return;
  }

  // Heuristic: self-message from the SW (no tab, no url)
  const isSelfSW = _sender?.id === chrome.runtime.id && !_sender.tab && !_sender.url;
  if (isSelfSW) {
    console.warn('[ScryHub] Misrouted self message:', msg.type);
  }

  (async () => {
    console.log('[ScryHub.Background]', 'received', msg.type, 'from', _sender.id);

    // TODO add namespaces to requests hub.content.lookupCard vs hub.options.getLibraries
    // that way its clear that content/options use these request to get the background to do something
    // make sure background never calls itself by somehow sending these same messages
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
        const listStoresEnvelope = await listStoresExternal(msg as ScryHubGetStoresMsg);
        sendResponse(listStoresEnvelope);
        break;
      // for options page handling
      case OptionsApiMessages.OPTIONS_GET_LIBRARIES:
        const librariesResult: OptionsGetLibraryResponse = await fetchStoredLibraries(msg as OptionsGetLibraryRequest);
        sendResponse(librariesResult);
        break;
      case OptionsApiMessages.ADD_LIBRARY:
        const libsAfterAdd = await addLibrary(msg as OptionsAddLibraryRequest);
        sendResponse(libsAfterAdd);
        break;
      case OptionsApiMessages.REMOVE_LIBRARY:
        const libsAfterRemove = await removeLibrary(msg as OptionsRemoveLibraryRequest);
        sendResponse(libsAfterRemove)
        break;
      case OptionsApiMessages.REFRESH_STORES:
        const libsAfterRefresh = await refreshStores(msg as OptionsRefreshStoresRequest);
        sendResponse(libsAfterRefresh);
        break;
      case OptionsApiMessages.CHECK_LIBRARY_COMPATIBILITY:
        const libsAfterCompatCheck = await recheckCompatibility(msg as OptionsCheckLibraryCompatibilityRequest);
        sendResponse(libsAfterCompatCheck);
        break;
      case OptionsApiMessages.TOGGLE_STORE:
        const libsAfterToggle = await toggleStore(msg as OptionsToggleStoreRequest);
        sendResponse(libsAfterToggle);
        break;
      default:
        sendResponse({ ok: false, error: 'unknown message ' + msg });
        break;
    }
  })();

  // we use an IIFE to await in chrome plugins
  return true;
});

backgroundLogger.log('onMessage registered for', chrome.runtime.id);
