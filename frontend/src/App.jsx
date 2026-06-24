import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Chat from './components/Chat';
import FakeScreen from './components/FakeScreen';
import { useState } from 'react';

const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const [isFake, setIsFake] = useState(
    localStorage.getItem('emergency_active') === 'true'
  );

  const activateFake = () => {
    localStorage.setItem('emergency_active', 'true');
    setIsFake(true);
  };

  const deactivateFake = () => {
    localStorage.removeItem('emergency_active');
    setIsFake(false);
  };

  if (isFake) {
    return <FakeScreen onUnlock={deactivateFake} />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/chat"
        element={
          <PrivateRoute>
            <Chat onEmergency={activateFake} />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;