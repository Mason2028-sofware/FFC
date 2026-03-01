export const SITE_CONFIGS = {
    amazon: {
        itemContainer: '.product-description-column', 
        name: '.lineitem-title-text',
        prices: '.lineitem-price-text'
    },
    nike: {
        itemContainer: '[data-automation="cart-item"]',
        name: '[data-automation="cart-item-product-name"]',
        prices: '.formatted-price'
    },
    ebay: {
        itemContainer: '.evo-item-detail',
        name: 'a[data-test-id="cart-item-link"]',
        prices: '.price-details'
    },
    walmart: {
        itemContainer: '.flex flex-column column2',
        name: 'a[href*="2353822796"]',
        prices: '.f2'
    }
};