import { useState, useEffect } from 'react';
import { X, Plus, Minus, CreditCard as Edit2, Trash2, Save, Upload, MapPin, Receipt, Package, Store, History, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Product, ShippingAddress, OrderRow, CartItemSnapshot } from '../types/database';

interface AdminPanelProps {
  onClose: () => void;
  onProductsChange: () => void;
}

type Tab = 'products' | 'addresses' | 'cashier';

type ProductFormData = Omit<Product, 'id' | 'created_at'>;

export default function AdminPanel({ onClose, onProductsChange }: AdminPanelProps) {
  const [tab, setTab] = useState<Tab>('products');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start overflow-y-auto">
      <div className="bg-white w-full max-w-6xl m-4 rounded-lg shadow-2xl animate-fadeIn">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white rounded-t-lg z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Admin Panel</h2>
            <p className="text-sm text-gray-600">Kelola produk, area pengiriman, dan transaksi kasir</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex gap-1 px-6 pt-4 border-b">
          <TabButton active={tab === 'products'} onClick={() => setTab('products')} icon={<Package className="w-4 h-4" />} label="Produk" />
          <TabButton active={tab === 'addresses'} onClick={() => setTab('addresses')} icon={<MapPin className="w-4 h-4" />} label="Area Pengiriman" />
          <TabButton active={tab === 'cashier'} onClick={() => setTab('cashier')} icon={<Receipt className="w-4 h-4" />} label="Kasir" />
        </div>

        <div className="p-6">
          {tab === 'products' && <ProductsTab onProductsChange={onProductsChange} />}
          {tab === 'addresses' && <AddressesTab />}
          {tab === 'cashier' && <CashierTab />}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
        active
          ? 'border-green-600 text-green-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ProductsTab({ onProductsChange }: { onProductsChange: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category: 'vegetables',
    price: 0,
    image_url: '',
    description: '',
    in_stock: true,
  });
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const filename = `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('products').upload(filename, file);
      if (error) throw error;

      const { data } = supabase.storage.from('products').getPublicUrl(filename);
      setFormData({ ...formData, image_url: data.publicUrl });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.image_url.trim()) {
      alert('Please upload a product image');
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase.from('products').update(formData).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert([formData]);
        if (error) throw error;
      }

      resetForm();
      await fetchProducts();
      onProductsChange();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product. Please try again.');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price,
      image_url: product.image_url,
      description: product.description,
      in_stock: product.in_stock,
    });
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;

      await fetchProducts();
      onProductsChange();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'vegetables',
      price: 0,
      image_url: '',
      description: '',
      in_stock: true,
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  return (
    <>
      {!isAdding ? (
        <button
          onClick={() => setIsAdding(true)}
          className="mb-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New Product
        </button>
      ) : (
        <div className="mb-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            {editingId ? 'Edit Product' : 'Add New Product'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Product['category'] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="vegetables">Ikan Laut</option>
                  <option value="fish">Tepung</option>
                  <option value="frozen">Gula</option>
                  <option value="spices">Ikan Air Tawar</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (IDR)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  min="0"
                  step="100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                <div className="flex gap-2">
                  <label className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                    <Upload className="w-4 h-4 mr-2" />
                    <span className="text-sm">Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>
                {formData.image_url && (
                  <div className="mt-2">
                    <img src={formData.image_url} alt="Preview" className="h-32 w-32 object-cover rounded-lg" />
                  </div>
                )}
                {uploadingImage && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                rows={3}
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="in_stock"
                checked={formData.in_stock}
                onChange={(e) => setFormData({ ...formData, in_stock: e.target.checked })}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="in_stock" className="text-sm font-medium text-gray-700">In Stock</label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-200 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingId ? 'Update Product' : 'Add Product'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-6 rounded-lg transition duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition flex gap-4"
            >
              <img src={product.image_url} alt={product.name} className="w-24 h-24 object-cover rounded-lg" />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">{product.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-green-600 font-bold">{formatPrice(product.price)}</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">{product.category}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        product.in_stock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {product.in_stock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(product)} className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function AddressesTab() {
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('shipping_addresses')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const { error } = await supabase
        .from('shipping_addresses')
        .insert([{ name: newName.trim(), is_active: true }]);
      if (error) throw error;
      setNewName('');
      await fetchAddresses();
    } catch (error) {
      console.error('Error adding address:', error);
      alert('Failed to add address. It may already exist.');
    }
  };

  const toggleActive = async (addr: ShippingAddress) => {
    try {
      const { error } = await supabase
        .from('shipping_addresses')
        .update({ is_active: !addr.is_active })
        .eq('id', addr.id);
      if (error) throw error;
      await fetchAddresses();
    } catch (error) {
      console.error('Error updating address:', error);
      alert('Failed to update address.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus area pengiriman ini?')) return;
    try {
      const { error } = await supabase.from('shipping_addresses').delete().eq('id', id);
      if (error) throw error;
      await fetchAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('Failed to delete address.');
    }
  };

  return (
    <div>
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <MapPin className="inline w-4 h-4 mr-1" />
          Area yang ditambahkan di sini akan tampil di form pembeli. Pembeli yang memilih area ini mendapat <strong>gratis ongkir</strong> untuk Kirim Sekarang. Area yang tidak ada di daftar tidak mendapat gratis ongkir instan.
        </p>
      </div>

      <form onSubmit={handleAdd} className="mb-6 flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nama area (contoh: Sekarpuro)"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
        />
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-200 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Tambah Area
        </button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : addresses.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Belum ada area pengiriman.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {addresses.map((addr) => (
            <div key={addr.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold text-gray-800">{addr.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    addr.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {addr.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleActive(addr)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${
                    addr.is_active
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      : 'bg-green-100 hover:bg-green-200 text-green-700'
                  }`}
                >
                  {addr.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CashierTab() {
  const [view, setView] = useState<'menu' | 'history' | 'entry'>('menu');

  if (view === 'menu') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <button
          onClick={() => setView('entry')}
          className="bg-white border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 rounded-xl p-8 text-left transition group"
        >
          <Store className="w-10 h-10 text-green-600 mb-3" />
          <h3 className="text-lg font-bold text-gray-800 mb-1">Input Penjualan</h3>
          <p className="text-sm text-gray-500">Catat penjualan dari toko offline atau online store</p>
        </button>
        <button
          onClick={() => setView('history')}
          className="bg-white border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 rounded-xl p-8 text-left transition group"
        >
          <History className="w-10 h-10 text-green-600 mb-3" />
          <h3 className="text-lg font-bold text-gray-800 mb-1">Riwayat Pembelian</h3>
          <p className="text-sm text-gray-500">Lihat semua riwayat penjualan online dan offline</p>
        </button>
      </div>
    );
  }

  if (view === 'history') {
    return <PurchaseHistory onBack={() => setView('menu')} />;
  }

  return <OfflineEntry onBack={() => setView('menu')} />;
}

function PurchaseHistory({ onBack }: { onBack: () => void }) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const filtered = orders.filter((o) => {
    const matchesFilter = filter === 'all' || o.order_source === filter;
    const matchesSearch =
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_address.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalRevenue = filtered.reduce((sum, o) => sum + o.total, 0);

  return (
    <div>
      <button onClick={onBack} className="mb-4 text-sm text-gray-500 hover:text-gray-700 transition flex items-center gap-1">
        ← Kembali ke Menu Kasir
      </button>

      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <History className="w-5 h-5 text-green-600" />
        Riwayat Pembelian
      </h3>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-2">
          {(['all', 'online', 'offline'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'Semua' : f === 'online' ? 'Online' : 'Offline'}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau alamat..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
          />
        </div>
      </div>

      <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
        <p className="text-sm text-green-800">
          Total Pendapatan ({filter === 'all' ? 'Semua' : filter === 'online' ? 'Online' : 'Offline'}):{' '}
          <strong>{formatPrice(totalRevenue)}</strong>
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Belum ada riwayat pembelian.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-800">{order.customer_name}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      order.order_source === 'online' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {order.order_source === 'online' ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{formatDate(order.created_at)}</p>
                </div>
                <span className="text-lg font-bold text-green-600">{formatPrice(order.total)}</span>
              </div>

              {order.customer_address && order.customer_address !== 'Admin' && (
                <p className="text-sm text-gray-600 mb-2">
                  <MapPin className="inline w-3.5 h-3.5 mr-1" />
                  {order.customer_address}
                </p>
              )}

              <div className="text-sm text-gray-600 space-y-0.5">
                {(order.items || []).map((item: CartItemSnapshot, i: number) => (
                  <div key={i} className="flex justify-between">
                    <span>{item.name} x{item.quantity}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-2 pt-2 border-t text-xs text-gray-500 flex flex-wrap gap-3">
                <span>Pengiriman: {order.shipping_type === 'preorder' ? 'Pre-Order' : 'Instan'}</span>
                <span>Ongkir: {order.shipping_fee === 0 ? 'Gratis' : formatPrice(order.shipping_fee)}</span>
                {order.payment_method && <span>Pembayaran: {order.payment_method}</span>}
                {order.notes && <span>Catatan: {order.notes}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OfflineEntry({ onBack }: { onBack: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItemSnapshot[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('in_stock', true)
        .order('name', { ascending: true });
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1, image_url: product.image_url }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Pilih minimal satu produk.');
      return;
    }
    if (!customerName.trim()) {
      alert('Nama pelanggan harus diisi.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('orders').insert({
        customer_name: customerName.trim(),
        customer_address: customerAddress.trim(),
        shipping_type: 'offline',
        items: cart,
        subtotal,
        shipping_fee: 0,
        total: subtotal,
        status: 'completed',
        order_source: 'offline',
        payment_method: paymentMethod,
        notes: notes.trim(),
      });

      if (error) throw error;

      setSuccess(true);
      setCart([]);
      setCustomerName('');
      setCustomerAddress('');
      setNotes('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving offline order:', error);
      alert('Gagal menyimpan penjualan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <button onClick={onBack} className="mb-4 text-sm text-gray-500 hover:text-gray-700 transition flex items-center gap-1">
        ← Kembali ke Menu Kasir
      </button>

      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Store className="w-5 h-5 text-green-600" />
        Input Penjualan
      </h3>

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
          Penjualan berhasil disimpan!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product picker */}
        <div>
          <h4 className="font-medium text-gray-700 mb-3">Pilih Produk</h4>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition text-left"
                >
                  <img src={product.image_url} alt={product.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{product.name}</p>
                    <p className="text-sm text-green-600">{formatPrice(product.price)}</p>
                  </div>
                  <Plus className="w-5 h-5 text-green-600 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart + form */}
        <div>
          <h4 className="font-medium text-gray-700 mb-3">Keranjang & Detail</h4>

          {cart.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center bg-gray-50 rounded-lg border border-gray-200">
              Belum ada produk dipilih
            </p>
          ) : (
            <div className="space-y-2 mb-4">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-gray-800 w-20 text-right">{formatPrice(item.price * item.quantity)}</span>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t">
                <span>Subtotal</span>
                <span className="text-green-600">{formatPrice(subtotal)}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pelanggan</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                placeholder="Nama pembeli"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat (opsional)</label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                placeholder="Alamat pembeli (opsional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Metode Pembayaran</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
              >
                <option value="Tunai">Tunai</option>
                <option value="QRIS">QRIS</option>
                <option value="Transfer">Transfer</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                placeholder="Catatan tambahan"
              />
            </div>
            <button
              type="submit"
              disabled={saving || cart.length === 0}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition duration-200 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Menyimpan...' : 'Simpan Penjualan'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
