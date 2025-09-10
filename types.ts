
import type { Session as SupabaseSession, User } from '@supabase/supabase-js';

export interface Product {
  id: string;
  created_at: string;
  name: string;
  price: number;
  stock: number;
  user_id: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface SaleItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Sale {
  id: string;
  created_at: string;
  items: SaleItem[];
  total_amount: number;
  user_id: string;
}

export type Session = SupabaseSession;
