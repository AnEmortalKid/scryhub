import { CardLookupDescriptor } from "@scryhub/protocol";


/**
 * Parses the various pieces of the dom to get the attributes we need
 */
export function getCardDescriptor(): CardLookupDescriptor {
    const cardName = getDisplayedCardName();
    const setCodeAndCollector = getSetAndCollectorFromTable();
    const titleAndBorder = getTitleAndBorder();

    return {
        name: cardName,
        ...setCodeAndCollector,
        ...titleAndBorder
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
 * Reads the set code and collector number from the printss-table, currently selected row
 * Parses through the card link, example: `<a href="/card/fin/404/yuna-hope-of-spira">`
 * 
 * @returns the setCode and collector number
 */
function getSetAndCollectorFromTable(): SetAndCollector {
    // find the current row, it usually is a link to this same page
    const currentRowLink = document.querySelector<HTMLAnchorElement>(
        '.prints-table tr.current td a[href^="/card/"]'
    );

    if (!currentRowLink) return {
        setCode: undefined, collectorNumber: undefined
    };

    const parts = currentRowLink.getAttribute('href')!.split('/');
    // /card/fin/404/yuna-hope-of-spira → ["", "card", "fin", "404", "yuna-hope-of-spira"]
    return {
        setCode: parts[2].toUpperCase(),       // "FIN"
        collectorNumber: parts[3] // "404"
    };
}