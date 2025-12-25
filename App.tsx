
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import Layout from './components/Layout';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import Jobs from './views/Jobs';
import Vehicles from './views/Vehicles';
import Drivers from './views/Drivers';
import Supervisors from './views/Supervisors';
import Users from './views/Users';
import ActivityLogs from './views/ActivityLogs';
import History from './views/History';
import { UserRole } from './types';

const PrivateRoute: React.FC<{ children: React.ReactNode, roles?: UserRole[] }> = ({ children, roles }) => {
  const { currentUser } = useAppContext();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { currentUser } = useAppContext();

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/jobs" element={<PrivateRoute><Jobs /></PrivateRoute>} />
          <Route path="/supervisors" element={<PrivateRoute roles={[UserRole.ADMIN]}><Supervisors /></PrivateRoute>} />
          <Route path="/users" element={<PrivateRoute roles={[UserRole.ADMIN]}><Users /></PrivateRoute>} />
          <Route path="/vehicles" element={<PrivateRoute roles={[UserRole.ADMIN]}><Vehicles /></PrivateRoute>} />
          <Route path="/drivers" element={<PrivateRoute roles={[UserRole.ADMIN]}><Drivers /></PrivateRoute>} />
          <Route path="/logs" element={<PrivateRoute roles={[UserRole.ADMIN]}><ActivityLogs /></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
