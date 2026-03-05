import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Cart() {
  const [cartData, setCartData] = useState({ items: [], total: 0 });
  const [customerName, setCustomerName] = useState('');
  
  // Logistics & Delivery States
  const [deliveryType, setDeliveryType] = useState('Home Delivery');
  const [address, setAddress] = useState('');
  const [distanceKm, setDistanceKm] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [totalWeight, setTotalWeight] = useState(0);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);
  
  // Payment States
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentSlip, setPaymentSlip] = useState(null);
  
  const navigate = useNavigate();

  const fetchCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    const res = await fetch('http://localhost:8000/cart/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      setCartData(await res.json());
    }
  };

  useEffect(() => { fetchCart(); }, []);

  // --- NEW: Calculate Delivery Fee whenever variables change ---
  useEffect(() => {
    const calculateFee = async () => {
      const token = localStorage.getItem('token');
      if (!token || cartData.items.length === 0) return;

      setIsCalculatingFee(true);
      try {
        const res = await fetch('http://localhost:8000/orders/calculate-fee', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            delivery_type: deliveryType,
            distance_km: parseFloat(distanceKm) || 0
          })
        });

        if (res.ok) {
          const data = await res.json();
          setDeliveryFee(data.fee);
          setTotalWeight(data.total_weight);
        }
      } catch (err) {
        console.error("Failed to calculate fee", err);
      } finally {
        setIsCalculatingFee(false);
      }
    };

    // Debounce distance input to prevent spamming the API while typing
    const delayDebounceFn = setTimeout(() => {
      calculateFee();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [cartData.items, deliveryType, distanceKm]);

  const updateQuantity = async (batchId, newQuantity) => {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:8000/cart/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ batch_id: batchId, quantity: newQuantity })
    });
    fetchCart();
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    if (deliveryType === 'Home Delivery' && !address.trim()) {
      alert("Please provide a delivery address."); return;
    }
    if (paymentMethod === 'Bank Transfer' && !paymentSlip) {
      alert("Please upload your bank transfer payment slip to proceed."); return;
    }

    const formData = new FormData();
    formData.append('customer_name', customerName);
    formData.append('delivery_type', deliveryType);
    if (deliveryType === 'Home Delivery') {
      formData.append('delivery_address', address);
      formData.append('distance_km', distanceKm || 0);
    }
    formData.append('payment_method', paymentMethod);
    if (paymentMethod === 'Bank Transfer' && paymentSlip) formData.append('payment_slip', paymentSlip);

    const res = await fetch('http://localhost:8000/orders/checkout', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }, 
      body: formData
    });

    if (res.ok) {
      alert(paymentMethod === 'PayHere' ? "Redirecting to PayHere..." : "Order placed successfully! 🎉");
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
        <button onClick={() => navigate('/')} style={{ padding: '12px 24px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>Start Shopping</button>
      </div>
    );
  }

  // Calculate the Grand Total
  const grandTotal = cartData.total + deliveryFee;

  return (
    <div>
      <h2 style={{ color: '#2c3e50', marginBottom: '30px' }}>Shopping Cart</h2>
      
      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        {/* LEFT COLUMN: Cart Items */}
        <div style={{ flex: '1 1 600px', backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          {cartData.items.map(item => (
            <div key={item.item_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 2 }}>
                <img src={item.image} alt={item.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                <div>
                  <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>{item.name}</h4>
                  <p style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>Rs. {item.price.toFixed(2)} each</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, justifyContent: 'center' }}>
                <button onClick={() => updateQuantity(item.batch_id, item.quantity - 1)} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer' }}>-</button>
                <span style={{ fontWeight: 'bold' }}>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.batch_id, item.quantity + 1)} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer' }}>+</button>
              </div>
              <div style={{ flex: 1, textAlign: 'right', fontWeight: 'bold', color: '#2c3e50' }}>Rs. {item.subtotal.toFixed(2)}</div>
            </div>
          ))}
          <div style={{ padding: '15px 0', color: '#7f8c8d', fontSize: '14px', textAlign: 'right' }}>
            Estimated Package Weight: <strong>{totalWeight.toFixed(2)} KG</strong>
          </div>
        </div>

        {/* RIGHT COLUMN: Checkout Panel */}
        <div style={{ flex: '1 1 350px', backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', position: 'sticky', top: '100px' }}>
          <h3 style={{ margin: '0 0 20px 0', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Order Summary</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '16px' }}>
            <span>Items Subtotal</span>
            <span>Rs. {cartData.total.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '16px' }}>
            <span>Delivery Fee</span>
            {isCalculatingFee ? <span style={{ color: '#f39c12' }}>Calculating...</span> : <span>Rs. {deliveryFee.toFixed(2)}</span>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', fontSize: '22px', fontWeight: 'bold', borderTop: '2px solid #eee', paddingTop: '15px' }}>
            <span>Total</span>
            <span>Rs. {grandTotal.toFixed(2)}</span>
          </div>

          <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="text" placeholder="Full Name" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
            
            {/* NEW: Delivery / Pickup Selector */}
            <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #eee' }}>
              <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#34495e', display: 'block', marginBottom: '10px' }}>Fulfillment Method</label>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input type="radio" value="Home Delivery" checked={deliveryType === 'Home Delivery'} onChange={(e) => setDeliveryType(e.target.value)} /> Home Delivery
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input type="radio" value="Store Pickup" checked={deliveryType === 'Store Pickup'} onChange={(e) => setDeliveryType(e.target.value)} /> Store Pickup
                </label>
              </div>

              {deliveryType === 'Home Delivery' && (
                <>
                  <input type="text" placeholder="Delivery Address" required value={address} onChange={(e) => setAddress(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box', marginBottom: '10px' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="number" step="0.1" placeholder="Est. Distance (KM)" required value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', flex: 1 }} title="Enter distance for accurate fee calculation" />
                  </div>
                </>
              )}
            </div>
            
            {/* PAYMENT METHOD SELECTOR */}
            <div>
              <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#34495e', display: 'block', marginBottom: '10px' }}>Payment Method</label>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input type="radio" value="Bank Transfer" checked={paymentMethod === 'Bank Transfer'} onChange={(e) => setPaymentMethod(e.target.value)} /> Bank Transfer
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input type="radio" value="PayHere" checked={paymentMethod === 'PayHere'} onChange={(e) => setPaymentMethod(e.target.value)} /> PayHere
                </label>
              </div>

              {paymentMethod === 'Bank Transfer' && (
                <div style={{ backgroundColor: '#fcf8e3', padding: '15px', borderRadius: '8px', border: '1px dashed #d8c383' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#856404' }}>
                    Please transfer <strong>Rs. {grandTotal.toFixed(2)}</strong> to Account: 123456789 (BOC).
                  </p>
                  <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setPaymentSlip(e.target.files[0])} style={{ fontSize: '13px', width: '100%' }} />
                </div>
              )}
            </div>

            <button type="submit" disabled={isCalculatingFee} style={{ padding: '15px', backgroundColor: paymentMethod === 'PayHere' ? '#3498db' : '#f39c12', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', marginTop: '10px', opacity: isCalculatingFee ? 0.7 : 1 }}>
              {paymentMethod === 'PayHere' ? "Pay via PayHere" : "Confirm & Upload Slip"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default Cart;