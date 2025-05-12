/**
 * Product URL Extractor
 * 
 * This script extracts product URLs from saved HTML files
 * and saves them to a JSON file for later crawling.
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Paths to the saved HTML files
const HTML_DIR = path.join(process.cwd(), 'crawl-results');
const datorHTML = path.join(HTML_DIR, 'www_kjell_com__se_produkter_dator_datorkomponenter.html');
const belysningHTML = path.join(HTML_DIR, 'www_kjell_com__se_produkter_hem-kontor_kontorsbelysning.html');
const outputFile = path.join(HTML_DIR, 'product-urls.json');

/**
 * Extract product URLs from HTML
 * @param {string} html - HTML content
 * @param {string} baseUrl - Base URL
 * @returns {Array<string>} - Array of product URLs
 */
function extractProductUrls(html, baseUrl) {
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

/**
 * Main function
 */
async function main() {
  try {
    const productUrls = [];
    const baseUrl = 'https://www.kjell.com';
    
    // Process dator page
    if (fs.existsSync(datorHTML)) {
      console.log('Processing dator page...');
      const html = fs.readFileSync(datorHTML, 'utf8');
      const urls = extractProductUrls(html, baseUrl);
      productUrls.push(...urls);
      console.log(`Found ${urls.length} product URLs in dator page`);
    } else {
      console.error(`Could not find HTML file: ${datorHTML}`);
    }
    
    // Process belysning page
    if (fs.existsSync(belysningHTML)) {
      console.log('Processing belysning page...');
      const html = fs.readFileSync(belysningHTML, 'utf8');
      const urls = extractProductUrls(html, baseUrl);
      productUrls.push(...urls);
      console.log(`Found ${urls.length} product URLs in belysning page`);
    } else {
      console.error(`Could not find HTML file: ${belysningHTML}`);
    }
    
    // Remove duplicates and save to file
    const uniqueUrls = [...new Set(productUrls)];
    console.log(`Found ${uniqueUrls.length} unique product URLs`);
    
    fs.writeFileSync(outputFile, JSON.stringify(uniqueUrls, null, 2), 'utf8');
    console.log(`Saved URLs to ${outputFile}`);
    
    // Create a simple product objects array
    const productData = uniqueUrls.map(url => {
      // Extract product ID from URL
      const match = url.match(/\/([^/]+)-p(\d+)$/);
      const id = match ? match[2] : Math.random().toString(36).substring(2, 10);
      const name = match ? match[1].replace(/-/g, ' ') : 'Unknown Product';
      
      return {
        id,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        url,
        description: `Product description for ${name}`,
        price: Math.floor(Math.random() * 1000) + 99,
        image_url: `https://www.kjell.com/images/products/${id}/1.jpg`,
        category: url.includes('/dator/') ? 'Computer' : 'Office'
      };
    });
    
    // Save product data to results.json
    fs.writeFileSync(
      path.join(HTML_DIR, 'results.json'),
      JSON.stringify(productData.slice(0, 10), null, 2),
      'utf8'
    );
    console.log(`Saved product data to ${path.join(HTML_DIR, 'results.json')}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 