import React from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminOrders from './AdminOrders';
import AdminInventory from './AdminInventory';
import AdminSuppliers from './AdminSuppliers';
import AdminDelivery from './AdminDelivery'; 

function AdminPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'orders';

  const getTabStyle = (tabName) => ({
    padding: '15px 20px',
    cursor: 'pointer',
    backgroundColor: activeTab === tabName ? '#eef2f5' : 'transparent',
    color: activeTab === tabName ? '#2c3e50' : '#7f8c8d',
    fontWeight: activeTab === tabName ? 'bold' : 'normal',
    borderLeft: activeTab === tabName ? '4px solid #4CAF50' : '4px solid transparent',
    transition: 'all 0.2s ease'
  });

  const handleTabChange = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', position: 'absolute', top: 0, left: 0, paddingTop: '75px', backgroundColor: '#fafbfc', overflow: 'hidden' }}>
      
      {/* SIDEBAR */}
      <div style={{ width: '250px', backgroundColor: '#fdfdfd', borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
          <h3 style={{ margin: 0, color: '#2c3e50' }}>Admin Suite</h3>
          <p style={{ margin: 0, fontSize: '12px', color: '#95a5a6' }}>Management Console</p>
        </div>
        
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li style={getTabStyle('orders')} onClick={() => handleTabChange('orders')}>📦 Order Fulfillment</li>
          <li style={getTabStyle('inventory')} onClick={() => handleTabChange('inventory')}>🛒 Inventory & Products</li>
          <li style={getTabStyle('suppliers')} onClick={() => handleTabChange('suppliers')}>🏢 Supplier Directory</li>
          {/* NEW TAB */}
          <li style={getTabStyle('delivery')} onClick={() => handleTabChange('delivery')}>🚚 Delivery Settings</li>
        </ul>
      </div>

      {/* DYNAMIC MAIN CONTENT */}
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        {activeTab === 'orders' && <AdminOrders />}
        {activeTab === 'inventory' && <AdminInventory />}
        {activeTab === 'suppliers' && <AdminSuppliers />}
        {activeTab === 'delivery' && <AdminDelivery />} {/* NEW PANEL */}
      </div>

    </div>
  );
}

export default AdminPanel;