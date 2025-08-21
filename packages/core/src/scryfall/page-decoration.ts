import { FoundCardInformation } from "@scryhub/protocol";


/**
 * id for our div where we will mount things into
 */
const rootId = 'scryhub-shadow-root';


/**
 * @returns whether we are actively on a scryfall single card page or not
 */
export function onCardPage() {
  const p = location.pathname.split("/").filter(Boolean);
  return p[0] === "card" && p.length >= 3;
}

/**
 * @returns the HTML element for the stores column or null if we are not on the right page
 */
function storesColumn(): HTMLElement | null {
  return document.querySelector("#stores");
}

async function injectStyles(shadowRoot: ShadowRoot, href: string) {
  const url = chrome.runtime.getURL(href);
  try {
    // Preferred: adoptedStyleSheets (fast, scoped, no DOM nodes)
    const cssText = await (await fetch(url)).text();
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(cssText);
    shadowRoot.adoptedStyleSheets = (shadowRoot.adoptedStyleSheets || []).concat(sheet);
  } catch {
    // Fallback: <link> or <style>
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    shadowRoot.appendChild(link);
  }
}

/**
 * Creates or retrieves the div we are going to use to mount our buttons on
 * @returns a list of items to add to our scryhub section
 */
export async function ensureHubSection(): Promise<{ list: HTMLUListElement } | null> {
  // not right page or the dom doesn't have the id anymore
  const col = storesColumn();
  if (!col) {
    return null;
  };

  // host element that will own the shadow root
  let host = document.getElementById(rootId) as HTMLElement | null;
  if (!host) {
    host = document.createElement('div');
    host.id = rootId;
    // mount INSIDE the stores column so it positions naturally in their layout
    col.appendChild(host);

    // create shadow root
    const shadow = host.attachShadow({ mode: 'open' });

    // inject styles into the shadow (await so we don't flash unstyled)
    await injectStyles(shadow, 'styles/shadow.css');

    // build ScryHub block INSIDE the shadow
    const block = document.createElement('div');
    block.className = 'sh-block';
    block.setAttribute('role', 'region');
    block.setAttribute('aria-label', 'ScryHub Buy Local');

    const header = document.createElement('div');
    header.className = 'sh-header';

    const logoImg = document.createElement('img');
    logoImg.className = 'sh-logo';
    logoImg.alt = '';
    logoImg.src = chrome.runtime.getURL('icons/scryhub.svg');
    header.appendChild(logoImg);

    // “ScryHub” mark
    const mark = document.createElement('span');
    mark.className = 'sh-mark';
    mark.textContent = 'ScryHub';
    header.appendChild(mark);

    // sub-label
    const sub = document.createElement('span');
    sub.classList.add('sh-sub', 'sh-right');
    sub.textContent = 'Buy local';
    header.appendChild(sub);


    const list = document.createElement('ul');
    list.className = 'sh-list';

    block.appendChild(header);
    block.appendChild(list);
    shadow.appendChild(block);

    // stash a handle to the list so we can find it later without querying light DOM
    // (optional) but we’ll also support re-query below
    (host as any).__shList = list;
  }

  // retrieve the list from the shadow (first try cached handle, else query)
  const list =
    (host as any).__shList ||
    host.shadowRoot?.querySelector('.sh-list') as HTMLUListElement | null;

  if (!list) {
    return null;
  }

  return { list };
}

/**
 * Appends a placeholder store button to a list item for the store
 * @param li a list element for our store
 * @param storeName the name of the store
 * @returns the anchor, price and meta(finish) element
 */
export function appendStoreButton(li: HTMLLIElement, storeName: string) {
  const a = document.createElement('a');
  a.className = 'sh-pill sh-disabled'; // start disabled
  a.href = "#";
  a.tabIndex = -1;                // not focusable while disabled
  a.style.pointerEvents = "none"; // blocks clicks without listeners
  a.setAttribute('aria-disabled', 'true');
  a.rel = 'nofollow noopener';
  a.target = '_blank';

  const store = document.createElement('span');
  store.className = 'sh-store';
  store.textContent = storeName;

  const meta = document.createElement('span');
  meta.className = 'sh-meta'; // e.g., (Foil) – set later if applicable

  const price = document.createElement('span');
  // TODO handle currency
  price.className = 'sh-price';
  price.textContent = '…';

  a.append(store, meta, price);

  li.appendChild(a);
  return { a, priceEl: price, metaEl: meta };
}

export function makeStoreLi(label: string, logoUrl?: string) {
  const li = document.createElement("li");
  li.classList.add("scryhub-store");

  const { a, priceEl, metaEl } = appendStoreButton(li, label);
  return { li, a, priceEl, metaEl };
}

function formatMoney(m?: { amount: number; currency: string }) {
  if (!m) {
    return undefined;
  }
  try {
    // USD only for now
    return new Intl.NumberFormat("en-US", { style: "currency", currency: m.currency || "USD", minimumFractionDigits: 2 }).format(m.amount);
  } catch {
    return `$${m.amount.toFixed(2)}`;
  }
}

/**
 * 
 * @param a the anchor to decorate
 * @param priceEl the elmeent that will hold the price
 * @param url the url to buy the card
 * @param priceText a formated textual repressentation for the price if we have it
 */
export function populateButtonSuccess(a: HTMLAnchorElement, priceEl: HTMLElement, cardAnswer: FoundCardInformation) {
  const url = cardAnswer.url;
  const priceText = formatMoney(cardAnswer.price);

  // enable
  a.classList.remove('sh-disabled');
  a.removeAttribute('aria-disabled');
  a.tabIndex = 0;
  a.style.pointerEvents = ''; // ensure clickable
  a.href = url || '#';

  // based on confidence level style our pill
  if(cardAnswer.match === 'loose')
  {
    a.classList.add('sh-loose');
  }

  // price
  priceEl.textContent = priceText ?? '';

  if (cardAnswer.availability === 'out_of_stock') {
    a.classList.add('sh-oos');
    a.setAttribute('aria-disabled', 'true');
    a.tabIndex = -1;
  } else {
    a.classList.remove('sh-oos');
  }
}



export function populateButtonNotFound(priceEl: HTMLElement) {
  priceEl.textContent = "Not found";
}