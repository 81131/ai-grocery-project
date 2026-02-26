import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import Notifications from './pages/Notifications';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  
  // NEW: Add a state to track the user's role (defaulting to what's in localStorage)
  const [userRole, setUserRole] = useState(localStorage.getItem('role') || 'customer');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role'); // Clear the role on logout
    setIsLoggedIn(false);
    setUserRole('customer');
    window.location.href = '/'; 
  };

  return (
    <Router>
      <div>
        <nav style={{ 
          padding: '15px 40px', backgroundColor: '#ffffff', boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, zIndex: 1000
        }}>
          <Link to="/" style={{ color: '#4CAF50', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>🛒</span>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: '#2c3e50' }}>Ransara Fresh</h1>
          </Link>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', fontWeight: '500' }}>
            <Link to="/" style={{ color: '#555', textDecoration: 'none' }}>Home</Link>
            
            {isLoggedIn ? (
              <>
                <Link to="/cart" style={{ color: '#555', textDecoration: 'none' }}>My Cart</Link>
                <Link to="/orders" style={{ color: '#555', textDecoration: 'none' }}>Orders</Link>
                <Link to="/notifications" style={{ color: '#555', textDecoration: 'none' }}>🔔</Link>
                
                {/* NEW: Only show the Admin Dashboard if the user is actually an admin! */}
                {userRole === 'admin' && (
                  <Link to="/admin" style={{ color: '#e67e22', fontWeight: 'bold', textDecoration: 'none' }}>Dashboard</Link>
                )}
                
                <button onClick={handleLogout} style={{ backgroundColor: '#ff4757', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={{ color: '#555', textDecoration: 'none' }}>Login</Link>
                <Link to="/register" style={{ backgroundColor: '#4CAF50', color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '20px' }}>
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/orders" element={<Orders />} />
            
            {/* Pass the new setUserRole function to the Login page */}
            <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} setUserRole={setUserRole} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/notifications" element={<Notifications />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;