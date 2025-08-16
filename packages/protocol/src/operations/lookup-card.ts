import { Money } from "../common/shared-types";

/**
 * Used to lookup info about a card
 */
export const MSG_LOOKUP = "scryhub.adapter.lookup" as const;

/**
 * Defines the request for the Lookup Card operation
 */
export type CardLookupReq = {
    /**
     * The type of the message
     */
    type: typeof MSG_LOOKUP;
    /**
     * The id/key for the store to lookup information from
     */
    storeKey: string;

    /**
     * The details about the card to lookup
     */
    cardName: string;
};


/**
 * Defines response when the lookup operation succeeds
 * but there is no information about the card
 */
export type CardLookupResultNotFound =
{
    /**
     * The card was not found at the store 
     */
    found: false
};


export type FoundCardInformation = {
    title: string;
    url: string;
    price?: Money;
    availability?: "in_stock" | "out_of_stock" | "unknown";
}


export type CardLoookupResultFound =
{
    /**
     * The card was found at the store 
     */
    found: true,

    /**
     * Information about the specific card
     */
    card: FoundCardInformation;
}

export type CardLookupResult =
    | CardLookupResultNotFound
    | CardLoookupResultFound;

/**
 * Expected response to a Lookup Card operation
 */
export type CardLookupResp = {
    /**
     * Whether the message succeeds or not
     */
    ok: boolean;

    /**
     * Data about the lookup operation, should be populated
     * when the operation succeeds. 
     */
    result?: CardLookupResult;

    /**
     * Identifier from the LGSLibrary to distinguish a specific LGSProvider
     */
    storeKey: string;
};
