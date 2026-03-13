import { useState, useEffect } from 'react';
import { User, MapPin, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { CustomerInfo } from '../types/database';

interface CustomerInfoModalProps {
  onSubmit: (info: CustomerInfo) => void;
}

export default function CustomerInfoModal({ onSubmit }: CustomerInfoModalProps) {
  const [role, setRole] = useState<'buyer' | 'admin'>('buyer');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ name: '', address: '', username: '', password: '', auth: '' });

  useEffect(() => {
    const savedInfo = sessionStorage.getItem('customerInfo');
    if (savedInfo) {
      const info: CustomerInfo = JSON.parse(savedInfo);
      onSubmit(info);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        setRole(role === 'admin' ? 'buyer' : 'admin');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSubmit, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = { name: '', address: '', username: '', password: '', auth: '' };
    let hasError = false;

    if (role === 'buyer') {
      if (!name.trim()) {
        newErrors.name = 'Name is required';
        hasError = true;
      }

      if (!address.trim()) {
        newErrors.address = 'Address is required';
        hasError = true;
      }

      if (!hasError) {
        const info: CustomerInfo = { name: name.trim(), address: address.trim(), role: 'buyer' };
        sessionStorage.setItem('customerInfo', JSON.stringify(info));
        onSubmit(info);
      }
    } else {
      if (!username.trim()) {
        newErrors.username = 'Username is required';
        hasError = true;
      }

      if (!password.trim()) {
        newErrors.password = 'Password is required';
        hasError = true;
      }

      setErrors(newErrors);

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
              role: 'admin',
              isAuthenticated: true
            };
            sessionStorage.setItem('customerInfo', JSON.stringify(info));
            onSubmit(info);
          } else {
            newErrors.auth = 'Invalid username or password';
            setErrors(newErrors);
          }
        } catch (error) {
          console.error('Error authenticating admin:', error);
          newErrors.auth = 'Authentication failed';
          setErrors(newErrors);
        }
      }
    }

    if (hasError) {
      setErrors(newErrors);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fadeIn">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome!</h2>
        <p className="text-gray-600 mb-6">Please provide your details for delivery</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="hidden">
            <input
              type="radio"
              value="buyer"
              checked={role === 'buyer'}
              onChange={(e) => setRole(e.target.value as 'buyer')}
            />
          </div>

          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline w-4 h-4 mr-1" />
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline w-4 h-4 mr-1" />
                Complete Shipping Address
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition resize-none ${
                  errors.address ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your complete address"
                rows={3}
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">{errors.address}</p>
              )}
            </div>

            {role === 'admin' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline w-4 h-4 mr-1" />
                    Admin Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition ${
                      errors.username ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter admin username"
                  />
                  {errors.username && (
                    <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Lock className="inline w-4 h-4 mr-1" />
                    Admin Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter admin password"
                  />
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                  )}
                </div>

                {errors.auth && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm">{errors.auth}</p>
                  </div>
                )}
              </>
            )}
          </>


          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition duration-200 transform hover:scale-[1.02]"
          >
            {role === 'admin' ? 'Login as Admin' : 'Continue Shopping'}
          </button>
        </form>
      </div>
    </div>
  );
}
