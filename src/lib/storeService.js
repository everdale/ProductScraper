/**
 * Store Service
 * 
 * This file provides functions to interact with the stores table in Supabase.
 * It handles CRUD operations and common queries for e-commerce stores.
 */

import { supabase, handleSupabaseError, createTableIfNotExists, checkAuth } from './supabase';

// Define the stores table name
const STORES_TABLE = 'stores';

// Define the stores table schema
const STORES_SCHEMA = `
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_crawl TIMESTAMP WITH TIME ZONE,
  product_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  config JSONB DEFAULT '{}'
`;

/**
 * Store Service for interacting with the stores table
 */
const storeService = {
  /**
   * Ensure the stores table exists
   * @returns {Promise<{success: boolean, error: string|null}>} Success or error
   */
  ensureTableExists: async () => {
    return await createTableIfNotExists(STORES_TABLE, STORES_SCHEMA);
  },

  /**
   * Fetch all stores with optional filtering and pagination
   * @param {Object} options - Query options
   * @param {string} options.category - Optional category to filter by
   * @param {number} options.limit - Optional limit on number of results
   * @param {number} options.offset - Optional offset for pagination
   * @param {string} options.orderBy - Optional field to order by
   * @param {boolean} options.ascending - Optional order direction
   * @returns {Promise<{data: Array, error: string|null}>} Stores data or error
   */
  getStores: async ({ 
    category = null, 
    limit = 50, 
    offset = 0, 
    orderBy = 'created_at',
    ascending = false,
    userId = null
  } = {}) => {
    try {
      // First ensure the table exists
      const { success, error: tableError } = await storeService.ensureTableExists();
      if (!success) {
        return { error: tableError };
      }
      
      let query = supabase
        .from(STORES_TABLE)
        .select('*')
        .order(orderBy, { ascending })
        .range(offset, offset + limit - 1);
      
      // Apply category filter if provided
      if (category) {
        query = query.eq('category', category);
      }
      
      // Filter by user_id if provided
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query;
      
      if (error) return handleSupabaseError(error);
      return { data };
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  /**
   * Get a single store by ID
   * @param {string} id - Store ID
   * @returns {Promise<{data: Object, error: string|null}>} Store data or error
   */
  getStoreById: async (id) => {
    try {
      // First ensure the table exists
      const { success, error: tableError } = await storeService.ensureTableExists();
      if (!success) {
        return { error: tableError };
      }
      
      const { data, error } = await supabase
        .from(STORES_TABLE)
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
   * Create a new store
   * @param {Object} store - Store data
   * @returns {Promise<{data: Object, error: string|null}>} New store or error
   */
  createStore: async (store) => {
    try {
      console.log('Creating store with data:', store);
      
      // Verify user_id is present
      if (!store.user_id) {
        console.error('Missing user_id in store data');
        return { error: 'User ID is required to create a store' };
      }
      
      // First check authentication status
      const { authenticated, user: authUser, error: authError } = await checkAuth();
      
      if (!authenticated) {
        console.error('Not authenticated for store creation:', authError);
        return { error: 'Authentication required to create a store' };
      }
      
      // Verify the user_id matches the authenticated user
      if (authUser.id !== store.user_id) {
        console.warn(`User ID mismatch - form user_id: ${store.user_id}, auth user_id: ${authUser.id}`);
        store.user_id = authUser.id; // Use the authenticated user ID
      }
      
      // First ensure the table exists
      const { success, error: tableError } = await storeService.ensureTableExists();
      if (!success) {
        return { error: tableError };
      }
      
      // Add timestamps and default values
      const storeWithDefaults = {
        ...store,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_crawl: null,
        product_count: 0,
        status: store.status || 'active',
        config: store.config || {}
      };

      console.log('Inserting store with final data:', storeWithDefaults);

      const { data, error } = await supabase
        .from(STORES_TABLE)
        .insert(storeWithDefaults)
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting store:', error);
        return handleSupabaseError(error);
      }
      
      console.log('Store created successfully:', data);
      return { data };
    } catch (error) {
      console.error('Exception in createStore:', error);
      return handleSupabaseError(error);
    }
  },

  /**
   * Update an existing store
   * @param {string} id - Store ID
   * @param {Object} updates - Store updates
   * @returns {Promise<{data: Object, error: string|null}>} Updated store or error
   */
  updateStore: async (id, updates) => {
    try {
      // Always update the updated_at timestamp
      const updatesWithTimestamp = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(STORES_TABLE)
        .update(updatesWithTimestamp)
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
   * Delete a store
   * @param {string} id - Store ID
   * @returns {Promise<{success: boolean, error: string|null}>} Success or error
   */
  deleteStore: async (id) => {
    try {
      const { error } = await supabase
        .from(STORES_TABLE)
        .delete()
        .eq('id', id);
      
      if (error) return handleSupabaseError(error);
      return { success: true };
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  /**
   * Update store status and crawl information
   * @param {string} id - Store ID
   * @param {string} status - New status
   * @param {number} productCount - Number of products
   * @returns {Promise<{data: Object, error: string|null}>} Updated store or error
   */
  updateStoreStatus: async (id, status, productCount = null) => {
    try {
      const updates = { 
        status,
        updated_at: new Date().toISOString(),
        ...(status === 'active' && { last_crawl: new Date().toISOString() })
      };
      
      if (productCount !== null) {
        updates.product_count = productCount;
      }
      
      const { data, error } = await supabase
        .from(STORES_TABLE)
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
   * Save store configuration (selectors, etc.)
   * @param {string} id - Store ID
   * @param {Object} config - Store configuration object
   * @returns {Promise<{data: Object, error: string|null}>} Updated store or error
   */
  saveStoreConfig: async (id, config) => {
    try {
      const { data, error } = await supabase
        .from(STORES_TABLE)
        .update({ 
          config,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) return handleSupabaseError(error);
      return { data };
    } catch (error) {
      return handleSupabaseError(error);
    }
  }
};

export default storeService; 