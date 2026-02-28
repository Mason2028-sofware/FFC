import { SITE_CONFIGS } from './websites.js';
import { universalScraper } from './scraper.js';

document.getElementById('clickMe').addEventListener('click', async () => {
    const display = document.getElementById('display');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    display.innerHTML = "Scanning items...";

    try {
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id, allFrames: true },
            func: universalScraper,
            args: [SITE_CONFIGS]
        });

        const found = results.find(res => res.result && res.result.success);

        if (found) {
            const { items, site } = found.result;
            let itemsHtml = `<div style="color: #888; font-size: 0.7em; margin-bottom: 8px;">${site} Order</div>`;
            
            items.forEach(item => {
                // Fix: Check if item.name exists before using substring
                const displayName = item.name ? item.name.substring(0, 45) : "Item";
                
                itemsHtml += `
                    <div style="border-bottom: 1px solid #eee; padding: 8px 0; display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                        <span style="font-size: 0.85em; color: #232f3e; flex: 1;">${displayName}...</span>
                        <span style="font-weight: bold; color: #B12704;">${item.price}</span>
                    </div>
                `;
            });

            display.innerHTML = itemsHtml;
        } else {
            display.innerHTML = "No items found. Make sure the 'Review Items' section is visible.";
        }
    } catch (e) {
        // This will now catch any other potential errors without breaking the popup
        display.innerHTML = "<div style='color:red;'>Selection Error: " + e.message + "</div>";
    }
});