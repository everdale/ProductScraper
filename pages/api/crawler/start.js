import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import cheerio from 'cheerio';
import PQueue from 'p-queue';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { method } = req;

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  const { siteId } = req.body;

  if (!siteId) {
    return res.status(400).json({ error: 'Site ID is required' });
  }

  try {
    // Get site with selectors
    const site = await prisma.crawlerSite.findUnique({
      where: { id: parseInt(siteId) },
      include: { selectors: true }
    });
    
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    if (!site.selectors) {
      return res.status(400).json({ error: 'No selectors configured for this site' });
    }

    // Create a new crawl log entry
    const crawlLog = await prisma.crawlLog.create({
      data: {
        site_id: site.id,
        status: 'in_progress'
      }
    });

    // Start crawling asynchronously
    startCrawling(site, crawlLog.id);

    return res.status(202).json({
      message: 'Crawl job started successfully',
      crawlId: crawlLog.id
    });
  } catch (error) {
    console.error('Error starting crawler:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Function to start a crawling job asynchronously
async function startCrawling(site, crawlLogId) {
  try {
    console.log(`Starting crawl for site: ${site.name} (ID: ${site.id})`);
    
    // Update site status
    await prisma.crawlerSite.update({
      where: { id: site.id },
      data: { 
        status: 'active',
        last_crawled: new Date()
      }
    });

    const productUrls = await crawlProductListings(site);
    console.log(`Found ${productUrls.length} product URLs`);

    // Setup queue with rate limiting
    const queue = new PQueue({ concurrency: site.rate_limit });
    let productsAdded = 0;
    let productsUpdated = 0;
    let pagesProcessed = 0;

    // Process each product URL
    const promises = productUrls.slice(0, site.max_pages).map(url => {
      return queue.add(async () => {
        try {
          const product = await crawlProductPage(url, site);
          if (product) {
            const result = await saveProduct(product, site.id);
            if (result.action === 'added') productsAdded++;
            if (result.action === 'updated') productsUpdated++;
          }
          pagesProcessed++;
          
          // Update crawl log periodically
          if (pagesProcessed % 10 === 0 || pagesProcessed === productUrls.length) {
            await updateCrawlLog(crawlLogId, {
              pages_crawled: pagesProcessed,
              products_found: productUrls.length,
              products_added: productsAdded,
              products_updated: productsUpdated
            });
          }
        } catch (error) {
          console.error(`Error processing product ${url}:`, error);
        }
      });
    });

    await Promise.all(promises);

    // Complete the crawl log
    await prisma.crawlLog.update({
      where: { id: crawlLogId },
      data: {
        status: 'success',
        end_time: new Date(),
        pages_crawled: pagesProcessed,
        products_found: productUrls.length,
        products_added: productsAdded,
        products_updated: productsUpdated
      }
    });

    // Update site status
    await prisma.crawlerSite.update({
      where: { id: site.id },
      data: { status: 'pending' }
    });

    console.log(`Crawl completed for site: ${site.name}`);
  } catch (error) {
    console.error(`Crawl failed for site ${site.name}:`, error);
    
    // Update crawl log with error
    await prisma.crawlLog.update({
      where: { id: crawlLogId },
      data: {
        status: 'error',
        end_time: new Date(),
        error_message: error.message
      }
    });

    // Update site status
    await prisma.crawlerSite.update({
      where: { id: site.id },
      data: { status: 'error' }
    });
  }
}

// Crawl product listing pages to collect product URLs
async function crawlProductListings(site) {
  const productUrls = new Set();
  let currentUrl = site.url;
  let pageCount = 0;
  const maxPages = 10; // Limit to 10 pages for safety

  const selectors = site.selectors;

  while (currentUrl && pageCount < maxPages) {
    try {
      console.log(`Crawling listing page: ${currentUrl}`);
      const response = await axios.get(currentUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 10000
      });
      
      const $ = cheerio.load(response.data);
      
      // Find product links
      const productContainer = $(selectors.product_list);
      const productLinks = productContainer.find(selectors.product_link);
      
      console.log(`Found ${productLinks.length} product links on page ${pageCount + 1}`);
      
      productLinks.each((_, element) => {
        let href = $(element).attr('href');
        
        // Handle relative URLs
        if (href && !href.startsWith('http')) {
          const baseUrl = new URL(site.url);
          href = new URL(href, baseUrl.origin).toString();
        }
        
        if (href) {
          productUrls.add(href);
        }
      });
      
      // Find next page link if it exists
      let nextUrl = null;
      if (selectors.pagination_next) {
        const nextLink = $(selectors.pagination_next);
        if (nextLink.length > 0) {
          nextUrl = nextLink.attr('href');
          
          // Handle relative URLs
          if (nextUrl && !nextUrl.startsWith('http')) {
            const baseUrl = new URL(site.url);
            nextUrl = new URL(nextUrl, baseUrl.origin).toString();
          }
        }
      }
      
      currentUrl = nextUrl;
      pageCount++;
      
      // Respect rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000 / site.rate_limit));
    } catch (error) {
      console.error(`Error crawling listing page ${currentUrl}:`, error);
      break;
    }
  }
  
  return [...productUrls];
}

// Crawl a product page to extract details
async function crawlProductPage(url, site) {
  try {
    console.log(`Crawling product: ${url}`);
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    const selectors = site.selectors;
    
    // Extract product data
    const name = $(selectors.prod_name).first().text().trim();
    const priceText = $(selectors.prod_price).first().text().trim()
      .replace(/[^0-9,.]/g, '') // Keep only numbers, commas and dots
      .replace(/,/g, '.'); // Replace comma with dot for proper float parsing
    const price = parseFloat(priceText) || 0;
    
    let description = '';
    if (selectors.prod_description) {
      description = $(selectors.prod_description).first().text().trim();
    }
    
    const images = [];
    if (selectors.prod_image) {
      $(selectors.prod_image).each((_, img) => {
        const src = $(img).attr('src');
        if (src) {
          // Handle relative URLs
          if (!src.startsWith('http')) {
            const baseUrl = new URL(site.url);
            const fullSrc = new URL(src, baseUrl.origin).toString();
            images.push(fullSrc);
          } else {
            images.push(src);
          }
        }
      });
    }
    
    let specs = {};
    if (selectors.prod_specs) {
      const specsContainer = $(selectors.prod_specs);
      // Extract specs from table or list - this is a simple example
      specsContainer.find('tr, li').each((_, el) => {
        const row = $(el);
        const key = row.find('th, dt, strong').first().text().trim();
        const value = row.find('td, dd').first().text().trim();
        if (key && value) {
          specs[key] = value;
        }
      });
    }
    
    if (!name || price === 0) {
      console.warn(`Insufficient data extracted from ${url}`);
      return null;
    }
    
    return {
      url,
      name,
      price,
      description,
      specs,
      images
    };
  } catch (error) {
    console.error(`Error crawling product ${url}:`, error);
    return null;
  }
}

// Save or update a product in the database
async function saveProduct(product, siteId) {
  try {
    // Check if product already exists
    const existingProduct = await prisma.product.findFirst({
      where: {
        site_id: siteId,
        url: product.url
      }
    });
    
    // Convert arrays and objects to JSON strings for SQLite
    const imagesJson = JSON.stringify(product.images || []);
    const specsJson = JSON.stringify(product.specs || {});
    
    if (existingProduct) {
      // Update existing product
      await prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          name: product.name,
          price: product.price,
          description: product.description,
          specs: specsJson,
          images: imagesJson,
          updated_at: new Date()
        }
      });
      return { success: true, action: 'updated' };
    } else {
      // Create new product
      await prisma.product.create({
        data: {
          site_id: siteId,
          url: product.url,
          name: product.name,
          price: product.price,
          description: product.description,
          specs: specsJson,
          images: imagesJson
        }
      });
      return { success: true, action: 'added' };
    }
  } catch (error) {
    console.error(`Error saving product ${product.url}:`, error);
    return { success: false, error: error.message };
  }
}

// Update crawl log with progress
async function updateCrawlLog(crawlLogId, data) {
  try {
    await prisma.crawlLog.update({
      where: { id: crawlLogId },
      data
    });
  } catch (error) {
    console.error(`Error updating crawl log ${crawlLogId}:`, error);
  }
} 