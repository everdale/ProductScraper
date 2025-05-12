import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { method } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  const { crawlId, siteId } = req.query;

  try {
    if (crawlId) {
      // Get status of specific crawl
      const crawlLog = await prisma.crawlLog.findUnique({
        where: { id: parseInt(crawlId) }
      });
      
      if (!crawlLog) {
        return res.status(404).json({ error: 'Crawl log not found' });
      }
      
      return res.status(200).json(crawlLog);
    } else if (siteId) {
      // Get latest crawl for a site
      const latestCrawl = await prisma.crawlLog.findFirst({
        where: { site_id: parseInt(siteId) },
        orderBy: { start_time: 'desc' }
      });
      
      if (!latestCrawl) {
        return res.status(404).json({ error: 'No crawls found for this site' });
      }
      
      return res.status(200).json(latestCrawl);
    } else {
      // Get all recent crawls
      const recentCrawls = await prisma.crawlLog.findMany({
        orderBy: { start_time: 'desc' },
        take: 10,
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
      
      return res.status(200).json(recentCrawls);
    }
  } catch (error) {
    console.error('Error getting crawl status:', error);
    return res.status(500).json({ error: error.message });
  }
} 