import { Product, StoreType, Store } from './types';

export const STORE_TYPES: StoreType[] = [
  'Kirana', 
  'Clothing', 
  'Electronics', 
  'Medical', 
  'Paints',
  'Shoes',
  'Bakery',
  'General',
  'Auto Parts'
];

export const STORE_CATEGORIES: Record<StoreType, string[]> = {
  'Kirana': ['Vegetables', 'Fruits', 'Spices', 'Snacks', 'Pantry'],
  'Clothing': ['Mens Wear', 'Womens Wear', 'Kids Wear', 'Accessories', 'Footwear'],
  'Electronics': ['Mobile', 'Appliances', 'Lighting', 'Accessories', 'Computers'],
  'Medical': ['Medicines', 'First Aid', 'Wellness', 'Baby Care', 'Supplements'],
  'Paints': ['Interior Paint', 'Exterior Paint', 'Tools', 'Hardware', 'Adhesives'],
  'Shoes': ['Running', 'Formal', 'Casual', 'Boots', 'Sandals'],
  'Bakery': ['Bread', 'Cakes', 'Pastries', 'Cookies', 'Beverages'],
  'General': ['Stationery', 'Household', 'Gifts', 'Toys', 'Cleaning'],
  'Auto Parts': ['Engine Oil', 'Filters', 'Batteries', 'Tires', 'Accessories']
};

export const STORE_IMAGES: Record<string, string> = {
  'All': 'https://images.unsplash.com/photo-1472851294608-41531b665086?auto=format&fit=crop&w=800&q=80',
  'Kirana': 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
  'Clothing': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
  'Electronics': 'https://images.unsplash.com/photo-1498049381145-066429502cdb?auto=format&fit=crop&w=800&q=80',
  'Medical': 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=800&q=80',
  'Paints': 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80',
  'Shoes': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
  'Bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  'General': 'https://images.unsplash.com/photo-1527011046414-4781f1f94f8c?auto=format&fit=crop&w=800&q=80',
  'Auto Parts': 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=800&q=80'
};

export const MOCK_STORES: Store[] = [
  { id: 'store-1', ownerId: '1', name: 'Golden Crust Bakery', type: 'Bakery', address: '12 Baker Street, Indore', phoneNumber: '+91 98765 43210' },
  { id: 'store-2', ownerId: 'owner-2', name: 'Fresh Greens Mart', type: 'Kirana', address: '45 Veggie Lane, Indore', phoneNumber: '+91 98765 43211' },
  { id: 'store-3', ownerId: 'owner-3', name: 'Urban Style Hub', type: 'Clothing', address: 'Mall Road, Indore', phoneNumber: '+91 98765 43212' },
  { id: 'store-4', ownerId: 'owner-4', name: 'Tech Point', type: 'Electronics', address: 'Tech Park, Indore', phoneNumber: '+91 98765 43213' },
  { id: 'store-5', ownerId: 'owner-5', name: 'City Pharmacy', type: 'Medical', address: 'Health Square, Indore', phoneNumber: '+91 98765 43214' },
  { id: 'store-6', ownerId: 'owner-6', name: 'Colors & Hues', type: 'Paints', address: 'Color Street, Indore', phoneNumber: '+91 98765 43215' },
  { id: 'store-7', ownerId: 'owner-7', name: 'Step Up Shoes', type: 'Shoes', address: 'Shoe Lane, Indore', phoneNumber: '+91 98765 43216' },
  { id: 'store-8', ownerId: 'owner-8', name: 'Speedy Spares', type: 'Auto Parts', address: 'Motor Way, Indore', phoneNumber: '+91 98765 43217' },
  { id: 'store-9', ownerId: 'owner-9', name: 'Everyday Essentials', type: 'General', address: 'Main Market, Indore', phoneNumber: '+91 98765 43218' }
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Artisan Sourdough Bread',
    description: 'Freshly baked sourdough with a crispy crust and soft, airy interior. Made with 100% organic flour.',
    price: 120.00,
    storeType: 'Bakery',
    category: 'Bread',
    imageUrl: 'https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&w=800&q=80',
    stock: 20,
    storeName: 'Golden Crust Bakery',
    storeId: 'store-1',
    distance: '0.2 mi'
  },
  {
    id: '2',
    name: 'Organic Avocados (Pack of 2)',
    description: 'Creamy, ripe avocados perfect for guacamole or toast. Locally sourced.',
    price: 250.00,
    storeType: 'Kirana',
    category: 'Fruits',
    imageUrl: 'https://images.unsplash.com/photo-1523049673856-6068b5a305d9?auto=format&fit=crop&w=800&q=80',
    stock: 15,
    storeName: 'Fresh Greens Mart',
    storeId: 'store-2',
    distance: '0.5 mi'
  },
  {
    id: '3',
    name: 'Men\'s Cotton T-Shirt',
    description: 'Classic fit, 100% cotton t-shirt. Breathable and comfortable for everyday wear.',
    price: 599.00,
    storeType: 'Clothing',
    category: 'Mens Wear',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
    stock: 50,
    storeName: 'Urban Style Hub',
    storeId: 'store-3',
    distance: '1.2 mi'
  },
  {
    id: '4',
    name: 'Wireless Bluetooth Earbuds',
    description: 'High-fidelity sound with noise cancellation. 24-hour battery life with charging case.',
    price: 1999.00,
    storeType: 'Electronics',
    category: 'Accessories',
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
    stock: 10,
    storeName: 'Tech Point',
    storeId: 'store-4',
    distance: '0.8 mi'
  },
  {
    id: '5',
    name: 'Pain Relief Tablets (24ct)',
    description: 'Fast-acting pain relief for headaches and muscle aches.',
    price: 150.00,
    storeType: 'Medical',
    category: 'Medicines',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
    stock: 100,
    storeName: 'City Pharmacy',
    storeId: 'store-5',
    distance: '0.3 mi'
  },
  {
    id: '6',
    name: 'Interior Wall Paint - Eggshell',
    description: 'Premium quality interior paint with excellent coverage and durability. Low odor.',
    price: 2400.00,
    storeType: 'Paints',
    category: 'Interior Paint',
    imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80',
    stock: 25,
    storeName: 'Colors & Hues',
    storeId: 'store-6',
    distance: '1.5 mi'
  },
  {
    id: '7',
    name: 'Running Sports Shoes',
    description: 'Lightweight breathable mesh running shoes with cushioned sole.',
    price: 2499.00,
    storeType: 'Shoes',
    category: 'Running',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    stock: 12,
    storeName: 'Step Up Shoes',
    storeId: 'store-7',
    distance: '1.1 mi'
  },
  {
    id: '8',
    name: 'Synthetic Engine Oil 5W-30',
    description: 'High performance synthetic motor oil for superior engine protection.',
    price: 1200.00,
    storeType: 'Auto Parts',
    category: 'Engine Oil',
    imageUrl: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=800&q=80',
    stock: 30,
    storeName: 'Speedy Spares',
    storeId: 'store-8',
    distance: '2.0 mi'
  },
  {
    id: '9',
    name: 'Premium Notebook Set',
    description: 'Pack of 3 hardcover notebooks with high-quality paper.',
    price: 350.00,
    storeType: 'General',
    category: 'Stationery',
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
    stock: 40,
    storeName: 'Everyday Essentials',
    storeId: 'store-9',
    distance: '0.6 mi'
  },
  {
    id: '10',
    name: 'Chocolate Croissants',
    description: 'Buttery, flaky croissants filled with rich dark chocolate.',
    price: 180.00,
    storeType: 'Bakery',
    category: 'Pastries',
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
    stock: 15,
    storeName: 'Golden Crust Bakery',
    storeId: 'store-1',
    distance: '0.2 mi'
  },
  {
    id: '11',
    name: 'Leather Formal Shoes',
    description: 'Classic brown leather oxfords, perfect for office wear.',
    price: 3999.00,
    storeType: 'Shoes',
    category: 'Formal',
    imageUrl: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=800&q=80',
    stock: 8,
    storeName: 'Step Up Shoes',
    storeId: 'store-7',
    distance: '1.1 mi'
  },
  {
    id: '12',
    name: 'Eco-Friendly Cleaning Kit',
    description: 'All-purpose cleaner, glass cleaner, and bathroom cleaner set.',
    price: 650.00,
    storeType: 'General',
    category: 'Cleaning',
    imageUrl: 'https://images.unsplash.com/photo-1585832013785-d509039a167c?auto=format&fit=crop&w=800&q=80',
    stock: 22,
    storeName: 'Everyday Essentials',
    storeId: 'store-9',
    distance: '0.6 mi'
  }
];