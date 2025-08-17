import { BaseOperationResponseFailure } from "./base";

/**
 * Used to get stores supplied by the provider
 */
export const MSG_LIST_STORES = "scryhub.library.listStores" as const;


/**
 * Defines the request for the List Stores operation
 */
export type ListStoresRequest = {
    /**
    * Type of this message
    */
    type: typeof MSG_LIST_STORES
};

/**
 * Defines information about a store
 */
export type StoreMeta = {
    /**
     * A unique key defined by the LGSLibrary to correctly identify this specific LGSProvider
     * 
     * ScryHub will use this key when asking for information from this specific store
     */
    key: string;
    
    /**
     * A human displayable name to identify this store, this will show up next to the text "Buy at" on the scryfall website
     */
    name: string; 
    
    /**
     * A url that can be used to fetch the logo for this store if it should be displayed
     */
    logoUrl?: string;
};

/**
 * The operation succeeded and we have data
 */
type ListStoresResponseSuccess = {
    /**
     * The message succeeded
     */
    ok: true;
    /**
     * The set of stores managed by a library
     */
    stores: StoreMeta[];
}

/**
 * Expected response to a list stores operation
 */
export type ListStoresResponse = 
    BaseOperationResponseFailure | ListStoresResponseSuccess;