/**
 * Used to get stores supplied by the provider
 */
export const MSG_LIST_STORES = "scryhub.adapter.listStores" as const;


/**
 * Defines the request for the List Stores operation
 */
export type ListStoresReq = {
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
    
    // TODO define the right url stuff
    logoUrl?: string; logoSvg?: string; logoDataUrl?: string
};


/**
 * Expected response to a list stores operation
 */
export type ListStoresResp = {
    /**
     * Whether the message succeeds or not
     */
    ok: boolean;
    stores?: StoreMeta[];
    error?: string;
};