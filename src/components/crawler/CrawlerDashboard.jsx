import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout';
import { useAuth } from '../auth';
import storeService from '../../lib/storeService';

/**
 * Store Manager Component
 * Displays a dashboard for managing e-commerce store connections
 */
const StoreDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStore, setNewStore] = useState({
    name: '',
    url: '',
    category: ''
  });
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch stores from Supabase
    const fetchStores = async () => {
      setLoading(true);
      try {
        // Get the current user's stores
        const userId = user?.id;
        
        if (!userId) {
          setError('User not authenticated');
          console.error('No user ID available when loading dashboard');
          setLoading(false);
          return;
        }
        
        console.log('Loading stores for user:', userId);
        
        const { data, error } = await storeService.getStores({ 
          userId, 
          orderBy: 'created_at', 
          ascending: false 
        });
        
        if (error) {
          setError(`Error loading stores: ${error}`);
          console.error('Error fetching stores:', error);
        } else {
          console.log('Stores loaded successfully:', data);
          setStores(data || []);
        }
      } catch (err) {
        setError(`Unexpected error: ${err.message}`);
        console.error('Error in fetchStores:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchStores();
    } else {
      console.log('Waiting for user authentication data...');
      setLoading(false);
    }
  }, [user]);

  const handleAddStore = () => {
    setShowAddForm(true);
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewStore({
      name: '',
      url: '',
      category: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStore(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Simple validation
    if (!newStore.name || !newStore.url) {
      setStatusMessage('Please fill in all required fields');
      setTimeout(() => setStatusMessage(''), 3000);
      return;
    }
    
    // Check if user is authenticated
    if (!user || !user.id) {
      setStatusMessage('You must be logged in to add a store');
      console.error('User not authenticated when trying to add store');
      setTimeout(() => setStatusMessage(''), 5000);
      return;
    }
    
    console.log('Authenticated user when adding store:', user);
    
    try {
      // Add the user_id to the new store data
      const storeData = {
        ...newStore,
        user_id: user.id,
        status: 'active',
        config: {}
      };
      
      console.log('Attempting to create store with data:', storeData);
      
      // Create the store in the database
      const { data, error } = await storeService.createStore(storeData);
      
      if (error) {
        console.error('Store creation error:', error);
        setStatusMessage(`Error adding store: ${error}`);
        setTimeout(() => setStatusMessage(''), 5000);
        return;
      }
      
      // Add the new store to the list
      setStores(prev => [data, ...prev]);
      setShowAddForm(false);
      setNewStore({
        name: '',
        url: '',
        category: ''
      });
      
      setStatusMessage('Store added successfully!');
      setTimeout(() => setStatusMessage(''), 3000);
      
      // Navigate to configure page for the new store
      navigate(`/crawler/configure/${data.id}`);
    } catch (err) {
      console.error('Exception when adding store:', err);
      setStatusMessage(`Unexpected error: ${err.message}`);
      setTimeout(() => setStatusMessage(''), 5000);
    }
  };

  const handleDeleteStore = async (id) => {
    try {
      // Delete store from database
      const { error } = await storeService.deleteStore(id);
      
      if (error) {
        setStatusMessage(`Error deleting store: ${error}`);
        setTimeout(() => setStatusMessage(''), 5000);
        return;
      }
      
      // Remove from local state
      setStores(prev => prev.filter(store => store.id !== id));
      setStatusMessage('Store deleted successfully!');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      setStatusMessage(`Unexpected error: ${err.message}`);
      setTimeout(() => setStatusMessage(''), 5000);
      console.error('Error deleting store:', err);
    }
  };

  const handleViewProducts = (id) => {
    navigate(`/crawler/products/${id}`);
  };

  const handleConfigureStore = (id) => {
    navigate(`/crawler/configure/${id}`);
  };

  const handleCrawlStore = async (id) => {
    try {
      // Update store status to crawling
      await storeService.updateStoreStatus(id, 'crawling');
      
      // Update local state
      setStores(prev => prev.map(store => {
        if (store.id === id) {
          return {
            ...store,
            status: 'crawling'
          };
        }
        return store;
      }));
      
      setStatusMessage('Crawl started! You can view the progress in the products page.');
      
      // Navigate to the products page to show crawl progress
      navigate(`/crawler/products/${id}`);
    } catch (err) {
      setStatusMessage(`Error starting crawl: ${err.message}`);
      setTimeout(() => setStatusMessage(''), 5000);
      console.error('Error starting crawl:', err);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="store-dashboard">
          <h1>Store Manager</h1>
          <p>Loading stores...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="store-dashboard">
        <div className="dashboard-header">
          <h1>Store Manager</h1>
          {!showAddForm && (
            <button 
              className="add-button"
              onClick={handleAddStore}
            >
              Add New Store
            </button>
          )}
        </div>
        
        {statusMessage && (
          <div className="status-message">
            {statusMessage}
          </div>
        )}
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {showAddForm ? (
          <div className="add-store-form-container">
            <div className="form-header">
              <h2>Add New Store</h2>
              <button 
                className="close-button"
                onClick={handleCancelAdd}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="add-store-form">
              <div className="form-group">
                <label htmlFor="name">Store Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={newStore.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Electronics Mega Store"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="url">Website URL</label>
                <input
                  id="url"
                  name="url"
                  type="url"
                  value={newStore.url}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <input
                  id="category"
                  name="category"
                  type="text"
                  value={newStore.category}
                  onChange={handleInputChange}
                  placeholder="e.g. Electronics, Fashion, Home"
                />
              </div>
              
              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={handleCancelAdd}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-button"
                >
                  Add Store
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="stores-container">
            {stores.length === 0 ? (
              <div className="no-stores">
                <p>No stores found. Add a store to get started!</p>
              </div>
            ) : (
              <div className="store-cards">
                {stores.map(store => (
                  <div className="store-card" key={store.id}>
                    <div className="store-card-header">
                      <h2>{store.name}</h2>
                      <span className="store-category">{store.category}</span>
                    </div>
                    
                    <div className="store-card-details">
                      <div className="store-detail">
                        <span className="detail-label">Website:</span>
                        <span className="detail-value">{store.url}</span>
                      </div>
                      
                      <div className="store-detail">
                        <span className="detail-label">Last Crawled:</span>
                        <span className="detail-value">{store.last_crawl ? new Date(store.last_crawl).toLocaleDateString() : 'Never'}</span>
                      </div>
                      
                      <div className="store-detail">
                        <span className="detail-label">Products:</span>
                        <span className="detail-value">{store.product_count || 0}</span>
                      </div>
                      
                      <div className="store-detail">
                        <span className="detail-label">Status:</span>
                        <span className={`detail-value status-${store.status}`}>
                          {store.status === 'active' ? 'Active' : 
                           store.status === 'pending' ? 'Pending Setup' : 
                           store.status === 'crawling' ? 'Crawling...' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="store-card-actions">
                      <button
                        className="view-button"
                        onClick={() => handleViewProducts(store.id)}
                        disabled={store.product_count === 0}
                      >
                        View Products
                      </button>
                      
                      <button
                        className="configure-button"
                        onClick={() => handleConfigureStore(store.id)}
                      >
                        Configure
                      </button>
                      
                      <button
                        className="crawl-button"
                        onClick={() => handleCrawlStore(store.id)}
                        disabled={store.status === 'crawling'}
                      >
                        {store.status === 'crawling' ? 'Crawling...' : 'Start Crawl'}
                      </button>
                      
                      <button
                        className="delete-button"
                        onClick={() => handleDeleteStore(store.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        <div className="dashboard-info">
          <h2>About Store Manager</h2>
          <p>
            The Store Manager allows you to connect and crawl e-commerce stores to collect product information.
            Add stores, configure how products are detected, and start crawls to keep your product database up to date.
          </p>
          <p>
            <strong>Quick Start:</strong> Click "Add New Store" to connect to an e-commerce site.
            Our AI-powered crawler will automatically detect products and organize them for comparison.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default StoreDashboard; 