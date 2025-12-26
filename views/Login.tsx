
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { storageService } from '../services/storageService';
import { Truck, Lock, User as UserIcon } from 'lucide-react';

const Login: React.FC = () => {
  const { setCurrentUser, t } = useAppContext();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const users = await storageService.getUsers();
      // Use trim to avoid whitespace issues during login
      const user = users.find(u => u.username.trim() === username.trim() && u.password === password);

      if (user) {
        await storageService.addLog({
          userId: user.id,
          userName: user.name,
          role: user.role,
          action: 'Logged in'
        });
        setCurrentUser(user);
      } else {
        setError('Invalid credentials. Please contact your administrator.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-blue-600 p-8 text-center text-white">
          <div className="inline-flex items-center justify-center p-4 bg-white/20 rounded-2xl mb-4">
            <Truck size={48} />
          </div>
          <h2 className="text-3xl font-bold">{t('loginTitle')}</h2>
          <p className="text-blue-100 mt-2">Manage your logistics seamlessly</p>
        </div>
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6" autoComplete="off">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t('username')}</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <UserIcon size={18} />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                  placeholder="Enter username"
                  required
                  autoComplete="one-time-code"
                  spellCheck="false"
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t('password')}</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                  placeholder="Enter password"
                  required
                  autoComplete="one-time-code"
                  disabled={loading}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center"
            >
              {loading ? 'Authenticating...' : t('login')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
