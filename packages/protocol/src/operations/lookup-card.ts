import { Money } from "../common/shared-types";

/**
 * Used to lookup info about a card
 */
export const MSG_LOOKUP = "scryhub.adapter.lookup" as const;


/**
 * Holds information about a card from ScryFall so an LGSProvider can properly search
 */
export type CardLookupDescriptor = {
    /**
     * The name of the card as it shows on the scryfal card
     * Ex: "Yuna, Hope of Spira"
     */
    name: string;

    /**
     * The title of the card computed by scryfall if we can find it, this often has the name, set and collector number
     * Ex: "Yuna, Hope of Spira (Final Fantasy #404)"
     */
    scryfallTitle?: string;

    /**
     * The set code for the card if we could find it, always uppercase
     * Ex: "FIN"
     */
    setCode?: string;
    /**
     * The collector number for the card within the set if we could find it
     * Ex: "404" or "404a"
     */
    collectorNumber?: string;


    /**
     * The type of border this card has, defined by scryfall. Can be used to lookup special treatement versions.
     * 
     * This most often will be the CSS class attached to the image of the card.
     */
    borderTreatment?: string;
}

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
    descriptor: CardLookupDescriptor;
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
