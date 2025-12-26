
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { storageService } from '../services/storageService';
import { User, UserRole, DriverStatus } from '../types';
import { UserPlus, Trash2, User as UserIcon, X } from 'lucide-react';

const Drivers: React.FC = () => {
  const { users, refreshUsers, currentUser, t } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', username: '', password: 'password', status: DriverStatus.AVAILABLE });

  const drivers = users.filter(u => u.role === UserRole.DRIVER);

  // Added async and fixed plural saveUsers to saveUser
  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    const user: User = {
      ...newUser,
      id: Math.random().toString(36).substr(2, 9),
      role: UserRole.DRIVER
    };
    
    await storageService.saveUser(user);
    if (currentUser) {
      await storageService.addLog({
        userId: currentUser.id,
        userName: currentUser.name,
        role: currentUser.role,
        action: `Added driver: ${user.name}`
      });
    }
    await refreshUsers();
    setIsModalOpen(false);
    setNewUser({ name: '', username: '', password: 'password', status: DriverStatus.AVAILABLE });
  };

  // Added async, await for getUsers, and fixed plural saveUsers to saveUser
  const updateStatus = async (id: string, status: string) => {
    const freshUsers = await storageService.getUsers();
    const user = freshUsers.find(u => String(u.id) === String(id));
    if (user) {
        const updated = { ...user, status };
        await storageService.saveUser(updated);
        await refreshUsers();
    }
  };

  // Added async, await for getUsers, and fixed plural saveUsers to deleteUser
  const handleDelete = async (id: string) => {
    const targetId = String(id);
    const freshUsers = await storageService.getUsers();
    const driverToDelete = freshUsers.find(u => String(u.id) === targetId);
    if (!driverToDelete || !currentUser) return;

    if (!confirm(`Are you sure you want to delete driver "${driverToDelete.name}"?`)) return;

    await storageService.deleteUser(targetId);
    
    await storageService.addLog({
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      action: `Deleted driver: ${driverToDelete.name}`
    });
    
    await refreshUsers();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">{t('drivers')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Personnel management and availability</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors">
          <UserPlus size={20} />
          <span>Add Driver</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drivers.map(driver => (
          <div key={driver.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                <UserIcon size={24} />
              </div>
              <button onClick={() => handleDelete(driver.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Delete Driver">
                <Trash2 size={18} />
              </button>
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{driver.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium italic">@{driver.username}</p>

            <div className="mt-6 space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('status')}</p>
              <div className="flex flex-wrap gap-2">
                {Object.values(DriverStatus).map(status => (
                  <button
                    key={status}
                    onClick={() => updateStatus(driver.id, status)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      driver.status === status 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {t(status.toLowerCase().replace('_', ''))}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
        {drivers.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 dark:text-slate-600">
            No drivers registered.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-xl text-slate-900 dark:text-white">Register New Driver</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X/></button>
            </div>
            <form onSubmit={handleAddDriver} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">Full Name</label>
                <input required className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none shadow-inner" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">Username</label>
                <input required className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none shadow-inner" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
              </div>
              <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 mt-4">Register Driver</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drivers;
