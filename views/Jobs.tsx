
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { storageService } from '../services/storageService';
import { Job, JobStatus, UserRole, Priority, VehicleStatus, DriverStatus } from '../types';
import { TIME_SLOTS } from '../constants';
import { Plus, Check, X, Trash2, Printer, MapPin, Loader2, Info, ClipboardList, Search, HandMetal, Bookmark, Flag } from 'lucide-react';

const Jobs: React.FC = () => {
  const { jobs, refreshJobs, currentUser, users, vehicles, refreshUsers, refreshVehicles, t } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'MY' | 'BOARD'>('MY');
  const [assignData, setAssignData] = useState({ driverId: '', vehicleId: '' });

  // New job state
  const [newJob, setNewJob] = useState({
    date: new Date().toISOString().split('T')[0],
    timeSlot: TIME_SLOTS[0],
    purpose: '',
    fromPlace: '',
    toPlace: '',
    priority: Priority.MEDIUM
  });

  const activeJobs = jobs.filter(j => j.status !== JobStatus.ARCHIVED);

  // Supervisors see Admin jobs in the Board tab
  const boardJobs = activeJobs.filter(j => 
    j.supervisorId === 'admin' && 
    j.status === JobStatus.PENDING
  );

  const filteredJobs = activeJobs.filter(job => 
    job.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.supervisorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.fromPlace.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.toPlace.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (job.driverName && job.driverName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const displayJobs = currentUser?.role === UserRole.DRIVER 
    ? filteredJobs.filter(j => j.driverId === currentUser.id && j.status !== JobStatus.PENDING)
    : currentUser?.role === UserRole.SUPERVISOR
    ? (activeTab === 'MY' ? filteredJobs.filter(j => j.supervisorId === currentUser.id) : boardJobs)
    : filteredJobs;

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const job: Job = {
      id: Math.random().toString(36).substr(2, 9),
      supervisorId: currentUser.role === UserRole.ADMIN ? 'admin' : currentUser.id,
      supervisorName: currentUser.role === UserRole.ADMIN ? 'Admin Requirement' : currentUser.name,
      ...newJob,
      status: JobStatus.PENDING,
      createdAt: new Date().toISOString()
    };

    const updatedJobs = [job, ...jobs];
    storageService.saveJobs(updatedJobs);
    storageService.addLog({
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      action: `Created job: ${job.purpose} (${job.fromPlace} to ${job.toPlace})`
    });
    refreshJobs();
    setIsModalOpen(false);
    setNewJob({
      date: new Date().toISOString().split('T')[0],
      timeSlot: TIME_SLOTS[0],
      purpose: '',
      fromPlace: '',
      toPlace: '',
      priority: Priority.MEDIUM
    });
  };

  const handleApply = (jobId: string) => {
    if (!currentUser) return;
    const updatedJobs = jobs.map(j => 
      j.id === jobId ? { ...j, supervisorId: currentUser.id, supervisorName: currentUser.name } : j
    );
    storageService.saveJobs(updatedJobs);
    storageService.addLog({
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      action: `Applied for Admin job: ${jobId}`
    });
    refreshJobs();
  };

  const handleDeleteJob = (id: string) => {
    if (!currentUser) return;
    const updatedJobs = jobs.map(j => j.id === id ? { ...j, status: JobStatus.ARCHIVED } : j);
    storageService.saveJobs(updatedJobs);
    storageService.addLog({
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      action: `Archived job: ${id}`
    });
    refreshJobs();
  };

  const handleApprove = (job: Job) => {
    setSelectedJob(job);
    setIsAssignModalOpen(true);
  };

  const handleReject = (job: Job) => {
    const reason = prompt("Enter rejection reason:");
    if (reason === null) return;

    const updatedJobs = jobs.map(j => 
      j.id === job.id ? { ...j, status: JobStatus.REJECTED, remarks: reason } : j
    );
    storageService.saveJobs(updatedJobs);
    if (currentUser) {
      storageService.addLog({
        userId: currentUser.id,
        userName: currentUser.name,
        role: currentUser.role,
        action: `Rejected job: ${job.id}`
      });
    }
    refreshJobs();
  };

  const handleAssign = () => {
    if (!selectedJob || !currentUser) return;
    const driver = users.find(u => u.id === assignData.driverId);
    const vehicle = vehicles.find(v => v.id === assignData.vehicleId);

    if (!driver || !vehicle) return alert("Select driver and vehicle");

    const isVehicleBusy = jobs.some(j => 
      j.id !== selectedJob.id && 
      j.vehicleId === vehicle.id && 
      j.date === selectedJob.date && 
      j.timeSlot === selectedJob.timeSlot &&
      (j.status === JobStatus.APPROVED || j.status === JobStatus.ACCEPTED || j.status === JobStatus.REACHED || j.status === JobStatus.ON_WORK)
    );

    if (isVehicleBusy) return alert("Vehicle already assigned for this time slot");

    const updatedJobs = jobs.map(j => 
      j.id === selectedJob.id ? { 
        ...j, 
        status: JobStatus.APPROVED, 
        driverId: driver.id, 
        driverName: driver.name,
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        approvedAt: new Date().toISOString()
      } : j
    );

    const updatedUsers = users.map(u => u.id === driver.id ? { ...u, status: DriverStatus.ASSIGNED } : u);
    storageService.saveUsers(updatedUsers);
    storageService.saveJobs(updatedJobs);
    
    storageService.addLog({
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      action: `Approved job ${selectedJob.id} and assigned to ${driver.name}`
    });

    refreshJobs();
    refreshUsers();
    setIsAssignModalOpen(false);
    setSelectedJob(null);
  };

  const updateDriverProgress = (job: Job, newStatus: JobStatus) => {
    if (!currentUser) return;
    const updatedJobs = jobs.map(j => 
      j.id === job.id ? { 
        ...j, 
        status: newStatus,
        completedAt: newStatus === JobStatus.COMPLETED ? new Date().toISOString() : j.completedAt
      } : j
    );
    
    if (newStatus === JobStatus.COMPLETED) {
      const updatedUsers = users.map(u => u.id === currentUser.id ? { ...u, status: DriverStatus.AVAILABLE } : u);
      storageService.saveUsers(updatedUsers);
      refreshUsers();
    }

    storageService.saveJobs(updatedJobs);
    storageService.addLog({
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      action: `Updated job status: ${newStatus}`
    });
    refreshJobs();
  };

  const handlePrint = (job: Job) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Job Slip - ${job.id}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .details { margin-top: 30px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            .footer { margin-top: 50px; text-align: center; font-style: italic; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>TransLogix Transport Slip</h1>
            <p>Job ID: ${job.id}</p>
          </div>
          <div class="details">
            <div class="row"><strong>Purpose:</strong> <span>${job.purpose}</span></div>
            <div class="row"><strong>Route:</strong> <span>${job.fromPlace} → ${job.toPlace}</span></div>
            <div class="row"><strong>Date:</strong> <span>${job.date}</span></div>
            <div class="row"><strong>Time Slot:</strong> <span>${job.timeSlot}</span></div>
            <div class="row"><strong>Priority:</strong> <span>${job.priority}</span></div>
            <div class="row"><strong>Status:</strong> <span>${job.status}</span></div>
            <hr/>
            <div class="row"><strong>Supervisor:</strong> <span>${job.supervisorName}</span></div>
            <div class="row"><strong>Driver:</strong> <span>${job.driverName || 'N/A'}</span></div>
            <div class="row"><strong>Vehicle:</strong> <span>${job.vehicleName || 'N/A'}</span></div>
          </div>
          <div class="footer">
            <p>This is a computer-generated slip. No signature required.</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 transition-all duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('jobs')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage transport requests and routes</p>
        </div>
        {(currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.SUPERVISOR) && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20 font-bold"
          >
            <Plus size={20} />
            <span>{t('createJob')}</span>
          </button>
        )}
      </div>

      {currentUser?.role === UserRole.SUPERVISOR && (
        <div className="flex space-x-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit">
          <button 
            onClick={() => setActiveTab('MY')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'MY' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
          >
            {t('myJobs')}
          </button>
          <button 
            onClick={() => setActiveTab('BOARD')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center space-x-2 ${activeTab === 'BOARD' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
          >
            <Bookmark size={16} />
            <span>{t('jobBoard')}</span>
            {boardJobs.length > 0 && <span className="w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{boardJobs.length}</span>}
          </button>
        </div>
      )}

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
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('purpose')} / Route</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('date')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('status')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('priority')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayJobs.map(job => (
                <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{job.purpose}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <MapPin size={12} className="text-blue-500" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">{job.fromPlace}</span>
                        <span className="text-xs text-slate-300 dark:text-slate-600">→</span>
                        <Flag size={12} className="text-red-500" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">{job.toPlace}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {job.supervisorId === 'admin' ? <span className="text-blue-500 font-bold uppercase">Open Requirement</span> : `By ${job.supervisorName}`}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="text-slate-800 dark:text-slate-200 font-medium">{job.date}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-xs">{job.timeSlot}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                      job.status === JobStatus.PENDING ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
                      job.status === JobStatus.APPROVED ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                      job.status === JobStatus.REJECTED ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                      job.status === JobStatus.COMPLETED ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                      'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                    }`}>
                      {t(job.status.toLowerCase())}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold ${
                      job.priority === Priority.HIGH ? 'text-red-500' :
                      job.priority === Priority.MEDIUM ? 'text-blue-500' :
                      'text-slate-400'
                    }`}>
                      {t(job.priority.toLowerCase())}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {currentUser?.role === UserRole.ADMIN && job.status === JobStatus.PENDING && (
                        <>
                          {job.supervisorId !== 'admin' ? (
                            <>
                              <button onClick={() => handleApprove(job)} className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors" title="Approve">
                                <Check size={18} />
                              </button>
                              <button onClick={() => handleReject(job)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Reject">
                                <X size={18} />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 uppercase font-bold italic">Waiting for Supervisor</span>
                          )}
                        </>
                      )}

                      {currentUser?.role === UserRole.SUPERVISOR && activeTab === 'BOARD' && (
                        <button 
                          onClick={() => handleApply(job.id)}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors shadow-md shadow-green-600/20"
                        >
                          <HandMetal size={14} />
                          <span>{t('apply')}</span>
                        </button>
                      )}

                      {currentUser?.role === UserRole.DRIVER && (
                        <>
                          {job.status === JobStatus.APPROVED && (
                            <button onClick={() => updateDriverProgress(job, JobStatus.ACCEPTED)} className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 font-bold">
                              {t('acceptJob')}
                            </button>
                          )}
                          {job.status === JobStatus.ACCEPTED && (
                            <button onClick={() => updateDriverProgress(job, JobStatus.REACHED)} className="px-3 py-1 bg-yellow-500 text-white text-xs rounded-lg hover:bg-yellow-600 font-bold">
                              {t('reached')}
                            </button>
                          )}
                          {job.status === JobStatus.REACHED && (
                            <button onClick={() => updateDriverProgress(job, JobStatus.ON_WORK)} className="px-3 py-1 bg-indigo-500 text-white text-xs rounded-lg hover:bg-indigo-600 font-bold">
                              {t('onWork')}
                            </button>
                          )}
                          {job.status === JobStatus.ON_WORK && (
                            <button onClick={() => updateDriverProgress(job, JobStatus.COMPLETED)} className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 font-bold">
                              {t('completed')}
                            </button>
                          )}
                        </>
                      )}

                      {(job.status === JobStatus.APPROVED || job.status === JobStatus.COMPLETED) && (
                        <button onClick={() => handlePrint(job)} className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" title="Print Slip">
                          <Printer size={18} />
                        </button>
                      )}

                      {(currentUser?.role === UserRole.ADMIN || (currentUser?.role === UserRole.SUPERVISOR && job.status === JobStatus.PENDING && job.supervisorId === currentUser.id)) && (
                        <button onClick={() => handleDeleteJob(job.id)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded-lg" title="Archive">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {displayJobs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
              <ClipboardList size={48} className="mb-2 opacity-20" />
              <p>{activeTab === 'BOARD' ? 'No open requirements currently' : 'No jobs found in this category'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Job Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transition-colors duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('createJob')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateJob} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t('purpose')}</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Raw Material Transport"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
                  value={newJob.purpose}
                  onChange={e => setNewJob({...newJob, purpose: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t('fromPlace')}</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Warehouse A"
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
                    value={newJob.fromPlace}
                    onChange={e => setNewJob({...newJob, fromPlace: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t('toPlace')}</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Factory B"
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
                    value={newJob.toPlace}
                    onChange={e => setNewJob({...newJob, toPlace: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t('date')}</label>
                  <input 
                    type="date" 
                    required
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
                    value={newJob.date}
                    onChange={e => setNewJob({...newJob, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t('priority')}</label>
                  <select 
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
                    value={newJob.priority}
                    onChange={e => setNewJob({...newJob, priority: e.target.value as Priority})}
                  >
                    <option value={Priority.LOW}>{t('low')}</option>
                    <option value={Priority.MEDIUM}>{t('medium')}</option>
                    <option value={Priority.HIGH}>{t('high')}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t('time')}</label>
                <select 
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
                  value={newJob.timeSlot}
                  onChange={e => setNewJob({...newJob, timeSlot: e.target.value})}
                >
                  {TIME_SLOTS.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl">{t('cancel')}</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20">{t('confirm')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {isAssignModalOpen && selectedJob && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden transition-colors duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Approve & Assign</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">{selectedJob.purpose}</p>
                <div className="flex items-center space-x-1 mb-2">
                    <span className="text-xs text-slate-500">{selectedJob.fromPlace}</span>
                    <span className="text-xs text-slate-400">→</span>
                    <span className="text-xs text-slate-500">{selectedJob.toPlace}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{selectedJob.date} | {selectedJob.timeSlot}</p>
                <p className="text-[10px] text-blue-500 font-bold mt-2 uppercase tracking-widest">Requested By: {selectedJob.supervisorName}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('drivers')}</label>
                <select 
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors shadow-inner"
                  value={assignData.driverId}
                  onChange={e => setAssignData({...assignData, driverId: e.target.value})}
                >
                  <option value="">Select Available Driver</option>
                  {users.filter(u => u.role === UserRole.DRIVER && u.status === DriverStatus.AVAILABLE).map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('vehicles')}</label>
                <select 
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors shadow-inner"
                  value={assignData.vehicleId}
                  onChange={e => setAssignData({...assignData, vehicleId: e.target.value})}
                >
                  <option value="">Select Active Vehicle</option>
                  {vehicles.filter(v => v.status === VehicleStatus.ACTIVE).map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button onClick={() => setIsAssignModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl transition-colors">{t('cancel')}</button>
                <button onClick={handleAssign} className="flex-1 px-4 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all">{t('assign')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;
