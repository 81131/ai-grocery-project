import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  const fetchAllOrders = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    const res = await fetch('http://localhost:8000/orders/all', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setOrders(data);
    }
  };

  useEffect(() => { fetchAllOrders(); }, [navigate]);

  const handleStatusChange = async (orderId, newStatus) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:8000/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus })
    });
    
    if (res.ok) {
      alert(`Order #${orderId} marked as ${newStatus}`);
      fetchAllOrders(); // Refresh the list
    }
  };

  return (
    <div>
      <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>Store Management Dashboard</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {orders.map(order => (
          <div key={order.id} style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: 'white', padding: '20px', borderRadius: '8px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: '5px solid #4CAF50'
          }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 5px 0' }}>Order #{order.id}</h3>
              <p style={{ margin: 0, color: '#7f8c8d' }}>Total: Rs. {order.total_amount.toFixed(2)}</p>
            </div>

            <div style={{ flex: 1, textAlign: 'center' }}>
              <span style={{ 
                backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '5px 12px', 
                borderRadius: '20px', fontWeight: 'bold', fontSize: '14px' 
              }}>
                Current: {order.current_status}
              </span>
            </div>

            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <select 
                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                defaultValue=""
                style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
              >
                <option value="" disabled>Update Status...</option>
                <option value="Processing">Processing</option>
                <option value="Packed">Packed</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminDashboard;