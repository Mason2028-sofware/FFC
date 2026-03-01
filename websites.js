export const SITE_CONFIGS = {
    amazon: {
        itemContainer: '.product-description-column', //container for each item in your cart
        name: '.lineitem-title-text',//name of the item in the elements
        prices: '.lineitem-price-text'//price of the item in the elements
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
    bestBuy: {
        itemContainer: '.card',
        name: '.cart-item__title',
        prices: '.price-block'
    }
};