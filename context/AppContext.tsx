
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Job, Vehicle, ActivityLog, Language, UserRole, Theme } from '../types';
import { storageService } from '../services/storageService';
import { TRANSLATIONS } from '../constants';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  jobs: Job[];
  refreshJobs: () => void;
  vehicles: Vehicle[];
  refreshVehicles: () => void;
  users: User[];
  refreshUsers: () => void;
  logs: ActivityLog[];
  refreshLogs: () => void;
  logout: () => void;
  t: (key: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('translogix_auth');
    return saved ? JSON.parse(saved) : null;
  });
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('translogix_lang');
    return (saved as Language) || 'EN';
  });
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('translogix_theme');
    return (saved as Theme) || 'light';
  });

  const [jobs, setJobs] = useState<Job[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  const refreshJobs = () => setJobs(storageService.getJobs());
  const refreshVehicles = () => setVehicles(storageService.getVehicles());
  const refreshUsers = () => setUsers(storageService.getUsers());
  const refreshLogs = () => setLogs(storageService.getLogs());

  useEffect(() => {
    refreshJobs();
    refreshVehicles();
    refreshUsers();
    refreshLogs();
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('translogix_auth', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('translogix_auth');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('translogix_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('translogix_theme', theme);
  }, [theme]);

  const logout = () => {
    if (currentUser) {
      storageService.addLog({
        userId: currentUser.id,
        userName: currentUser.name,
        role: currentUser.role,
        action: 'Logged out'
      });
    }
    setCurrentUser(null);
  };

  const t = (key: string): string => {
    const translation = (TRANSLATIONS[language] as any)[key];
    return translation || key;
  };

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser,
      language, setLanguage,
      theme, setTheme,
      jobs, refreshJobs,
      vehicles, refreshVehicles,
      users, refreshUsers,
      logs, refreshLogs,
      logout, t
    }}>
      <div className={theme === 'dark' ? 'dark' : ''}>
        {children}
      </div>
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
