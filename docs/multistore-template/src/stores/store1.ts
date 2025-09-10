import { CardLookupDescriptor, CardLookupResult, FinishTreatment, FoundCardInformation, StoreMeta } from "@scryhub/protocol";
import { StoreHandler } from "./store-handler";


const Store1: StoreMeta = {
    key: 'store-1',
    name: "Store 1"
};


export class Store1Handler implements StoreHandler {

    meta = Store1;

    async lookupCard(descriptor: CardLookupDescriptor): Promise<CardLookupResult> {
        // TODO implement me
        return { found: false }
    }
}   