
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Clock, User as UserIcon, Activity } from 'lucide-react';

const ActivityLogs: React.FC = () => {
  const { logs, t } = useAppContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('logs')}</h1>
        <p className="text-slate-500 mt-1">Audit trail of all system activities</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {logs.map(log => (
            <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Activity size={20} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-slate-800">{log.action}</p>
                  <span className="text-xs text-slate-400 font-medium flex items-center">
                    <Clock size={12} className="mr-1" />
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center mt-1 text-sm text-slate-500">
                  <UserIcon size={14} className="mr-1" />
                  <span>{log.userName}</span>
                  <span className="mx-2 text-slate-300">•</span>
                  <span className="uppercase tracking-tighter text-xs font-bold text-blue-500">{log.role}</span>
                </div>
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              No activity logs found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;
