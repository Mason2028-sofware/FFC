export const universalScraper = (configs) => {
    const host = window.location.hostname;
    
    let site;

    if (host.includes('amazon')) {
        site = configs.amazon;
    } else if (host.includes('nike')) {
        site = configs.nike;
    } else if (host.includes('ebay')) {
        site = configs.ebay;
    } else if (host.includes('bestbuy')) {
        site = configs.bestBuy;
    }
    if (!site) return { success: false };

    const containers = Array.from(document.querySelectorAll(site.itemContainer));
    console.log(containers);

    const foundItems = containers.map(container => {
        const nameEl = container.querySelector(site.name);
        const priceEl = container.querySelector(site.prices);
        
        //console.log(nameEl.innerText);
        console.log(priceEl);

        if (priceEl) {
            // Ensure name is a string, even if the element is missing

            const rawName = nameEl ? nameEl.innerText : "Unknown Product";
            const cleanName = rawName.trim().replace(/\s+/g, ' ');
            
            const priceMatch = priceEl.innerText.match(/\$\d+\.\d{2}/);
            const finalPrice = priceMatch ? priceMatch[0] : "N/A";

            return {
                name: cleanName || "Product",
                price: finalPrice
            };
        }
        return null;
    }).filter(item => item !== null);

    return {
        success: foundItems.length > 0,
        site: host.includes('nike') ? 'Nike' : host.includes('bestbuy') ? 'Best Buy' : host.includes('amazon') ? 'Amazon' : 'E-Bay',
        items: foundItems
    };
};