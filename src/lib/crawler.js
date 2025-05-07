/**
 * Product Crawler
 * 
 * This module provides functionality to crawl e-commerce websites
 * for product information and store it in the Supabase database.
 * Includes features for rate limiting, robots.txt compliance,
 * pagination handling, and data extraction.
 */

const axios = require('axios');
const cheerio = require('cheerio');
const PQueue = require('p-queue');
const { parse: parseRobots } = require('robots-parser');
const productService = require('./productService');

// Configuration defaults
const DEFAULT_CONFIG = {
  concurrency: 2,        // Number of concurrent requests
  delay: 1000,           // Delay between requests in ms
  maxRetries: 3,         // Max retry attempts for failed requests
  timeout: 10000,        // Request timeout in ms
  userAgent: 'SveaProductCrawler/1.0', // User agent for requests
  respectRobotsTxt: true // Whether to respect robots.txt rules
};

/**
 * Product Crawler class for extracting product data from e-commerce sites
 */
class ProductCrawler {
  /**
   * Create a new ProductCrawler instance
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.queue = new PQueue({ concurrency: this.config.concurrency });
    this.robotsCache = new Map(); // Cache for robots.txt rules
    this.visited = new Set(); // Track visited URLs
    this.results = []; // Store extracted product data
    this.errors = []; // Store errors
    
    // Configure axios instance
    this.client = axios.create({
      timeout: this.config.timeout,
      headers: {
        'User-Agent': this.config.userAgent
      }
    });
  }
  
  /**
   * Fetch and parse robots.txt for a domain
   * @param {string} baseUrl - Base URL of the site
   * @returns {Promise<Object>} - Parsed robots.txt rules
   */
  async getRobotsRules(baseUrl) {
    try {
      // Return cached rules if available
      if (this.robotsCache.has(baseUrl)) {
        return this.robotsCache.get(baseUrl);
      }
      
      const url = new URL(baseUrl);
      const robotsUrl = `${url.protocol}//${url.hostname}/robots.txt`;
      
      const response = await this.client.get(robotsUrl);
      const rules = parseRobots(robotsUrl, response.data);
      
      // Cache the rules
      this.robotsCache.set(baseUrl, rules);
      return rules;
    } catch (error) {
      console.warn(`Error fetching robots.txt for ${baseUrl}:`, error.message);
      // Return permissive rules if robots.txt cannot be fetched
      return {
        isAllowed: () => true
      };
    }
  }
  
  /**
   * Check if crawling a URL is allowed by robots.txt
   * @param {string} url - URL to check
   * @returns {Promise<boolean>} - Whether crawling is allowed
   */
  async isAllowed(url) {
    if (!this.config.respectRobotsTxt) {
      return true;
    }
    
    try {
      const baseUrl = new URL(url).origin;
      const rules = await this.getRobotsRules(baseUrl);
      return rules.isAllowed(url, this.config.userAgent);
    } catch (error) {
      console.error('Error checking robots.txt permissions:', error);
      return false; // Default to not allowed on error
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
        const response = await this.client.get(url);
        return response.data;
      } catch (error) {
        retries++;
        console.warn(`Error fetching ${url} (attempt ${retries}/${this.config.maxRetries}):`, error.message);
        
        if (retries >= this.config.maxRetries) {
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.config.delay * retries));
      }
    }
  }
  
  /**
   * Extract product information from HTML
   * @param {string} html - HTML content
   * @param {string} url - Source URL
   * @param {Object} siteConfig - Site-specific extraction configuration
   * @returns {Object} - Extracted product data
   */
  extractProductData(html, url, siteConfig) {
    const $ = cheerio.load(html);
    
    // Apply site-specific selectors to extract data
    const name = $(siteConfig.selectors.name).first().text().trim();
    const price = this.extractPrice($(siteConfig.selectors.price).first().text(), siteConfig);
    const description = $(siteConfig.selectors.description).first().text().trim();
    const imageUrl = this.extractImageUrl($(siteConfig.selectors.imageUrl), url);
    
    // Extract attributes from specifications
    const attributes = {};
    $(siteConfig.selectors.specifications).each((_, element) => {
      const label = $(element).find(siteConfig.selectors.specLabel).text().trim();
      const value = $(element).find(siteConfig.selectors.specValue).text().trim();
      if (label && value) {
        attributes[label] = value;
      }
    });
    
    return {
      name,
      description,
      price,
      image_url: imageUrl,
      category: siteConfig.defaultCategory || 'Uncategorized',
      attributes,
      source_url: url
    };
  }
  
  /**
   * Extract and normalize price data
   * @param {string} priceText - Raw price text
   * @param {Object} siteConfig - Site configuration
   * @returns {number} - Normalized price value
   */
  extractPrice(priceText, siteConfig) {
    if (!priceText) return 0;
    
    // Remove currency symbols and non-numeric characters
    let normalized = priceText.replace(/[^\d.,]/g, '');
    
    // Replace comma with period for decimal if needed
    if (siteConfig.priceFormat === 'european') {
      normalized = normalized.replace(/(\d+),(\d+)/, '$1.$2');
    }
    
    // Parse as float and ensure two decimal places
    const price = parseFloat(normalized);
    return isNaN(price) ? 0 : parseFloat(price.toFixed(2));
  }
  
  /**
   * Extract and normalize image URL
   * @param {Object} imageElement - Cheerio image element
   * @param {string} baseUrl - Base URL for resolving relative paths
   * @returns {string} - Full image URL
   */
  extractImageUrl(imageElement, baseUrl) {
    let src = imageElement.attr('src') || imageElement.attr('data-src') || '';
    
    // Handle relative URLs
    if (src && !src.startsWith('http')) {
      const url = new URL(baseUrl);
      if (src.startsWith('/')) {
        src = `${url.protocol}//${url.hostname}${src}`;
      } else {
        // Handle relative path without leading slash
        src = `${url.protocol}//${url.hostname}/${src}`;
      }
    }
    
    return src;
  }
  
  /**
   * Extract pagination links from a product listing page
   * @param {string} html - HTML content
   * @param {string} baseUrl - Base URL for resolving relative paths
   * @param {Object} siteConfig - Site-specific configuration
   * @returns {Array<string>} - List of pagination URLs
   */
  extractPaginationLinks(html, baseUrl, siteConfig) {
    const $ = cheerio.load(html);
    const links = [];
    
    $(siteConfig.selectors.paginationLinks).each((_, element) => {
      let href = $(element).attr('href');
      
      // Skip if no href or it's a non-URL (like "#")
      if (!href || href.startsWith('#')) return;
      
      // Handle relative URLs
      if (!href.startsWith('http')) {
        const url = new URL(baseUrl);
        if (href.startsWith('/')) {
          href = `${url.protocol}//${url.hostname}${href}`;
        } else {
          href = `${url.protocol}//${url.hostname}/${href}`;
        }
      }
      
      // Ensure we don't add duplicates
      if (!links.includes(href) && !this.visited.has(href)) {
        links.push(href);
      }
    });
    
    return links;
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
    
    $(siteConfig.selectors.productLinks).each((_, element) => {
      let href = $(element).attr('href');
      
      // Skip if no href
      if (!href) return;
      
      // Handle relative URLs
      if (!href.startsWith('http')) {
        const url = new URL(baseUrl);
        if (href.startsWith('/')) {
          href = `${url.protocol}//${url.hostname}${href}`;
        } else {
          href = `${url.protocol}//${url.hostname}/${href}`;
        }
      }
      
      // Ensure we don't add duplicates
      if (!links.includes(href) && !this.visited.has(href)) {
        links.push(href);
      }
    });
    
    return links;
  }
  
  /**
   * Process a product listing page
   * @param {string} url - URL of the listing page
   * @param {Object} siteConfig - Site-specific configuration
   * @returns {Promise<void>}
   */
  async processListingPage(url, siteConfig) {
    try {
      console.log(`Processing listing page: ${url}`);
      this.visited.add(url);
      
      const html = await this.fetchPage(url);
      
      // Extract product links
      const productLinks = this.extractProductLinks(html, url, siteConfig);
      
      // Add products to the crawl queue
      for (const productUrl of productLinks) {
        this.queue.add(() => this.processProductPage(productUrl, siteConfig));
      }
      
      // Extract and process pagination links if needed
      if (siteConfig.followPagination) {
        const paginationLinks = this.extractPaginationLinks(html, url, siteConfig);
        
        for (const pageUrl of paginationLinks) {
          if (!this.visited.has(pageUrl)) {
            this.queue.add(() => this.processListingPage(pageUrl, siteConfig));
          }
        }
      }
    } catch (error) {
      console.error(`Error processing listing page ${url}:`, error);
      this.errors.push({
        url,
        error: error.message,
        type: 'listing'
      });
    }
  }
  
  /**
   * Process a product detail page
   * @param {string} url - URL of the product page
   * @param {Object} siteConfig - Site-specific configuration
   * @returns {Promise<void>}
   */
  async processProductPage(url, siteConfig) {
    try {
      // Check if allowed by robots.txt
      if (!(await this.isAllowed(url))) {
        console.log(`Skipping ${url} (disallowed by robots.txt)`);
        return;
      }
      
      console.log(`Processing product page: ${url}`);
      this.visited.add(url);
      
      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, this.config.delay));
      
      const html = await this.fetchPage(url);
      const productData = this.extractProductData(html, url, siteConfig);
      
      // Store the data
      if (productData.name && productData.price) {
        this.results.push(productData);
        
        // Save to database if configured to do so
        if (this.config.saveToDatabase) {
          await this.saveProduct(productData);
        }
      }
    } catch (error) {
      console.error(`Error processing product page ${url}:`, error);
      this.errors.push({
        url,
        error: error.message,
        type: 'product'
      });
    }
  }
  
  /**
   * Save a product to Supabase
   * @param {Object} productData - Product data to save
   * @returns {Promise<void>}
   */
  async saveProduct(productData) {
    try {
      const { data, error } = await productService.createProduct(productData);
      
      if (error) {
        console.error('Error saving product to database:', error);
      } else {
        console.log(`Saved product: ${productData.name}`);
      }
    } catch (error) {
      console.error('Error saving product to database:', error);
    }
  }
  
  /**
   * Start crawling from a list of URLs
   * @param {string|Array<string>} startUrls - URLs to start crawling from
   * @param {Object} siteConfig - Site-specific configuration
   * @returns {Promise<Array<Object>>} - Extracted product data
   */
  async crawl(startUrls, siteConfig) {
    this.results = [];
    this.errors = [];
    this.visited.clear();
    
    // Ensure startUrls is an array
    const urls = Array.isArray(startUrls) ? startUrls : [startUrls];
    
    // Add starting URLs to the queue
    for (const url of urls) {
      const isProductPage = siteConfig.productUrlPattern && new RegExp(siteConfig.productUrlPattern).test(url);
      
      if (isProductPage) {
        this.queue.add(() => this.processProductPage(url, siteConfig));
      } else {
        this.queue.add(() => this.processListingPage(url, siteConfig));
      }
    }
    
    // Wait for all tasks to complete
    await this.queue.onIdle();
    console.log(`Crawl completed. Extracted ${this.results.length} products with ${this.errors.length} errors.`);
    
    return this.results;
  }
}

module.exports = ProductCrawler; 