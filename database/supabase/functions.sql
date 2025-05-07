-- Supabase Database Functions

-- Function to get product categories with counts
CREATE OR REPLACE FUNCTION public.get_product_categories()
RETURNS TABLE(category TEXT, count BIGINT) 
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    category,
    COUNT(id) as count
  FROM products
  GROUP BY category
  ORDER BY category;
$$;

-- Function to search products with more advanced filtering
CREATE OR REPLACE FUNCTION public.search_products(
  search_query TEXT,
  category_filter TEXT DEFAULT NULL,
  min_price DECIMAL DEFAULT NULL,
  max_price DECIMAL DEFAULT NULL,
  limit_val INTEGER DEFAULT 20,
  offset_val INTEGER DEFAULT 0
)
RETURNS SETOF products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM products p
  WHERE
    -- Apply search filter if provided
    (search_query IS NULL OR 
     p.name ILIKE '%' || search_query || '%' OR 
     p.description ILIKE '%' || search_query || '%')
    -- Apply category filter if provided
    AND (category_filter IS NULL OR p.category = category_filter)
    -- Apply price range filters if provided
    AND (min_price IS NULL OR p.price >= min_price)
    AND (max_price IS NULL OR p.price <= max_price)
  ORDER BY p.created_at DESC
  LIMIT limit_val
  OFFSET offset_val;
END;
$$;

-- Function to get featured products
CREATE OR REPLACE FUNCTION public.get_featured_products(limit_val INTEGER DEFAULT 5)
RETURNS SETOF products
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM products
  -- You could modify this with your own logic, for example:
  -- WHERE attributes->>'featured' = 'true'
  -- For now, just returning newest products
  ORDER BY created_at DESC
  LIMIT limit_val;
$$; 