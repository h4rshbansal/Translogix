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
  refreshJobs: () => Promise<void>;
  vehicles: Vehicle[];
  refreshVehicles: () => Promise<void>;
  users: User[];
  refreshUsers: () => Promise<void>;
  logs: ActivityLog[];
  refreshLogs: () => Promise<void>;
  logout: () => void;
  t: (key: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<Language>('EN');
  const [theme, setTheme] = useState<Theme>('light');
  const [isInitialized, setIsInitialized] = useState(false);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    const initApp = async () => {
      try {
        const settings = await storageService.getAppSettings();
        if (settings) {
          setLanguage(settings.language);
          setTheme(settings.theme);
        }

        await Promise.all([
          refreshJobs(),
          refreshVehicles(),
          refreshUsers(),
          refreshLogs()
        ]);
        
        setIsInitialized(true);
      } catch (err) {
        console.error("Initialization failed:", err);
        setIsInitialized(true);
      }
    };
    initApp();
  }, []);

  const refreshJobs = async () => {
    const data = await storageService.getJobs();
    setJobs([...data]);
  };
  
  const refreshVehicles = async () => {
    const data = await storageService.getVehicles();
    setVehicles([...data]);
  };
  
  const refreshUsers = async () => {
    const data = await storageService.getUsers();
    setUsers([...data]);
  };
  
  const refreshLogs = async () => {
    const data = await storageService.getLogs();
    setLogs([...data]);
  };

  const handleSetLanguage = async (lang: Language) => {
    setLanguage(lang);
    await storageService.saveAppSettings({ language: lang, theme });
  };

  const handleSetTheme = async (newTheme: Theme) => {
    setTheme(newTheme);
    await storageService.saveAppSettings({ language, theme: newTheme });
  };

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

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser,
      language, setLanguage: handleSetLanguage,
      theme, setTheme: handleSetTheme,
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