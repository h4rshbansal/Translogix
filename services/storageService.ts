
import { User, Job, Vehicle, ActivityLog, UserRole, DriverStatus, VehicleStatus } from '../types';

const USERS_KEY = 'translogix_users';
const JOBS_KEY = 'translogix_jobs';
const VEHICLES_KEY = 'translogix_vehicles';
const LOGS_KEY = 'translogix_logs';

const INITIAL_USERS: User[] = [
  { id: '1', username: 'ishwar', password: 'ishwar@121', role: UserRole.ADMIN, status: 'Active', name: 'Ishwar Admin' },
];

const INITIAL_VEHICLES: Vehicle[] = [];

export const storageService = {
  getUsers: (): User[] => {
    const data = localStorage.getItem(USERS_KEY);
    if (!data) {
      localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(data);
  },
  saveUsers: (users: User[]) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  getJobs: (): Job[] => {
    const data = localStorage.getItem(JOBS_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveJobs: (jobs: Job[]) => localStorage.setItem(JOBS_KEY, JSON.stringify(jobs)),

  getVehicles: (): Vehicle[] => {
    const data = localStorage.getItem(VEHICLES_KEY);
    if (!data) {
      localStorage.setItem(VEHICLES_KEY, JSON.stringify(INITIAL_VEHICLES));
      return INITIAL_VEHICLES;
    }
    return JSON.parse(data);
  },
  saveVehicles: (vehicles: Vehicle[]) => localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles)),

  getLogs: (): ActivityLog[] => {
    const data = localStorage.getItem(LOGS_KEY);
    return data ? JSON.parse(data) : [];
  },
  addLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const logs = storageService.getLogs();
    const newLog: ActivityLog = {
      ...log,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(0, 500))); // Keep last 500
  }
};
