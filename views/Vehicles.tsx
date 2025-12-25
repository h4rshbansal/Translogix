
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { storageService } from '../services/storageService';
import { Vehicle, VehicleStatus } from '../types';
import { Plus, Trash2, Shield, Search, X } from 'lucide-react';

const Vehicles: React.FC = () => {
  const { vehicles, refreshVehicles, currentUser, t } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newVehicle, setNewVehicle] = useState({ name: '', registrationNumber: '', status: VehicleStatus.ACTIVE });

  // Smart Search: Filters by name, registration number, or status
  const filteredVehicles = vehicles.filter(vehicle => 
    vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t(vehicle.status.toLowerCase().replace('_', '')).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    const vehicle: Vehicle = {
      ...newVehicle,
      id: Math.random().toString(36).substr(2, 9)
    };
    const freshVehicles = storageService.getVehicles();
    const updated = [...freshVehicles, vehicle];
    storageService.saveVehicles(updated);
    if (currentUser) {
      storageService.addLog({
        userId: currentUser.id,
        userName: currentUser.name,
        role: currentUser.role,
        action: `Added vehicle: ${vehicle.name}`
      });
    }
    refreshVehicles();
    setIsModalOpen(false);
    setNewVehicle({ name: '', registrationNumber: '', status: VehicleStatus.ACTIVE });
  };

  const handleDelete = (id: string) => {
    const targetId = String(id);
    const freshVehicles = storageService.getVehicles();
    const vehicleToDelete = freshVehicles.find(v => String(v.id) === targetId);
    if (!vehicleToDelete || !currentUser) return;

    if (!confirm(`Are you sure you want to delete vehicle "${vehicleToDelete.name}"?`)) return;

    const updated = freshVehicles.filter(v => String(v.id) !== targetId);
    storageService.saveVehicles(updated);

    storageService.addLog({
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      action: `Deleted vehicle: ${vehicleToDelete.name}`
    });

    refreshVehicles();
  };

  const updateStatus = (id: string, status: VehicleStatus) => {
    const freshVehicles = storageService.getVehicles();
    const updated = freshVehicles.map(v => String(v.id) === String(id) ? { ...v, status } : v);
    storageService.saveVehicles(updated);
    refreshVehicles();
  };

  return (
    <div className="space-y-6 transition-all duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">{t('vehicles')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Fleet management and status tracking</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 font-semibold hover:bg-blue-700 transition-all"
        >
          <Plus size={20} />
          <span>Add Vehicle</span>
        </button>
      </div>

      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
          <Search size={18} />
        </span>
        <input
          type="text"
          placeholder={`${t('search')} (Name, Reg No, Status...)`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white transition-all shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map(vehicle => (
          <div key={vehicle.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400">
                <Shield size={24} />
              </div>
              <button onClick={() => handleDelete(vehicle.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Delete Vehicle">
                <Trash2 size={18} />
              </button>
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{vehicle.name}</h3>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">{vehicle.registrationNumber}</p>
            
            <div className="mt-6 space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('status')}</p>
              <div className="flex flex-wrap gap-2">
                {Object.values(VehicleStatus).map(status => (
                  <button
                    key={status}
                    onClick={() => updateStatus(vehicle.id, status)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      vehicle.status === status 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20' 
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
      </div>

      {filteredVehicles.length === 0 && (
        <div className="py-20 text-center text-slate-400 dark:text-slate-600 font-medium">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
            <Search size={32} className="opacity-20" />
          </div>
          <p>No vehicles match your search criteria.</p>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transition-colors duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-xl text-slate-900 dark:text-white">Add New Vehicle</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"><X/></button>
            </div>
            <form onSubmit={handleAddVehicle} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">Vehicle Name</label>
                <input required className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner" value={newVehicle.name} onChange={e => setNewVehicle({...newVehicle, name: e.target.value})} placeholder="e.g. Heavy Duty Truck" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">Registration Number</label>
                <input required className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner" value={newVehicle.registrationNumber} onChange={e => setNewVehicle({...newVehicle, registrationNumber: e.target.value})} placeholder="e.g. MH-12-AB-1234" />
              </div>
              <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all mt-4">Add Vehicle</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;
