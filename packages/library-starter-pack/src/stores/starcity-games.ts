import {
    CardLookupDescriptor,
    CardLookupResult,
    FinishTreatment,
    FoundCardInformation,
    MatchQualification,
    StoreMeta
} from "@scryhub/protocol";
import { StoreHandler } from "./store-handler";
import { availabilityRank, matchRank } from "../utils/sorting";


/**
 * This is the hawk search ClientGUID for star city games and is not a secret key
 */
const scgPublicClientId = 'cc3be22005ef47d3969c3de28f09571b';

async function fetchScgHawk(keyword: string) {
    const body = {
        Keyword: keyword,
        MaxPerPage: 24,
        SortBy: "score",
        ClientGuid: scgPublicClientId,
        Variant: { MaxPerPage: 32 }
    };

    const resp = await fetch("https://essearchapi-na.hawksearch.com/api/v2/search", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json();
}


function mapScgResult(doc: any, descriptor: CardLookupDescriptor): FoundCardInformation {
    const url = new URL(doc.url_detail?.[0] ?? "", "https://starcitygames.com/").toString();
    const finish: FinishTreatment = (doc.finish?.[0] ?? "").toLowerCase().includes("non-foil") ? "nonfoil" : "foil";

    const priceStr = doc.price_retail?.[0] ?? doc.price_sort?.[0];
    const priceNum = priceStr ? parseFloat(priceStr) : null;

    const availability = doc.availability?.[0] === "Available" ? 'in_stock' : 'out_of_stock';

    const collectorNumber = doc.collector_number?.[0];
    // may contain the set code
    // TODO the set will also be useful
    const matchesSet = descriptor?.setCode ? doc.sku?.[0].indexOf(descriptor!.setCode) !== -1 : false;
    const matchesCollector = collectorNumber === descriptor.collectorNumber;

    return {
        url,
        title: doc.product_name?.[0] ?? doc.card_name?.[0] ?? "Unknown",
        price: priceNum ? { amount: priceNum, currency: "USD" } : undefined,
        availability: availability,
        finishTreatment: finish,
        // double hit, we good, else lose
        match: (matchesSet && matchesCollector) ? 'exact' : 'loose'
    };
}

function asFinishSet(ft: FinishTreatment | FinishTreatment[] | undefined): Set<FinishTreatment> {
  if (!ft) return new Set<FinishTreatment>();
  return new Set(Array.isArray(ft) ? ft : [ft]);
}

function requestedFinishes(descriptor: CardLookupDescriptor): FinishTreatment[] | undefined {
  // adapt to your protocol: maybe descriptor.finish or descriptor.treatments
  const req = (descriptor as any).finish as FinishTreatment | FinishTreatment[] | undefined;
  if (!req) return undefined;
  return Array.isArray(req) ? req : [req];
}

function priceNumber(of: FoundCardInformation): number | null {
  return of.price?.amount ?? null;
}

function compareOffers(a: FoundCardInformation, b: FoundCardInformation): number {
  // 1) exact > loose
  const mr = matchRank((a.match as MatchQualification)) - matchRank((b.match as MatchQualification));
  if (mr !== 0) return mr;
  // 2) in_stock > out_of_stock
  const ar = availabilityRank(a) - availabilityRank(b);
  if (ar !== 0) return ar;
  // 3) lower price first (nulls last)
  const pa = priceNumber(a);
  const pb = priceNumber(b);
  if (pa == null && pb == null) return 0;
  if (pa == null) return 1;
  if (pb == null) return -1;
  return pa - pb;
}

// returns at most 1 best offer per requested finish; if none requested, 1 per finish seen
function pickTopPerFinish(
  offers: FoundCardInformation[],
  requested?: FinishTreatment[]
): FoundCardInformation[] {
  // sort once by desirability
  const sorted = [...offers].sort(compareOffers);

  // build target list: requested finishes or all finishes encountered
  const targets = new Set<FinishTreatment>(
    requested && requested.length > 0
      ? requested
      : sorted.flatMap(o => Array.from(asFinishSet(o.finishTreatment)))
  );

  const chosenByFinish = new Map<FinishTreatment, FoundCardInformation>();

  for (const offer of sorted) {
    const finishes = asFinishSet(offer.finishTreatment);
    for (const f of finishes) {
      if (targets.has(f) && !chosenByFinish.has(f)) {
        chosenByFinish.set(f, offer);
      }
    }
    // early exit if we’ve satisfied all targets
    if (chosenByFinish.size === targets.size) break;
  }

  return Array.from(chosenByFinish.values());
}

const SGCMeta: StoreMeta = {
    name: "StarCity Games",
    key: "star-city-games"
};

export class StarCityGamesHandler implements StoreHandler {
    meta = SGCMeta;

    async lookupCard(descriptor: CardLookupDescriptor): Promise<CardLookupResult> {
        const data = await fetchScgHawk(descriptor.name);

        const offers = (data.Results ?? []).map((r: { Document: any; }) => mapScgResult(r.Document, descriptor));

        if (offers.length == 0) {
            return { found: false }
        }

        // filter the offers
        const reqFinishes = requestedFinishes(descriptor); // e.g., ['foil','nonfoil'] or undefined
        const picks = pickTopPerFinish(offers, reqFinishes);


        return {
            found: true,
            cards: offers
        } as CardLookupResult

    }
}
