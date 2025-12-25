
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { storageService } from '../services/storageService';
import { User, UserRole } from '../types';
import { Briefcase, Trash2, Search, X, UserPlus } from 'lucide-react';

const Supervisors: React.FC = () => {
  const { users, refreshUsers, currentUser, t } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newSupervisor, setNewSupervisor] = useState({ name: '', username: '', password: 'password', status: 'Active' });

  const supervisors = users.filter(u => u.role === UserRole.SUPERVISOR);
  const filteredSupervisors = supervisors.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSupervisor = (e: React.FormEvent) => {
    e.preventDefault();
    if (users.some(u => u.username === newSupervisor.username)) {
      alert("Username already exists!");
      return;
    }

    const user: User = {
      ...newSupervisor,
      id: Math.random().toString(36).substr(2, 9),
      role: UserRole.SUPERVISOR
    };
    const updated = [...users, user];
    storageService.saveUsers(updated);
    if (currentUser) {
      storageService.addLog({
        userId: currentUser.id,
        userName: currentUser.name,
        role: currentUser.role,
        action: `Added supervisor: ${user.name}`
      });
    }
    refreshUsers();
    setIsModalOpen(false);
    setNewSupervisor({ name: '', username: '', password: 'password', status: 'Active' });
  };

  const handleDelete = (id: string) => {
    const targetId = String(id);
    const freshUsers = storageService.getUsers();
    const supervisorToDelete = freshUsers.find(u => String(u.id) === targetId);
    if (!supervisorToDelete || !currentUser) return;

    if (!confirm(`Are you sure you want to delete supervisor "${supervisorToDelete.name}"?`)) return;

    const updated = freshUsers.filter(u => String(u.id) !== targetId);
    storageService.saveUsers(updated);

    storageService.addLog({
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      action: `Deleted supervisor: ${supervisorToDelete.name}`
    });

    refreshUsers();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">{t('supervisors')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Personnel management for transport supervisors</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors">
          <UserPlus size={20} />
          <span>{t('addSupervisor')}</span>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSupervisors.map(supervisor => (
          <div key={supervisor.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Briefcase size={24} />
              </div>
              <button onClick={() => handleDelete(supervisor.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Delete Supervisor">
                <Trash2 size={18} />
              </button>
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{supervisor.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium italic">@{supervisor.username}</p>
            <div className="mt-4">
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-bold rounded-lg uppercase">
                    {supervisor.status}
                </span>
            </div>
          </div>
        ))}
        {filteredSupervisors.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 dark:text-slate-600">
            No supervisors found.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transition-all duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-xl text-slate-900 dark:text-white">{t('addSupervisor')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X/></button>
            </div>
            <form onSubmit={handleAddSupervisor} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">Full Name</label>
                <input required className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 shadow-inner" value={newSupervisor.name} onChange={e => setNewSupervisor({...newSupervisor, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">Username</label>
                <input required className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 shadow-inner" value={newSupervisor.username} onChange={e => setNewSupervisor({...newSupervisor, username: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">Password</label>
                <input required type="password" className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 shadow-inner" value={newSupervisor.password} onChange={e => setNewSupervisor({...newSupervisor, password: e.target.value})} />
              </div>
              <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all mt-4">Add Supervisor</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Supervisors;
