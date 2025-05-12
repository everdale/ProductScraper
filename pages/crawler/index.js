import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';

export default function CrawlerDashboard() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newSite, setNewSite] = useState({ name: '', url: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/crawler');
      setSites(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load crawler sites: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSite({ ...newSite, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newSite.name || !newSite.url) {
      setError('Name and URL are required');
      return;
    }

    try {
      setSubmitLoading(true);
      setError(null);
      
      const response = await axios.post('/api/crawler', newSite);
      
      setSuccessMessage('Site added successfully! Redirecting to configure selectors...');
      setTimeout(() => {
        router.push(`/crawler/configure/${response.data.site.id}`);
      }, 2000);
      
      setNewSite({ name: '', url: '' });
    } catch (err) {
      setError('Failed to add site: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this site? This will delete all associated data.')) {
      return;
    }

    try {
      await axios.delete(`/api/crawler?id=${id}`);
      setSuccessMessage('Site deleted successfully');
      fetchSites();
    } catch (err) {
      setError('Failed to delete site: ' + (err.response?.data?.error || err.message));
    }
  };

  const startCrawl = async (id) => {
    try {
      setSuccessMessage('');
      setError(null);
      await axios.post('/api/crawler/start', { siteId: id });
      setSuccessMessage(`Crawl started for site ID ${id}`);
      
      // Refresh site list after a brief delay
      setTimeout(() => {
        fetchSites();
      }, 2000);
    } catch (err) {
      setError('Failed to start crawl: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>Product Crawler Dashboard</title>
      </Head>

      <h1 className="text-3xl font-bold mb-6">Product Crawler Dashboard</h1>

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

      {/* Add new site form */}
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New E-commerce Site</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                Site Name
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="name"
                type="text"
                name="name"
                value={newSite.name}
                onChange={handleInputChange}
                placeholder="e.g., Kjell & Company"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="url">
                Starting URL
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="url"
                type="url"
                name="url"
                value={newSite.url}
                onChange={handleInputChange}
                placeholder="e.g., https://www.kjell.com/se/produkter/ljud-bild"
              />
            </div>
          </div>
          <div className="flex items-center justify-end">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
              disabled={submitLoading}
            >
              {submitLoading ? 'Adding...' : 'Add Site'}
            </button>
          </div>
        </form>
      </div>

      {/* Sites list */}
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
        <h2 className="text-xl font-semibold mb-4">Configured Sites</h2>
        
        {loading ? (
          <p>Loading sites...</p>
        ) : sites.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Crawled
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sites.map((site) => (
                  <tr key={site.id}>
                    <td className="py-2 px-4 border-b border-gray-200">{site.id}</td>
                    <td className="py-2 px-4 border-b border-gray-200">{site.name}</td>
                    <td className="py-2 px-4 border-b border-gray-200">
                      <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {site.url.substring(0, 30)}...
                      </a>
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${site.status === 'active' ? 'bg-green-100 text-green-800' : 
                          site.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                        {site.status}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200">
                      {site.last_crawled ? new Date(site.last_crawled).toLocaleString() : 'Never'}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200">
                      <div className="flex space-x-2">
                        <Link 
                          href={`/crawler/configure/${site.id}`}
                          className="text-indigo-600 hover:text-indigo-900 mr-2"
                        >
                          Configure
                        </Link>
                        <button
                          onClick={() => startCrawl(site.id)}
                          disabled={site.status === 'active'}
                          className={`text-green-600 hover:text-green-900 mr-2 ${site.status === 'active' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {site.status === 'active' ? 'Crawling...' : 'Start Crawl'}
                        </button>
                        <Link 
                          href={`/crawler/products/${site.id}`}
                          className="text-blue-600 hover:text-blue-900 mr-2"
                        >
                          Products
                        </Link>
                        <button
                          onClick={() => handleDelete(site.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No sites configured yet. Add your first site above.</p>
        )}
      </div>
    </div>
  );
} 