import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { method } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  const { siteId, page = 1, pageSize = 10, productId } = req.query;
  const pageNum = parseInt(page);
  const pageSizeNum = parseInt(pageSize);

  // Validate parameters
  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({ error: 'Page must be a positive number' });
  }

  if (isNaN(pageSizeNum) || pageSizeNum < 1 || pageSizeNum > 100) {
    return res.status(400).json({ error: 'Page size must be between 1 and 100' });
  }

  try {
    // Case 1: Get a specific product
    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: parseInt(productId) }
      });
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      // Parse JSON strings to objects for client
      const processedProduct = processProduct(product);
      return res.status(200).json(processedProduct);
    }
    
    // Case 2: Get products for a specific site with pagination
    else if (siteId) {
      // Get the total count for pagination
      const totalCount = await prisma.product.count({
        where: { site_id: parseInt(siteId) }
      });
      
      // Get paginated products
      const products = await prisma.product.findMany({
        where: { site_id: parseInt(siteId) },
        orderBy: { updated_at: 'desc' },
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum
      });
      
      // Parse JSON strings to objects for all products
      const processedProducts = products.map(processProduct);
      
      return res.status(200).json({
        products: processedProducts,
        total: totalCount,
        page: pageNum,
        pageSize: pageSizeNum,
        pageCount: Math.ceil(totalCount / pageSizeNum)
      });
    }
    
    // Case 3: Get recent products across all sites
    else {
      // Get the total count for pagination
      const totalCount = await prisma.product.count();
      
      // Get paginated products
      const products = await prisma.product.findMany({
        orderBy: { updated_at: 'desc' },
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum,
        include: {
          site: {
            select: {
              id: true,
              name: true,
              url: true
            }
          }
        }
      });
      
      // Parse JSON strings to objects for all products
      const processedProducts = products.map(processProduct);
      
      return res.status(200).json({
        products: processedProducts,
        total: totalCount,
        page: pageNum,
        pageSize: pageSizeNum,
        pageCount: Math.ceil(totalCount / pageSizeNum)
      });
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Helper function to process JSON strings in product data
function processProduct(product) {
  if (!product) return null;
  
  try {
    // Create a copy to avoid modifying the original
    const processed = { ...product };
    
    // Parse images JSON string to array if it exists
    if (processed.images) {
      try {
        processed.images = JSON.parse(processed.images);
      } catch (e) {
        console.error(`Failed to parse images for product ${product.id}:`, e);
        processed.images = [];
      }
    } else {
      processed.images = [];
    }
    
    // Parse specs JSON string to object if it exists
    if (processed.specs) {
      try {
        processed.specs = JSON.parse(processed.specs);
      } catch (e) {
        console.error(`Failed to parse specs for product ${product.id}:`, e);
        processed.specs = {};
      }
    } else {
      processed.specs = {};
    }
    
    // Parse metadata JSON string to object if it exists
    if (processed.metadata) {
      try {
        processed.metadata = JSON.parse(processed.metadata);
      } catch (e) {
        console.error(`Failed to parse metadata for product ${product.id}:`, e);
        processed.metadata = {};
      }
    } else {
      processed.metadata = {};
    }
    
    return processed;
  } catch (error) {
    console.error('Error processing product:', error);
    return product; // Return the original if processing fails
  }
} 