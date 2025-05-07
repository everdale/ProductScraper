#!/usr/bin/env node

/**
 * Crawler CLI Tool
 * 
 * This script provides a command-line interface for running the product crawler.
 * It can be used to test crawling on different sites with various configurations.
 * 
 * Usage:
 *   node crawl.js --site=kjell --limit=10 --save
 *   node crawl.js --url=https://example.com/products --site=kjell
 */

const fs = require('fs');
const path = require('path');
const ProductCrawler = require('../lib/crawler');
const { availableConfigs } = require('../lib/crawlConfigs');

// Parse command-line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    acc[key] = value !== undefined ? value : true;
  }
  return acc;
}, {});

// Default values
const DEFAULT_OUTPUT_DIR = path.join(process.cwd(), 'crawl-results');
const DEFAULT_LIMIT = 20;

/**
 * Main function to run the crawler
 */
async function runCrawler() {
  try {
    // Show help if requested
    if (args.help) {
      showHelp();
      return;
    }
    
    // Check for required site parameter
    if (!args.site && !args.config) {
      console.error('Error: Please specify a site (--site=kjell) or a config file (--config=path/to/config.json)');
      showHelp();
      return;
    }
    
    // Load configuration
    let siteConfig;
    if (args.config) {
      try {
        const configPath = path.resolve(process.cwd(), args.config);
        const configData = fs.readFileSync(configPath, 'utf8');
        siteConfig = JSON.parse(configData);
      } catch (error) {
        console.error(`Error loading config file: ${error.message}`);
        return;
      }
    } else {
      const siteName = args.site.toLowerCase();
      if (!availableConfigs[siteName]) {
        console.error(`Error: Unknown site '${siteName}'. Available sites: ${Object.keys(availableConfigs).join(', ')}`);
        return;
      }
      siteConfig = availableConfigs[siteName];
    }
    
    // Configure the crawler
    const crawlerConfig = {
      concurrency: parseInt(args.concurrency) || 2,
      delay: parseInt(args.delay) || 1000,
      maxRetries: parseInt(args.retries) || 3,
      timeout: parseInt(args.timeout) || 10000,
      userAgent: args.useragent || 'SveaProductCrawler/1.0',
      respectRobotsTxt: args.robots !== 'false',
      saveToDatabase: args.save === true || args.save === 'true'
    };
    
    console.log('Starting crawler with configuration:');
    console.log(JSON.stringify(crawlerConfig, null, 2));
    
    const crawler = new ProductCrawler(crawlerConfig);
    
    // Determine starting URLs
    let startUrls = args.url ? [args.url] : siteConfig.startUrls;
    if (!startUrls || startUrls.length === 0) {
      console.error('Error: No starting URLs provided');
      return;
    }
    
    console.log(`Starting crawl from: ${startUrls.join(', ')}`);
    
    // Set limit if provided
    const limit = parseInt(args.limit) || DEFAULT_LIMIT;
    if (limit > 0) {
      console.log(`Limiting crawl to ${limit} products`);
      
      // Create a wrapper that limits the number of products
      const originalProcessProduct = crawler.processProductPage.bind(crawler);
      crawler.processProductPage = async function(url, config) {
        if (this.results.length >= limit) {
          return; // Skip if we've reached the limit
        }
        await originalProcessProduct(url, config);
      };
    }
    
    // Run the crawler
    const startTime = Date.now();
    const results = await crawler.crawl(startUrls, siteConfig);
    const endTime = Date.now();
    
    console.log(`Crawl completed in ${(endTime - startTime) / 1000} seconds`);
    console.log(`Found ${results.length} products`);
    
    // Save results to file if requested
    if (args.output) {
      await saveResults(results, args.output);
    }
    
    // Print error summary
    if (crawler.errors.length > 0) {
      console.log(`\nEncountered ${crawler.errors.length} errors:`);
      
      // Group errors by type and message
      const errorCounts = crawler.errors.reduce((acc, error) => {
        const key = `${error.type}: ${error.error}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(errorCounts).forEach(([error, count]) => {
        console.log(`- ${error} (${count} occurrences)`);
      });
    }
    
  } catch (error) {
    console.error('Error running crawler:', error);
  }
}

/**
 * Save crawl results to a file
 * @param {Array} results - Crawl results
 * @param {string} filename - Output filename or path
 */
async function saveResults(results, filename) {
  try {
    let outputPath = filename;
    
    // If just a filename without path, use the default directory
    if (!path.isAbsolute(filename) && !filename.includes(path.sep)) {
      // Ensure output directory exists
      if (!fs.existsSync(DEFAULT_OUTPUT_DIR)) {
        fs.mkdirSync(DEFAULT_OUTPUT_DIR, { recursive: true });
      }
      outputPath = path.join(DEFAULT_OUTPUT_DIR, filename);
    }
    
    // Add .json extension if not present
    if (!outputPath.endsWith('.json')) {
      outputPath += '.json';
    }
    
    // Write the data
    fs.writeFileSync(
      outputPath,
      JSON.stringify(results, null, 2),
      'utf8'
    );
    
    console.log(`Results saved to ${outputPath}`);
  } catch (error) {
    console.error(`Error saving results: ${error.message}`);
  }
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Crawler CLI Tool

Usage:
  node crawl.js [options]

Options:
  --site=NAME           Site to crawl (kjell, etc.)
  --config=PATH         Path to JSON config file (alternative to --site)
  --url=URL             Starting URL (overrides config's startUrls)
  --limit=N             Maximum number of products to crawl
  --concurrency=N       Number of concurrent requests (default: 2)
  --delay=N             Delay between requests in ms (default: 1000)
  --retries=N           Max retry attempts (default: 3)
  --timeout=N           Request timeout in ms (default: 10000)
  --useragent=STRING    User agent string
  --robots=BOOLEAN      Whether to respect robots.txt (default: true)
  --save                Save products to database
  --output=FILENAME     Save results to JSON file
  --help                Show this help message

Examples:
  node crawl.js --site=kjell --limit=10
  node crawl.js --site=kjell --output=results
  node crawl.js --url=https://www.kjell.com/se/produkter/dator --site=kjell --limit=5
  `);
}

// Run the crawler
runCrawler(); 