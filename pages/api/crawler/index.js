import { PrismaClient } from '@prisma/client';
import { parse } from 'url';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    case 'DELETE':
      return handleDelete(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

// Get all crawler sites or a specific one
async function handleGet(req, res) {
  const { id } = req.query;

  try {
    if (id) {
      const site = await prisma.crawlerSite.findUnique({
        where: { id: parseInt(id) },
        include: { selectors: true }
      });
      
      if (!site) {
        return res.status(404).json({ error: 'Site not found' });
      }
      
      // Process custom_selectors if exists
      if (site.selectors && site.selectors.custom_selectors) {
        try {
          site.selectors.custom_selectors = JSON.parse(site.selectors.custom_selectors);
        } catch (e) {
          console.error('Error parsing custom selectors:', e);
          site.selectors.custom_selectors = {};
        }
      }
      
      return res.status(200).json(site);
    } else {
      const sites = await prisma.crawlerSite.findMany({
        include: { selectors: true }
      });
      
      // Process custom_selectors for all sites
      sites.forEach(site => {
        if (site.selectors && site.selectors.custom_selectors) {
          try {
            site.selectors.custom_selectors = JSON.parse(site.selectors.custom_selectors);
          } catch (e) {
            console.error(`Error parsing custom selectors for site ${site.id}:`, e);
            site.selectors.custom_selectors = {};
          }
        }
      });
      
      return res.status(200).json(sites);
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// Add a new crawler site
async function handlePost(req, res) {
  const { name, url } = req.body;
  
  if (!name || !url) {
    return res.status(400).json({ error: 'Name and URL are required' });
  }

  try {
    // Check if URL is valid
    const parsedUrl = parse(url);
    if (!parsedUrl.hostname) {
      return res.status(400).json({ error: 'Invalid URL' });
    }
    
    const baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}`;

    // Create site in database
    const site = await prisma.crawlerSite.create({
      data: {
        name,
        url,
      }
    });

    // Try to discover robots.txt and sitemap
    const discoveryResults = await discoverSiteInfo(baseUrl);
    
    // Create default selectors (can be updated later)
    await prisma.crawlerSelectors.create({
      data: {
        site_id: site.id,
        product_list: '.products', // Default example selectors
        product_link: '.product a',
        pagination_next: '.pagination .next',
        prod_name: '.product-name',
        prod_price: '.product-price',
        prod_description: '.product-description',
        prod_image: '.product-image img',
        prod_specs: '.product-specs',
        custom_selectors: '{}' // Empty JSON object as string for SQLite
      }
    });

    return res.status(201).json({
      site,
      discoveryResults,
      message: 'Site added successfully. Please update selectors based on the site structure.'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// Delete a crawler site
async function handleDelete(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Site ID is required' });
  }

  try {
    const site = await prisma.crawlerSite.delete({
      where: { id: parseInt(id) }
    });
    
    return res.status(200).json({ message: 'Site deleted successfully', site });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// Helper function to discover robots.txt and sitemap
async function discoverSiteInfo(baseUrl) {
  const results = {
    robots: { found: false, content: null, error: null },
    sitemap: { found: false, urls: [], error: null }
  };

  // Try to fetch robots.txt
  try {
    const robotsResponse = await axios.get(`${baseUrl}/robots.txt`, { timeout: 5000 });
    if (robotsResponse.status === 200) {
      results.robots.found = true;
      results.robots.content = robotsResponse.data;
      
      // Look for Sitemap directive in robots.txt
      const sitemapMatch = robotsResponse.data.match(/Sitemap:\s*(.+)/i);
      if (sitemapMatch && sitemapMatch[1]) {
        results.sitemap.sitemapUrl = sitemapMatch[1].trim();
      }
    }
  } catch (error) {
    results.robots.error = `Could not fetch robots.txt: ${error.message}`;
  }

  // Try to fetch sitemap.xml if not found in robots.txt
  if (!results.sitemap.sitemapUrl) {
    results.sitemap.sitemapUrl = `${baseUrl}/sitemap.xml`;
  }

  try {
    const sitemapResponse = await axios.get(results.sitemap.sitemapUrl, { timeout: 5000 });
    if (sitemapResponse.status === 200) {
      results.sitemap.found = true;
      
      // Parse XML sitemap
      try {
        const parsed = await parseStringPromise(sitemapResponse.data);
        if (parsed.urlset && parsed.urlset.url) {
          results.sitemap.urls = parsed.urlset.url.map(url => url.loc[0]);
        }
      } catch (parseError) {
        results.sitemap.error = `Could not parse sitemap: ${parseError.message}`;
      }
    }
  } catch (error) {
    results.sitemap.error = `Could not fetch sitemap: ${error.message}`;
  }

  return results;
} 