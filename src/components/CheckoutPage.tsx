import { useState, useRef, useCallback } from 'react';
import { ArrowLeft, Plus, Minus, Trash2, MessageCircle, Package, Truck, Clock, Printer, Lock, Image, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
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
  const [orderLocked, setOrderLocked] = useState(false);
  const [sending, setSending] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
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

  const orderDate = new Date().toLocaleDateString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
  const orderTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const saveOrderToDB = async (): Promise<string | null> => {
    const orderItems = cart.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

    const { data, error } = await supabase
      .from('orders')
      .insert({
        customer_name: customerName,
        customer_address: customerAddress,
        shipping_type: shipping,
        items: orderItems,
        subtotal,
        shipping_fee: shippingFee,
        total,
      })
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('Error saving order:', error);
      return null;
    }
    return data?.id ?? null;
  };

  const captureReceiptImage = useCallback(async (): Promise<Blob | null> => {
    if (!receiptRef.current) return null;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(receiptRef.current, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });

      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
      });
    } catch (err) {
      console.error('Error capturing receipt:', err);
      return null;
    }
  }, []);

  const uploadReceiptImage = async (blob: Blob, id: string): Promise<string | null> => {
    const fileName = `receipt-${id}-${Date.now()}.png`;
    const { data, error } = await supabase.storage
      .from('images')
      .upload(`receipts/${fileName}`, blob, {
        contentType: 'image/png',
        upsert: true,
      });

    if (error) {
      console.error('Error uploading receipt:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(`receipts/${fileName}`);

    return urlData.publicUrl;
  };

  const buildOrderMessage = (receiptUrl?: string) => {
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

    if (receiptUrl) {
      message += `\n\n*Struk Pesanan:* ${receiptUrl}`;
    }

    message += `\n\nTerima kasih!`;
    return message;
  };

  const handleSendWhatsApp = async () => {
    setSending(true);
    try {
      const id = await saveOrderToDB();
      if (id) setOrderId(id);

      const message = buildOrderMessage();
      const url = `https://api.whatsapp.com/send?phone=${ADMIN_WHATSAPP}&text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      setOrderLocked(true);
    } finally {
      setSending(false);
    }
  };

  const handleSendReceiptWhatsApp = async () => {
    setSending(true);
    try {
      const id = await saveOrderToDB();
      if (id) setOrderId(id);

      const imageBlob = await captureReceiptImage();
      let receiptUrl: string | undefined;

      if (imageBlob && id) {
        receiptUrl = await uploadReceiptImage(imageBlob, id) ?? undefined;
      }

      const message = buildOrderMessage(receiptUrl);
      const url = `https://api.whatsapp.com/send?phone=${ADMIN_WHATSAPP}&text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      setOrderLocked(true);
    } finally {
      setSending(false);
    }
  };

  const handlePrintReceipt = async () => {
    const imageBlob = await captureReceiptImage();
    if (!imageBlob) return;

    const imageUrl = URL.createObjectURL(imageBlob);
    const printWindow = window.open(imageUrl, '_blank');
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

        {/* Locked Banner */}
        {orderLocked && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5 flex items-center gap-3">
            <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">Pesanan Terkunci</p>
              <p className="text-amber-600 text-xs">Pesanan sudah dikirim dan tersimpan. Detail tidak dapat diubah.</p>
            </div>
          </div>
        )}

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
                    {orderLocked ? (
                      <p className="mt-2 text-sm font-semibold text-gray-700">
                        x{item.quantity}
                      </p>
                    ) : (
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
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-800 text-sm">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                    {!orderLocked && (
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="mt-2 text-red-400 hover:text-red-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
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
                  className={`flex items-start gap-3 p-3.5 rounded-lg border-2 transition ${
                    orderLocked ? 'cursor-default opacity-60' : 'cursor-pointer'
                  } ${
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
                    disabled={orderLocked}
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
                  className={`flex items-start gap-3 p-3.5 rounded-lg border-2 transition ${
                    orderLocked ? 'cursor-default opacity-60' : 'cursor-pointer'
                  } ${
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
                    disabled={orderLocked}
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
          {!orderLocked ? (
            <>
              <button
                onClick={handleSendWhatsApp}
                disabled={cart.length === 0 || sending}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-md transition duration-200 flex items-center justify-center gap-3 text-base active:scale-[0.98]"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageCircle className="w-6 h-6" />}
                {sending ? 'Menyimpan Pesanan...' : 'Kirim Pesanan via WhatsApp'}
              </button>

              <button
                onClick={handleSendReceiptWhatsApp}
                disabled={cart.length === 0 || sending}
                className="w-full bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 font-semibold py-3.5 rounded-xl border border-gray-300 shadow-sm transition duration-200 flex items-center justify-center gap-2.5 text-sm active:scale-[0.98]"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-5 h-5 text-green-600" />}
                {sending ? 'Memproses Struk...' : 'Kirim Struk via WhatsApp'}
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="w-full bg-gray-100 text-gray-400 font-bold py-4 rounded-xl flex items-center justify-center gap-3 text-base">
                <Lock className="w-5 h-5" />
                Pesanan Sudah Dikirim
              </div>
              <button
                onClick={handlePrintReceipt}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3.5 rounded-xl border border-gray-300 shadow-sm transition duration-200 flex items-center justify-center gap-2.5 text-sm active:scale-[0.98]"
              >
                <Printer className="w-5 h-5 text-gray-500" />
                Cetak Ulang Struk
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 pb-4">
          {orderLocked
            ? 'Pesanan terkunci & tersimpan. Hubungi admin untuk perubahan.'
            : 'Pesanan akan dikirim ke WhatsApp admin untuk dikonfirmasi'}
        </p>
      </div>

      {/* Hidden Receipt for Image Capture */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div
          ref={receiptRef}
          style={{
            width: '320px',
            padding: '24px 16px',
            backgroundColor: '#ffffff',
            fontFamily: 'monospace, Courier New, Courier',
            color: '#000000',
            fontSize: '13px',
            lineHeight: '1.5',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '18px', letterSpacing: '1px' }}>SEMBROLI MART</div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>Toko Sembako & Kebutuhan Sehari-hari</div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '6px', letterSpacing: '0.5px' }}>STRUK PESANAN</div>
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

          <div style={{ fontSize: '12px' }}>
            <div>Tanggal : {orderDate}</div>
            <div>Jam     : {orderTime}</div>
            <div>Nama    : {customerName}</div>
            <div>Kirim   : {shipping === 'preorder' ? 'Pre-Order (Gratis)' : 'Kirim Skrg (+Rp5.000)'}</div>
            <div style={{ wordBreak: 'break-word' }}>Alamat  : {customerAddress || '-'}</div>
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }} />

          {cart.map((item, i) => (
            <div key={item.id} style={{ marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{item.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span>{item.quantity} x {formatPrice(item.price)}</span>
                <span style={{ fontWeight: 'bold' }}>{formatPrice(item.price * item.quantity)}</span>
              </div>
            </div>
          ))}

          <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span>Ongkir</span>
            <span>{shippingFee === 0 ? 'Gratis' : formatPrice(shippingFee)}</span>
          </div>

          <div style={{ borderTop: '2px solid #000', margin: '8px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px' }}>
            <span>TOTAL</span>
            <span>{formatPrice(total)}</span>
          </div>

          <div style={{ borderTop: '1px dashed #999', margin: '12px 0' }} />

          <div style={{ textAlign: 'center', fontSize: '11px', color: '#444' }}>
            <div style={{ fontWeight: 'bold' }}>Terima kasih telah berbelanja</div>
            <div style={{ fontWeight: 'bold' }}>di SEMBROLI MART!</div>
            <div style={{ marginTop: '4px' }}>Pesanan akan segera diproses.</div>
            <div>Hubungi kami via WhatsApp.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
