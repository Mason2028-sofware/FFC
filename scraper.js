export const universalScraper = (configs) => {
    const host = window.location.hostname;

    let site;
    let siteLabel;

    if (host.includes('amazon')) {
        site = configs.amazon;
        siteLabel = 'Amazon';
    } else if (host.includes('nike')) {
        site = configs.nike;
        siteLabel = 'Nike';
    } else if (host.includes('ebay')) {
        site = configs.ebay;
        siteLabel = 'eBay';
    } else if (host.includes('bestbuy')) {
        site = configs.bestBuy;  // matches websites.js key
        siteLabel = 'Best Buy';
    }

    if (!site) return { success: false };

    const containers = Array.from(document.querySelectorAll(site.itemContainer));
    console.log('[FFC] containers found:', containers.length, 'using selector:', site.itemContainer);

    const foundItems = containers.map(container => {
        const nameEl  = container.querySelector(site.name);
        const priceEl = container.querySelector(site.prices);

        console.log('[FFC] nameEl:', nameEl?.innerText?.trim(), '| priceEl:', priceEl?.innerText?.trim());

        if (!priceEl) return null;

        const rawName   = nameEl ? nameEl.innerText : 'Unknown Product';
        const cleanName = rawName.trim().replace(/\s+/g, ' ');
        const priceMatch = priceEl.innerText.match(/\$\d+[\.,]\d{2}/);
        const finalPrice = priceMatch ? priceMatch[0] : 'N/A';

        return { name: cleanName || 'Product', price: finalPrice };
    }).filter(Boolean);

    return {
        success: foundItems.length > 0,
        site: siteLabel,
        items: foundItems
    };
};