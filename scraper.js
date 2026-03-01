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

    const checkoutBtn = document.querySelector('[data-testid="SPC_selectPlaceOrder"]');

    if (checkoutBtn && !checkoutBtn.dataset.listener) {
        checkoutBtn.dataset.listener = "true";
        checkoutBtn.addEventListener('click', () => {
            const total = foundItems.reduce((sum, item) => sum + parsePrice(item.price), 0);
            
            chrome.runtime.sendMessage({
                type: 'PURCHASE_COMPLETED',
                data: { 
                    total: total, 
                    site: 'Amazon',
                    timestamp: Date.now() 
                }
            });
        });
    }

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