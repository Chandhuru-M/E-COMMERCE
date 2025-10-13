import type { Product } from '../types/product';

export const heroHighlight: Product = {
  id: 'neo-aurora-1',
  name: 'Neo Aurora Pro 15" Laptop',
  description:
    'Slim magnesium shell, 3.1K Liquid Retina display, 14‑core AI coprocessor, Wi-Fi 7, 22-hour battery with hypercharge.',
  price: 149999,
  image:
    'https://images.unsplash.com/photo-1618005198919-d3d4b5a92eee?auto=format&fit=crop&w=1200&q=80',
  tag: 'New Launch',
  rating: 4.9,
  reviews: 412,
  currency: 'INR',
  category: 'laptops',
  brand: 'Neo',
  stock: 34,
  sku: 'NEO-LTP-15-AURORA'
};

export const mockProducts: Product[] = [
  {
    id: 'neo-buds',
    name: 'Neo SonicBuds Max ANC',
    description: 'Spatial audio with head tracking, adaptive noise cancellation, 45-hour battery life.',
    price: 19999,
    currency: 'INR',
    image: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?auto=format&fit=crop&w=800&q=80',
    tag: 'Bestseller',
    rating: 4.7,
    reviews: 326,
    category: 'audio',
    brand: 'Neo',
    stock: 112,
    sku: 'NEO-AUD-BUDS-MAX'
  },
  {
    id: 'neo-watch',
    name: 'Neo Chrono Titanium Watch',
    description: 'MicroLED always-on display, ECG + SpO2, dual-frequency GPS, titanium frame.',
    price: 34999,
    currency: 'INR',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviews: 221,
    category: 'wearables',
    brand: 'Neo',
    stock: 78,
    sku: 'NEO-WHT-TITANIUM'
  },
  {
    id: 'neo-bike',
    name: 'Neo Velocity Smart Bike',
    description: '28-speed carbon frame, integrated e-assist, smart analytics app with live coaching.',
    price: 129999,
    currency: 'INR',
    image: 'https://images.unsplash.com/photo-1529429617124-aee00148110b?auto=format&fit=crop&w=800&q=80',
    tag: 'Limited Stock',
    rating: 4.6,
    reviews: 94,
    category: 'mobility',
    brand: 'Neo',
    stock: 18,
    sku: 'NEO-BIKE-VELOCITY'
  },
  {
    id: 'neo-speaker',
    name: 'Neo Pulse Atmos Speaker',
    description: '360° Dolby Atmos, adaptive tuning, beamforming microphones, multi-room sync.',
    price: 24999,
    currency: 'INR',
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
    tag: 'Trending',
    rating: 4.5,
    reviews: 188,
    category: 'audio',
    brand: 'Neo',
    stock: 64,
    sku: 'NEO-SPK-PULSE'
  },
  {
    id: 'neo-camera',
    name: 'Neo Vista Mirrorless Camera',
    description: '45MP stacked sensor, 8K 120fps, dual native ISO, 5-axis stabilization.',
    price: 189999,
    currency: 'INR',
    image: 'https://images.unsplash.com/photo-1519183071298-a2962be90b8e?auto=format&fit=crop&w=800&q=80',
    tag: 'Creator Studio',
    rating: 4.9,
    reviews: 152,
    category: 'photography',
    brand: 'Neo',
    stock: 42,
    sku: 'NEO-CAM-VISTA'
  },
  {
    id: 'neo-smart-home',
    name: 'Neo Halo Smart Home Hub',
    description: 'Matter compatible, on-device automation, wall-mountable touchscreen, end-to-end encryption.',
    price: 14999,
    currency: 'INR',
    image: 'https://images.unsplash.com/photo-1506499424305-016c4bea8a8b?auto=format&fit=crop&w=800&q=80',
    rating: 4.4,
    reviews: 89,
    category: 'smart-home',
    brand: 'Neo',
    stock: 156,
    sku: 'NEO-SMART-HALO'
  }
];
