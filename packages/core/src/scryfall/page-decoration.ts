import { FoundCardInformation } from "@scryhub/protocol";


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

/**
 * Creates or retrieves the div we are going to use to mount our buttons on
 * @returns a list of items to add to our scryhub section
 */
export function ensureHubSection(): { list: HTMLUListElement } | null {
    // not right page or the dom doesn't have the id anymore
    const col = storesColumn();
    if (!col) {
        return null;
    };

    // get or make our div
    let scryhubSectionDiv = document.getElementById("scryhub-section");
    if (!scryhubSectionDiv) {
        scryhubSectionDiv = document.createElement("div");
        scryhubSectionDiv.id = "scryhub-section";
        scryhubSectionDiv.innerHTML = `<h6>Buy Locally (ScryHub)</h6><ul class="toolbox-links"></ul>`;
        scryhubSectionDiv.style = "padding: 20px 0px;"
        col.appendChild(scryhubSectionDiv);
    }

    return { list: scryhubSectionDiv.querySelector(".toolbox-links") as HTMLUListElement };
}

export function makeStoreLi(label: string, logoUrl?: string) {
  const li = document.createElement("li");
  const a = document.createElement("a");
  a.className = "button-n disabled";
  a.href = "#";
  a.tabIndex = -1;                // not focusable while disabled
  a.style.pointerEvents = "none"; // blocks clicks without listeners
  a.style.opacity = "0.6";

  if (logoUrl) {
    const img = document.createElement("img");
    img.src = logoUrl;
    img.alt = "";
    img.style.width = "16px";
    img.style.height = "16px";
    img.style.verticalAlign = "middle";
    img.style.marginRight = "6px";
    a.appendChild(img);
  }

  const labelEl = document.createElement("i");
  labelEl.textContent = label;
  a.appendChild(labelEl);

  const price = document.createElement("span");
  // TODO handle currency
  price.className = "price currency-usd";
  price.textContent = "…";
  a.appendChild(price);

  li.appendChild(a);
  return { li, a, priceEl: price };
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

  // enable the link
  a.classList.remove("disabled");
  a.style.opacity = "";
  // remove block of events
  a.style.pointerEvents = "";
  a.href = url;
  a.target = "_blank";
  a.rel = "nofollow";

  // nothing more to decorate
  if(!priceText) {
    priceEl.textContent = ""
    return;
  }

  priceEl.textContent = priceText;
  // make it faded if out of stock
  if(cardAnswer.availability === 'out_of_stock') {
    a.style.opacity = "0.5";
  }
}

export function populateButtonNotFound(priceEl: HTMLElement) {
  priceEl.textContent = "Not found";
}