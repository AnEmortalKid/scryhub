import { Money } from "../common/shared-types";
import { BaseOperationResponseFailure } from "./base";

/**
 * Used to lookup info about a card
 */
export const MSG_LOOKUP = "scryhub.library.lookupCard" as const;

/**
 * The types of finish treatment available
 */
export type FinishTreatment = 'nonfoil' | 'foil';

export type MatchQualification = 
    // set code and number
    'exact' | 
    // possibly just by name so it may mismatch set/treatment
    'loose';

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
     * Type of treatments found on the card, return all treatments possible even if not found,
     * Guaranteed to not be empty, possibly just contains 'nonfoil' in most cases when a treatment
     * could not be determined
     */
    finishTreatments: FinishTreatment[];

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
export type CardLookupRequest = {
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
export type CardLookupResultNotFound = {
    /**
     * The card was not found at the store 
     */
    found: false
};

/**
 * Container for the details of a card when it is found on the store
 */
export type FoundCardInformation = {
    /**
     * The name of the card
     */
    title: string;
    
    /**
     * A url that points to where to buy the card
     */
    url: string;
    
    /**
     * Price information if it could be retrieved
     */
    price?: Money;

    /**
     * Availability of the card if the store lists stock/out-of-stock items
     */
    availability: "in_stock" | "out_of_stock" | "unknown";

    /**
     * The type of treatment on a card
     */
    finishTreatment: FinishTreatment;

    /**
     * Qualifies the result in terms of matching against a set/code , border level, etc.
     */
    match: MatchQualification;
}


/**
 * Contains information when a card listing was found at the desired store
 */
export type CardLoookupResultFound = {
    /**
     * The card was found at the store 
     */
    found: true,

    /**
     * Information about the specific treatment of the card, can return multiple
     * if there are variants (foil/nonfoil)
     */
    cards: FoundCardInformation[];
}

/**
 * Defines the possible answers to a Card Lookup
 */
export type CardLookupResult =
    | CardLookupResultNotFound
    | CardLoookupResultFound;

/**
 * Result of the lookup operation, a message may succeed but not find a card
 */
type CardLookupResponseSuccess = {
    /**
     * Message succeeded
     */
    ok: true;

    /**
     * Data about the lookup operation, should be populated even if a card was not found
     */
    result: CardLookupResult;
    
    /**
     * Identifier from the LGSLibrary to distinguish a specific LGSProvider
     */
    storeKey: string;
}

/**
 * Expected response to a Lookup Card operation
 */
export type CardLookupResponse = BaseOperationResponseFailure | CardLookupResponseSuccess;