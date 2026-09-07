export interface ProductRow {
  id: string;
  name: string;
  category: 'vegetables' | 'fish' | 'frozen' | 'spices';
  price: number;
  image_url: string;
  description: string;
  in_stock: boolean;
  created_at: string;
}

export interface ProductInsert {
  name: string;
  category: 'vegetables' | 'fish' | 'frozen' | 'spices';
  price: number;
  image_url: string;
  description: string;
  in_stock: boolean;
}

export interface ProductUpdate {
  name?: string;
  category?: 'vegetables' | 'fish' | 'frozen' | 'spices';
  price?: number;
  image_url?: string;
  description?: string;
  in_stock?: boolean;
}

export interface AdminRow {
  id: string;
  username: string;
  password: string;
  created_at: string;
}

export interface ShippingAddressRow {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface ShippingAddressInsert {
  name: string;
  is_active?: boolean;
}

export interface ShippingAddressUpdate {
  name?: string;
  is_active?: boolean;
}

export interface CartItemSnapshot {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

export interface OrderRow {
  id: string;
  customer_name: string;
  customer_address: string;
  shipping_type: string;
  items: CartItemSnapshot[];
  subtotal: number;
  shipping_fee: number;
  total: number;
  status: string;
  order_source: string;
  payment_method: string;
  notes: string;
  created_at: string;
}

export interface OrderInsert {
  customer_name: string;
  customer_address?: string;
  shipping_type?: string;
  items: CartItemSnapshot[];
  subtotal?: number;
  shipping_fee?: number;
  total?: number;
  status?: string;
  order_source?: string;
  payment_method?: string;
  notes?: string;
}

export interface OrderUpdate {
  customer_name?: string;
  customer_address?: string;
  shipping_type?: string;
  items?: CartItemSnapshot[];
  subtotal?: number;
  shipping_fee?: number;
  total?: number;
  status?: string;
  order_source?: string;
  payment_method?: string;
  notes?: string;
}

export type Database = {
  public: {
    Tables: {
      products: {
        Row: ProductRow;
        Insert: ProductInsert;
        Update: ProductUpdate;
      };
      admins: {
        Row: AdminRow;
        Insert: Omit<AdminRow, 'id' | 'created_at'>;
        Update: Partial<Omit<AdminRow, 'id' | 'created_at'>>;
      };
      shipping_addresses: {
        Row: ShippingAddressRow;
        Insert: ShippingAddressInsert;
        Update: ShippingAddressUpdate;
      };
      orders: {
        Row: OrderRow;
        Insert: OrderInsert;
        Update: OrderUpdate;
      };
    };
  };
};

export type Product = ProductRow;
export type Admin = AdminRow;
export type ShippingAddress = ShippingAddressRow;
export type OrderRowType = OrderRow;

export interface CartItem extends Product {
  quantity: number;
}

export interface CustomerInfo {
  name: string;
  address: string;
  addressDetail: string;
  role: 'buyer' | 'admin';
  isAuthenticated?: boolean;
}
