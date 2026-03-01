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
    walmart: {
        itemContainer: '[data-testid="product-tile-container"]',
        name: '[data-testid="productName"]',
        prices: '[class="w_iUH7"]'
    },
    bestBuy: {
        itemContainer: '.card',
        name: '.cart-item_title',
        prices: '.price-block'
    }
};