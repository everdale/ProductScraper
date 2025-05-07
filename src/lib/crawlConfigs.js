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
  productUrlPattern: '/(sv|en)/products/', // Regex pattern to identify product pages
  followPagination: true, // Whether to follow pagination links
  
  // CSS selectors for extracting data
  selectors: {
    // Product listing page selectors
    productLinks: '.product-list-item a.product-list-item__link, .product-grid-item a.product-grid-item__link',
    paginationLinks: '.pagination a[href]',
    
    // Product detail page selectors
    name: 'h1.product-title',
    price: '.product-price-component .price',
    description: '.product-information__description',
    imageUrl: '.product-gallery__image img, .product-gallery-slider__image img',
    
    // Product specifications
    specifications: '.product-specifications tr',
    specLabel: 'th',
    specValue: 'td'
  },
  
  // Starting URLs for crawling
  startUrls: [
    'https://www.kjell.com/se/produkter/dator/datorkomponenter',
    'https://www.kjell.com/se/produkter/hem-kontor/kontorsbelysning'
  ]
};

/**
 * Available crawler configurations
 */
const availableConfigs = {
  kjell: kjellConfig,
  // Add more configurations for other sites here
};

module.exports = {
  kjellConfig,
  availableConfigs
};

module.exports.default = availableConfigs; 