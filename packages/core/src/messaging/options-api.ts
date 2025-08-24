import { LGSLibrary } from "../stores";


/**
 * The set of apis needed by the Options page, that will be handled
 * by the background worker to return/process data to for the options page
 */
export const OptionsApiMessages = {
  /**
   * Mesage type for our options page to get a list of libraries
   */
  OPTIONS_GET_LIBRARIES: "scryhub.core.getLibraries",
  
  /**
   * Message type for adding a new library and their stores
   */
  ADD_LIBRARY: "scryhub.core.addLibrary",
  
  /**
   * Message type for removing a library
   */
  REMOVE_LIBRARY: "scryhub.core.removeLibrary",
  
  /**
   * Retrieves store information for a library if it has new stores
   */
  REFRESH_STORES: "scryhub.core.refreshStores",

  /**
   * Rechecks a libraries compatibility state in case it has been updated
   */
  CHECK_LIBRARY_COMPATIBILITY: "scryhub.core.checkLibraryCompatibility",

  /**
   * Toggles a store on/off for a given library
   */
  TOGGLE_STORE: "scryhub.core.toggleStore",
}

type OptionsUpToDateLibrariesResponse = {
  /**
  * The set of libraries and their current state
  */
  libraries: LGSLibrary[]
}

/**
 * Internal message type to request all libraries
 */
export type OptionsGetLibraryRequest = {
  /**
   * type of message to match
   */
  type: typeof OptionsApiMessages["OPTIONS_GET_LIBRARIES"],
}

/**
 * Container for our result
 */
export type OptionsGetLibraryResponse = OptionsUpToDateLibrariesResponse & {}

/**
 * Internal message to request adding a library
 * This should also discover stores for a library and update our internal state
 */
export type OptionsAddLibraryRequest = {
  /**
   * type of message to match
   */
  type: typeof OptionsApiMessages["ADD_LIBRARY"],

  /**
   * The identifier for the library to add
   */
  id: string;

  /**
   * Human displayable name given to this library
   */
  name?: string;
}



export type OptionsAddLibraryResponse = OptionsUpToDateLibrariesResponse & {}


export type OptionsRemoveLibraryRequest = {
  /**
   * type of message to match
   */
  type: typeof OptionsApiMessages["REMOVE_LIBRARY"]
  /**
 * The identifier for the library to remove
 */
  id: string;
}

export type OptionsRemoveLibraryResponse = OptionsUpToDateLibrariesResponse & {}

export type OptionsRefreshStoresRequest = {
  /**
   * type of message to match
   */
  type: typeof OptionsApiMessages["REFRESH_STORES"]
  /**
 * The identifier for the library to fetch stores for
 */
  id: string;
}

export type OptionsRefreshStoresResponse = OptionsUpToDateLibrariesResponse & {};

export type OptionsCheckLibraryCompatibilityRequest = {
  /**
   * type of message to match
   */
  type: typeof OptionsApiMessages["CHECK_LIBRARY_COMPATIBILITY"]
  /**
   * The identifier for the library to check compatibility for
   */
  id: string;
}

export type OptionCheckLibraryCompatibilityResponse = OptionsUpToDateLibrariesResponse & {};

export type OptionsToggleStoreRequest = {
  /**
   * type of message to match
   */
  type: typeof OptionsApiMessages["TOGGLE_STORE"]
  /**
   * The identifier for the library that knows the store
   */
  id: string;
  /**
   * The key of the store to toggle
   */
  storeKey: string;
}

export type OptionsToggleStoreResponse = OptionsUpToDateLibrariesResponse & {};