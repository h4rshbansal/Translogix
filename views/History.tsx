
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { JobStatus, UserRole } from '../types';
import { Archive, Search } from 'lucide-react';

const History: React.FC = () => {
  const { jobs, currentUser, t } = useAppContext();
  
  const historyJobs = jobs.filter(j => {
    const isCompletedOrArchived = j.status === JobStatus.COMPLETED || j.status === JobStatus.REJECTED || j.status === JobStatus.ARCHIVED;
    if (!isCompletedOrArchived) return false;
    
    if (currentUser?.role === UserRole.DRIVER) return j.driverId === currentUser.id;
    if (currentUser?.role === UserRole.SUPERVISOR) return j.supervisorId === currentUser.id;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('history')}</h1>
        <p className="text-slate-500 mt-1">Review past jobs and assignments</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{t('purpose')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{t('date')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{t('status')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{t('remarks')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historyJobs.map(job => (
                <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium">{job.purpose}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{job.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase ${
                      job.status === JobStatus.COMPLETED ? 'bg-green-100 text-green-600' :
                      job.status === JobStatus.REJECTED ? 'bg-red-100 text-red-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {t(job.status.toLowerCase())}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 italic">
                    {job.remarks || 'No remarks'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {historyJobs.length === 0 && (
            <div className="py-20 text-center text-slate-400">
              <Archive size={48} className="mx-auto mb-2 opacity-20" />
              <p>No historical records found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
