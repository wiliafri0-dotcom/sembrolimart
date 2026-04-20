import { useState } from 'react';
import { ArrowLeft, Plus, Minus, Trash2, MessageCircle, Package, Truck, Clock } from 'lucide-react';
import type { CartItem } from '../types/database';

interface CheckoutPageProps {
  cart: CartItem[];
  customerName: string;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onBack: () => void;
}

type ShippingOption = 'preorder' | 'instant';

const ADMIN_WHATSAPP = '6282136146737';

export default function CheckoutPage({
  cart,
  customerName,
  onUpdateQuantity,
  onRemoveItem,
  onBack,
}: CheckoutPageProps) {
  const [address, setAddress] = useState('');
  const [shipping, setShipping] = useState<ShippingOption>('preorder');
  const [addressError, setAddressError] = useState('');

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = shipping === 'instant' ? 5000 : 0;
  const total = subtotal + shippingFee;

  const handleSendWhatsApp = () => {
    if (!address.trim()) {
      setAddressError('Mohon isi nomor blok/rumah terlebih dahulu');
      return;
    }
    setAddressError('');

    const shippingLabel =
      shipping === 'preorder'
        ? 'Pre-Order – Antar Besok Pagi Jam 07.30 (Gratis Ongkir)'
        : 'Kirim Sekarang / Instan (Ongkir Rp5.000)';

    let message = `Halo, saya ingin memesan:\n\n`;
    message += `*Nama:* ${customerName}\n`;
    message += `*Alamat:* ${address}\n`;
    message += `*Pengiriman:* ${shippingLabel}\n\n`;
    message += `*Daftar Pesanan:*\n`;

    cart.forEach((item, i) => {
      message += `${i + 1}. ${item.name} x${item.quantity} = ${formatPrice(item.price * item.quantity)}\n`;
    });

    message += `\n*Subtotal Produk:* ${formatPrice(subtotal)}`;
    if (shippingFee > 0) {
      message += `\n*Ongkir:* ${formatPrice(shippingFee)}`;
    }
    message += `\n*Total:* ${formatPrice(total)}`;
    message += `\n\nTerima kasih!`;

    const url = `https://api.whatsapp.com/send?phone=${ADMIN_WHATSAPP}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 transition p-1 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Checkout</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Order Summary */}
        <section className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            <h2 className="font-bold text-gray-800">Ringkasan Pesanan</h2>
          </div>

          {cart.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-400">
              <p>Keranjang kamu kosong.</p>
            </div>
          ) : (
            <div className="divide-y">
              {cart.map((item) => (
                <div key={item.id} className="px-5 py-4 flex gap-4 items-start">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{item.name}</p>
                    <p className="text-sm text-green-600 font-medium mt-0.5">
                      {formatPrice(item.price)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-800 text-sm">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="mt-2 text-red-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Shipping Form */}
        <section className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <Truck className="w-5 h-5 text-green-600" />
            <h2 className="font-bold text-gray-800">Detail Pengiriman</h2>
          </div>
          <div className="px-5 py-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Penerima
              </label>
              <input
                type="text"
                value={customerName}
                readOnly
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                No. Blok / Rumah <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (e.target.value.trim()) setAddressError('');
                }}
                placeholder="cth: Blok B2 No.5"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm transition ${
                  addressError ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {addressError && (
                <p className="text-red-500 text-xs mt-1">{addressError}</p>
              )}
            </div>

            {/* Shipping Option */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opsi Pengiriman
              </label>
              <div className="space-y-2.5">
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-lg border-2 cursor-pointer transition ${
                    shipping === 'preorder'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="shipping"
                    value="preorder"
                    checked={shipping === 'preorder'}
                    onChange={() => setShipping('preorder')}
                    className="mt-0.5 accent-green-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-sm text-gray-800">Pre-Order</span>
                      <span className="ml-auto text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                        Gratis
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Antar besok pagi jam 07.30</p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3.5 rounded-lg border-2 cursor-pointer transition ${
                    shipping === 'instant'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="shipping"
                    value="instant"
                    checked={shipping === 'instant'}
                    onChange={() => setShipping('instant')}
                    className="mt-0.5 accent-green-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-orange-500" />
                      <span className="font-semibold text-sm text-gray-800">Kirim Sekarang</span>
                      <span className="ml-auto text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                        +Rp5.000
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Instan / langsung dikirim</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Price Breakdown */}
        <section className="bg-white rounded-xl shadow-sm px-5 py-4 space-y-2.5">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal Produk</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Ongkir</span>
            <span className={shippingFee === 0 ? 'text-green-600 font-medium' : ''}>
              {shippingFee === 0 ? 'Gratis' : formatPrice(shippingFee)}
            </span>
          </div>
          <div className="pt-2.5 border-t flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span className="text-green-600 text-lg">{formatPrice(total)}</span>
          </div>
        </section>

        {/* WhatsApp CTA */}
        <button
          onClick={handleSendWhatsApp}
          disabled={cart.length === 0}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-md transition duration-200 flex items-center justify-center gap-3 text-base active:scale-[0.98]"
        >
          <MessageCircle className="w-6 h-6" />
          Kirim Pesanan via WhatsApp
        </button>

        <p className="text-center text-xs text-gray-400 pb-4">
          Pesanan akan dikirim ke WhatsApp admin untuk dikonfirmasi
        </p>
      </div>
    </div>
  );
}
