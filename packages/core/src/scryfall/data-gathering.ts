import { CardLookupDescriptor, FinishTreatment } from "@scryhub/protocol";


/**
 * Parses the various pieces of the dom to get the attributes we need
 */
export function getCardDescriptor(): CardLookupDescriptor {
    const cardName = getDisplayedCardName();
    const setName = getSetNameFromTable();
    const setCodeAndCollector = getSetAndCollectorFromTable();
    const titleAndBorder = getTitleAndBorder();
    const finishTreatments = getTreatmentsFromDetails();
    // todo get border

    return {
        name: cardName,
        finishTreatments,
        // the optional fields here
        setName,
        ...setCodeAndCollector,
        ...titleAndBorder,
    };
}


/**
 * Inner types just to have the right keys
 */
type SetAndCollector = Pick<CardLookupDescriptor, 'setCode' | 'collectorNumber'>;
type TitleAndBorder = Pick<CardLookupDescriptor, 'scryfallTitle' | 'borderTreatment'>;


/**
 * Reads the name from `<span class="card-text-card-name">`
 */
function getDisplayedCardName(): string {
    const nameSpan = document.querySelector<HTMLElement>('span.card-text-card-name');

    if (nameSpan) {
        return nameSpan.textContent.trim();
    }

    // not found probably need other approaches later
    return "";
}

/**
 * Reads the title and border treatment from the `img` for the card
 */
function getTitleAndBorder(): TitleAndBorder {
    const img = document.querySelector<HTMLImageElement>('.card-image-front img');

    if (!img) {
        return {};
    }

    const title = img.title.trim();

    let borderTreatment = undefined;
    for (const cls of img.classList) {
        if (cls.startsWith('border-')) {
            borderTreatment = cls.slice('border-'.length); // e.g. "borderless", "black", "white", "silver"
        }
    }

    return {
        scryfallTitle: title,
        borderTreatment: borderTreatment
    }
}

/**
 * Reads through the prints-current-set-name span and tries to parse the non code
 */
function getSetNameFromTable(): string | undefined {
    const currentSetNameSpan = document.querySelector<HTMLSpanElement>(
        '.prints-current-set-name'
    );

    if (!currentSetNameSpan) {
        return undefined;
    }

    const rawText = currentSetNameSpan.textContent?.trim();
    if (!rawText) {
        return undefined;
    }

    // Remove the trailing (CODE) part if it exists
    const nameOnly = rawText.replace(/\s*\([A-Z0-9]+\)\s*$/, '');

    return nameOnly || undefined;
}

/**
 * Reads the set code and collector number from the prints-table, currently selected row
 * Parses through the card link, example: `<a href="/card/fin/404/yuna-hope-of-spira">`
 * 
 * @returns the setCode and collector number
 */
function getSetAndCollectorFromTable(): SetAndCollector {
    // find the current row, it usually is a link to this same page
    const currentRowLink = document.querySelector<HTMLAnchorElement>(
        '.prints-table tr.current td a[href^="/card/"]'
    );

    if (!currentRowLink) {
        return {
            setCode: undefined, collectorNumber: undefined
        };
    }

    const parts = currentRowLink.getAttribute('href')!.split('/');
    // /card/fin/404/yuna-hope-of-spira → ["", "card", "fin", "404", "yuna-hope-of-spira"]
    return {
        setCode: parts[2].toUpperCase(),       // "FIN"
        collectorNumber: parts[3] // "404"
    };
}

/**
 * Parses through the current set details to get the treatments for the card
 */
function getTreatmentsFromDetails(): FinishTreatment[] {
    // Go from "#132 · Common · English · Nonfoil/Foil"
    // To "Nonfoil"/Foil

    const setDetailsSpan = document.querySelector<HTMLSpanElement>(
        '.prints-current-set-details'
    );

    if (!setDetailsSpan) {
        return ['nonfoil'];
    }

    // try to parse the treatments

    const contents = setDetailsSpan.textContent
        .replace(/\s+/g, ' ')     // collapse whitespace
        .replace(/\s*<br>\s*$/i, '') // just in case innerHTML copied to textContent somewhere
        .trim();

    // split by the weird separator and take last and always trim
    const last = (contents.split('·').pop() || '').trim();
    // handle 'Nonfoil/Foil' and 'Nonfoil, foil' and 'nonfoil or foil'
    const tokens = last.split(/\/|,|\bor\b/i).map(t => t.trim().toLowerCase());
    // now test if we have "Nonfoil" and "Foil" in there
    const seen = new Set<FinishTreatment>();
    for (const tok of tokens) {
        if (/\bnon[-\s]?foil\b|\bnormal\b/.test(tok)) {
            seen.add('nonfoil');
        }
        else if (/\bfoil\b/.test(tok)) {
            seen.add('foil');
        }
    }

    let foundTreatments: FinishTreatment[] = [];
    foundTreatments = [...seen];

    // somehow empty, push nonfoil to find something
    if (foundTreatments.length === 0) {
        foundTreatments = ['nonfoil'];
    }

    return foundTreatments;
}