document.getElementById('clickMe').addEventListener('click', async () => {
    const display = document.getElementById('display');
    
    // 1. Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url.includes("amazon.com")) {
        display.innerHTML = "<p style='color:red;'>Please go to an Amazon checkout page.</p>";
        return;
    }

    display.innerHTML = "Scanning page...";

    // 2. Execute the script in ALL frames of the page
    chrome.scripting.executeScript({
        target: { 
            tabId: tab.id, 
            allFrames: true // This is critical for Amazon's "Chewbacca" pipeline
        },
        func: () => {
            // This function runs inside every frame on the Amazon page
            const nameEl = document.querySelector('.lineitem-title-text');
            const priceEl = document.querySelector('.lineitem-price-text');

            if (nameEl || priceEl) {
                return {
                    name: nameEl ? nameEl.innerText.trim() : "Name not found",
                    price: priceEl ? priceEl.innerText.replace(/\s\s+/g, ' ').trim() : "Price not found"
                };
            }
            return null; // Return null if this specific frame doesn't have the data
        }
    }, (injectionResults) => {
        if (chrome.runtime.lastError) {
            display.innerHTML = `<p style='color:red;'>Error: ${chrome.runtime.lastError.message}</p>`;
            return;
        }

        // 3. Filter the results to find the frame that actually returned data
        const validFrame = injectionResults.find(frame => frame.result !== null);

        if (validFrame && validFrame.result) {
            const data = validFrame.result;
            display.innerHTML = `
                <div style="border-left: 4px solid #ff9900; padding: 10px; background: #f9f9f9;">
                    <p><strong>Item:</strong> ${data.name}</p>
                    <p><strong>Price:</strong> ${data.price}</p>
                    <p style="font-size: 0.7em; color: gray; margin-top: 10px;">
                        Scanned at: ${new Date().toLocaleTimeString()}
                    </p>
                </div>
            `;
            
            // Optional: Save to local storage for your "tracking" feature
            chrome.storage.local.get({history: []}, (res) => {
                const history = res.history;
                history.push({ ...data, date: new Date().toISOString() });
                chrome.storage.local.set({history: history});
            });

        } else {
            display.innerHTML = `
                <p style="color:orange;">Item not detected yet.</p>
                <p style="font-size: 0.8em;">Try scrolling the checkout list into view and click again.</p>
            `;
        }
    });
});