import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../Layout';

/**
 * Products Component
 * Displays products crawled from a specific e-commerce site
 */
const Products = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [site, setSite] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock fetching site data and products - replace with actual API call in production
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // Sample site data
      const mockSite = {
        id: parseInt(id),
        name: id === '1' ? 'Kjell & Company' : 'Example Store',
        url: id === '1' ? 'https://www.kjell.com/se/produkter' : 'https://example.com/products',
      };
      
      // Sample product data
      const mockProducts = [
        {
          id: 1,
          name: 'Wireless Keyboard K380',
          price: '399 kr',
          description: 'Wireless keyboard with multi-device support',
          image_url: 'https://via.placeholder.com/150',
          url: 'https://www.kjell.com/se/produkter/sample-product-1',
          extracted_at: new Date().toISOString()
        },
        {
          id: 2,
          name: 'USB-C Hub 7-in-1',
          price: '599 kr',
          description: 'USB-C hub with HDMI, USB-A, SD card reader',
          image_url: 'https://via.placeholder.com/150',
          url: 'https://www.kjell.com/se/produkter/sample-product-2',
          extracted_at: new Date().toISOString()
        },
        {
          id: 3,
          name: 'Bluetooth Speaker',
          price: '799 kr',
          description: 'Portable Bluetooth speaker with 12 hours battery life',
          image_url: 'https://via.placeholder.com/150',
          url: 'https://www.kjell.com/se/produkter/sample-product-3',
          extracted_at: new Date().toISOString()
        },
        {
          id: 4,
          name: 'Wireless Mouse',
          price: '249 kr',
          description: 'Ergonomic wireless mouse with quiet clicks',
          image_url: 'https://via.placeholder.com/150',
          url: 'https://www.kjell.com/se/produkter/sample-product-4',
          extracted_at: new Date().toISOString()
        }
      ];
      
      setSite(mockSite);
      setProducts(mockProducts);
      setLoading(false);
    }, 500);
  }, [id]);

  const handleDeleteProduct = (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(product => product.id !== productId));
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="crawler-dashboard">
          <h1>Products</h1>
          <p>Loading products...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="crawler-dashboard">
        <div className="crawler-header">
          <h1>Products from: {site?.name}</h1>
          <button 
            className="back-button"
            onClick={() => navigate('/crawler')}
          >
            Back to Crawler Dashboard
          </button>
        </div>

        <div className="products-container">
          <div className="products-header">
            <h2>Crawled Products ({products.length})</h2>
            <div className="header-actions">
              <button 
                className="refresh-button"
                onClick={() => setLoading(true)}
              >
                Refresh
              </button>
              <button 
                className="start-crawl-button"
                onClick={() => navigate(`/crawler/configure/${id}`)}
              >
                Configure Crawler
              </button>
            </div>
          </div>

          {products.length > 0 ? (
            <div className="products-grid">
              {products.map((product) => (
                <div className="product-card" key={product.id}>
                  <div className="product-image">
                    <img src={product.image_url} alt={product.name} />
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <div className="product-price">{product.price}</div>
                    <p className="product-description">{product.description}</p>
                    <div className="product-actions">
                      <a 
                        href={product.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="view-product-link"
                      >
                        View on Site
                      </a>
                      <button
                        className="delete-product-button"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-products">
              <p>No products have been crawled from this site yet.</p>
              <p>Start a crawl from the dashboard to gather products.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Products; 