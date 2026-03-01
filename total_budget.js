chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'PURCHASE_COMPLETED') {
        // We pull the current budget and history
        chrome.storage.local.get(['budget', 'totalSpent', 'purchaseHistory'], (data) => {
            const currentBudget = parseFloat(data.budget) || 0;
            const orderTotal = message.data.total;
            
            // Calculate the new remaining budget
            const newBudget = currentBudget - orderTotal;
            const newTotalSpent = (data.totalSpent || 0) + orderTotal;
            
            const history = data.history || [];
            history.push({ ...message.data, remainingBudget: newBudget });

            // Save everything back to storage
            chrome.storage.local.set({ 
                budget: newBudget.toFixed(2), // This "lowers" the budget
                totalSpent: newTotalSpent,
                history: history 
            });
        });
    }
});