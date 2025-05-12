-- CreateTable
CREATE TABLE "CrawlerSite" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "last_crawled" DATETIME,
    "respect_robots" BOOLEAN NOT NULL DEFAULT true,
    "crawl_frequency" INTEGER NOT NULL DEFAULT 24,
    "max_pages" INTEGER NOT NULL DEFAULT 100,
    "rate_limit" INTEGER NOT NULL DEFAULT 1
);

-- CreateTable
CREATE TABLE "CrawlerSelectors" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "site_id" INTEGER NOT NULL,
    "product_list" TEXT NOT NULL,
    "product_link" TEXT NOT NULL,
    "pagination_next" TEXT,
    "prod_name" TEXT NOT NULL,
    "prod_price" TEXT NOT NULL,
    "prod_description" TEXT,
    "prod_image" TEXT,
    "prod_specs" TEXT,
    "custom_selectors" TEXT,
    CONSTRAINT "CrawlerSelectors_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "CrawlerSite" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "site_id" INTEGER NOT NULL,
    "external_id" TEXT,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SEK',
    "description" TEXT,
    "specs" TEXT,
    "images" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "in_stock" BOOLEAN NOT NULL DEFAULT true,
    "metadata" TEXT,
    CONSTRAINT "Product_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "CrawlerSite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CrawlLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "site_id" INTEGER NOT NULL,
    "start_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_time" DATETIME,
    "status" TEXT NOT NULL,
    "pages_crawled" INTEGER NOT NULL DEFAULT 0,
    "products_found" INTEGER NOT NULL DEFAULT 0,
    "products_added" INTEGER NOT NULL DEFAULT 0,
    "products_updated" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "metadata" TEXT,
    CONSTRAINT "CrawlLog_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "CrawlerSite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CrawlerSelectors_site_id_key" ON "CrawlerSelectors"("site_id");

-- CreateIndex
CREATE UNIQUE INDEX "Product_site_id_url_key" ON "Product"("site_id", "url");
