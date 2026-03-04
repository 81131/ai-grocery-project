import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  const [quantities, setQuantities] = useState({});
  const [storeItems, setStoreItems] = useState([]); // NEW: State for database items

  // Fetch real batches from the backend
  useEffect(() => {
    const fetchStorefront = async () => {
      try {
        const res = await fetch('http://localhost:8000/inventory/storefront');
        if (res.ok) setStoreItems(await res.json());
      } catch (error) {
        console.error("Failed to fetch store items:", error);
      }
    };
    fetchStorefront();
  }, []);

  const changeQty = (batchId, delta, maxAvailable) => {
    setQuantities(prev => {
      const current = prev[batchId] || 1;
      const next = current + delta;
      if (next < 1) return prev; 
      if (next > maxAvailable) return prev; // Prevent adding more than in stock
      return { ...prev, [batchId]: next };
    });
  };

  const handleAddToCart = async (item) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Please log in to add items to your cart!");
      navigate('/login');
      return;
    }

    const qtyToAdd = quantities[item.batch_id] || 1;

    try {
      // NOTE: We pass product_id to not break your cart.py, but ideally, 
      // your cart should be updated to track batch_id in the future!
      const response = await fetch('http://localhost:8000/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ product_id: item.product_id, quantity: qtyToAdd })
      });
      
      if (response.ok) {
        alert(`Added ${qtyToAdd} ${item.product_name} to cart! 🛒`);
        setQuantities(prev => ({ ...prev, [item.batch_id]: 1 }));
      }
    } catch (error) {
      console.error("Failed to add to cart:", error);
    }
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '36px', color: '#2c3e50', marginBottom: '10px' }}>Fresh Groceries, Delivered.</h2>
        <p style={{ color: '#7f8c8d', fontSize: '18px' }}>Quality ingredients for your daily needs.</p>
      </div>
      
      {storeItems.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#95a5a6' }}>Loading fresh products...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '25px' }}>
          {storeItems.map(item => {
            const currentQty = quantities[item.batch_id] || 1;
            
            return (
              <div key={item.batch_id} className="hover-card" style={{ 
                backgroundColor: 'white', borderRadius: '12px', padding: '20px', 
                textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.04)', border: '1px solid #eee',
                display: 'flex', flexDirection: 'column'
              }}>
                {/* Image Display with forced perfect square */}
                <img 
                  src={item.image} 
                  alt={item.product_name} 
                  style={{ 
                    width: '100%', 
                    aspectRatio: '1 / 1', 
                    objectFit: 'cover', 
                    borderRadius: '8px', 
                    marginBottom: '15px',
                    backgroundColor: '#f8f9fa'
                  }} 
                />
                
                <span style={{ fontSize: '12px', color: '#95a5a6', textTransform: 'uppercase', letterSpacing: '1px' }}>{item.category}</span>
                <h3 style={{ margin: '10px 0 5px 0', fontSize: '18px', color: '#333' }}>{item.product_name}</h3>
                
                {/* Batch Number badge for clarity */}
                <span style={{ fontSize: '11px', backgroundColor: '#eef2f5', padding: '3px 6px', borderRadius: '4px', color: '#7f8c8d', alignSelf: 'center' }}>
                  Batch: {item.batch_number}
                </span>

                <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#4CAF50', margin: '10px 0' }}>
                  Rs. {item.price.toFixed(2)}
                  <span style={{ fontSize: '14px', color: '#95a5a6', fontWeight: 'normal' }}> / {item.unit}</span>
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', margin: '15px 0', marginTop: 'auto' }}>
                  <button onClick={() => changeQty(item.batch_id, -1, item.available_qty)} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #ddd', backgroundColor: '#f9f9f9', fontSize: '16px', cursor: 'pointer' }}>-</button>
                  <span style={{ fontWeight: 'bold', fontSize: '16px', width: '20px' }}>{currentQty}</span>
                  <button onClick={() => changeQty(item.batch_id, 1, item.available_qty)} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #ddd', backgroundColor: '#f9f9f9', fontSize: '16px', cursor: 'pointer' }}>+</button>
                </div>

                <button 
                  onClick={() => handleAddToCart(item)}
                  style={{ 
                    width: '100%', backgroundColor: '#4CAF50', color: 'white', 
                    padding: '12px', border: 'none', borderRadius: '8px', 
                    cursor: 'pointer', fontWeight: 'bold', fontSize: '15px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
                >
                  Add to Cart
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Home;