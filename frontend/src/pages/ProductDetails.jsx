import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function ProductDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const item = location.state; // We will pass the item data directly from Home.jsx
  const [quantity, setQuantity] = useState(1);

  // If someone navigates here directly without data, send them back home
  if (!item) {
    navigate('/');
    return null;
  }

  const handleAddToCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Please log in to add items to your cart!");
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ batch_id: item.primary_batch_id, quantity: quantity })
      });
      
      if (response.ok) {
        alert(`Added ${quantity} ${item.product_name} to cart! 🛒`);
      }
    } catch (error) {
      console.error("Failed to add to cart:", error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.product_name,
          text: `Check out ${item.product_name} for just Rs. ${item.price} at our store!`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing', error);
      }
    } else {
      // Fallback for desktop browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert("Product link copied to clipboard!");
    }
  };

  // Parse keywords safely
  const keywordList = item.keywords ? item.keywords.split(',').map(k => k.trim()) : [];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', fontSize: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '5px' }}>
        ← Back to Store
      </button>

      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', backgroundColor: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        
        {/* Left: Image */}
        <div style={{ flex: '1 1 400px' }}>
          <img 
            src={item.image} 
            alt={item.product_name} 
            style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: '12px', border: '1px solid #eee' }} 
          />
        </div>

        {/* Right: Details */}
        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '13px', color: '#95a5a6', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
            {item.category}
          </span>
          
          <h1 style={{ margin: '10px 0', color: '#2c3e50', fontSize: '32px' }}>{item.product_name}</h1>
          
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#4CAF50', margin: '10px 0 20px 0' }}>
            Rs. {item.price.toFixed(2)}
            <span style={{ fontSize: '16px', color: '#7f8c8d', fontWeight: 'normal' }}> / {item.unit}</span>
          </p>

          <p style={{ color: '#555', lineHeight: '1.6', marginBottom: '20px' }}>
            High-quality {item.product_name} sourced from our trusted suppliers. 
            Currently, we have <strong>{item.available_qty} {item.unit}</strong> in stock ready for delivery or pickup.
          </p>

          {/* Keywords Display */}
          {keywordList.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '30px' }}>
              {keywordList.map((kw, i) => (
                <span key={i} style={{ backgroundColor: '#eef2f5', color: '#34495e', padding: '4px 10px', borderRadius: '20px', fontSize: '12px' }}>
                  {kw}
                </span>
              ))}
            </div>
          )}

          {/* Cart Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: 'auto', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ padding: '12px 20px', border: 'none', backgroundColor: '#f9f9f9', cursor: 'pointer', fontSize: '18px' }}>-</button>
              <span style={{ padding: '0 20px', fontWeight: 'bold', fontSize: '18px' }}>{quantity}</span>
              <button onClick={() => setQuantity(Math.min(item.available_qty, quantity + 1))} style={{ padding: '12px 20px', border: 'none', backgroundColor: '#f9f9f9', cursor: 'pointer', fontSize: '18px' }}>+</button>
            </div>

            <button onClick={handleAddToCart} style={{ flex: 1, padding: '15px 30px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              Add to Cart
            </button>
            
            <button onClick={handleShare} style={{ padding: '15px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Share this product">
              ↗️
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ProductDetails;