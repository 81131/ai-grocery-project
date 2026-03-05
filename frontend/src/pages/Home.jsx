import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { useToast } from '../context/ToastContext'; // Assuming you added the toast!

// --- SKELETON COMPONENT ---
// This mimics the exact layout of your real product card
const ProductSkeleton = () => (
  <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
    <div className="skeleton skeleton-img"></div>
    <div className="skeleton skeleton-text short" style={{ height: '12px' }}></div>
    <div className="skeleton skeleton-text title"></div>
    <div className="skeleton skeleton-text short" style={{ marginTop: '10px', height: '22px' }}></div>
    
    <div style={{ display: 'flex', gap: '15px', margin: '15px 0', marginTop: 'auto' }}>
       <div className="skeleton skeleton-btn" style={{ flex: 1 }}></div>
    </div>
    <div style={{ display: 'flex', gap: '10px' }}>
      <div className="skeleton skeleton-btn" style={{ flex: 1 }}></div>
      <div className="skeleton skeleton-btn" style={{ flex: 2 }}></div>
    </div>
  </div>
);

function Home() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [quantities, setQuantities] = useState({});
  const [storeItems, setStoreItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // NEW: Loading state

  useEffect(() => {
    const fetchStorefront = async () => {
      try {
        const res = await fetch('http://localhost:8000/inventory/storefront');
        if (res.ok) setStoreItems(await res.json());
      } catch (error) { 
        console.error("Failed to fetch store items:", error); 
        addToast("Failed to load products. Please try again.", "error");
      } finally {
        // Whether it succeeds or fails, stop loading
        setIsLoading(false);
      }
    };
    fetchStorefront();
  }, [addToast]);

  const changeQty = (groupKey, delta, maxAvailable) => {
    setQuantities(prev => {
      const current = prev[groupKey] || 1;
      const next = current + delta;
      if (next < 1 || next > maxAvailable) return prev; 
      return { ...prev, [groupKey]: next };
    });
  };

  const handleAddToCart = async (item) => {
    const token = localStorage.getItem('token');
    if (!token) {
      addToast("Please log in to add items to your cart!", "info");
      navigate('/login');
      return;
    }
    const qtyToAdd = quantities[item.group_key] || 1;
    try {
      const response = await fetch('http://localhost:8000/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ batch_id: item.primary_batch_id, quantity: qtyToAdd })
      });
      if (response.ok) {
        addToast(`Added ${qtyToAdd} ${item.product_name} to cart!`, "success");
        setQuantities(prev => ({ ...prev, [item.group_key]: 1 })); 
      } else {
        const err = await response.json();
        addToast("Failed to add to cart: " + err.detail, "error");
      }
    } catch (error) { 
      console.error("Failed to add to cart:", error); 
    }
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 className="text-title" style={{ fontSize: '36px', marginBottom: '10px' }}>Fresh Groceries, Delivered.</h2>
        <p className="text-subtitle" style={{ fontSize: '18px' }}>Quality ingredients for your daily needs.</p>
      </div>
      
      {/* GRID LAYOUT REMAINS THE SAME */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '25px' }}>
        
        {/* CONDITIONAL RENDERING */}
        {isLoading ? (
          /* Render 8 Skeletons to fill the screen while loading */
          Array.from({ length: 8 }).map((_, index) => <ProductSkeleton key={index} />)
        ) : storeItems.length === 0 ? (
          /* Empty state if loading finished but no products exist */
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
            <ShoppingCart size={48} style={{ opacity: 0.5, marginBottom: '15px' }} />
            <h3>No products available right now.</h3>
            <p>Please check back later!</p>
          </div>
        ) : (
          /* Render actual product cards */
          storeItems.map(item => {
            const currentQty = quantities[item.group_key] || 1;
            return (
              <div key={item.group_key} className="card hover-card" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
                <div style={{ cursor: 'pointer' }} onClick={() => navigate(`/product/${item.primary_batch_id}`, { state: item })}>
                  <img src={item.image} alt={item.product_name} style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: '15px', backgroundColor: 'var(--bg-muted)' }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>{item.category}</span>
                  <h3 className="text-title" style={{ margin: '10px 0 5px 0', fontSize: '18px' }}>{item.product_name}</h3>
                </div>

                <p style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-primary)', margin: '10px 0' }}>
                  Rs. {item.price.toFixed(2)}
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 'normal' }}> / {item.unit}</span>
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', margin: '15px 0', marginTop: 'auto' }}>
                  <button onClick={() => changeQty(item.group_key, -1, item.available_qty)} className="btn btn-secondary" style={{ padding: '8px' }}><Minus size={16} /></button>
                  <span style={{ fontWeight: 'bold', fontSize: '16px', minWidth: '24px', textAlign: 'center' }}>{currentQty}</span>
                  <button onClick={() => changeQty(item.group_key, 1, item.available_qty)} className="btn btn-secondary" style={{ padding: '8px' }}><Plus size={16} /></button>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => navigate(`/product/${item.primary_batch_id}`, { state: item })} className="btn btn-secondary" style={{ flex: 1 }}>View</button>
                  <button onClick={() => handleAddToCart(item)} className="btn btn-primary" style={{ flex: 2 }}>
                    <ShoppingCart size={18} /> Add
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Home;