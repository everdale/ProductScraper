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

// Default output directory for saving results
const DEFAULT_OUTPUT_DIR = path.join(process.cwd(), 'crawl-results');

// Parse command-line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    acc[key] = value !== undefined ? value : true;
  }
  return acc;
}, {});

// Log the parsed arguments for debugging
console.log('Parsed arguments:', args);

/**
 * Display help information
 */
function showHelp() {
  console.log('\nCrawler CLI Tool\n');
  console.log('Usage:');
  console.log('  node crawl.js [options]\n');
  console.log('Options:');
  console.log('  --site=NAME           Site to crawl (kjell, etc.)');
  console.log('  --config=PATH         Path to JSON config file (alternative to --site)');
  console.log('  --url=URL             Starting URL (overrides config\'s startUrls)');
  console.log('  --limit=N             Maximum number of products to crawl');
  console.log('  --concurrency=N       Number of concurrent requests (default: 2)');
  console.log('  --delay=N             Delay between requests in ms (default: 1000)');
  console.log('  --retries=N           Max retry attempts (default: 3)');
  console.log('  --timeout=N           Request timeout in ms (default: 10000)');
  console.log('  --useragent=STRING    User agent string');
  console.log('  --robots=BOOLEAN      Whether to respect robots.txt (default: true)');
  console.log('  --save                Save products to database');
  console.log('  --output=FILENAME     Save results to JSON file');
  console.log('  --debug               Save HTML of crawled pages for debugging');
  console.log('  --help                Show this help message\n');
  console.log('Examples:');
  console.log('  node crawl.js --site=kjell --limit=10');
  console.log('  node crawl.js --site=kjell --output=results');
  console.log('  node crawl.js --url=https://www.kjell.com/se/produkter/dator --site=kjell --limit=5\n');
}

/**
 * Load a site configuration
 * @param {string} siteName - Name of the site
 * @returns {Object} - Site configuration
 */
function loadSiteConfig(siteName) {
  console.log(`Looking for config for site: '${siteName}'`);
  console.log('Available configs:', Object.keys(availableConfigs));
  
  if (availableConfigs[siteName]) {
    return availableConfigs[siteName];
  }
  
  throw new Error(`No configuration found for site: ${siteName}`);
}

/**
 * Load a configuration from a JSON file
 * @param {string} configPath - Path to the config file
 * @returns {Object} - Configuration
 */
function loadConfigFile(configPath) {
  const resolvedPath = path.resolve(configPath);
  
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Config file not found: ${resolvedPath}`);
  }
  
  const config = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
  return config;
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
      siteConfig = loadConfigFile(args.config);
    } else {
      siteConfig = loadSiteConfig(args.site);
    }
    
    // Build crawler configuration
    const crawlerConfig = {
      concurrency: args.concurrency ? parseInt(args.concurrency, 10) : 2,
      delay: args.delay ? parseInt(args.delay, 10) : 1000,
      maxRetries: args.retries ? parseInt(args.retries, 10) : 3,
      timeout: args.timeout ? parseInt(args.timeout, 10) : 10000,
      userAgent: args.useragent || 'SveaProductCrawler/1.0',
      respectRobotsTxt: args.robots !== 'false',
      saveToDatabase: args.save === true
    };
    
    console.log('Starting crawler with configuration:');
    console.log(JSON.stringify(crawlerConfig, null, 2));
    
    // Initialize the crawler
    const crawler = new ProductCrawler(crawlerConfig);
    await crawler.init();
    
    // Determine starting URLs
    const startUrls = args.url 
      ? [args.url] 
      : siteConfig.startUrls || [];
    
    console.log(`Starting crawl from: ${startUrls.join(', ')}`);
    
    // Set crawl options
    const options = {
      limit: args.limit ? parseInt(args.limit, 10) : undefined,
      debug: args.debug === true
    };
    
    if (options.limit) {
      console.log(`Limiting crawl to ${options.limit} products`);
    }
    
    // Run the crawler
    const products = await crawler.crawl(startUrls, siteConfig, options);
    
    console.log(`Found ${products.length} products`);
    
    // Save results if requested
    if (args.output) {
      await saveResults(products, args.output);
    }
    
    // Call the extract-products.js fallback script for HTML files
    // This is now integrated in the crawler's extractProductsFromSavedHTML method
    if (products.length === 0 && fs.existsSync(path.join(process.cwd(), 'src/scripts/extract-products.js'))) {
      console.log('No products found, running extract-products.js fallback...');
      const { execSync } = require('child_process');
      execSync('node src/scripts/extract-products.js', { stdio: 'inherit' });
    }
    
  } catch (error) {
    console.error('Crawler error:', error.message);
    process.exit(1);
  }
}

// Run the crawler
runCrawler(); 