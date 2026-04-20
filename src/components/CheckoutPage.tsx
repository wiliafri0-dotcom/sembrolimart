import { useState, useRef } from 'react';
import { ArrowLeft, Plus, Minus, Trash2, MessageCircle, Package, Truck, Clock, Printer } from 'lucide-react';
import type { CartItem } from '../types/database';

interface CheckoutPageProps {
  cart: CartItem[];
  customerName: string;
  customerAddress: string;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onBack: () => void;
}

type ShippingOption = 'preorder' | 'instant';

const ADMIN_WHATSAPP = '6282136146737';

export default function CheckoutPage({
  cart,
  customerName,
  customerAddress,
  onUpdateQuantity,
  onRemoveItem,
  onBack,
}: CheckoutPageProps) {
  const [shipping, setShipping] = useState<ShippingOption>('preorder');
  const receiptRef = useRef<HTMLDivElement>(null);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = shipping === 'instant' ? 5000 : 0;
  const total = subtotal + shippingFee;

  const shippingLabel =
    shipping === 'preorder'
      ? 'Pre-Order – Antar Besok Pagi Jam 07.30 (Gratis Ongkir)'
      : 'Kirim Sekarang / Instan (Ongkir Rp5.000)';

  const handleSendWhatsApp = () => {
    let message = `Halo, saya ingin memesan:\n\n`;
    message += `*Nama:* ${customerName}\n`;
    message += `*Alamat:* ${customerAddress}\n`;
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

  const handlePrintReceipt = () => {
    const orderDate = new Date().toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const orderTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit', minute: '2-digit'
    });

    const itemRows = cart.map((item, i) => `
      <tr>
        <td style="padding:4px 0;border-bottom:1px solid #f0f0f0;">${i + 1}. ${item.name}</td>
        <td style="padding:4px 0;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
        <td style="padding:4px 0;border-bottom:1px solid #f0f0f0;text-align:right;">${formatPrice(item.price)}</td>
        <td style="padding:4px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;">${formatPrice(item.price * item.quantity)}</td>
      </tr>
    `).join('');

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Struk Pesanan - ${customerName}</title>
        <style>
          @page { size: A5; margin: 12mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a1a1a; background: white; }
          .header { text-align: center; border-bottom: 2px solid #16a34a; padding-bottom: 10px; margin-bottom: 12px; }
          .store-name { font-size: 20px; font-weight: 800; color: #16a34a; letter-spacing: 1px; }
          .store-sub { font-size: 10px; color: #666; margin-top: 2px; }
          .receipt-title { font-size: 13px; font-weight: 700; color: #1a1a1a; margin-top: 6px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
          .info-box { background: #f8f8f8; border-radius: 6px; padding: 8px 10px; }
          .info-label { font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
          .info-value { font-size: 11px; font-weight: 600; color: #1a1a1a; word-break: break-word; }
          .info-wide { grid-column: 1 / -1; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          th { font-size: 9px; text-transform: uppercase; color: #888; padding: 6px 0; border-bottom: 2px solid #e5e5e5; text-align: left; }
          th:nth-child(2) { text-align: center; }
          th:nth-child(3), th:nth-child(4) { text-align: right; }
          td { font-size: 10.5px; color: #333; vertical-align: top; }
          .totals { border-top: 1px solid #e5e5e5; padding-top: 8px; }
          .total-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 10.5px; color: #555; }
          .total-final { display: flex; justify-content: space-between; padding: 6px 0 0; font-size: 14px; font-weight: 800; color: #16a34a; border-top: 2px solid #16a34a; margin-top: 4px; }
          .shipping-badge { display: inline-block; background: ${shipping === 'preorder' ? '#dcfce7' : '#fff7ed'}; color: ${shipping === 'preorder' ? '#166534' : '#c2410c'}; border-radius: 4px; padding: 2px 7px; font-size: 9.5px; font-weight: 700; margin-top: 3px; }
          .footer { text-align: center; margin-top: 14px; padding-top: 10px; border-top: 1px dashed #ccc; font-size: 9.5px; color: #888; line-height: 1.6; }
          .footer strong { color: #16a34a; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="store-name">SEMBROLI MART</div>
          <div class="store-sub">Toko Sembako & Kebutuhan Sehari-hari</div>
          <div class="receipt-title">STRUK PESANAN</div>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <div class="info-label">Tanggal</div>
            <div class="info-value">${orderDate}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Jam</div>
            <div class="info-value">${orderTime}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Nama Penerima</div>
            <div class="info-value">${customerName}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Pengiriman</div>
            <div class="info-value">
              <span class="shipping-badge">${shipping === 'preorder' ? 'Pre-Order' : 'Kirim Sekarang'}</span>
            </div>
          </div>
          <div class="info-box info-wide">
            <div class="info-label">Alamat Pengiriman</div>
            <div class="info-value">${customerAddress}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Produk</th>
              <th style="text-align:center">Qty</th>
              <th style="text-align:right">Harga</th>
              <th style="text-align:right">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        <div class="totals">
          <div class="total-row"><span>Subtotal Produk</span><span>${formatPrice(subtotal)}</span></div>
          <div class="total-row"><span>Ongkir</span><span>${shippingFee === 0 ? 'Gratis' : formatPrice(shippingFee)}</span></div>
          <div class="total-final"><span>TOTAL</span><span>${formatPrice(total)}</span></div>
        </div>

        <div class="footer">
          <strong>Terima kasih telah berbelanja di SEMBROLI MART!</strong><br>
          Pesanan akan segera diproses dan dikirimkan.<br>
          Hubungi kami via WhatsApp untuk konfirmasi.
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (printWindow) {
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
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

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5" ref={receiptRef}>

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

        {/* Shipping Details */}
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
                Alamat Lengkap
              </label>
              <div className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm min-h-[42px] leading-relaxed">
                {customerAddress || <span className="text-gray-400 italic">Tidak ada alamat</span>}
              </div>
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

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleSendWhatsApp}
            disabled={cart.length === 0}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-md transition duration-200 flex items-center justify-center gap-3 text-base active:scale-[0.98]"
          >
            <MessageCircle className="w-6 h-6" />
            Kirim Pesanan via WhatsApp
          </button>

          <button
            onClick={handlePrintReceipt}
            disabled={cart.length === 0}
            className="w-full bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 font-semibold py-3.5 rounded-xl border border-gray-300 shadow-sm transition duration-200 flex items-center justify-center gap-2.5 text-sm active:scale-[0.98]"
          >
            <Printer className="w-5 h-5 text-gray-500" />
            Cetak Struk (A5)
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 pb-4">
          Pesanan akan dikirim ke WhatsApp admin untuk dikonfirmasi
        </p>
      </div>
    </div>
  );
}
