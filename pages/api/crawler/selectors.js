import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGet(req, res);
    case 'PUT':
      return handlePut(req, res);
    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

// Get selectors for a specific site
async function handleGet(req, res) {
  const { siteId } = req.query;

  if (!siteId) {
    return res.status(400).json({ error: 'Site ID is required' });
  }

  try {
    const selectors = await prisma.crawlerSelectors.findUnique({
      where: { site_id: parseInt(siteId) }
    });
    
    if (!selectors) {
      return res.status(404).json({ error: 'Selectors not found for this site' });
    }
    
    // Parse custom_selectors if it exists
    if (selectors.custom_selectors) {
      try {
        selectors.custom_selectors = JSON.parse(selectors.custom_selectors);
      } catch (e) {
        console.error('Error parsing custom selectors:', e);
        selectors.custom_selectors = {};
      }
    }
    
    return res.status(200).json(selectors);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// Update selectors for a specific site
async function handlePut(req, res) {
  const { siteId } = req.query;
  const {
    product_list,
    product_link,
    pagination_next,
    prod_name,
    prod_price,
    prod_description,
    prod_image,
    prod_specs,
    custom_selectors
  } = req.body;

  if (!siteId) {
    return res.status(400).json({ error: 'Site ID is required' });
  }

  if (!product_list || !product_link || !prod_name || !prod_price) {
    return res.status(400).json({ 
      error: 'Required fields are missing',
      requiredFields: ['product_list', 'product_link', 'prod_name', 'prod_price']
    });
  }

  try {
    // Check if site exists
    const site = await prisma.crawlerSite.findUnique({
      where: { id: parseInt(siteId) }
    });
    
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    // Convert custom_selectors object to JSON string for SQLite
    let customSelectorsStr = '{}';
    if (custom_selectors) {
      try {
        customSelectorsStr = JSON.stringify(custom_selectors);
      } catch (e) {
        console.error('Error stringifying custom selectors:', e);
      }
    }

    // Update selectors
    const selectors = await prisma.crawlerSelectors.upsert({
      where: { site_id: parseInt(siteId) },
      update: {
        product_list,
        product_link,
        pagination_next,
        prod_name,
        prod_price,
        prod_description,
        prod_image,
        prod_specs,
        custom_selectors: customSelectorsStr
      },
      create: {
        site_id: parseInt(siteId),
        product_list,
        product_link,
        pagination_next: pagination_next || null,
        prod_name,
        prod_price,
        prod_description: prod_description || null,
        prod_image: prod_image || null,
        prod_specs: prod_specs || null,
        custom_selectors: customSelectorsStr
      }
    });
    
    // Parse the saved custom_selectors back to an object for the response
    if (selectors.custom_selectors) {
      try {
        selectors.custom_selectors = JSON.parse(selectors.custom_selectors);
      } catch (e) {
        console.error('Error parsing saved custom selectors:', e);
        selectors.custom_selectors = {};
      }
    }
    
    return res.status(200).json({ 
      message: 'Selectors updated successfully',
      selectors
    });
  } catch (error) {
    console.error('Error updating selectors:', error);
    return res.status(500).json({ error: error.message });
  }
} 