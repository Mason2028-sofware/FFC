chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_ITEM_DATA") {
        // Target the specific classes you provided
        const nameEl = document.querySelector('.lineitem-title-text');
        const priceEl = document.querySelector('.lineitem-price-text');

        // Extract and clean the text
        const scrapedName = nameEl ? nameEl.innerText.trim() : "Name not found";
        
        // The regex replaces multiple newlines/spaces with a single space
        const scrapedPrice = priceEl ? priceEl.innerText.replace(/\s\s+/g, ' ').trim() : "Price not found";

        // Send the data back to popup.js
        sendResponse({
            name: scrapedName,
            price: scrapedPrice
        });
    }
    // Return true to indicate we will send a response asynchronously
    return true; 
});