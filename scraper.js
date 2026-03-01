export const universalScraper = (configs) => {
    const host = window.location.hostname;

    const site = host.includes('amazon') ? configs.amazon : (host.includes('nike') ? configs.nike : (host.includes('walmart') ? configs.walmart : (host.includes('bestbuy') ? configs.bestBuy : null)));

    if (!site) return { success: false };

    const containers = Array.from(document.querySelectorAll(site.itemContainer));
    
    const foundItems = containers.map(container => {
        const nameEl = container.querySelector(site.name);
        const priceEl = container.querySelector(site.prices);
        
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
        site: host.includes('nike') ? 'Nike' : (host.includes('bestbuy') ? 'Best Buy' : 'Amazon'),
        items: foundItems
    };
};