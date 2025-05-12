/**
 * Crawler Configurations
 * 
 * This file contains site-specific configurations for different
 * e-commerce websites that can be crawled using the ProductCrawler.
 */

/**
 * Kjell & Company (kjell.com) configuration
 */
const kjellConfig = {
  // Site metadata
  name: 'Kjell & Company',
  baseUrl: 'https://www.kjell.com',
  defaultCategory: 'Electronics',
  priceFormat: 'european', // Uses comma as decimal separator
  
  // URL patterns
  productUrlPattern: '/(sv|en|se)/produkt', // Regex pattern to identify product pages
  followPagination: true, // Whether to follow pagination links
  
  // Starting URLs
  startUrls: [
    'https://www.kjell.com/se/produkter/dator/datorkomponenter',
    'https://www.kjell.com/se/produkter/hem-kontor/kontorsbelysning'
  ],
  
  // CSS selectors for extracting data (updated for 2023 website structure)
  selectors: {
    // Product listing page selectors
    productLinks: 'a[data-test-id][href*="produkt"], a[data-scope-link][href*="produkt"], a[href*="produkt"]',
    pagination: 'a.pagination__link, a[href*="page="], a[href*="sida="]',
    
    // Product detail page selectors
    productName: 'h1.product-name, .product-header__name, [data-test-id="product-name"]',
    productPrice: '.product-price, .product-header__price, [data-test-id="product-price"]',
    productDescription: '.product-description, .product-information__description, [data-test-id="product-description"]',
    productImage: '.product-image img, .product-gallery__main-image img, [data-test-id="product-image"] img',
    
    // Product specifications
    specifications: '.product-specifications__item, .product-data li, .product-specs tr',
    specLabel: '.product-specifications__label, .product-data__label, .product-specs th',
    specValue: '.product-specifications__value, .product-data__value, .product-specs td'
  }
};

/**
 * Export available configurations
 */
const availableConfigs = {
  kjell: kjellConfig
};

export { availableConfigs }; 