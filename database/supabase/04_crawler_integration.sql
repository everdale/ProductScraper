-- Crawler Integration for Supabase

-- Function to synchronize products from crawler to Supabase
CREATE OR REPLACE FUNCTION public.sync_crawler_products(
  crawler_products JSONB,
  store_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  product JSONB;
  result JSONB = '{"added": 0, "updated": 0, "skipped": 0}'::JSONB;
  existing_id UUID;
  current_url TEXT;
  current_name TEXT;
  current_price DECIMAL;
  current_description TEXT;
  current_attributes JSONB;
BEGIN
  -- Check if user is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Permission denied: Admin role required';
  END IF;

  -- Process each product in the array
  FOR i IN 0..jsonb_array_length(crawler_products) - 1 LOOP
    product = crawler_products->i;
    
    -- Extract data
    current_url = product->>'url';
    current_name = product->>'name';
    current_price = (product->>'price')::DECIMAL;
    current_description = product->>'description';
    
    -- Create attributes JSON with store reference and other metadata
    current_attributes = jsonb_build_object(
      'store_id', store_id::TEXT,
      'external_id', product->>'external_id',
      'in_stock', COALESCE((product->>'in_stock')::BOOLEAN, true),
      'crawled_at', CURRENT_TIMESTAMP
    );
    
    -- Add specs if available
    IF product ? 'specs' THEN
      current_attributes = current_attributes || jsonb_build_object('specs', product->'specs');
    END IF;
    
    -- Check if product already exists based on URL
    SELECT id INTO existing_id 
    FROM products 
    WHERE source_url = current_url;
    
    IF existing_id IS NOT NULL THEN
      -- Update existing product
      UPDATE products
      SET 
        name = current_name,
        price = current_price,
        description = current_description,
        attributes = current_attributes,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = existing_id;
      
      result = jsonb_set(result, '{updated}', to_jsonb((result->>'updated')::INTEGER + 1));
    ELSE
      -- Insert new product
      INSERT INTO products (
        name, 
        description,
        price,
        image_url,
        category,
        attributes,
        source_url
      ) VALUES (
        current_name,
        current_description,
        current_price,
        product->>'image_url',
        COALESCE(product->>'category', 'Uncategorized'),
        current_attributes,
        current_url
      );
      
      result = jsonb_set(result, '{added}', to_jsonb((result->>'added')::INTEGER + 1));
    END IF;
  END LOOP;
  
  -- Update the store's last_crawl timestamp and increment product count
  UPDATE stores
  SET 
    last_crawl = CURRENT_TIMESTAMP,
    product_count = product_count + (result->>'added')::INTEGER
  WHERE id = store_id;
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  -- Return error information
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Function to update store crawling status
CREATE OR REPLACE FUNCTION public.update_store_status(
  p_store_id UUID,
  p_status TEXT,
  p_crawl_data JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Check if user is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Permission denied: Admin role required';
  END IF;

  -- Update store status
  UPDATE stores
  SET 
    status = p_status,
    config = CASE WHEN p_crawl_data IS NOT NULL 
                      THEN config || p_crawl_data 
                      ELSE config 
                     END,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_store_id;
  
  -- Return updated store data
  SELECT json_build_object(
    'id', id,
    'name', name,
    'url', url,
    'status', status,
    'last_crawl', last_crawl,
    'config', config,
    'product_count', product_count
  ) INTO result
  FROM stores
  WHERE id = p_store_id;
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  -- Return error information
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$; 