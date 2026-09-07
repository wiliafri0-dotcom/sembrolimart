import { useState, useEffect } from 'react';
import { User, MapPin, Lock, ChevronDown, ChevronUp, Home } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { CustomerInfo, ShippingAddress } from '../types/database';

interface CustomerInfoModalProps {
  onSubmit: (info: CustomerInfo) => void;
}

export default function CustomerInfoModal({ onSubmit }: CustomerInfoModalProps) {
  const [role, setRole] = useState<'buyer' | 'admin'>('buyer');
  const [name, setName] = useState('');
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [addressDetail, setAddressDetail] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [isManual, setIsManual] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ name: '', address: '', detail: '', manual: '', username: '', password: '', auth: '' });

  useEffect(() => {
    const savedInfo = sessionStorage.getItem('customerInfo');
    if (savedInfo) {
      const info: CustomerInfo = JSON.parse(savedInfo);
      onSubmit(info);
    }
    fetchAddresses();
  }, [onSubmit]);

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('shipping_addresses')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const fullAddress = isManual
    ? manualAddress.trim()
    : `${selectedArea}${addressDetail.trim() ? ` - ${addressDetail.trim()}` : ''}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = { name: '', address: '', detail: '', manual: '', username: '', password: '', auth: '' };
    let hasError = false;

    if (role === 'buyer') {
      if (!name.trim()) {
        newErrors.name = 'Nama harus diisi';
        hasError = true;
      }

      if (isManual) {
        if (!manualAddress.trim()) {
          newErrors.manual = 'Alamat lengkap harus diisi';
          hasError = true;
        }
      } else {
        if (!selectedArea) {
          newErrors.address = 'Pilih area alamat';
          hasError = true;
        }
        if (!addressDetail.trim()) {
          newErrors.detail = 'Detail alamat harus diisi (contoh: no. rumah)';
          hasError = true;
        }
      }

      if (!hasError) {
        const info: CustomerInfo = {
          name: name.trim(),
          address: fullAddress,
          addressDetail: addressDetail.trim(),
          role: 'buyer',
          isManualAddress: isManual,
        };
        sessionStorage.setItem('customerInfo', JSON.stringify(info));
        onSubmit(info);
      }
    } else {
      if (!username.trim()) {
        newErrors.username = 'Username harus diisi';
        hasError = true;
      }

      if (!password.trim()) {
        newErrors.password = 'Password harus diisi';
        hasError = true;
      }

      if (!hasError) {
        try {
          const { data, error } = await supabase
            .from('admins')
            .select('*')
            .eq('username', username.trim())
            .eq('password', password.trim())
            .maybeSingle();

          if (error) throw error;

          if (data) {
            const info: CustomerInfo = {
              name: username.trim(),
              address: 'Admin',
              addressDetail: '',
              role: 'admin',
              isAuthenticated: true,
            };
            sessionStorage.setItem('customerInfo', JSON.stringify(info));
            onSubmit(info);
          } else {
            newErrors.auth = 'Username atau password salah';
          }
        } catch (error) {
          console.error('Error authenticating admin:', error);
          newErrors.auth = 'Login gagal';
        }
      }
    }

    setErrors(newErrors);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fadeIn relative my-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Selamat Datang!</h2>
        <p className="text-gray-600 mb-6">
          {role === 'buyer' ? 'Silakan isi data Anda untuk pengiriman' : 'Silakan login sebagai admin'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {role === 'buyer' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline w-4 h-4 mr-1" />
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Masukkan nama lengkap"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Pilih Area Alamat (Radius 2KM Gratis Ongkir)
                </label>
                {!isManual ? (
                  <>
                    <select
                      value={selectedArea}
                      onChange={(e) => setSelectedArea(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition ${
                        errors.address ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">-- Pilih Area --</option>
                      {addresses.map((addr) => (
                        <option key={addr.id} value={addr.name}>
                          {addr.name}
                        </option>
                      ))}
                    </select>
                    {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}

                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Home className="inline w-4 h-4 mr-1" />
                        Detail Alamat (No. Rumah, RT/RW, dll)
                      </label>
                      <input
                        type="text"
                        value={addressDetail}
                        onChange={(e) => setAddressDetail(e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition ${
                          errors.detail ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Contoh: Jl. Melati No. 12, RT 03/RW 05"
                      />
                      {errors.detail && <p className="text-red-500 text-sm mt-1">{errors.detail}</p>}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsManual(true);
                        setErrors({ ...errors, address: '', detail: '' });
                      }}
                      className="mt-2 text-sm text-green-600 hover:text-green-700 font-medium transition"
                    >
                      Alamat tidak ada di daftar? Masuk manual
                    </button>
                  </>
                ) : (
                  <>
                    <textarea
                      value={manualAddress}
                      onChange={(e) => setManualAddress(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition resize-none ${
                        errors.manual ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Masukkan alamat lengkap Anda"
                      rows={3}
                    />
                    {errors.manual && <p className="text-red-500 text-sm mt-1">{errors.manual}</p>}
                    <button
                      type="button"
                      onClick={() => {
                        setIsManual(false);
                        setErrors({ ...errors, manual: '' });
                      }}
                      className="mt-2 text-sm text-green-600 hover:text-green-700 font-medium transition"
                    >
                      Pilih dari daftar area
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          {role === 'admin' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline w-4 h-4 mr-1" />
                  Username Admin
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition ${
                    errors.username ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Masukkan username admin"
                />
                {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="inline w-4 h-4 mr-1" />
                  Password Admin
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Masukkan password admin"
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              {errors.auth && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{errors.auth}</p>
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition duration-200 transform hover:scale-[1.02]"
          >
            {role === 'admin' ? 'Login sebagai Admin' : 'Mulai Belanja'}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t">
          <button
            onClick={() => {
              setRole(role === 'admin' ? 'buyer' : 'admin');
              setErrors({ name: '', address: '', detail: '', manual: '', username: '', password: '', auth: '' });
            }}
            className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition py-2"
          >
            {role === 'admin' ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Kembali ke Login Pembeli
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Login sebagai Admin
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
