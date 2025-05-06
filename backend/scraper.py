import requests
from bs4 import BeautifulSoup
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Update the URLs for Webhallen and Kjell
webhallen_url = "https://www.webhallen.com/se/"
kjell_url = "https://www.kjell.com/se/"

# Add headers to mimic a browser
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
}

class WebScraper:
    def __init__(self, url):
        self.url = url

    def fetch_data(self):
        try:
            response = requests.get(self.url, headers=headers)
            response.raise_for_status()
            return response.text
        except requests.RequestException as e:
            logging.error(f"Error fetching data from {self.url}: {e}")
            return None

    def parse_data(self, html):
        soup = BeautifulSoup(html, 'html.parser')
        # Example: Extract product names and prices
        products = []
        for product in soup.find_all('div', class_='product-item'):  # Adjust class name as needed
            name_tag = product.find('h2', class_='product-name')
            price_tag = product.find('span', class_='product-price')
            name = name_tag.text.strip() if name_tag else 'N/A'
            price = price_tag.text.strip() if price_tag else 'N/A'
            products.append({'name': name, 'price': price})
        return products

    def scrape(self):
        html = self.fetch_data()
        if html:
            data = self.parse_data(html)
            logging.info(f"Scraped data: {data}")

# Example usage
if __name__ == "__main__":
    # Scrape Webhallen
    webhallen_scraper = WebScraper(webhallen_url)
    webhallen_scraper.scrape()

    # Scrape Kjell
    kjell_scraper = WebScraper(kjell_url)
    kjell_scraper.scrape() 