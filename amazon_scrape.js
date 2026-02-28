/**
 * UI Helper: Refreshes the history list in the popup
 */
const updateHistoryUI = () => {
    chrome.storage.local.get({history: []}, (data) => {
        const list = document.getElementById('historyList');
        if (!list) return;

        list.innerHTML = data.history.length ? '' : '<p style="font-size:0.8em; color:#888;">No items saved yet.</p>';
        
        // Show the 5 most recent scans
        [...data.history].reverse().slice(0, 5).forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <span class="history-name" title="${item.name}">${item.name}</span>
                <span class="price-badge">${item.total}</span>
            `;
            list.appendChild(div);
        });
    });
};

/**
 * Main Scraper Function
 * This runs inside the Amazon page context
 */
const amazonScraper = () => {
    // 1. Find Item Name
    const nameEl = document.querySelector('.lineitem-title-text');
    const itemName = nameEl ? nameEl.innerText.trim() : "Unknown Item";

    // 2. Find ALL summary rows
    // We look for rows that contain labels and values
    const rows = Array.from(document.querySelectorAll('.order-summary-line-definition'));
    
    // 3. Logic to find the "Final Total" 
    // Usually, the grand total is the very last definition on the page.
    let grandTotal = "Not Found";
    if (rows.length > 0) {
        const lastRow = rows[rows.length - 1];
        // Clean up the massive whitespace Amazon uses
        grandTotal = lastRow.innerText.replace(/\s\s+/g, ' ').trim();
    }

    // 4. Fallback: If the class above fails, try to find the bold total
    if (grandTotal === "Not Found" || grandTotal === "") {
        const boldTotal = document.querySelector('.a-color-price.a-size-medium.a-text-bold');
        if (boldTotal) grandTotal = boldTotal.innerText.trim();
    }

    return {
        name: itemName,
        total: grandTotal,
        timestamp: new Date().toISOString()
    };
};

/**
 * Event Listeners
 */
document.addEventListener('DOMContentLoaded', updateHistoryUI);

document.getElementById('clickMe').addEventListener('click', async () => {
    const display = document.getElementById('display');
    
    try {
        // Get the active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab.url.includes("amazon.com")) {
            display.innerHTML = "<p style='color:red;'>Please stay on the Amazon Checkout page.</p>";
            return;
        }

        display.innerHTML = "Scanning all price fields...";

        // Inject the scraper into all frames
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id, allFrames: true },
            func: amazonScraper
        });

        // Find the frame that actually returned data (not null/Unknown)
        const validResult = results.find(res => res.result && res.result.total !== "Not Found");

        if (validResult && validResult.result) {
            const data = validResult.result;
            
            // Update Main Display
            display.innerHTML = `
                <div style="border-left: 4px solid #ff9900; padding-left: 10px;">
                    <span class="total-label">Final Order Total</span><br>
                    <span class="price-badge" style="font-size: 1.4em;">${data.total}</span>
                    <p style="margin-top: 8px; font-size: 0.85em; color: #555;">${data.name.substring(0, 50)}...</p>
                </div>
            `;

            // Save to Local Storage
            chrome.storage.local.get({history: []}, (res) => {
                const newHistory = res.history;
                // Avoid duplicates if user clicks twice on same item
                const isDuplicate = newHistory.length > 0 && newHistory[newHistory.length - 1].name === data.name;
                
                if (!isDuplicate) {
                    newHistory.push(data);
                    chrome.storage.local.set({history: newHistory}, updateHistoryUI);
                }
            });

        } else {
            display.innerHTML = `
                <p style="color:orange;">Total not found yet.</p>
                <p style="font-size:0.8em;">Make sure your <b>Order Summary</b> is visible on the right side of the screen.</p>
            `;
        }

    } catch (err) {
        console.error("Critical Extension Error:", err);
        display.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
    }
});