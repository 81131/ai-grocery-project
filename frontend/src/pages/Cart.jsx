import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, ShoppingCart, MapPin, Package, UploadCloud, CreditCard } from 'lucide-react';

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
    if (res.ok) setCartData(await res.json());
  };

  useEffect(() => { fetchCart(); }, []);

  useEffect(() => {
    const calculateFee = async () => {
      const token = localStorage.getItem('token');
      if (!token || cartData.items.length === 0) return;

      setIsCalculatingFee(true);
      try {
        const res = await fetch('http://localhost:8000/orders/calculate-fee', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ delivery_type: deliveryType, distance_km: parseFloat(distanceKm) || 0 })
        });
        if (res.ok) {
          const data = await res.json();
          setDeliveryFee(data.fee);
          setTotalWeight(data.total_weight);
        }
      } catch (err) { console.error("Failed to calculate fee", err); } 
      finally { setIsCalculatingFee(false); }
    };

    const delayDebounceFn = setTimeout(() => { calculateFee(); }, 500);
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
      alert(paymentMethod === 'PayHere' ? "Redirecting to PayHere..." : "Order placed successfully!");
      navigate('/orders');
    } else {
      const err = await res.json();
      alert("Checkout failed: " + err.detail);
    }
  };

  if (cartData.items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h2 className="text-title" style={{ fontSize: '30px', marginBottom: '20px' }}>Your cart is empty</h2>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          <ShoppingCart size={20} /> Start Shopping
        </button>
      </div>
    );
  }

  const grandTotal = cartData.total + deliveryFee;

  return (
    <div>
      <h2 className="text-title" style={{ marginBottom: '30px', fontSize: '28px' }}>Shopping Cart</h2>
      
      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        {/* LEFT COLUMN: Cart Items */}
        <div className="card" style={{ flex: '1 1 600px' }}>
          {cartData.items.map(item => (
            <div key={item.item_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 2 }}>
                <img src={item.image} alt={item.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-muted)' }} />
                <div>
                  <h4 className="text-title" style={{ margin: '0 0 5px 0' }}>{item.name}</h4>
                  <p className="text-subtitle">Rs. {item.price.toFixed(2)} each</p>
                </div>
              </div>
              
              {/* Replaced text + and - with lucide-react SVGs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, justifyContent: 'center' }}>
                <button onClick={() => updateQuantity(item.batch_id, item.quantity - 1)} className="btn btn-secondary" style={{ padding: '8px' }}>
                  <Minus size={16} />
                </button>
                <span style={{ fontWeight: 'bold', fontSize: '16px', minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.batch_id, item.quantity + 1)} className="btn btn-secondary" style={{ padding: '8px' }}>
                  <Plus size={16} />
                </button>
              </div>
              
              <div style={{ flex: 1, textAlign: 'right', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                Rs. {item.subtotal.toFixed(2)}
              </div>
            </div>
          ))}
          <div style={{ padding: '15px 0', color: 'var(--text-muted)', fontSize: '14px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
            <Package size={16} /> Estimated Package Weight: <strong style={{ color: 'var(--text-main)' }}>{totalWeight.toFixed(2)} KG</strong>
          </div>
        </div>

        {/* RIGHT COLUMN: Checkout Panel */}
        <div className="card" style={{ flex: '1 1 350px', position: 'sticky', top: '30px' }}>
          <h3 className="text-title" style={{ margin: '0 0 20px 0', borderBottom: '1px solid var(--border-light)', paddingBottom: '15px' }}>Order Summary</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '15px', color: 'var(--text-muted)' }}>
            <span>Items Subtotal</span>
            <span style={{ color: 'var(--text-main)', fontWeight: '500' }}>Rs. {cartData.total.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '15px', color: 'var(--text-muted)' }}>
            <span>Delivery Fee</span>
            {isCalculatingFee ? <span style={{ color: 'var(--color-warning)' }}>Calculating...</span> : <span style={{ color: 'var(--text-main)', fontWeight: '500' }}>Rs. {deliveryFee.toFixed(2)}</span>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', fontSize: '22px', fontWeight: 'bold', borderTop: '1px solid var(--border-light)', paddingTop: '15px', color: 'var(--text-main)' }}>
            <span>Total</span>
            <span style={{ color: 'var(--color-primary)' }}>Rs. {grandTotal.toFixed(2)}</span>
          </div>

          <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="text" placeholder="Full Name" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="input-field" />
            
            <div style={{ backgroundColor: 'var(--bg-app)', padding: '15px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <label style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <MapPin size={16} /> Fulfillment Method
              </label>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}>
                  <input type="radio" value="Home Delivery" checked={deliveryType === 'Home Delivery'} onChange={(e) => setDeliveryType(e.target.value)} /> Home Delivery
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}>
                  <input type="radio" value="Store Pickup" checked={deliveryType === 'Store Pickup'} onChange={(e) => setDeliveryType(e.target.value)} /> Store Pickup
                </label>
              </div>

              {deliveryType === 'Home Delivery' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input type="text" placeholder="Delivery Address" required value={address} onChange={(e) => setAddress(e.target.value)} className="input-field" />
                  <input type="number" step="0.1" placeholder="Est. Distance (KM)" required value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} className="input-field" title="Enter distance for accurate fee calculation" />
                </div>
              )}
            </div>
            
            <div>
              <label style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <CreditCard size={16} /> Payment Method
              </label>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}>
                  <input type="radio" value="Bank Transfer" checked={paymentMethod === 'Bank Transfer'} onChange={(e) => setPaymentMethod(e.target.value)} /> Bank Transfer
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}>
                  <input type="radio" value="PayHere" checked={paymentMethod === 'PayHere'} onChange={(e) => setPaymentMethod(e.target.value)} /> PayHere
                </label>
              </div>

              {paymentMethod === 'Bank Transfer' && (
                <div style={{ backgroundColor: 'rgba(243, 156, 18, 0.1)', padding: '15px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-warning)' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#b9770e' }}>
                    Please transfer <strong>Rs. {grandTotal.toFixed(2)}</strong> to Account: 123456789 (BOC).
                  </p>
                  <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setPaymentSlip(e.target.files[0])} style={{ fontSize: '13px', width: '100%', color: 'var(--text-muted)' }} />
                </div>
              )}
            </div>

            <button type="submit" disabled={isCalculatingFee} className="btn btn-primary" style={{ width: '100%', marginTop: '10px', opacity: isCalculatingFee ? 0.7 : 1, padding: '16px', fontSize: '16px' }}>
              {paymentMethod === 'PayHere' ? <><CreditCard size={20} /> Pay via PayHere</> : <><UploadCloud size={20} /> Confirm & Upload Slip</>}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default Cart;