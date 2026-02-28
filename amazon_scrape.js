/**
 * UI Helper: Refreshes the history list in the popup
 */
const updateHistoryUI = () => {
    chrome.storage.local.get({history: []}, (data) => {
        const list = document.getElementById('historyList');
        if (!list) return;

        list.innerHTML = data.history.length ? '' : '<p style="font-size:0.8em; color:#888;">No history yet.</p>';
        
        [...data.history].reverse().slice(0, 5).forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            // Show the Grand Total in the history list
            div.innerHTML = `
                <span class="history-name">${item.name}</span>
                <span class="price-badge">${item.grandTotal}</span>
            `;
            list.appendChild(div);
        });
    });
};

/**
 * Main Scraper Function
 * Runs inside the Amazon page
 */
const amazonScraper = () => {
    const nameEl = document.querySelector('.lineitem-title-text');
    const itemName = nameEl ? nameEl.innerText.trim() : "Unknown Item";

    // Grab all summary values ($ amounts)
    const values = Array.from(document.querySelectorAll('.order-summary-line-definition'));
    
    // Clean the text for all found prices
    const prices = values.map(v => v.innerText.replace(/\s\s+/g, ' ').trim());

    /* Amazon Summary Order usually follows this index:
       [0] - Items Subtotal (e.g., $1.25)
       [1] - Shipping & Handling
       [2] - Total before tax
       [last] - Grand Total (e.g., $9.37)
    */

    if (prices.length > 0) {
        return {
            name: itemName,
            itemPrice: prices[0] || "N/A",
            shipping: prices[1] || "N/A",
            grandTotal: prices[prices.length - 1] || "N/A",
            allPrices: prices // Keeps everything just in case
        };
    }
    return null;
};

document.addEventListener('DOMContentLoaded', updateHistoryUI);

document.getElementById('clickMe').addEventListener('click', async () => {
    const display = document.getElementById('display');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    try {
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id, allFrames: true },
            func: amazonScraper
        });

        const found = results.find(res => res.result !== null);

        if (found && found.result) {
            const data = found.result;
            
            // Show the breakdown in the popup
            display.innerHTML = `
                <div style="font-size: 0.9em; line-height: 1.4;">
                    <strong>${data.name.substring(0, 35)}...</strong>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 8px 0;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Item Price:</span> <span>${data.itemPrice}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Shipping:</span> <span>${data.shipping}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 5px; color: #B12704;">
                        <span>Order Total:</span> <span>${data.grandTotal}</span>
                    </div>
                </div>
            `;

            // Save to Storage
            chrome.storage.local.get({history: []}, (res) => {
                const newHistory = res.history;
                newHistory.push(data);
                chrome.storage.local.set({history: newHistory}, updateHistoryUI);
            });

        } else {
            display.innerHTML = "Prices not found. Ensure the 'Order Summary' is loaded.";
        }
    } catch (err) {
        display.innerHTML = "Error: " + err.message;
    }
});