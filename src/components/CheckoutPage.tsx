import { useState } from 'react';
import { ArrowLeft, Plus, Minus, Trash2, MessageCircle, Package, Truck, Clock, Printer } from 'lucide-react';
import { jsPDF } from 'jspdf';
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
    const doc = new jsPDF({ unit: 'mm', format: [80, 200] });

    const pageW = doc.internal.pageSize.getWidth();
    const margin = 4;
    const contentW = pageW - margin * 2;

    let y = margin + 2;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('SEMBROLI MART', pageW / 2, y, { align: 'center' });
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.text('Toko Sembako & Kebutuhan Sehari-hari', pageW / 2, y, { align: 'center' });
    y += 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text('STRUK PESANAN', pageW / 2, y, { align: 'center' });
    y += 4;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + contentW, y);
    y += 3;

    const orderDate = new Date().toLocaleDateString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
    const orderTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.text(`Tanggal : ${orderDate}`, margin, y);
    y += 3;
    doc.text(`Jam     : ${orderTime}`, margin, y);
    y += 3;
    doc.text(`Nama    : ${customerName}`, margin, y);
    y += 3;
    const shippingShort = shipping === 'preorder' ? 'Pre-Order (Gratis)' : 'Kirim Skrg (+Rp5.000)';
    doc.text(`Kirim   : ${shippingShort}`, margin, y);
    y += 3;
    const addrLines = doc.splitTextToSize(`Alamat  : ${customerAddress || '-'}`, contentW);
    doc.text(addrLines, margin, y);
    y += addrLines.length * 2.5 + 2;

    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + contentW, y);
    y += 3;

    cart.forEach((item) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      const nameLines = doc.splitTextToSize(item.name, contentW);
      doc.text(nameLines, margin, y);
      y += nameLines.length * 2.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.text(`${item.quantity} x ${formatPrice(item.price)}`, margin, y);
      doc.setFont('helvetica', 'bold');
      doc.text(formatPrice(item.price * item.quantity), margin + contentW, y, { align: 'right' });
      y += 3.5;
    });

    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + contentW, y);
    y += 3;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.text('Subtotal', margin, y);
    doc.text(formatPrice(subtotal), margin + contentW, y, { align: 'right' });
    y += 3;
    doc.text('Ongkir', margin, y);
    doc.text(shippingFee === 0 ? 'Gratis' : formatPrice(shippingFee), margin + contentW, y, { align: 'right' });
    y += 3;

    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + contentW, y);
    y += 3.5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('TOTAL', margin, y);
    doc.text(formatPrice(total), margin + contentW, y, { align: 'right' });
    y += 5;

    doc.setLineWidth(0.3);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(margin, y, margin + contentW, y);
    doc.setLineDashPattern([], 0);
    y += 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.text('Terima kasih telah berbelanja', pageW / 2, y, { align: 'center' });
    y += 2.5;
    doc.text('di SEMBROLI MART!', pageW / 2, y, { align: 'center' });
    y += 3;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.text('Pesanan akan segera diproses.', pageW / 2, y, { align: 'center' });
    y += 2.5;
    doc.text('Hubungi kami via WhatsApp.', pageW / 2, y, { align: 'center' });

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
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
