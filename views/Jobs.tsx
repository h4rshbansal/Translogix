import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { storageService } from '../services/storageService';
import { Job, JobStatus, UserRole, Priority, VehicleStatus, DriverStatus } from '../types';
import { TIME_SLOTS } from '../constants';
import { Plus, Check, X, Trash2, Printer, MapPin, Loader2, ClipboardList, Search, Bookmark, Flag, Sparkles } from 'lucide-react';
// Correct import for @google/genai
import { GoogleGenAI } from "@google/genai";

const Jobs: React.FC = () => {
  const { jobs, refreshJobs, currentUser, users, vehicles, refreshUsers, refreshVehicles, t } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'MY' | 'BOARD'>('MY');
  const [assignData, setAssignData] = useState({ driverId: '', vehicleId: '' });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

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

  // AI-Assisted Priority Suggestion using Gemini
  const handleAISuggestPriority = async () => {
    if (!newJob.purpose) return;
    setAiLoading(true);
    try {
      // Fix: Always initialize GoogleGenAI right before making an API call
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Given the transport job purpose: "${newJob.purpose}", categorize its priority as LOW, MEDIUM, or HIGH. Respond with ONLY the category name.`,
      });

      // Fix: The text property directly returns the string output
      const priorityText = response.text?.trim()?.toUpperCase();
      if (priorityText === 'LOW' || priorityText === 'MEDIUM' || priorityText === 'HIGH') {
        setNewJob(prev => ({ ...prev, priority: priorityText as Priority }));
      }
    } catch (err) {
      console.error("AI Priority Suggestion failed:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);

    const job: Job = {
      id: Math.random().toString(36).substr(2, 9),
      supervisorId: currentUser.role === UserRole.ADMIN ? 'admin' : currentUser.id,
      supervisorName: currentUser.role === UserRole.ADMIN ? 'Admin Requirement' : currentUser.name,
      ...newJob,
      status: JobStatus.PENDING,
      createdAt: new Date().toISOString()
    };

    try {
      await storageService.saveJob(job);
      await storageService.addLog({
        userId: currentUser.id,
        userName: currentUser.name,
        role: currentUser.role,
        action: `Created job: ${job.purpose} (${job.fromPlace} to ${job.toPlace})`
      });
      await refreshJobs();
      setIsModalOpen(false);
      setNewJob({
        date: new Date().toISOString().split('T')[0],
        timeSlot: TIME_SLOTS[0],
        purpose: '',
        fromPlace: '',
        toPlace: '',
        priority: Priority.MEDIUM
      });
    } catch (err) {
      alert("Failed to create job.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId: string) => {
    if (!currentUser) return;
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    try {
      const updatedJob = { ...job, supervisorId: currentUser.id, supervisorName: currentUser.name };
      await storageService.saveJob(updatedJob);
      await storageService.addLog({
        userId: currentUser.id,
        userName: currentUser.name,
        role: currentUser.role,
        action: `Applied for Admin job: ${jobId}`
      });
      await refreshJobs();
    } catch (err) {
      alert("Failed to apply.");
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (!currentUser) return;
    const job = jobs.find(j => j.id === id);
    if (!job) return;

    try {
      const updatedJob = { ...job, status: JobStatus.ARCHIVED };
      await storageService.saveJob(updatedJob);
      await storageService.addLog({
        userId: currentUser.id,
        userName: currentUser.name,
        role: currentUser.role,
        action: `Archived job: ${id}`
      });
      await refreshJobs();
    } catch (err) {
      alert("Failed to archive job.");
    }
  };

  const handleApprove = (job: Job) => {
    setSelectedJob(job);
    setIsAssignModalOpen(true);
  };

  const handleReject = async (job: Job) => {
    const reason = prompt("Enter rejection reason:");
    if (reason === null) return;

    try {
      const updatedJob = { ...job, status: JobStatus.REJECTED, remarks: reason };
      await storageService.saveJob(updatedJob);
      if (currentUser) {
        await storageService.addLog({
          userId: currentUser.id,
          userName: currentUser.name,
          role: currentUser.role,
          action: `Rejected job: ${job.id}`
        });
      }
      await refreshJobs();
    } catch (err) {
      alert("Failed to reject job.");
    }
  };

  const handleAssign = async () => {
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

    setLoading(true);
    try {
      const updatedJob: Job = { 
        ...selectedJob, 
        status: JobStatus.APPROVED, 
        driverId: driver.id, 
        driverName: driver.name,
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        approvedAt: new Date().toISOString()
      };

      const updatedDriver = { ...driver, status: DriverStatus.ASSIGNED };
      
      await storageService.saveJob(updatedJob);
      await storageService.saveUser(updatedDriver);
      
      await storageService.addLog({
        userId: currentUser.id,
        userName: currentUser.name,
        role: currentUser.role,
        action: `Approved job ${selectedJob.id} and assigned to ${driver.name}`
      });

      await refreshJobs();
      await refreshUsers();
      setIsAssignModalOpen(false);
      setSelectedJob(null);
    } catch (err) {
      alert("Assignment failed.");
    } finally {
      setLoading(false);
    }
  };

  const updateDriverProgress = async (job: Job, newStatus: JobStatus) => {
    if (!currentUser) return;
    try {
      const updatedJob = { 
        ...job, 
        status: newStatus,
        completedAt: newStatus === JobStatus.COMPLETED ? new Date().toISOString() : job.completedAt
      };
      
      if (newStatus === JobStatus.COMPLETED) {
        const updatedUser = { ...currentUser, status: DriverStatus.AVAILABLE };
        await storageService.saveUser(updatedUser);
        await refreshUsers();
      }

      await storageService.saveJob(updatedJob);
      await storageService.addLog({
        userId: currentUser.id,
        userName: currentUser.name,
        role: currentUser.role,
        action: `Updated job status: ${newStatus}`
      });
      await refreshJobs();
    } catch (err) {
      alert("Update failed.");
    }
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
                        <Flag size={12} className="text-emerald-500" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">{job.toPlace}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{job.date}</p>
                    <p className="text-xs text-slate-400">{job.timeSlot}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase ${
                      job.status === JobStatus.PENDING ? 'bg-orange-100 text-orange-600' :
                      job.status === JobStatus.APPROVED ? 'bg-blue-100 text-blue-600' :
                      job.status === JobStatus.COMPLETED ? 'bg-green-100 text-green-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {t(job.status.toLowerCase())}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold ${
                      job.priority === Priority.HIGH ? 'text-red-500' :
                      job.priority === Priority.MEDIUM ? 'text-orange-500' :
                      'text-blue-500'
                    }`}>
                      {t(job.priority.toLowerCase())}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {currentUser?.role === UserRole.ADMIN && job.status === JobStatus.PENDING && (
                        <>
                          <button onClick={() => handleApprove(job)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="Approve & Assign"><Check size={16}/></button>
                          <button onClick={() => handleReject(job)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Reject"><X size={16}/></button>
                        </>
                      )}
                      {currentUser?.role === UserRole.SUPERVISOR && activeTab === 'BOARD' && (
                        <button onClick={() => handleApply(job.id)} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-1 text-xs px-2 font-bold">
                          <span>{t('apply')}</span>
                        </button>
                      )}
                      {currentUser?.role === UserRole.DRIVER && job.status === JobStatus.APPROVED && (
                        <button onClick={() => updateDriverProgress(job, JobStatus.ACCEPTED)} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg">{t('acceptJob')}</button>
                      )}
                      {currentUser?.role === UserRole.DRIVER && job.status === JobStatus.ACCEPTED && (
                        <button onClick={() => updateDriverProgress(job, JobStatus.REACHED)} className="px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-lg">{t('reached')}</button>
                      )}
                      {currentUser?.role === UserRole.DRIVER && job.status === JobStatus.REACHED && (
                        <button onClick={() => updateDriverProgress(job, JobStatus.ON_WORK)} className="px-3 py-1.5 bg-purple-500 text-white text-xs font-bold rounded-lg">{t('onWork')}</button>
                      )}
                      {currentUser?.role === UserRole.DRIVER && job.status === JobStatus.ON_WORK && (
                        <button onClick={() => updateDriverProgress(job, JobStatus.COMPLETED)} className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg">{t('completed')}</button>
                      )}
                      <button onClick={() => handlePrint(job)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"><Printer size={16}/></button>
                      {(currentUser?.role === UserRole.ADMIN || (currentUser?.role === UserRole.SUPERVISOR && job.supervisorId === currentUser.id)) && (
                        <button onClick={() => handleDeleteJob(job.id)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {displayJobs.length === 0 && (
            <div className="py-20 text-center text-slate-400">
              <ClipboardList size={48} className="mx-auto mb-2 opacity-20" />
              <p>No jobs found</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Job Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold dark:text-white">{t('createJob')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X size={24}/></button>
            </div>
            <form onSubmit={handleCreateJob} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1 dark:text-slate-300">{t('fromPlace')}</label>
                  <input required className="w-full px-4 py-2 border dark:bg-slate-950 dark:border-slate-800 dark:text-white rounded-xl outline-none" value={newJob.fromPlace} onChange={e => setNewJob({...newJob, fromPlace: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1 dark:text-slate-300">{t('toPlace')}</label>
                  <input required className="w-full px-4 py-2 border dark:bg-slate-950 dark:border-slate-800 dark:text-white rounded-xl outline-none" value={newJob.toPlace} onChange={e => setNewJob({...newJob, toPlace: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 dark:text-slate-300">{t('purpose')}</label>
                <div className="flex gap-2">
                  <input required className="flex-1 px-4 py-2 border dark:bg-slate-950 dark:border-slate-800 dark:text-white rounded-xl outline-none" value={newJob.purpose} onChange={e => setNewJob({...newJob, purpose: e.target.value})} />
                  <button type="button" onClick={handleAISuggestPriority} disabled={aiLoading || !newJob.purpose} className="px-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 disabled:opacity-50 transition-colors">
                    {aiLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1 dark:text-slate-300">{t('date')}</label>
                  <input type="date" required className="w-full px-4 py-2 border dark:bg-slate-950 dark:border-slate-800 dark:text-white rounded-xl outline-none" value={newJob.date} onChange={e => setNewJob({...newJob, date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1 dark:text-slate-300">{t('time')}</label>
                  <select className="w-full px-4 py-2 border dark:bg-slate-950 dark:border-slate-800 dark:text-white rounded-xl outline-none" value={newJob.timeSlot} onChange={e => setNewJob({...newJob, timeSlot: e.target.value})}>
                    {TIME_SLOTS.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 dark:text-slate-300">{t('priority')}</label>
                <div className="flex gap-2">
                  {Object.values(Priority).map(p => (
                    <button key={p} type="button" onClick={() => setNewJob({...newJob, priority: p})} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${newJob.priority === p ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 dark:border-slate-800 text-slate-500'}`}>{t(p.toLowerCase())}</button>
                  ))}
                </div>
              </div>
              <button disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all mt-4 flex items-center justify-center">
                {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : t('createJob')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {isAssignModalOpen && selectedJob && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold dark:text-white">{t('assign')}</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X size={24}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1 dark:text-slate-300">{t('drivers')}</label>
                <select className="w-full px-4 py-2 border dark:bg-slate-950 dark:border-slate-800 dark:text-white rounded-xl outline-none" value={assignData.driverId} onChange={e => setAssignData({...assignData, driverId: e.target.value})}>
                  <option value="">Select Driver</option>
                  {users.filter(u => u.role === UserRole.DRIVER && u.status === DriverStatus.AVAILABLE).map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 dark:text-slate-300">{t('vehicles')}</label>
                <select className="w-full px-4 py-2 border dark:bg-slate-950 dark:border-slate-800 dark:text-white rounded-xl outline-none" value={assignData.vehicleId} onChange={e => setAssignData({...assignData, vehicleId: e.target.value})}>
                  <option value="">Select Vehicle</option>
                  {vehicles.filter(v => v.status === VehicleStatus.ACTIVE).map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</option>
                  ))}
                </select>
              </div>
              <button onClick={handleAssign} disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all mt-4 flex items-center justify-center">
                {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;