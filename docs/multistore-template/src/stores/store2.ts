import { CardLookupDescriptor, CardLookupResult, FinishTreatment, FoundCardInformation, StoreMeta } from "@scryhub/protocol";
import { StoreHandler } from "./store-handler";


const Store2: StoreMeta = {
    key: 'store-2',
    name: "Store 2"
};


export class Store2Handler implements StoreHandler {

    meta = Store2;

    async lookupCard(descriptor: CardLookupDescriptor): Promise<CardLookupResult> {
        // TODO implement me
        return { found: false }
    }
}   