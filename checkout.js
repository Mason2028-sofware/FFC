chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'PURCHASE_COMPLETED') {
        chrome.storage.local.get(['totalSpent', 'purchaseHistory'], (data) => {
            const currentTotal = data.totalSpent || 0;
            const history = data.purchaseHistory || [];
            
            const newTotal = currentTotal + message.data.total;
            history.push(message.data);

            // Save the new running total and the history log
            chrome.storage.local.set({ 
                totalSpent: newTotal,
                purchaseHistory: history 
            }, () => {
                console.log(`Total updated: $${newTotal.toFixed(2)}`);
            });
        });
    }
});