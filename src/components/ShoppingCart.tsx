import { X, Plus, Minus, Trash2 } from 'lucide-react';
import type { CartItem } from '../types/database';

interface ShoppingCartProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClose: () => void;
  onCheckout: () => void;
}

export default function ShoppingCart({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClose,
  onCheckout,
}: ShoppingCartProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleQuantityChange = (productId: string, value: string) => {
    const num = parseInt(value) || 1;
    if (num >= 1) {
      onUpdateQuantity(productId, num);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-slideIn">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Shopping Cart</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p className="text-lg">Your cart is empty</p>
              <p className="text-sm">Add some products to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-50 rounded-lg p-4 flex gap-3"
                >
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-1">
                      {item.name}
                    </h3>
                    <p className="text-sm text-green-600 font-medium mb-2">
                      {formatPrice(item.price)}
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          onUpdateQuantity(item.id, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                        className="bg-white hover:bg-gray-100 disabled:bg-gray-100 disabled:cursor-not-allowed border border-gray-300 w-8 h-8 rounded flex items-center justify-center transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleQuantityChange(item.id, e.target.value)
                        }
                        className="w-12 text-center border border-gray-300 rounded py-1 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                        min="1"
                      />

                      <button
                        onClick={() =>
                          onUpdateQuantity(item.id, item.quantity + 1)
                        }
                        className="bg-white hover:bg-gray-100 border border-gray-300 w-8 h-8 rounded flex items-center justify-center transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="ml-auto text-red-500 hover:text-red-700 transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <p className="text-sm text-gray-600 mt-2">
                      Subtotal: {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t p-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-800">
                Total:
              </span>
              <span className="text-2xl font-bold text-green-600">
                {formatPrice(calculateTotal())}
              </span>
            </div>

            <button
              onClick={onCheckout}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-lg transition duration-200 transform hover:scale-[1.02]"
            >
              Order via WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
