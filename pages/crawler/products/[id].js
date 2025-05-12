import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';

export default function ProductsList() {
  const router = useRouter();
  const { id } = router.query;
  const [site, setSite] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (id) {
      fetchSite();
      fetchProducts();
    }
  }, [id, page, pageSize]);

  const fetchSite = async () => {
    try {
      const response = await axios.get(`/api/crawler?id=${id}`);
      setSite(response.data);
    } catch (err) {
      setError('Failed to load site information: ' + (err.response?.data?.error || err.message));
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/crawler/products?siteId=${id}&page=${page}&pageSize=${pageSize}`);
      setProducts(response.data.products);
      setTotalProducts(response.data.total);
      setError(null);
    } catch (err) {
      setError('Failed to load products: ' + (err.response?.data?.error || err.message));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setPage(1); // Reset to first page when changing page size
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>{site ? `Products from ${site.name}` : 'Products'}</title>
      </Head>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {site ? `Products from ${site.name}` : 'Products'}
        </h1>
        <div className="flex space-x-4">
          <Link href={`/crawler/configure/${id}`} className="text-blue-600 hover:underline">
            Configure Selectors
          </Link>
          <Link href="/crawler" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Products count and pagination controls */}
      <div className="bg-white shadow-md rounded px-6 py-4 mb-6 flex justify-between items-center">
        <div>
          {!loading && (
            <span className="text-gray-700">
              Showing {products.length} of {totalProducts} products
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-gray-700">Page Size:</span>
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="border rounded py-1 px-2"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className={`px-3 py-1 rounded ${page === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
              Previous
            </button>
            <span className="px-3 py-1 bg-gray-200 rounded">
              Page {page} of {Math.ceil(totalProducts / pageSize) || 1}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= Math.ceil(totalProducts / pageSize)}
              className={`px-3 py-1 rounded ${page >= Math.ceil(totalProducts / pageSize) ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Products grid */}
      {loading ? (
        <div className="text-center py-10">
          <p className="text-gray-600">Loading products...</p>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-white shadow-md rounded overflow-hidden">
              {/* Product image */}
              <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  <img 
                    src={product.images[0]} 
                    alt={product.name} 
                    className="w-full h-full object-contain"
                    onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                  />
                ) : (
                  <div className="text-gray-500">No image</div>
                )}
              </div>
              
              {/* Product details */}
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-2 line-clamp-2" title={product.name}>
                  {product.name}
                </h2>
                
                <p className="text-gray-700 text-xl font-bold mb-2">
                  {product.price.toFixed(2)} {product.currency}
                </p>
                
                <div className="mb-3 h-12 overflow-hidden">
                  <p className="text-gray-600 text-sm line-clamp-2" title={product.description}>
                    {product.description || 'No description available'}
                  </p>
                </div>
                
                <div className="flex justify-between items-center">
                  <a 
                    href={product.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View Original
                  </a>
                  <span className="text-xs text-gray-500">
                    Updated: {new Date(product.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white shadow-md rounded p-8 text-center">
          <p className="text-gray-600 mb-4">No products found for this site.</p>
          <p className="text-gray-600">
            Make sure you've configured the selectors correctly and run a crawl.
          </p>
          <div className="mt-6">
            <Link 
              href={`/crawler/configure/${id}`}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Configure Selectors
            </Link>
          </div>
        </div>
      )}
    </div>
  );
} 