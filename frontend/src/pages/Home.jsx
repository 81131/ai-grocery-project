import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  // State to hold the chosen quantity for each product card
  const [quantities, setQuantities] = useState({});

  const mockProducts = [
    { id: 1, name: "Fresh Organic Apples", price: 450.00, image: "🍎", category: "Fruits" },
    { id: 2, name: "Whole Wheat Bread", price: 120.00, image: "🍞", category: "Bakery" },
    { id: 3, name: "Fresh Milk 1L", price: 300.00, image: "🥛", category: "Dairy" },
    { id: 4, name: "Ripe Bananas", price: 250.00, image: "🍌", category: "Fruits" },
  ];

  // Helper to safely increase/decrease numbers
  const changeQty = (productId, delta) => {
    setQuantities(prev => {
      const current = prev[productId] || 1;
      const next = current + delta;
      if (next < 1) return prev; // Prevent going below 1
      return { ...prev, [productId]: next };
    });
  };

  const handleAddToCart = async (productId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Please log in to add items to your cart!");
      navigate('/login');
      return;
    }

    const qtyToAdd = quantities[productId] || 1;

    try {
      const response = await fetch('http://localhost:8000/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ product_id: productId, quantity: qtyToAdd })
      });
      
      if (response.ok) {
        alert(`Added ${qtyToAdd} item(s) to cart! 🛒`);
        // Optional: Reset the quantity back to 1 after adding
        setQuantities(prev => ({ ...prev, [productId]: 1 }));
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
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '25px' }}>
        {mockProducts.map(product => {
          const currentQty = quantities[product.id] || 1;
          
          return (
            <div key={product.id} className="hover-card" style={{ 
              backgroundColor: 'white', borderRadius: '12px', padding: '25px', 
              textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.04)', border: '1px solid #eee'
            }}>
              <div style={{ fontSize: '60px', marginBottom: '15px' }}>{product.image}</div>
              <span style={{ fontSize: '12px', color: '#95a5a6', textTransform: 'uppercase', letterSpacing: '1px' }}>{product.category}</span>
              <h3 style={{ margin: '10px 0', fontSize: '18px', color: '#333' }}>{product.name}</h3>
              <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#4CAF50', margin: '10px 0' }}>
                Rs. {product.price.toFixed(2)}
              </p>

              {/* Quantity Selector */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', margin: '15px 0' }}>
                <button onClick={() => changeQty(product.id, -1)} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #ddd', backgroundColor: '#f9f9f9', fontSize: '16px' }}>-</button>
                <span style={{ fontWeight: 'bold', fontSize: '16px', width: '20px' }}>{currentQty}</span>
                <button onClick={() => changeQty(product.id, 1)} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #ddd', backgroundColor: '#f9f9f9', fontSize: '16px' }}>+</button>
              </div>

              <button 
                onClick={() => handleAddToCart(product.id)}
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
    </div>
  );
}

export default Home;