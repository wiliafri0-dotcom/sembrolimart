import { useState, useEffect, useMemo } from 'react';
import { Search, ShoppingCart, Filter, Settings, LogOut } from 'lucide-react';
import CustomerInfoModal from './components/CustomerInfoModal';
import ProductCard from './components/ProductCard';
import ShoppingCartComponent from './components/ShoppingCart';
import AdminPanel from './components/AdminPanel';
import { supabase } from './lib/supabase';
import type { Product, CartItem, CustomerInfo } from './types/database';

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All Products',
  vegetables: 'Vegetables',
  fish: 'Fresh Fish',
  frozen: 'Frozen Food',
  spices: 'Kitchen Spices',
};

function App() {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCart, setShowCart] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [loading, setLoading] = useState(true);

  const isAdmin = customerInfo?.role === 'admin' && customerInfo?.isAuthenticated;

  useEffect(() => {
    const savedInfo = sessionStorage.getItem('customerInfo');
    if (savedInfo) {
      setCustomerInfo(JSON.parse(savedInfo));
    }
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleCustomerInfoSubmit = (info: CustomerInfo) => {
    setCustomerInfo(info);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('customerInfo');
    setCustomerInfo(null);
    setCart([]);
    setShowAdminPanel(false);
  };

  const handleAddToCart = (product: Product, quantity: number) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...prevCart, { ...product, quantity }];
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleCheckout = () => {
    if (!customerInfo || cart.length === 0) return;

    let message = 'Hello, I would like to order the following products:\n\n';
    message += '[ORDER LIST]\n';

    cart.forEach((item) => {
      const itemTotal = item.price * item.quantity;
      message += `- ${item.name} (${item.quantity}) - ${formatPrice(itemTotal)}\n`;
    });

    message += '\n\n---------------------------\n';
    message += `Total Product Price: ${formatPrice(calculateTotal())}\n`;
    message += `Orderer Name: ${customerInfo.name}\n`;
    message += `Shipping Address: ${customerInfo.address}\n\n`;
    message += 'Please confirm availability and total shipping costs. Thank you.';

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {!customerInfo && (
        <CustomerInfoModal onSubmit={handleCustomerInfoSubmit} />
      )}

      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-green-600">
                Rumah Mlijo
              </h1>
              {isAdmin && (
                <p className="text-xs text-gray-600">Admin Mode</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {isAdmin ? (
                <>
                  <button
                    onClick={() => setShowAdminPanel(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200 flex items-center gap-2"
                  >
                    <Settings className="w-5 h-5" />
                    Manage Products
                  </button>
                  <button
                    onClick={handleLogout}
                    className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-full transition duration-200"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowCart(true)}
                    className="relative bg-green-600 hover:bg-green-700 text-white p-3 rounded-full transition duration-200"
                  >
                    <ShoppingCart className="w-6 h-6" />
                    {cartItemCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                        {cartItemCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-full transition duration-200"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Filter className="w-5 h-5 text-gray-500 flex-shrink-0" />
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
                  selectedCategory === key
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </main>

      {showCart && !isAdmin && (
        <ShoppingCartComponent
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClose={() => setShowCart(false)}
          onCheckout={handleCheckout}
        />
      )}

      {showAdminPanel && isAdmin && (
        <AdminPanel
          onClose={() => setShowAdminPanel(false)}
          onProductsChange={fetchProducts}
        />
      )}
    </div>
  );
}

export default App;
