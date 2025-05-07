-- Seed Data for Svea AI Application

-- Insert sample products
INSERT INTO public.products (name, description, price, image_url, category, attributes, source_url)
VALUES
  (
    'Modern Sofa',
    'A comfortable modern sofa with clean lines and durable fabric.',
    699.99,
    'https://images.example.com/furniture/sofa1.jpg',
    'Furniture',
    '{"color": "gray", "material": "fabric", "dimensions": {"width": 220, "height": 85, "depth": 95}, "features": ["stain-resistant", "modular"]}',
    'https://originalstore.com/products/modern-sofa'
  ),
  (
    'Ergonomic Office Chair',
    'Adjustable office chair with lumbar support and breathable mesh back.',
    249.95,
    'https://images.example.com/furniture/chair1.jpg',
    'Furniture',
    '{"color": "black", "material": "mesh", "adjustableHeight": true, "armrests": true, "maxWeight": 150}',
    'https://officestore.com/products/ergo-chair'
  ),
  (
    'Minimalist Coffee Table',
    'Scandinavian-inspired coffee table with oak finish and sleek design.',
    199.50,
    'https://images.example.com/furniture/table1.jpg',
    'Furniture',
    '{"color": "oak", "material": "wood", "dimensions": {"width": 120, "height": 45, "depth": 60}, "assembly": "required"}',
    'https://homedesign.com/products/coffee-table'
  ),
  (
    'Smart 4K TV - 55"',
    'Ultra HD smart TV with voice control and streaming apps built-in.',
    799.99,
    'https://images.example.com/electronics/tv1.jpg',
    'Electronics',
    '{"brand": "TechVision", "resolution": "4K", "screenSize": 55, "smartFeatures": ["voice control", "wifi", "bluetooth"], "inputs": ["HDMI", "USB", "Optical"]}',
    'https://electrostore.com/products/smart-tv-55'
  ),
  (
    'Wireless Noise-Cancelling Headphones',
    'Premium over-ear headphones with active noise cancellation and 30-hour battery life.',
    299.95,
    'https://images.example.com/electronics/headphones1.jpg',
    'Electronics',
    '{"brand": "AudioPlus", "color": "black", "battery": "30 hours", "bluetooth": true, "foldable": true, "microphoneIncluded": true}',
    'https://audioworld.com/products/noise-cancelling-headphones'
  ),
  (
    'Smartphone XYZ Pro',
    'Latest flagship smartphone with triple camera system and all-day battery life.',
    899.00,
    'https://images.example.com/electronics/phone1.jpg',
    'Electronics',
    '{"brand": "TechGiant", "storage": "256GB", "ram": "8GB", "screenSize": 6.5, "camera": "triple 48MP", "color": "midnight blue"}',
    'https://phonestore.com/products/xyz-pro'
  ),
  (
    'Cotton Bedding Set - Queen',
    'Soft 100% cotton bedding set including duvet cover and two pillowcases.',
    89.99,
    'https://images.example.com/home/bedding1.jpg',
    'Home Textiles',
    '{"color": "white", "material": "cotton", "size": "queen", "pieceCount": 3, "threadCount": 400, "care": "machine washable"}',
    'https://bedandbath.com/products/cotton-bedding'
  ),
  (
    'Wool Area Rug - 5x8',
    'Hand-tufted wool rug with geometric pattern, perfect for living rooms.',
    249.00,
    'https://images.example.com/home/rug1.jpg',
    'Home Textiles',
    '{"color": "multicolor", "material": "wool", "pattern": "geometric", "dimensions": {"width": 152, "length": 244}, "pile": "medium"}',
    'https://homeaccents.com/products/geometric-rug'
  ),
  (
    'Blackout Curtains',
    'Energy-efficient blackout curtains to block light and reduce noise.',
    59.95,
    'https://images.example.com/home/curtains1.jpg',
    'Home Textiles',
    '{"color": "navy blue", "material": "polyester", "dimensions": {"width": 140, "length": 240}, "features": ["blackout", "noise reducing", "energy efficient"]}',
    'https://homewares.com/products/blackout-curtains'
  ),
  (
    'Cast Iron Dutch Oven - 5qt',
    'Versatile enameled cast iron dutch oven for baking, braising, and stewing.',
    129.99,
    'https://images.example.com/kitchenware/dutchoven1.jpg',
    'Kitchenware',
    '{"color": "red", "material": "cast iron", "capacity": "5 quarts", "dishwasherSafe": false, "ovenSafe": true, "maxTemp": 500}',
    'https://culinarystore.com/products/cast-iron-dutch-oven'
  ),
  (
    'Chef''s Knife Set',
    'Professional 5-piece knife set with ergonomic handles and German steel blades.',
    149.95,
    'https://images.example.com/kitchenware/knives1.jpg',
    'Kitchenware',
    '{"material": "German steel", "pieceCount": 5, "includes": ["chef''s knife", "bread knife", "utility knife", "paring knife", "kitchen shears"], "blockIncluded": true}',
    'https://culinarystore.com/products/chef-knife-set'
  ),
  (
    'Non-stick Cookware Set',
    'Complete 10-piece non-stick cookware set for everyday cooking.',
    199.99,
    'https://images.example.com/kitchenware/cookware1.jpg',
    'Kitchenware',
    '{"material": "aluminum", "coating": "non-stick", "pieceCount": 10, "dishwasherSafe": true, "colorOptions": ["black", "copper", "gray"], "inductionCompatible": true}',
    'https://kitchenstore.com/products/nonstick-cookware-set'
  ); 