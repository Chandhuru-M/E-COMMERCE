# Architecture Overview

This project follows a modern commerce architecture inspired by large-scale marketplaces.

## High-level components

- **Frontend (React + Vite)**
  - Tailwind CSS design system with premium styling for hero modules, curated product grids, and cart experience.
  - Zustand state for cart with Supabase realtime hooks to react to inventory updates.
  - React Router layout with top navigation, mega menu, and modular sections.
- **Backend (Express + TypeScript)**
  - Thin BFF layer proxying Supabase for product catalog, auth, and checkout flows.
  - Zod-based environment validation, Helmet, CORS, and structured error handling.
  - Fallback mock data to keep UI functional while Supabase tables are provisioned.
- **Supabase**
  - PostgreSQL tables for `products`, `product_variants`, `carts`, `orders`, and `reviews`.
  - Row Level Security (RLS) policies gate data by user role.
  - Realtime channels broadcast inventory/order events to the frontend.
- **Payments**
  - Stripe integration stubbed in backend config (webhook + intents planned).

## Data flow

1. Client requests product list from `GET /api/products`.
2. Backend queries Supabase via service-role key; falls back to curated mock data if empty.
3. Frontend displays hero + product cards, allowing users to add items to cart (stored in Zustand + localStorage).
4. Realtime hook listens to `inventory_update` broadcasts from Supabase to auto-remove out-of-stock items from cart.
5. Checkout flow will call backend to create Stripe PaymentIntent (future work).

## Next steps

- Implement Supabase migrations or SQL scripts for tables and RLS policies.
- Build auth flows (Supabase Auth) and persist carts tied to users.
- Integrate Stripe sandbox payment flow and webhook consumer.
- Add admin dashboard for catalog management and analytics.
