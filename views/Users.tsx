
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { storageService } from '../services/storageService';
import { User, UserRole } from '../types';
import { UserPlus, Trash2, Search, X, Shield, Users as UsersIcon, Loader2 } from 'lucide-react';

const Users: React.FC = () => {
  const { users, refreshUsers, currentUser, t } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    password: '',
    role: UserRole.SUPERVISOR,
    status: 'Active'
  });

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (users.some(u => u.username === newUser.username)) {
      alert("Username already exists!");
      return;
    }

    setLoading(true);
    const user: User = {
      ...newUser,
      id: Math.random().toString(36).substr(2, 9)
    };

    try {
      await storageService.saveUser(user);
      await storageService.addLog({
        userId: currentUser.id,
        userName: currentUser.name,
        role: currentUser.role,
        action: `Created user: ${user.name} (${user.role})`
      });
      
      await refreshUsers();
      setIsModalOpen(false);
      setNewUser({
        name: '',
        username: '',
        password: '',
        role: UserRole.SUPERVISOR,
        status: 'Active'
      });
    } catch (err) {
      alert("Failed to add user.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    const currentUserId = String(currentUser?.id);
    const targetId = String(id);

    if (!currentUser || targetId === currentUserId) {
      alert("You cannot delete your own account.");
      return;
    }

    const userToDelete = users.find(u => String(u.id) === targetId);
    if (!userToDelete) {
      alert("User not found.");
      return;
    }

    if (!confirm(`Are you sure you want to delete user "${userToDelete.name}"? This action cannot be undone.`)) return;

    try {
      await storageService.deleteUser(targetId);
      await storageService.addLog({
        userId: currentUser.id,
        userName: currentUser.name,
        role: currentUser.role,
        action: `Deleted user: ${userToDelete.name} (${userToDelete.role})`
      });
      await refreshUsers();
    } catch (err) {
      alert("Failed to delete user.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">{t('users')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage system access and roles</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20 font-bold"
        >
          <UserPlus size={20} />
          <span>{t('addUser')}</span>
        </button>
      </div>

      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
          <Search size={18} />
        </span>
        <input
          type="text"
          placeholder={t('search')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white transition-all shadow-sm"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('name')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('username')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('role')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">@{user.username}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                      user.role === UserRole.ADMIN ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                      user.role === UserRole.SUPERVISOR ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                      'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={String(user.id) === String(currentUser?.id)}
                      className={`p-2 rounded-lg transition-colors ${String(user.id) === String(currentUser?.id) ? 'text-slate-300 dark:text-slate-700 opacity-20 cursor-not-allowed' : 'text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10'}`}
                      title="Delete User"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
              <UsersIcon size={64} className="mb-4 opacity-10" />
              <p className="font-medium">No users found matching your search</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transition-colors duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('addUser')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4" autoComplete="off">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t('name')}</label>
                <input 
                  type="text" 
                  required
                  placeholder="John Doe"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-inner"
                  value={newUser.name}
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t('username')}</label>
                <input 
                  type="text" 
                  required
                  placeholder="johndoe"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-inner"
                  value={newUser.username}
                  onChange={e => setNewUser({...newUser, username: e.target.value})}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t('password')}</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-inner"
                  value={newUser.password}
                  onChange={e => setNewUser({...newUser, password: e.target.value})}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t('role')}</label>
                <select 
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-inner"
                  value={newUser.role}
                  onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                >
                  <option value={UserRole.ADMIN}>Admin</option>
                  <option value={UserRole.SUPERVISOR}>Supervisor</option>
                  <option value={UserRole.DRIVER}>Driver</option>
                </select>
              </div>
              <div className="pt-6 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">{t('cancel')}</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center">
                  {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : t('confirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
