export interface CartItemSnapshot {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          category: 'vegetables' | 'fish' | 'frozen' | 'spices';
          price: number;
          image_url: string;
          description: string;
          in_stock: boolean;
          created_at: string;
        };
        Insert: {
          name: string;
          category: 'vegetables' | 'fish' | 'frozen' | 'spices';
          price: number;
          image_url: string;
          description: string;
          in_stock: boolean;
        };
        Update: {
          name?: string;
          category?: 'vegetables' | 'fish' | 'frozen' | 'spices';
          price?: number;
          image_url?: string;
          description?: string;
          in_stock?: boolean;
        };
      };
      admins: {
        Row: {
          id: string;
          username: string;
          password: string;
          created_at: string;
        };
        Insert: {
          username: string;
          password: string;
        };
        Update: {
          username?: string;
          password?: string;
        };
      };
      shipping_addresses: {
        Row: {
          id: string;
          name: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          name: string;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          is_active?: boolean;
        };
      };
      orders: {
        Row: {
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
        };
        Insert: {
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
        };
        Update: {
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
        };
      };
    };
  };
};

export type Product = Database['public']['Tables']['products']['Row'];
export type Admin = Database['public']['Tables']['admins']['Row'];
export type ShippingAddress = Database['public']['Tables']['shipping_addresses']['Row'];
export type OrderRow = Database['public']['Tables']['orders']['Row'];

export interface CartItem extends Product {
  quantity: number;
}

export interface CustomerInfo {
  name: string;
  address: string;
  addressDetail: string;
  role: 'buyer' | 'admin';
  isAuthenticated?: boolean;
  isManualAddress?: boolean;
}
