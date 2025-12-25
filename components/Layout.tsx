
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { UserRole } from '../types';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  ClipboardList, 
  History, 
  LogOut, 
  Menu, 
  X,
  Languages,
  Activity,
  Sun,
  Moon,
  UserCheck,
  Briefcase
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout, language, setLanguage, theme, setTheme, t } = useAppContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  if (!currentUser) return <div className="dark:bg-slate-950 min-h-screen">{children}</div>;

  const menuItems = [
    { 
      label: t('dashboard'), 
      path: '/', 
      icon: <LayoutDashboard size={20} />, 
      roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.DRIVER] 
    },
    { 
      label: t('jobs'), 
      path: '/jobs', 
      icon: <ClipboardList size={20} />, 
      roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.DRIVER] 
    },
    { 
      label: t('supervisors'), 
      path: '/supervisors', 
      icon: <Briefcase size={20} />, 
      roles: [UserRole.ADMIN] 
    },
    { 
      label: t('drivers'), 
      path: '/drivers', 
      icon: <Users size={20} />, 
      roles: [UserRole.ADMIN] 
    },
    { 
      label: t('vehicles'), 
      path: '/vehicles', 
      icon: <Truck size={20} />, 
      roles: [UserRole.ADMIN] 
    },
    { 
      label: t('users'), 
      path: '/users', 
      icon: <UserCheck size={20} />, 
      roles: [UserRole.ADMIN] 
    },
    { 
      label: t('logs'), 
      path: '/logs', 
      icon: <Activity size={20} />, 
      roles: [UserRole.ADMIN] 
    },
    { 
      label: t('history'), 
      path: '/history', 
      icon: <History size={20} />, 
      roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.DRIVER] 
    },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(currentUser.role));

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-200">
      {/* Sidebar - Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 md:translate-x-0 md:static ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center space-x-2 text-blue-400 font-bold text-2xl mb-8">
            <Truck size={32} />
            <span>TransLogix</span>
          </div>
          <nav className="space-y-1">
            {filteredItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === item.path ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="absolute bottom-0 w-64 p-6 border-t border-slate-800">
          <button 
            onClick={logout}
            className="flex items-center space-x-3 px-4 py-3 w-full text-left text-slate-400 hover:bg-red-600/10 hover:text-red-500 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 flex-shrink-0 z-40 transition-colors duration-200">
          <div className="flex items-center">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <Menu size={24} />
            </button>
            <h1 className="ml-4 font-semibold text-slate-800 dark:text-slate-100 text-lg hidden sm:block">
              {currentUser.role} {t('dashboard')}
            </h1>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <button 
              onClick={toggleTheme}
              className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title={t('themeToggle')}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <button 
              onClick={() => setLanguage(language === 'EN' ? 'HI' : 'EN')}
              className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
            >
              <Languages size={16} />
              <span className="hidden sm:inline">{language === 'EN' ? 'हिंदी' : 'English'}</span>
              <span className="sm:hidden">{language === 'EN' ? 'HI' : 'EN'}</span>
            </button>
            
            <div className="flex items-center space-x-3 border-l pl-4 border-slate-200 dark:border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-none">{currentUser.name}</p>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{currentUser.role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                {currentUser.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>

        <footer className="h-10 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400 flex-shrink-0 transition-colors duration-200">
          {t('madeBy')}
        </footer>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}
    </div>
  );
};

export default Layout;
