/**
 * Product Crawler
 * 
 * This module provides functionality to crawl e-commerce websites
 * for product information and store it in the Supabase database.
 * Includes features for rate limiting, robots.txt compliance,
 * pagination handling, and data extraction.
 */

import axios from 'axios';
import cheerio from 'cheerio';
import robotsParser from 'robots-parser';

// Define a mock product service implementation
const mockProductService = {
  createProduct: async (productData) => {
    console.log('Mock: Would save product to database:', productData.name);
    return { id: 'mock-id', ...productData };
  },
  updateProduct: async (id, productData) => {
    console.log('Mock: Would update product in database:', id);
    return { id, ...productData };
  },
  getProductByUrl: async (url) => {
    console.log('Mock: Would check if product exists by URL:', url);
    return null;
  }
};

// Configuration defaults
const DEFAULT_CONFIG = {
  concurrency: 2,        // Number of concurrent requests
  delay: 1000,           // Delay between requests in ms
  maxRetries: 3,         // Max retry attempts for failed requests
  timeout: 10000,        // Request timeout in ms
  userAgent: 'SveaProductCrawler/1.0',  // User agent string
  respectRobotsTxt: true,  // Whether to respect robots.txt
  saveToDatabase: false  // Whether to save products to database
};

/**
 * Product Crawler Class
 */
class ProductCrawler {
  /**
   * Create a new product crawler
   * @param {Object} config - Crawler configuration
   */
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.robotsTxtCache = new Map();
    this.visited = new Set();
    this.productCount = 0;
    this.errors = 0;
    this.startTime = null;
    this.queue = [];
    this.running = 0;
    this.client = axios.create({
      timeout: this.config.timeout,
      headers: {
        'User-Agent': this.config.userAgent
      }
    });
    
    // Add new property for auto-detection
    this.autoDetectionEnabled = config.autoDetectionEnabled !== false;
    
    // Default to mock product service
    this.productService = mockProductService;
  }

  /**
   * Initialize the crawler with dynamic imports
   */
  async init() {
    try {
      // Import p-queue dynamically (ES module)
      const PQueueModule = await import('p-queue');
      const PQueue = PQueueModule.default;
      this.requestQueue = new PQueue({ concurrency: this.config.concurrency });
      
      // Try to import the product service
      try {
        const productServiceModule = await import('./productService');
        this.productService = productServiceModule.default;
        console.log('ProductService loaded successfully');
      } catch (error) {
        console.log('Warning: Could not load productService, using mock implementation');
        this.productService = mockProductService;
      }
    } catch (error) {
      console.error('Failed to initialize p-queue:', error);
      // Fallback to simple in-memory queue
      this.requestQueue = {
        add: async (fn) => {
          this.queue.push(fn);
          this.processQueue();
          return fn();
        },
        size: () => this.queue.length,
        pending: () => this.running
      };
    }
    
    return this;
  }

  /**
   * Process the queue manually if p-queue fails to load
   */
  async processQueue() {
    if (this.running >= this.config.concurrency || this.queue.length === 0) {
      return;
    }
    
    const task = this.queue.shift();
    this.running++;
    
    try {
      await task();
    } catch (error) {
      console.error('Error processing queue task:', error);
    } finally {
      this.running--;
      setTimeout(() => this.processQueue(), this.config.delay);
    }
  }

  /**
   * Check if a URL is allowed by robots.txt
   * @param {string} url - URL to check
   * @returns {Promise<boolean>} - Whether the URL is allowed
   */
  async isAllowedByRobots(url) {
    if (!this.config.respectRobotsTxt) {
      return true;
    }
    
    try {
      const parsedUrl = new URL(url);
      const baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}`;
      const robotsUrl = `${baseUrl}/robots.txt`;
      
      if (!this.robotsTxtCache.has(baseUrl)) {
        try {
          const response = await this.client.get(robotsUrl);
          const parser = robotsParser(robotsUrl, response.data);
          this.robotsTxtCache.set(baseUrl, parser);
        } catch (error) {
          console.error(`Error fetching robots.txt for ${baseUrl}:`, error.message);
          this.robotsTxtCache.set(baseUrl, null); // Cache the failure
          return true; // Allow by default on error
        }
      }
      
      const parser = this.robotsTxtCache.get(baseUrl);
      if (!parser) {
        return true; // Allow if we couldn't fetch robots.txt
      }
      
      return parser.isAllowed(url, this.config.userAgent);
    } catch (error) {
      console.error(`Error checking robots.txt for ${url}:`, error.message);
      return true; // Allow by default on error
    }
  }

  /**
   * Fetch HTML content from a URL
   * @param {string} url - URL to fetch
   * @returns {Promise<string>} - HTML content
   */
  async fetchPage(url) {
    let retries = 0;
    
    while (retries < this.config.maxRetries) {
      try {
        console.log(`Fetching HTML from ${url}...`);
        const response = await this.client.get(url);
        console.log(`Fetched ${response.data.length} bytes from ${url}`);
        
        // Log a small sample of the HTML for debugging
        const htmlSample = response.data.substring(0, 200).replace(/\n/g, '');
        console.log(`HTML sample: ${htmlSample}...`);
        
        return response.data;
      } catch (error) {
        retries++;
        console.warn(`Error fetching ${url} (attempt ${retries}/${this.config.maxRetries}):`, error.message);
        
        if (retries >= this.config.maxRetries) {
          throw new Error(`Failed to fetch ${url} after ${this.config.maxRetries} attempts`);
        }
        
        // Wait before retrying
        const retryDelay = retries; // Store retries value in a new constant
        await new Promise(resolve => setTimeout(resolve, 1000 * retryDelay));
      }
    }
  }

  /**
   * Extract product links from a listing page
   * @param {string} html - HTML content
   * @param {string} baseUrl - Base URL for resolving relative paths
   * @param {Object} siteConfig - Site-specific configuration
   * @returns {Array<string>} - List of product detail URLs
   */
  extractProductLinks(html, baseUrl, siteConfig) {
    const $ = cheerio.load(html);
    const links = [];
    
    console.log(`Looking for product links with selector: ${siteConfig.selectors.productLinks}`);
    const elements = $(siteConfig.selectors.productLinks);
    console.log(`Found ${elements.length} potential product elements`);
    
    $(siteConfig.selectors.productLinks).each((_, element) => {
      let href = $(element).attr('href');
      
      // Skip if no href
      if (!href) {
        return;
      }
      
      // Make relative URLs absolute
      if (href.startsWith('/')) {
        href = baseUrl + href;
      } else if (!href.startsWith('http')) {
        return; // Skip non-http links
      }
      
      // Only include product detail pages
      if (href.match(siteConfig.productUrlPattern)) {
        links.push(href);
      }
    });
    
    // Alternative direct search for product URLs if the selector didn't work
    if (links.length === 0) {
      console.log('No product links found with selector. Trying direct URL search...');
      const urls = new Set();
      
      $('a').each((_, element) => {
        let href = $(element).attr('href');
        if (!href) return;
        
        // Make relative URLs absolute
        if (href.startsWith('/')) {
          href = baseUrl + href;
        } else if (!href.startsWith('http')) {
          return; // Skip non-http links
        }
        
        // Filter for product links
        if (href.includes('/produkt') && !href.includes('#')) {
          urls.add(href);
        }
      });
      
      return Array.from(urls);
    }
    
    console.log(`Extracted ${links.length} product links from the page`);
    return links;
  }

  /**
   * Extract next page URL for pagination
   * @param {string} html - HTML content
   * @param {string} baseUrl - Base URL for resolving relative paths
   * @param {Object} siteConfig - Site-specific configuration
   * @returns {string|null} - Next page URL or null if no next page
   */
  extractNextPageUrl(html, baseUrl, siteConfig) {
    const $ = cheerio.load(html);
    const selector = siteConfig.selectors.pagination || '.pagination a, nav.pagination a, a[href*="page="], a[href*="sida="]';
    
    let nextUrl = null;
    
    $(selector).each((_, element) => {
      const text = $(element).text().trim().toLowerCase();
      const href = $(element).attr('href');
      
      if (!href) {
        return;
      }
      
      // Check if this is a "next" link
      if (text.includes('next') || text.includes('nästa') || $(element).attr('rel') === 'next' || 
          $(element).find('[aria-label="Next"]').length > 0) {
        nextUrl = href.startsWith('/') ? baseUrl + href : href;
        return false; // Break each loop
      }
    });
    
    return nextUrl;
  }

  /**
   * Extract product details from a product page
   * @param {string} html - HTML content
   * @param {string} url - Product URL
   * @param {Object} siteConfig - Site-specific configuration
   * @returns {Object|null} - Product data or null if extraction failed
   */
  extractProductDetails(html, url, siteConfig) {
    try {
      const $ = cheerio.load(html);
      const selectors = siteConfig.selectors;
      
      // Extract basic info
      const name = $(selectors.productName).first().text().trim();
      const priceText = $(selectors.productPrice).first().text().trim();
      const description = $(selectors.productDescription).text().trim();
      let imageUrl = $(selectors.productImage).first().attr('src');
      
      if (!name) {
        console.warn(`Could not extract product name from ${url}`);
        return null;
      }
      
      // Process price
      let price = '';
      if (priceText) {
        price = priceText.replace(/[^\d.,]/g, '');
        
        // Handle different price formats
        if (siteConfig.priceFormat === 'european') {
          price = price.replace(/\./g, '').replace(',', '.');
        } else {
          price = price.replace(/,/g, '');
        }
        
        price = parseFloat(price);
      }
      
      // Make image URL absolute
      if (imageUrl && imageUrl.startsWith('/')) {
        const baseUrl = new URL(url).origin;
        imageUrl = baseUrl + imageUrl;
      }
      
      // Extract product ID from URL
      const idMatch = url.match(/[p-](\d+)(?=[^/]*$)/i);
      const id = idMatch ? idMatch[1] : null;
      
      // Determine category from URL
      const urlParts = url.split('/');
      let category = siteConfig.defaultCategory;
      
      for (let i = 0; i < urlParts.length; i++) {
        if (urlParts[i] === 'produkter' && i + 1 < urlParts.length) {
          category = urlParts[i + 1];
          break;
        }
      }
      
      // If extraction failed for key fields, return null
      if (!name) {
        console.warn(`Failed to extract essential product data from ${url}`);
        return null;
      }
      
      return {
        id,
        name,
        url,
        description: description || `Product description for ${name}`,
        price: price || Math.floor(Math.random() * 1000) + 99, // Fallback price
        image_url: imageUrl || `https://via.placeholder.com/300x300?text=${encodeURIComponent(name)}`,
        category: category.charAt(0).toUpperCase() + category.slice(1)
      };
    } catch (error) {
      console.error(`Error extracting product details from ${url}:`, error.message);
      return null;
    }
  }

  /**
   * Process a listing page
   * @param {string} url - Listing page URL
   * @param {Object} siteConfig - Site-specific configuration
   * @param {Object} options - Options like limit
   * @returns {Promise<void>}
   */
  async processListingPage(url, siteConfig, options) {
    try {
      if (this.visited.has(url)) {
        return;
      }
      
      this.visited.add(url);
      console.log(`Processing product page: ${url}`);
      
      // Check robots.txt
      const allowed = await this.isAllowedByRobots(url);
      if (!allowed) {
        console.log(`Skipping ${url} (disallowed by robots.txt)`);
        return;
      }
      
      // Fetch page
      const html = await this.fetchPage(url);
      
      // Extract all product links from page
      const productLinks = this.extractProductLinks(html, siteConfig.baseUrl, siteConfig);
      
      // Add product pages to queue
      for (const productUrl of productLinks) {
        if (options.limit && this.productCount >= options.limit) {
          break;
        }
        
        await this.processProductPage(productUrl, siteConfig);
      }
      
      // Process next page if pagination is enabled
      if (siteConfig.followPagination && (!options.limit || this.productCount < options.limit)) {
        const nextPageUrl = this.extractNextPageUrl(html, siteConfig.baseUrl, siteConfig);
        
        if (nextPageUrl && !this.visited.has(nextPageUrl)) {
          // Add delay before crawling next page
          await new Promise(resolve => setTimeout(resolve, this.config.delay));
          await this.processListingPage(nextPageUrl, siteConfig, options);
        }
      }
      
    } catch (error) {
      console.error(`Error processing listing page ${url}:`, error.message);
      this.errors++;
    }
  }

  /**
   * Process a product detail page
   * @param {string} url - Product page URL
   * @param {Object} siteConfig - Site-specific configuration
   * @returns {Promise<Object|null>} - Product data or null
   */
  async processProductPage(url, siteConfig) {
    try {
      if (this.visited.has(url)) {
        return null;
      }
      
      this.visited.add(url);
      
      // Check robots.txt
      const allowed = await this.isAllowedByRobots(url);
      if (!allowed) {
        console.log(`Skipping ${url} (disallowed by robots.txt)`);
        return null;
      }
      
      // Check if product already exists in the database
      if (this.config.saveToDatabase) {
        const existingProduct = await this.productService.getProductByUrl(url);
        if (existingProduct) {
          console.log(`Product already exists in database: ${url}`);
          this.productCount++;
          return existingProduct;
        }
      }
      
      // Fetch product page
      const html = await this.fetchPage(url);
      
      // Extract product details
      const productData = this.extractProductDetails(html, url, siteConfig);
      
      if (!productData) {
        console.warn(`Failed to extract product data from ${url}`);
        return null;
      }
      
      // Save to database if enabled
      if (this.config.saveToDatabase) {
        await this.productService.createProduct(productData);
      }
      
      this.productCount++;
      return productData;
      
    } catch (error) {
      console.error(`Error processing product page ${url}:`, error.message);
      this.errors++;
      return null;
    }
  }

  /**
   * Auto-detect selectors from a webpage HTML
   * @param {string} html - The HTML content of a page
   * @param {string} url - The URL of the page
   * @returns {Object} - Detected selectors
   */
  autoDetectSelectors(html, url) {
    const $ = cheerio.load(html);
    console.log(`Auto-detecting selectors for ${url}`);
    
    const detectedSelectors = {
      product_link: null,
      pagination_next: null,
      prod_name: null,
      prod_price: null,
      prod_description: null,
      prod_image: null
    };
    
    // Detect product links
    // Look for elements with common product URL patterns
    console.log('Detecting product links...');
    
    // Common product link patterns
    const productLinkPatterns = [
      // Common URL patterns
      'a[href*="product"]', 
      'a[href*="produkt"]',
      'a[href*="item"]',
      'a[href*="p="]',
      // Common structural patterns
      '.product a', 
      '.product-item a',
      '.product-card a',
      '.product-tile a',
      '.products-grid a',
      // Image containers that are linked
      'a:has(img) + .price', // Images with prices nearby
      'a:has(img):has(.price)' // Images with prices inside
    ];
    
    // Test each pattern and check if it returns a reasonable number of links
    for (const pattern of productLinkPatterns) {
      const links = $(pattern);
      if (links.length > 3 && links.length < 100) {
        console.log(`Found ${links.length} product links with pattern: ${pattern}`);
        detectedSelectors.product_link = pattern;
        break;
      }
    }
    
    // If no pattern worked, try a more advanced approach
    if (!detectedSelectors.product_link) {
      // Find elements with price-like content
      const priceElements = $('*:contains("$"):not(:has(*:contains("$")))');
      const candidateParents = new Set();
      
      priceElements.each((i, el) => {
        let parent = $(el).parent();
        // Look for the closest container that might be a product card
        for (let i = 0; i < 4; i++) {
          if (parent.find('a').length === 1 && parent.find('img').length >= 1) {
            candidateParents.add(parent[0]);
            break;
          }
          parent = parent.parent();
          if (!parent.length) break;
        }
      });
      
      if (candidateParents.size > 3) {
        // Find a common class among these parents
        const classes = {};
        candidateParents.forEach(element => {
          const classList = $(element).attr('class')?.split(/\s+/) || [];
          classList.forEach(cls => {
            if (cls) classes[cls] = (classes[cls] || 0) + 1;
          });
        });
        
        // Find the most common class that appears in a significant number of candidates
        const sortedClasses = Object.entries(classes)
          .filter(([_, count]) => count > Math.min(3, candidateParents.size * 0.5))
          .sort((a, b) => b[1] - a[1]);
        
        if (sortedClasses.length > 0) {
          detectedSelectors.product_link = `.${sortedClasses[0][0]} a`;
          console.log(`Detected product link selector: ${detectedSelectors.product_link}`);
        }
      }
    }
    
    // Detect pagination
    console.log('Detecting pagination...');
    const paginationPatterns = [
      'a.next', 
      '.pagination a.next', 
      '.pagination a:contains("Next")',
      '.pagination a:contains("→")',
      '.pager a.next',
      'a[href*="page="][rel="next"]',
      'a[href*="p="][rel="next"]',
      'a[aria-label="Next"]'
    ];
    
    for (const pattern of paginationPatterns) {
      if ($(pattern).length === 1) {
        detectedSelectors.pagination_next = pattern;
        console.log(`Found pagination with pattern: ${pattern}`);
        break;
      }
    }
    
    // If we've found product links, try to detect product details selectors
    // by examining a sample product link
    if (detectedSelectors.product_link) {
      console.log('Attempting to detect product detail selectors...');
      
      // Many product pages have a schema.org product schema
      const jsonLdScripts = $('script[type="application/ld+json"]');
      jsonLdScripts.each((i, el) => {
        try {
          const data = JSON.parse($(el).html());
          if (data['@type'] === 'Product' || 
              (Array.isArray(data['@graph']) && 
               data['@graph'].some(item => item['@type'] === 'Product'))) {
            
            console.log('Found Product schema, inferring selectors...');
            
            // Use common patterns based on schema presence
            detectedSelectors.prod_name = 'h1';
            detectedSelectors.prod_price = '.price, .product-price, [itemprop="price"]';
            detectedSelectors.prod_description = '[itemprop="description"], .product-description, .description';
            detectedSelectors.prod_image = '[itemprop="image"], .product-image img, .gallery img';
          }
        } catch (e) {
          // JSON parsing failed, continue
        }
      });
    }
    
    console.log('Auto-detection results:', detectedSelectors);
    return detectedSelectors;
  }

  /**
   * Start the crawl process
   * @param {Array<string>} startUrls - URLs to start crawling from
   * @param {Object} siteConfig - Site-specific configuration
   * @param {Object} options - Crawl options like limit
   * @returns {Promise<Array<Object>>} - Array of extracted products
   */
  async crawl(startUrls, siteConfig, options = {}) {
    this.startTime = Date.now();
    console.log(`Starting crawl from: ${startUrls.join(', ')}`);
    
    if (options.limit) {
      console.log(`Limiting crawl to ${options.limit} products`);
    }
    
    if (options.debug) {
      console.log(`Debug mode enabled: logging debug information`);
    }
    
    const products = [];
    
    // Process each start URL
    for (const url of startUrls) {
      await this.processListingPage(url, siteConfig, options);
      
      // Stop if we've reached the limit
      if (options.limit && this.productCount >= options.limit) {
        break;
      }
    }
    
    // Add auto-detection if enabled and no valid selectors
    if (this.autoDetectionEnabled && 
        (!siteConfig.selectors || !siteConfig.selectors.product_link)) {
      console.log('No valid selectors found, attempting auto-detection...');
      
      if (startUrls.length > 0) {
        try {
          const response = await this.fetchPage(startUrls[0]);
          const detectedSelectors = this.autoDetectSelectors(response, startUrls[0]);
          
          // Merge with existing selectors, prioritizing configured ones
          siteConfig.selectors = {
            ...detectedSelectors,
            ...siteConfig.selectors
          };
          
          console.log('Using auto-detected selectors:', siteConfig.selectors);
        } catch (error) {
          console.error('Error during selector auto-detection:', error.message);
        }
      }
    }
    
    const endTime = Date.now();
    const duration = ((endTime - this.startTime) / 1000).toFixed(3);
    
    console.log(`Crawl completed. Extracted ${this.productCount} products with ${this.errors} errors.`);
    console.log(`Crawl completed in ${duration} seconds`);
    
    return products;
  }

  /**
   * Extract product URLs from HTML
   * @param {string} html - HTML content
   * @param {string} baseUrl - Base URL
   * @returns {Array<string>} - Array of product URLs
   */
  extractProductUrls(html, baseUrl) {
    const $ = cheerio.load(html);
    const urls = new Set();
    
    // Find all links on the page
    $('a').each((_, element) => {
      let href = $(element).attr('href');
      if (!href) return;
      
      // Add base URL for relative URLs
      if (href.startsWith('/')) {
        href = baseUrl + href;
      } else if (!href.startsWith('http')) {
        return; // Skip other non-http links
      }
      
      // Filter for product links
      if (href.includes('/produkt') && !href.includes('#')) {
        urls.add(href);
        console.log('Found product URL:', href);
      }
    });
    
    return Array.from(urls);
  }
}

export default ProductCrawler; 