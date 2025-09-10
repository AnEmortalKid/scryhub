import { FoundCardInformation, MatchQualification } from "@scryhub/protocol";


export function availabilityRank(a: FoundCardInformation): number {
    return a.availability === 'in_stock' ? 0 : 1; // lower is better
}

export function matchRank(m: MatchQualification): number {
    return m === 'exact' ? 0 : 1; // lower is better
}