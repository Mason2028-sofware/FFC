const CART_URLS = [
  'amazon.com/checkout',
  'amazon.com/cart',
  'nike.com/cart',
  'cart.ebay.com',
  'bestbuy.com/cart'
];

const isCartUrl = (url) => url && CART_URLS.some(pattern => url.includes(pattern));

const injectOverlay = (tabId) => {
  chrome.scripting.executeScript({
    target: { tabId },
    files: ['content.js']
  }).catch(() => {}); // silently ignore if already injected
};

// Fires on full page navigations
chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId !== 0) return; // main frame only
  if (isCartUrl(details.url)) {
    injectOverlay(details.tabId);
  }
});

// Fires on SPA navigations (Nike, eBay use these)
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  if (details.frameId !== 0) return;
  if (isCartUrl(details.url)) {
    injectOverlay(details.tabId);
  }
});
