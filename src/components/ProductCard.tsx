import { useState } from 'react';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import type { Product } from '../types/database';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (value: string) => {
    const num = parseInt(value) || 0;
    if (num >= 0) {
      setQuantity(num);
    }
  };

  const incrementQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const decrementQuantity = () => {
    setQuantity((prev) => Math.max(0, prev - 1));
  };

  const handleAddToCart = () => {
    if (quantity > 0) {
      onAddToCart(product, quantity);
      setQuantity(1);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
        />
        {!product.in_stock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-4 py-2 rounded-full font-semibold">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {product.description}
        </p>
        <p className="text-xl font-bold text-green-600 mb-4">
          {formatPrice(product.price)}
        </p>

        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={decrementQuantity}
            disabled={!product.in_stock}
            className="bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 w-10 h-10 rounded-lg flex items-center justify-center transition"
          >
            <Minus className="w-4 h-4" />
          </button>

          <input
            type="number"
            value={quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            disabled={!product.in_stock}
            className="w-16 text-center border border-gray-300 rounded-lg py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none disabled:bg-gray-100"
            min="0"
          />

          <button
            onClick={incrementQuantity}
            disabled={!product.in_stock}
            className="bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 w-10 h-10 rounded-lg flex items-center justify-center transition"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={!product.in_stock || quantity === 0}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition duration-200 flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-5 h-5" />
          Add to Cart
        </button>
      </div>
    </div>
  );
}
