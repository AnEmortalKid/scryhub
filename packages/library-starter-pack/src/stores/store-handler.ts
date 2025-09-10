import { CardLookupDescriptor, CardLookupResult, StoreMeta } from "@scryhub/protocol";

export type StoreMetadata = StoreMeta

/**
 * Handles logic for a given store
 */
export interface StoreHandler {

    meta: StoreMeta;

    lookupCard(descriptor: CardLookupDescriptor): Promise<CardLookupResult>

}