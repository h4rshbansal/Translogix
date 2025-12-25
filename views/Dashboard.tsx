
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { UserRole, JobStatus, DriverStatus } from '../types';
import StatsCard from '../components/StatsCard';
import { ClipboardList, CheckCircle, Truck, Users, Clock } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { jobs, vehicles, users, currentUser, t } = useAppContext();

  // Filter archived jobs for counting
  const activeJobs = jobs.filter(j => j.status !== JobStatus.ARCHIVED);
  const pendingCount = activeJobs.filter(j => j.status === JobStatus.PENDING).length;
  const approvedCount = activeJobs.filter(j => j.status === JobStatus.APPROVED || j.status === JobStatus.ACCEPTED || j.status === JobStatus.REACHED || j.status === JobStatus.ON_WORK).length;
  const completedCount = activeJobs.filter(j => j.status === JobStatus.COMPLETED).length;
  const driverCount = users.filter(u => u.role === UserRole.DRIVER && u.status === DriverStatus.AVAILABLE).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">{t('welcome')}, {currentUser?.name}!</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{t('stats')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title={t('pendingJobs')} 
          value={pendingCount} 
          icon={<Clock className="text-orange-600 dark:text-orange-400" size={24} />} 
          colorClass="bg-orange-100 dark:bg-orange-900/30" 
        />
        <StatsCard 
          title={t('approvedJobs')} 
          value={approvedCount} 
          icon={<ClipboardList className="text-blue-600 dark:text-blue-400" size={24} />} 
          colorClass="bg-blue-100 dark:bg-blue-900/30" 
        />
        <StatsCard 
          title={t('activeDrivers')} 
          value={driverCount} 
          icon={<Users className="text-green-600 dark:text-green-400" size={24} />} 
          colorClass="bg-green-100 dark:bg-green-900/30" 
        />
        <StatsCard 
          title={t('completedJobs')} 
          value={completedCount} 
          icon={<CheckCircle className="text-emerald-600 dark:text-emerald-400" size={24} />} 
          colorClass="bg-emerald-100 dark:bg-emerald-900/30" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
          <h2 className="text-lg font-bold mb-4 flex items-center dark:text-white">
            <Clock size={20} className="mr-2 text-slate-600 dark:text-slate-400" />
            Recent Job Activity
          </h2>
          <div className="space-y-4">
            {activeJobs.slice(0, 5).map(job => (
              <div key={job.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{job.purpose}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{job.date} | {job.timeSlot}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase ${
                  job.status === JobStatus.PENDING ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
                  job.status === JobStatus.COMPLETED ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                  'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                }`}>
                  {t(job.status.toLowerCase())}
                </span>
              </div>
            ))}
            {activeJobs.length === 0 && <p className="text-slate-400 text-center py-4">No recent jobs found</p>}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
          <h2 className="text-lg font-bold mb-4 flex items-center dark:text-white">
            <Truck size={20} className="mr-2 text-slate-600 dark:text-slate-400" />
            Resources Overview
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Total Vehicles</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{vehicles.length}</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">Total Staff</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{users.length}</p>
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-1">Operational</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {vehicles.filter(v => v.status === 'ACTIVE').length}
              </p>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-1">Maintenance</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {vehicles.filter(v => v.status === 'MAINTENANCE').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
