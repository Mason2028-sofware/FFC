chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'PURCHASE_COMPLETED') {
        chrome.storage.local.get(['budget', 'totalSpent', 'purchaseHistory'], (data) => {
            const currentBudget = parseFloat(data.budget) || 0;
            const orderTotal = message.data.total;
            
            const newBudget = currentBudget - orderTotal;
            const newTotalSpent = (data.totalSpent || 0) + orderTotal;
            
            const history = data.history || [];
            history.push({ ...message.data, remainingBudget: newBudget });

            chrome.storage.local.set({ 
                budget: newBudget.toFixed(2),
                totalSpent: newTotalSpent,
                history: history 
            });
        });
    }
});