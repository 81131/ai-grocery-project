import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, ShoppingCart, Package, Users, AlertTriangle, Loader2, CheckCircle, Clock } from 'lucide-react';

function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [salesData, setSalesData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, totalProducts: 0, activeUsers: 0 });

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      try {
        const response = await fetch('http://localhost:8000/orders/dashboard-stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
          setRecentOrders(data.recentOrders);
          setLowStockItems(data.lowStockItems);
          setSalesData(data.salesData);
          setCategoryData(data.categoryData);
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchDashboardData();
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#6b7280' }}>
        <Loader2 className="lucide-spin" size={40} style={{ animation: 'spin 1s linear infinite', marginBottom: '15px' }} />
        <p>Crunching the latest numbers...</p>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '40px', fontFamily: '"Inter", sans-serif' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 5px 0', color: '#111827', fontSize: '28px', fontWeight: 'bold' }}>Dashboard</h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '15px' }}>Welcome back! Here's what's happening with your store today.</p>
      </div>

      {/* --- STATS ROW --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#4b5563', fontSize: '14px', fontWeight: '500' }}>Total Revenue</h3>
            <DollarSign color="#10b981" size={20} />
          </div>
          <h2 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '28px', fontWeight: 'bold' }}>Rs. {stats.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
          <span style={{ color: '#10b981', fontSize: '13px', fontWeight: '500' }}>↗ Lifetime Revenue</span>
        </div>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#4b5563', fontSize: '14px', fontWeight: '500' }}>Total Orders</h3>
            <ShoppingCart color="#3b82f6" size={20} />
          </div>
          <h2 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '28px', fontWeight: 'bold' }}>{stats.totalOrders}</h2>
          <span style={{ color: '#9ca3af', fontSize: '13px' }}>All time orders</span>
        </div>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <h3 style={{ margin: '0', color: '#4b5563', fontSize: '14px', fontWeight: '500' }}>Total Products</h3>
            <Package color="#f97316" size={20} />
          </div>
          <h2 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '28px', fontWeight: 'bold' }}>{stats.totalProducts}</h2>
          <span style={{ color: '#9ca3af', fontSize: '13px' }}>Active product listings</span>
        </div>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#4b5563', fontSize: '14px', fontWeight: '500' }}>Active Users</h3>
            <Users color="#a855f7" size={20} />
          </div>
          <h2 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '28px', fontWeight: 'bold' }}>{stats.activeUsers}</h2>
          <span style={{ color: '#9ca3af', fontSize: '13px' }}>Users with placed orders</span>
        </div>

      </div>

      {/* --- BOTTOM ROW (Orders & Low Stock matching mockup) --- */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
        
        {/* Recent Orders */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 5px 0', color: '#111827', fontSize: '16px', fontWeight: 'bold' }}>Recent Orders</h3>
          <p style={{ margin: '0 0 20px 0', color: '#6b7280', fontSize: '14px' }}>Latest customer orders</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentOrders.length > 0 ? (
              recentOrders.map((order, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: '600', color: '#111827', fontSize: '14px' }}>{order.id}</span>
                      <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '500', color: order.color, backgroundColor: order.bg, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {order.status === 'Delivered' ? <CheckCircle size={12} /> : <Clock size={12} />}
                        {order.status}
                      </span>
                    </div>
                    <div style={{ color: '#4b5563', fontSize: '14px', marginBottom: '2px' }}>{order.name}</div>
                    <div style={{ color: '#9ca3af', fontSize: '12px' }}>{order.time}</div>
                  </div>
                  <div style={{ fontWeight: 'bold', color: '#111827', fontSize: '16px' }}>{order.total}</div>
                </div>
              ))
            ) : (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>No recent orders to display.</p>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 5px 0', color: '#111827', fontSize: '16px', fontWeight: 'bold' }}>Low Stock Alert</h3>
          <p style={{ margin: '0 0 20px 0', color: '#6b7280', fontSize: '14px' }}>Items running low on inventory</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fee2e2' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <AlertTriangle color="#ef4444" size={20} style={{ marginTop: '2px' }} />
                    <div>
                      <div style={{ color: '#111827', fontWeight: '600', fontSize: '14px', marginBottom: '2px' }}>{item.name}</div>
                      <div style={{ color: '#6b7280', fontSize: '12px' }}>{item.cat}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '14px', marginBottom: '2px' }}>{item.qty} units</div>
                    <div onClick={() => navigate('/admin?tab=inventory')} style={{ color: '#9ca3af', fontSize: '12px', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color='#ef4444'} onMouseLeave={e => e.target.style.color='#9ca3af'}>
                      Reorder now
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>Inventory levels are healthy.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminDashboard;