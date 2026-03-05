import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Package, Truck, ShoppingCart, 
  MessageSquare, Bot, BarChart2, Settings, Search, Bell, ShoppingBag
} from 'lucide-react';

import AdminOrders from './AdminOrders';
import AdminInventory from './AdminInventory';
import AdminSuppliers from './AdminSuppliers';
import AdminDelivery from './AdminDelivery';
import AdminDashboard from './AdminDashboard'; 

function AdminPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  const navigate = useNavigate();

  const handleTabChange = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'inventory', label: 'Products & Inventory', icon: Package },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
    { id: 'chatbot', label: 'Chatbot Support', icon: Bot },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart2 },
    { id: 'delivery', label: 'Settings', icon: Settings }, 
  ];

  return (
    // FIX: Fixed positioning forces it to cover the entire screen, hiding the customer Navbar
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', backgroundColor: '#f9fafb', fontFamily: '"Inter", sans-serif' }}>
      
      {/* --- LEFT SIDEBAR --- */}
      <div style={{ width: '260px', backgroundColor: 'white', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
        
        {/* Logo Area */}
        <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ backgroundColor: '#10b981', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingBag color="white" size={20} />
          </div>
          <h2 style={{ margin: 0, color: '#111827', fontSize: '20px', fontWeight: 'bold' }}>Ransara</h2>
        </div>
        
        {/* Navigation Links */}
        <nav style={{ flex: 1, padding: '0 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                  width: '100%', border: 'none', borderRadius: '8px', cursor: 'pointer',
                  backgroundColor: isActive ? '#f0fdf4' : 'transparent',
                  color: isActive ? '#10b981' : '#4b5563', // Matches the exact green from mockup
                  fontWeight: isActive ? '600' : '500',
                  fontSize: '14px', textAlign: 'left', transition: 'all 0.2s ease'
                }}
              >
                <Icon size={20} color={isActive ? '#10b981' : '#6b7280'} strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* TOP HEADER */}
        <header style={{ height: '70px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px' }}>
          
          <div style={{ position: 'relative', width: '350px' }}>
            <Search size={18} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search..." 
              style={{ width: '100%', padding: '10px 10px 10px 40px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <Bell size={22} color="#4b5563" />
              <span style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#ef4444', color: 'white', fontSize: '10px', fontWeight: 'bold', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                3
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <div style={{ width: '36px', height: '36px', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                AD
              </div>
              <span style={{ fontWeight: '500', color: '#111827', fontSize: '14px' }}>Admin</span>
            </div>
          </div>
        </header>

        {/* DYNAMIC PAGE CONTENT */}
        <main style={{ flex: 1, padding: '30px', overflowY: 'auto', backgroundColor: '#f9fafb' }}>
          {activeTab === 'dashboard' && <AdminDashboard />}
          {activeTab === 'inventory' && <AdminInventory />}
          {activeTab === 'suppliers' && <AdminSuppliers />}
          {activeTab === 'orders' && <AdminOrders />}
          {activeTab === 'delivery' && <AdminDelivery />}
          
          {['users', 'feedback', 'chatbot', 'reports'].includes(activeTab) && (
            <div style={{ textAlign: 'center', marginTop: '100px', color: '#6b7280' }}>
              <h2>Coming Soon</h2>
              <p>The {activeTab} module is currently under development.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminPanel;