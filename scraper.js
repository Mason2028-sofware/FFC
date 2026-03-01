export const universalScraper = (configs) => {
    const host = window.location.hostname;

    let site;
    //sets the site equal to the right one based on the url, if it doesn't match any of the sites we support, it returns null and the scraper stops
    if (host.includes('amazon')) {
        site = configs.amazon;
    } else if (host.includes('nike')) {
        site = configs.nike;
    } else if (host.includes('ebay')) {
        site = configs.ebay;
    } else if (host.includes('bestbuy')) {
        site = configs.bestBuy;
    } else {
        site = null;
    }

    if (!site) return { success: false };
    //selects all of the data from the data in the item container, then maps through it to get the name and price of each item, if the price element doesn't exist it skips that item, then it filters out any null items (items without prices) and returns the final array of items with their names and prices
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
            //checks if the price text contains a valid price format, if it does it uses that, otherwise it defaults to "N/A"`
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
        site: host.includes('nike') ? 'Nike' : (host.includes('bestbuy') ? 'Best Buy' : (host.includes('amazon') ? 'Amazon' : 'Ebay')),
        items: foundItems
    };
};