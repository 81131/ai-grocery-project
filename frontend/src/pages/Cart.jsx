import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Cart() {
  const [cartData, setCartData] = useState({ items: [], total: 0 });
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const navigate = useNavigate();

  const fetchCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    const res = await fetch('http://localhost:8000/cart/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setCartData(data);
    }
  };

  useEffect(() => { fetchCart(); }, []);

  const updateQuantity = async (productId, newQuantity) => {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:8000/cart/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ product_id: productId, quantity: newQuantity })
    });
    fetchCart();
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:8000/orders/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ customer_name: customerName, delivery_address: address })
    });

    if (res.ok) {
      alert("Order placed successfully! 🎉");
      navigate('/orders');
    } else {
      const err = await res.json();
      alert("Checkout failed: " + err.detail);
    }
  };

  if (cartData.items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h2 style={{ fontSize: '30px', color: '#2c3e50' }}>Your cart is empty</h2>
        <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>Looks like you haven't added anything yet.</p>
        <button onClick={() => navigate('/')} style={{ padding: '12px 24px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ color: '#2c3e50', marginBottom: '30px' }}>Shopping Cart</h2>
      
      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        {/* LEFT COLUMN: Cart Items */}
        <div style={{ flex: '1 1 600px', backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          {cartData.items.map(item => (
            <div key={item.item_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ flex: 2 }}>
                <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>{item.name}</h4>
                <p style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>Rs. {item.price.toFixed(2)} each</p>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, justifyContent: 'center' }}>
                <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #ddd', backgroundColor: 'white' }}>-</button>
                <span style={{ fontWeight: 'bold' }}>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #ddd', backgroundColor: 'white' }}>+</button>
              </div>
              
              <div style={{ flex: 1, textAlign: 'right', fontWeight: 'bold', color: '#2c3e50' }}>
                Rs. {item.subtotal.toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT COLUMN: Checkout Panel */}
        <div style={{ flex: '1 1 350px', backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', position: 'sticky', top: '100px' }}>
          <h3 style={{ margin: '0 0 20px 0', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Order Summary</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '18px' }}>
            <span>Subtotal</span>
            <span>Rs. {cartData.total.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '18px' }}>
            <span>Delivery</span>
            <span style={{ color: '#4CAF50' }}>Free</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', fontSize: '22px', fontWeight: 'bold', borderTop: '2px solid #eee', paddingTop: '15px' }}>
            <span>Total</span>
            <span>Rs. {cartData.total.toFixed(2)}</span>
          </div>

          <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="text" placeholder="Full Name" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
            <input type="text" placeholder="Delivery Address" required value={address} onChange={(e) => setAddress(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
            <button type="submit" style={{ padding: '15px', backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', marginTop: '10px' }}>
              Confirm & Pay
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default Cart;