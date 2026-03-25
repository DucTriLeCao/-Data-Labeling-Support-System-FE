import { useState, useEffect } from 'react';
import Login from './components/Login';
import ManagerLayout from './components/Manager/ManagerLayout';
import AnnotatorLayout from './components/annotator/AnnotatorLayout';
import ReviewerLayout from './components/Reviewer/ReviewerLayout';
import AdminLayout from './components/Admin/AdminLayout';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // If logged in, show appropriate dashboard based on role
  if (user) {
    const role = user.role?.toLowerCase();
    if (role === 'admin') {
      return <AdminLayout user={user} onLogout={handleLogout} />;
    }
    if (role === 'manager') {
      return <ManagerLayout user={user} onLogout={handleLogout} />;
    }
    if (role === 'annotator') {
      return <AnnotatorLayout user={user} onLogout={handleLogout} />;
    }
    if (role === 'reviewer') {
      return <ReviewerLayout user={user} onLogout={handleLogout} />;
    }
  }

  return (
    <Login 
      onLoginSuccess={handleLoginSuccess}
    />
  );
}

export default App;
