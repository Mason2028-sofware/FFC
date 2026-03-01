export const SITE_CONFIGS = {
    amazon: {
        itemContainer: '.product-description-column', //container for each item in your cart
        name: '.lineitem-title-text',//name of the item in the elements
        prices: '.lineitem-price-text',//price of the item in the elements
        checkout: '[data-testid="SPC_selectPlaceOrder"]'//the button that you click to place the order, we can use this to trigger the scraper when the user goes to place an order
    },
    nike: {
        itemContainer: '[data-automation="cart-item"]',
        name: '[data-automation="cart-item-product-name"]',
        prices: '.formatted-price',
        checkout: '[data-automation="member-checkout-button"]'
    },
    ebay: {
        itemContainer: '.evo-item-detail',
        name: 'a[data-test-id="cart-item-link"]',
        prices: '.price-details',
        checkout: 'button[data-test-id="cta-top"]'
    },
    bestBuy: {
        itemContainer: '.card',
        name: '.cart-item__title',
        prices: '.price-block',
        checkout: 'button[data-track="Checkout - Top"]'
    }
};