import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminInventory() {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  // We will build the backend endpoint for this next!
  const fetchInventory = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    try {
      const res = await fetch('http://localhost:8000/inventory/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Waiting for backend APIs to be built...", error);
    }
  };

  useEffect(() => { fetchInventory(); }, [navigate]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#2c3e50', margin: 0 }}>Inventory Management 📦</h2>
        <button style={{ backgroundColor: '#4CAF50', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          + Add New Product
        </button>
      </div>

      {/* Inventory Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eee' }}>
            <tr>
              <th style={{ padding: '15px', color: '#7f8c8d' }}>SKU</th>
              <th style={{ padding: '15px', color: '#7f8c8d' }}>Product Name</th>
              <th style={{ padding: '15px', color: '#7f8c8d' }}>Category</th>
              <th style={{ padding: '15px', color: '#7f8c8d' }}>Stock Available</th>
              <th style={{ padding: '15px', color: '#7f8c8d' }}>Unit</th>
              <th style={{ padding: '15px', color: '#7f8c8d' }}>Retail Price</th>
              <th style={{ padding: '15px', color: '#7f8c8d' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Fallback UI while API is missing */}
            {products.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#95a5a6' }}>
                  No products found. (Or backend API is not connected yet!)
                </td>
              </tr>
            ) : (
              products.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#34495e' }}>{item.sku}</td>
                  <td style={{ padding: '15px' }}>{item.product_name}</td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ backgroundColor: '#eef2f3', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                      {item.category_name}
                    </span>
                  </td>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: item.current_quantity > 10 ? '#27ae60' : '#e74c3c' }}>
                    {item.current_quantity}
                  </td>
                  <td style={{ padding: '15px', color: '#7f8c8d' }}>{item.unit_of_measure}</td>
                  <td style={{ padding: '15px' }}>Rs. {item.retail_price.toFixed(2)}</td>
                  <td style={{ padding: '15px' }}>
                    <button style={{ padding: '6px 12px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                      Update Stock
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminInventory;