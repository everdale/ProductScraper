import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';

export default function ConfigureCrawler() {
  const router = useRouter();
  const { id } = router.query;
  const [site, setSite] = useState(null);
  const [selectors, setSelectors] = useState({
    product_list: '',
    product_link: '',
    pagination_next: '',
    prod_name: '',
    prod_price: '',
    prod_description: '',
    prod_image: '',
    prod_specs: '',
    custom_selectors: {}
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [robotsTxt, setRobotsTxt] = useState(null);
  const [sitemapInfo, setSitemapInfo] = useState(null);

  useEffect(() => {
    if (id) {
      fetchSiteData();
    }
  }, [id]);

  const fetchSiteData = async () => {
    try {
      setLoading(true);
      // Get site details with selectors
      const response = await axios.get(`/api/crawler?id=${id}`);
      setSite(response.data);
      
      // If site has selectors, update the state
      if (response.data.selectors) {
        setSelectors({
          product_list: response.data.selectors.product_list || '',
          product_link: response.data.selectors.product_link || '',
          pagination_next: response.data.selectors.pagination_next || '',
          prod_name: response.data.selectors.prod_name || '',
          prod_price: response.data.selectors.prod_price || '',
          prod_description: response.data.selectors.prod_description || '',
          prod_image: response.data.selectors.prod_image || '',
          prod_specs: response.data.selectors.prod_specs || '',
          custom_selectors: response.data.selectors.custom_selectors || {}
        });
      }
      
      // Check if robots.txt and sitemap info are available in site's discoveryResults
      if (response.data.discoveryResults) {
        if (response.data.discoveryResults.robots) {
          setRobotsTxt(response.data.discoveryResults.robots);
        }
        if (response.data.discoveryResults.sitemap) {
          setSitemapInfo(response.data.discoveryResults.sitemap);
        }
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load site: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectors(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCustomSelectorChange = (key, value) => {
    setSelectors(prev => ({
      ...prev,
      custom_selectors: {
        ...prev.custom_selectors,
        [key]: value
      }
    }));
  };

  const addCustomSelector = () => {
    const key = prompt('Enter a name for the custom selector:');
    if (key && key.trim()) {
      handleCustomSelectorChange(key.trim(), '');
    }
  };

  const removeCustomSelector = (key) => {
    if (confirm(`Remove custom selector "${key}"?`)) {
      const updatedCustomSelectors = { ...selectors.custom_selectors };
      delete updatedCustomSelectors[key];
      
      setSelectors(prev => ({
        ...prev,
        custom_selectors: updatedCustomSelectors
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectors.product_list || !selectors.product_link || !selectors.prod_name || !selectors.prod_price) {
      setError('The following fields are required: Product List, Product Link, Product Name, Product Price');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      const response = await axios.put(`/api/crawler/selectors?siteId=${id}`, selectors);
      
      setSuccessMessage('Selectors saved successfully!');
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err) {
      setError('Failed to save selectors: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading site data...</div>;
  }

  if (!site && !loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Site not found. <Link href="/crawler" className="underline">Return to dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>Configure Crawler - {site.name}</title>
      </Head>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Configure Crawler: {site.name}</h1>
        <Link href="/crawler" className="text-blue-600 hover:underline">
          Back to Dashboard
        </Link>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Site Info */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <h2 className="text-xl font-semibold mb-4">Site Information</h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Site URL:</p>
              <a 
                href={site.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all"
              >
                {site.url}
              </a>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Status: <span className={`px-2 py-1 text-xs rounded-full 
                ${site.status === 'active' ? 'bg-green-100 text-green-800' : 
                  site.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{site.status}</span>
              </p>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Last Crawled:</p>
              <p>{site.last_crawled ? new Date(site.last_crawled).toLocaleString() : 'Never'}</p>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Rate Limit:</p>
              <p>{site.rate_limit} requests per second</p>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Max Pages:</p>
              <p>{site.max_pages} pages</p>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Respect robots.txt:</p>
              <p>{site.respect_robots ? 'Yes' : 'No'}</p>
            </div>
          </div>

          {/* Robots.txt & Sitemap Info */}
          <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <h2 className="text-xl font-semibold mb-4">Discovery Information</h2>
            
            <div className="mb-4">
              <h3 className="text-md font-semibold mb-2">Robots.txt</h3>
              {robotsTxt ? (
                robotsTxt.found ? (
                  <div className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">
                    <pre>{robotsTxt.content}</pre>
                  </div>
                ) : (
                  <p className="text-yellow-600">Robots.txt not found: {robotsTxt.error}</p>
                )
              ) : (
                <p className="text-gray-500">No robots.txt information available</p>
              )}
            </div>
            
            <div className="mb-4">
              <h3 className="text-md font-semibold mb-2">Sitemap</h3>
              {sitemapInfo ? (
                sitemapInfo.found ? (
                  <div>
                    <p className="text-green-600 mb-2">Sitemap found at: {sitemapInfo.sitemapUrl}</p>
                    <div className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">
                      <p className="font-semibold">URLs found: {sitemapInfo.urls.length}</p>
                      <ul className="list-disc pl-5">
                        {sitemapInfo.urls.slice(0, 5).map((url, index) => (
                          <li key={index}>{url}</li>
                        ))}
                        {sitemapInfo.urls.length > 5 && <li>... and {sitemapInfo.urls.length - 5} more</li>}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="text-yellow-600">Sitemap not found: {sitemapInfo.error}</p>
                )
              ) : (
                <p className="text-gray-500">No sitemap information available</p>
              )}
            </div>
          </div>
        </div>

        {/* Selectors Form */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <h2 className="text-xl font-semibold mb-4">Configure Selectors</h2>
            <p className="text-sm text-gray-600 mb-4">
              CSS selectors determine how the crawler identifies and extracts product information. Required fields are marked with *.
            </p>
            
            <form onSubmit={handleSubmit}>
              {/* Listing Page Selectors */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2 border-b pb-1">Product Listing Page Selectors</h3>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="product_list">
                    Product List Container * <span className="text-xs text-gray-500">(selector for the container that holds all products)</span>
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="product_list"
                    name="product_list"
                    type="text"
                    value={selectors.product_list}
                    onChange={handleInputChange}
                    placeholder=".products-grid, ul.products"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="product_link">
                    Product Link * <span className="text-xs text-gray-500">(selector for links to individual products)</span>
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="product_link"
                    name="product_link"
                    type="text"
                    value={selectors.product_link}
                    onChange={handleInputChange}
                    placeholder=".product-item a, .product-title a"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pagination_next">
                    Pagination Next Link <span className="text-xs text-gray-500">(selector for the "next page" button)</span>
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="pagination_next"
                    name="pagination_next"
                    type="text"
                    value={selectors.pagination_next}
                    onChange={handleInputChange}
                    placeholder=".pagination .next, .pages-item-next a"
                  />
                </div>
              </div>
              
              {/* Product Page Selectors */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2 border-b pb-1">Product Detail Page Selectors</h3>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="prod_name">
                    Product Name * <span className="text-xs text-gray-500">(selector for the product name/title)</span>
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="prod_name"
                    name="prod_name"
                    type="text"
                    value={selectors.prod_name}
                    onChange={handleInputChange}
                    placeholder=".product-name h1, .product-title"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="prod_price">
                    Product Price * <span className="text-xs text-gray-500">(selector for the product price)</span>
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="prod_price"
                    name="prod_price"
                    type="text"
                    value={selectors.prod_price}
                    onChange={handleInputChange}
                    placeholder=".product-info-price .price, .product-price"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="prod_description">
                    Product Description <span className="text-xs text-gray-500">(selector for the product description)</span>
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="prod_description"
                    name="prod_description"
                    type="text"
                    value={selectors.prod_description}
                    onChange={handleInputChange}
                    placeholder=".product-info-description, #description"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="prod_image">
                    Product Image <span className="text-xs text-gray-500">(selector for product images)</span>
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="prod_image"
                    name="prod_image"
                    type="text"
                    value={selectors.prod_image}
                    onChange={handleInputChange}
                    placeholder=".product-image img, .gallery-item img"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="prod_specs">
                    Product Specifications <span className="text-xs text-gray-500">(selector for product specs/attributes)</span>
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="prod_specs"
                    name="prod_specs"
                    type="text"
                    value={selectors.prod_specs}
                    onChange={handleInputChange}
                    placeholder=".product-attributes table, .specifications"
                  />
                </div>
              </div>
              
              {/* Custom Selectors */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium border-b pb-1">Custom Selectors (Optional)</h3>
                  <button 
                    type="button"
                    onClick={addCustomSelector}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded text-sm"
                  >
                    Add Custom Selector
                  </button>
                </div>
                
                {Object.keys(selectors.custom_selectors).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(selectors.custom_selectors).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <div className="w-1/3">
                          <label className="block text-gray-700 text-sm font-bold mb-1">
                            {key}
                          </label>
                        </div>
                        <div className="flex-1">
                          <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            type="text"
                            value={value}
                            onChange={(e) => handleCustomSelectorChange(key, e.target.value)}
                            placeholder={`CSS selector for ${key}`}
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeCustomSelector(key)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No custom selectors added. Click "Add Custom Selector" to create one.
                  </p>
                )}
              </div>
              
              <div className="flex items-center justify-end">
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Selectors'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 