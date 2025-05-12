/**
 * Product Service
 * 
 * This file provides functions to interact with the products table in Supabase.
 * It handles CRUD operations and common queries for products.
 */

import { supabase, handleSupabaseError, createTableIfNotExists } from './supabase';

// Define the products table name
const PRODUCTS_TABLE = 'products';

// Define the products table schema
const PRODUCTS_SCHEMA = `
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  sale_price DECIMAL(10, 2),
  image_url TEXT,
  url TEXT,
  category TEXT,
  brand TEXT,
  sku TEXT,
  store_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  stock_status TEXT,
  data JSONB
`;

/**
 * Product Service for interacting with the products table
 */
const productService = {
  /**
   * Ensure the products table exists
   * @returns {Promise<{success: boolean, error: string|null}>} Success or error
   */
  ensureTableExists: async () => {
    return await createTableIfNotExists(PRODUCTS_TABLE, PRODUCTS_SCHEMA);
  },
  
  /**
   * Fetch all products with optional filtering and pagination
   * @param {Object} options - Query options
   * @param {string} options.category - Optional category to filter by
   * @param {number} options.limit - Optional limit on number of results
   * @param {number} options.offset - Optional offset for pagination
   * @param {string} options.orderBy - Optional field to order by
   * @param {boolean} options.ascending - Optional order direction
   * @returns {Promise<{data: Array, error: string|null}>} Products data or error
   */
  getProducts: async ({ 
    category = null, 
    limit = 50, 
    offset = 0, 
    orderBy = 'created_at',
    ascending = false
  } = {}) => {
    try {
      // First ensure the table exists
      const { success, error: tableError } = await productService.ensureTableExists();
      if (!success) {
        return { error: tableError };
      }
      
      let query = supabase
        .from(PRODUCTS_TABLE)
        .select('*')
        .order(orderBy, { ascending })
        .range(offset, offset + limit - 1);
      
      // Apply category filter if provided
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query;
      
      if (error) return handleSupabaseError(error);
      return { data };
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  /**
   * Get a single product by ID
   * @param {string} id - Product ID
   * @returns {Promise<{data: Object, error: string|null}>} Product data or error
   */
  getProductById: async (id) => {
    try {
      // First ensure the table exists
      const { success, error: tableError } = await productService.ensureTableExists();
      if (!success) {
        return { error: tableError };
      }
      
      const { data, error } = await supabase
        .from(PRODUCTS_TABLE)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) return handleSupabaseError(error);
      return { data };
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  /**
   * Search products by name or description
   * @param {string} query - Search query
   * @param {number} limit - Optional limit on results
   * @returns {Promise<{data: Array, error: string|null}>} Products data or error
   */
  searchProducts: async (query, limit = 20) => {
    try {
      // First ensure the table exists
      const { success, error: tableError } = await productService.ensureTableExists();
      if (!success) {
        return { error: tableError };
      }
      
      // Using Postgres textual search capabilities
      const { data, error } = await supabase
        .from(PRODUCTS_TABLE)
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(limit);
      
      if (error) return handleSupabaseError(error);
      return { data };
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  /**
   * Create a new product (admin only via RLS)
   * @param {Object} product - Product data
   * @returns {Promise<{data: Object, error: string|null}>} New product or error
   */
  createProduct: async (product) => {
    try {
      // First ensure the table exists
      const { success, error: tableError } = await productService.ensureTableExists();
      if (!success) {
        return { error: tableError };
      }
      
      const { data, error } = await supabase
        .from(PRODUCTS_TABLE)
        .insert(product)
        .select()
        .single();
      
      if (error) return handleSupabaseError(error);
      return { data };
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  /**
   * Update an existing product (admin only via RLS)
   * @param {string} id - Product ID
   * @param {Object} updates - Product updates
   * @returns {Promise<{data: Object, error: string|null}>} Updated product or error
   */
  updateProduct: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from(PRODUCTS_TABLE)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) return handleSupabaseError(error);
      return { data };
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  /**
   * Delete a product (admin only via RLS)
   * @param {string} id - Product ID
   * @returns {Promise<{success: boolean, error: string|null}>} Success or error
   */
  deleteProduct: async (id) => {
    try {
      const { error } = await supabase
        .from(PRODUCTS_TABLE)
        .delete()
        .eq('id', id);
      
      if (error) return handleSupabaseError(error);
      return { success: true };
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  /**
   * Get product categories with counts
   * @returns {Promise<{data: Array, error: string|null}>} Categories data or error
   */
  getCategories: async () => {
    try {
      // First ensure the table exists
      const { success, error: tableError } = await productService.ensureTableExists();
      if (!success) {
        return { error: tableError };
      }
      
      // This uses PostgreSQL's aggregation functionality
      const { data, error } = await supabase
        .rpc('get_product_categories');
      
      if (error) {
        // Fallback if the RPC function doesn't exist
        const { data: fallbackData, error: fallbackError } = await supabase
          .from(PRODUCTS_TABLE)
          .select('category')
          .order('category');
        
        if (fallbackError) return handleSupabaseError(fallbackError);
        
        // Process to get unique categories
        const categories = [...new Set(fallbackData.map(p => p.category))];
        return { data: categories.map(category => ({ category, count: 0 })) };
      }
      
      return { data };
    } catch (error) {
      return handleSupabaseError(error);
    }
  }
};

export default productService; 