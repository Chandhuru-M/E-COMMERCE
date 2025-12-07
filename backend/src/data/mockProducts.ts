export interface ProductRecord {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  sku: string;
  stock: number;
  category: string;
  brand?: string;
  tag?: string;
  rating?: number;
  reviews?: number;
}

export const mockProducts: ProductRecord[] = [
  {
    id: 'neo-aurora-1',
    name: 'Neo Aurora Pro 15" Laptop',
    description: '3.1K Liquid Retina display, AI co-processor, 22-hour battery.',
    price: 149999,
    currency: 'INR',
    image: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92eee?auto=format&fit=crop&w=1200&q=80',
    sku: 'NEO-LTP-15-AURORA',
    stock: 34,
    category: 'electronics',
    brand: 'Neo',
    tag: 'New Launch',
    rating: 4.9,
    reviews: 412
  },
  {
    id: 'neo-buds',
    name: 'Neo SonicBuds Max ANC',
    description: 'Spatial audio with adaptive ANC and lossless streaming.',
    price: 19999,
    currency: 'INR',
    image: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?auto=format&fit=crop&w=800&q=80',
    sku: 'NEO-AUD-BUDS-MAX',
    stock: 112,
    category: 'audio',
    brand: 'Neo'
  },
  {
    id: 'neo-watch',
    name: 'Neo Chrono Titanium Watch',
    description: 'MicroLED always-on display with dual-frequency GPS.',
    price: 34999,
    currency: 'INR',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
    sku: 'NEO-WHT-TITANIUM',
    stock: 78,
    category: 'wearables',
    brand: 'Neo'
  }
];
