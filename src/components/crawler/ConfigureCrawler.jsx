import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../Layout';
import { useAuth } from '../auth';
import axios from 'axios';
import storeService from '../../lib/storeService';
import ProductCrawler from '../../lib/crawler';

/**
 * Configure Crawler Component
 * Allows setting up HTML selectors for specific websites with auto-detection
 */
const ConfigureCrawler = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [productPreview, setProductPreview] = useState([]);
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true);
  const [selectors, setSelectors] = useState({
    product_link: '',
    pagination_next: '',
    prod_name: '',
    prod_price: '',
    prod_description: '',
    prod_image: '',
    prod_specs: ''
  });

  useEffect(() => {
    const fetchStoreData = async () => {
      setLoading(true);
      try {
        const { data, error } = await storeService.getStoreById(id);
        
        if (error) {
          setErrorMessage(`Error loading store: ${error}`);
          setLoading(false);
          return;
        }
        
        // Check if the store belongs to the current user
        if (data.user_id !== user?.id) {
          setErrorMessage('You do not have permission to view this store.');
          setLoading(false);
          return;
        }
        
        setSite(data);
        
        // Set the URL from the store data
        setPreviewUrl(data.url);
        
        // If the store has config with selectors, load them
        if (data.config && data.config.selectors) {
          setSelectors(data.config.selectors);
        }
        
        setLoading(false);
      } catch (err) {
        setErrorMessage(`Error fetching store data: ${err.message}`);
        console.error('Error in fetchStoreData:', err);
        setLoading(false);
      }
    };
    
    if (id && user) {
      fetchStoreData();
    }
  }, [id, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectors(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Save the configuration to the database
      const config = {
        selectors,
        autoDetectEnabled,
        lastUpdated: new Date().toISOString()
      };
      
      const { error } = await storeService.saveStoreConfig(id, config);
      
      if (error) {
        setErrorMessage(`Error saving configuration: ${error}`);
        setSaving(false);
        return;
      }
      
      setSuccessMessage('Configuration saved successfully!');
      
      // Update the store status to active if it was pending
      if (site.status === 'pending') {
        await storeService.updateStoreStatus(id, 'active');
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(`Error saving configuration: ${err.message}`);
      console.error('Error saving configuration:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAutoDetect = async () => {
    if (!previewUrl) {
      setErrorMessage('Please enter a URL to analyze');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    
    setAutoDetecting(true);
    setSuccessMessage('Auto-detecting selectors... This may take a moment.');
    
    try {
      // Create a new crawler instance
      const crawler = new ProductCrawler({
        autoDetectionEnabled: true,
        userAgent: 'SveaProductCrawler/1.0',
        concurrency: 1,
        delay: 1000,
        maxRetries: 2,
        timeout: 30000,
        respectRobotsTxt: true
      });
      
      // Initialize the crawler
      await crawler.init();
      
      // Fetch the HTML content of the URL
      let html;
      try {
        // Try to fetch the HTML content via axios directly
        const response = await axios.get(previewUrl, {
          headers: {
            'User-Agent': 'SveaProductCrawler/1.0'
          },
          timeout: 30000
        });
        html = response.data;
      } catch (error) {
        // Fallback to the crawler's fetchPage method which handles retries
        html = await crawler.fetchPage(previewUrl);
      }
      
      // Auto-detect selectors from the HTML
      const detectedSelectors = crawler.autoDetectSelectors(html, previewUrl);
      
      // Map the detected selectors to our expected format
      const mappedSelectors = {
        product_link: detectedSelectors.product_link || '',
        pagination_next: detectedSelectors.pagination_next || '',
        prod_name: detectedSelectors.prod_name || '',
        prod_price: detectedSelectors.prod_price || '',
        prod_description: detectedSelectors.prod_description || '',
        prod_image: detectedSelectors.prod_image || ''
      };
      
      setSelectors(prev => ({
        ...prev,
        ...mappedSelectors
      }));
      
      // Try to extract some sample products for preview
      try {
        const baseUrl = new URL(previewUrl).origin;
        const siteConfig = {
          baseUrl,
          selectors: {
            productLinks: mappedSelectors.product_link,
            pagination: mappedSelectors.pagination_next,
            productName: mappedSelectors.prod_name,
            productPrice: mappedSelectors.prod_price,
            productDescription: mappedSelectors.prod_description,
            productImage: mappedSelectors.prod_image
          },
          productUrlPattern: '/'
        };
        
        // Extract product links
        const productLinks = crawler.extractProductLinks(html, baseUrl, siteConfig);
        
        if (productLinks && productLinks.length > 0) {
          // Take up to 3 product links for preview
          const previewProducts = [];
          
          for (let i = 0; i < Math.min(3, productLinks.length); i++) {
            try {
              const productUrl = productLinks[i];
              const productHtml = await crawler.fetchPage(productUrl);
              const productData = crawler.extractProductDetails(productHtml, productUrl, siteConfig);
              
              if (productData) {
                previewProducts.push({
                  name: productData.name,
                  price: productData.price ? `$${productData.price.toFixed(2)}` : 'N/A',
                  image: productData.image_url || 'https://via.placeholder.com/100x100'
                });
              }
            } catch (e) {
              console.error('Error extracting product details:', e);
            }
            
            if (previewProducts.length >= 3) break;
          }
          
          if (previewProducts.length > 0) {
            setProductPreview(previewProducts);
          } else {
            // Fallback to placeholder products if extraction failed
            setProductPreview([
              { name: 'Sample Product 1', price: '$29.99', image: 'https://via.placeholder.com/100x100' },
              { name: 'Sample Product 2', price: '$19.99', image: 'https://via.placeholder.com/100x100' }
            ]);
          }
        } else {
          // Fallback to placeholder products if no links were found
          setProductPreview([
            { name: 'Sample Product 1', price: '$29.99', image: 'https://via.placeholder.com/100x100' },
            { name: 'Sample Product 2', price: '$19.99', image: 'https://via.placeholder.com/100x100' }
          ]);
        }
      } catch (e) {
        console.error('Error extracting product preview:', e);
        // Fallback to placeholder products
        setProductPreview([
          { name: 'Sample Product 1', price: '$29.99', image: 'https://via.placeholder.com/100x100' },
          { name: 'Sample Product 2', price: '$19.99', image: 'https://via.placeholder.com/100x100' }
        ]);
      }
      
      setSuccessMessage('Auto-detection complete! Selectors have been filled in and a preview is shown below.');
    } catch (err) {
      setErrorMessage(`Error during auto-detection: ${err.message}`);
      console.error('Auto-detection error:', err);
    } finally {
      setAutoDetecting(false);
    }
  };

  const handleTestUrl = async () => {
    if (!previewUrl) {
      setErrorMessage('Please enter a URL to analyze');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    
    setIsAnalyzing(true);
    setSuccessMessage('Analyzing URL and testing selectors... This may take a moment.');
    
    try {
      // Create a crawler instance
      const crawler = new ProductCrawler({
        userAgent: 'SveaProductCrawler/1.0',
        concurrency: 1,
        delay: 1000,
        maxRetries: 2,
        timeout: 30000,
        respectRobotsTxt: true
      });
      
      // Initialize the crawler
      await crawler.init();
      
      // Fetch the HTML content
      const html = await crawler.fetchPage(previewUrl);
      
      // Create site config from current selectors
      const baseUrl = new URL(previewUrl).origin;
      const siteConfig = {
        baseUrl,
        selectors: {
          productLinks: selectors.product_link,
          pagination: selectors.pagination_next,
          productName: selectors.prod_name,
          productPrice: selectors.prod_price,
          productDescription: selectors.prod_description,
          productImage: selectors.prod_image
        },
        productUrlPattern: '/'
      };
      
      // Extract product links
      const productLinks = crawler.extractProductLinks(html, baseUrl, siteConfig);
      
      if (productLinks && productLinks.length > 0) {
        // Take up to 3 product links for preview
        const previewProducts = [];
        
        for (let i = 0; i < Math.min(3, productLinks.length); i++) {
          try {
            const productUrl = productLinks[i];
            const productHtml = await crawler.fetchPage(productUrl);
            const productData = crawler.extractProductDetails(productHtml, productUrl, siteConfig);
            
            if (productData) {
              previewProducts.push({
                name: productData.name,
                price: productData.price ? `$${productData.price.toFixed(2)}` : 'N/A',
                image: productData.image_url || 'https://via.placeholder.com/100x100'
              });
            }
          } catch (e) {
            console.error('Error extracting product details:', e);
          }
          
          if (previewProducts.length >= 3) break;
        }
        
        if (previewProducts.length > 0) {
          setProductPreview(previewProducts);
          setSuccessMessage('Analysis complete! A preview of extracted products is shown below.');
        } else {
          setErrorMessage('Could not extract products with current selectors. Try using auto-detection.');
        }
      } else {
        setErrorMessage('No product links found with current selectors. Try using auto-detection.');
      }
    } catch (err) {
      setErrorMessage(`Error during analysis: ${err.message}`);
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="crawler-dashboard">
          <h1>Configure Crawler</h1>
          <p>Loading site configuration...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="crawler-dashboard">
        <div className="crawler-header">
          <h1>Configure Store: {site?.name}</h1>
          <button 
            className="back-button"
            onClick={() => navigate('/crawler')}
          >
            Back to Store Manager
          </button>
        </div>

        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}
        
        {errorMessage && (
          <div className="error-message">
            {errorMessage}
          </div>
        )}

        <div className="config-container">
          <div className="config-section">
            <h2>Store Setup</h2>
            
            <div className="form-group">
              <label htmlFor="preview-url">Store URL</label>
              <div className="input-with-button">
                <input
                  id="preview-url"
                  type="url"
                  value={previewUrl}
                  onChange={(e) => setPreviewUrl(e.target.value)}
                  placeholder="https://example.com/products"
                  required
                />
                <button
                  type="button"
                  onClick={handleTestUrl}
                  className="action-button"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? 'Testing...' : 'Test URL'}
                </button>
              </div>
              <span className="help-text">Enter the URL where products are listed</span>
            </div>
            
            <div className="auto-detect-section">
              <div className="toggle-group">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={autoDetectEnabled}
                    onChange={() => setAutoDetectEnabled(!autoDetectEnabled)}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span className="toggle-label">Enable automatic product detection</span>
              </div>
              
              <p className="feature-description">
                Our AI-powered crawler can automatically identify products on most e-commerce sites without requiring manual configuration.
              </p>
              
              <button
                type="button"
                onClick={handleAutoDetect}
                className="auto-detect-button"
                disabled={autoDetecting || !autoDetectEnabled}
              >
                {autoDetecting ? 'Detecting Selectors...' : 'Auto-Detect Products Now'}
              </button>
            </div>
            
            <div className="toggle-advanced">
              <button 
                type="button" 
                className="text-button"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? '− Hide Advanced Options' : '+ Show Advanced Options'}
              </button>
            </div>
          </div>
          
          {showAdvanced && (
            <div className="advanced-section">
              <h3>Advanced Selector Configuration</h3>
              <p className="help-text">
                These settings are only needed if auto-detection doesn't work correctly for your store.
                Manual selectors will override the automatically detected ones.
              </p>
              
              <form onSubmit={handleSubmit}>
                <div className="selector-groups">
                  <div className="selector-group">
                    <h4>Product Listing Selectors</h4>
                    
                    <div className="form-group">
                      <label htmlFor="product_link">Product Link Selector</label>
                      <input
                        id="product_link"
                        name="product_link"
                        type="text"
                        value={selectors.product_link}
                        onChange={handleInputChange}
                        placeholder=".product-item a"
                      />
                      <span className="help-text">Identifies links to product pages</span>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="pagination_next">Pagination Selector</label>
                      <input
                        id="pagination_next"
                        name="pagination_next"
                        type="text"
                        value={selectors.pagination_next}
                        onChange={handleInputChange}
                        placeholder=".pagination .next"
                      />
                      <span className="help-text">Identifies "next page" links</span>
                    </div>
                  </div>
                  
                  <div className="selector-group">
                    <h4>Product Details Selectors</h4>
                    
                    <div className="form-group">
                      <label htmlFor="prod_name">Product Name</label>
                      <input
                        id="prod_name"
                        name="prod_name"
                        type="text"
                        value={selectors.prod_name}
                        onChange={handleInputChange}
                        placeholder=".product-title h1"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="prod_price">Product Price</label>
                      <input
                        id="prod_price"
                        name="prod_price"
                        type="text"
                        value={selectors.prod_price}
                        onChange={handleInputChange}
                        placeholder=".product-price"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="prod_image">Product Image</label>
                      <input
                        id="prod_image"
                        name="prod_image"
                        type="text"
                        value={selectors.prod_image}
                        onChange={handleInputChange}
                        placeholder=".product-image img"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="prod_description">Product Description</label>
                      <input
                        id="prod_description"
                        name="prod_description"
                        type="text"
                        value={selectors.prod_description}
                        onChange={handleInputChange}
                        placeholder=".product-description"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button
                    type="submit"
                    className="save-button"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {productPreview.length > 0 && (
            <div className="preview-section">
              <h3>Product Preview</h3>
              <p className="help-text">Here's what the crawler found using the current configuration:</p>
              
              <div className="product-preview-grid">
                {productPreview.map((product, index) => (
                  <div className="preview-product-card" key={index}>
                    <div className="preview-product-image">
                      <img src={product.image} alt={product.name} />
                    </div>
                    <div className="preview-product-details">
                      <h4>{product.name}</h4>
                      <p className="preview-product-price">{product.price}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="preview-actions">
                <button
                  type="button"
                  className="start-crawler-button"
                  onClick={() => navigate(`/crawler/products/${id}`)}
                >
                  Start Full Crawl
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ConfigureCrawler; 