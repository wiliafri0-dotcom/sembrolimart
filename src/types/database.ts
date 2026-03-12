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
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      admins: {
        Row: {
          id: string;
          username: string;
          password: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['admins']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['admins']['Insert']>;
      };
    };
  };
};

export type Product = Database['public']['Tables']['products']['Row'];
export type Admin = Database['public']['Tables']['admins']['Row'];

export interface CartItem extends Product {
  quantity: number;
}

export interface CustomerInfo {
  name: string;
  address: string;
  role: 'buyer' | 'admin';
  isAuthenticated?: boolean;
}
