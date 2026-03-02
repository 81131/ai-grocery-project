import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  
  // UI State for Forms
  const [showProductForm, setShowProductForm] = useState(false);
  const [showStockForm, setShowStockForm] = useState(null); // stores the product ID being updated

  // Form Data State
  const [productData, setProductData] = useState({ 
    product_name: '', sku: '', category_id: '', supplier_id: '', unit_of_measure: 'Units' 
  });
  const [stockData, setStockData] = useState({ 
    batch_number: '', retail_price: '', current_quantity: '' 
  });

  const navigate = useNavigate();

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    const headers = { 'Authorization': `Bearer ${token}` };

    try {
      // 1. Fetch the unified list for the table
      const prodRes = await fetch('http://localhost:8000/inventory/products/all', { headers });
      if (prodRes.ok) setProducts(await prodRes.json());

      // 2. Fetch categories
      const catRes = await fetch('http://localhost:8000/inventory/categories', { headers });
      if (catRes.ok) setCategories(await catRes.json());

      // 3. Fetch suppliers (FIXED: Now points to the decoupled API!)
      const supRes = await fetch('http://localhost:8000/suppliers/', { headers });
      if (supRes.ok) setSuppliers(await supRes.json());
      
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => { fetchData(); }, [navigate]);

  // --- Submit Handlers ---
  
  const handleAddProduct = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    const res = await fetch('http://localhost:8000/inventory/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(productData)
    });

    if (res.ok) {
      alert("Product created successfully! 📦");
      setShowProductForm(false);
      setProductData({ product_name: '', sku: '', category_id: '', supplier_id: '', unit_of_measure: 'Units' });
      fetchData(); // Refresh the table
    } else {
      const err = await res.json();
      alert("Failed to add product: " + JSON.stringify(err.detail));
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    const payload = {
      product_id: showStockForm,
      batch_number: stockData.batch_number,
      retail_price: parseFloat(stockData.retail_price),
      current_quantity: parseFloat(stockData.current_quantity)
    };

    const res = await fetch('http://localhost:8000/inventory/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert("Stock received successfully!");
      setShowStockForm(null);
      setStockData({ batch_number: '', retail_price: '', current_quantity: '' });
      fetchData(); // Refresh the table so the new total appears
    } else {
      const err = await res.json();
      alert("Failed to update stock: " + JSON.stringify(err.detail));
    }
  };

  // Helper to generate a category if you haven't built a category UI yet
  const handleSeedCategories = async () => {
    const token = localStorage.getItem('token');
    await fetch('http://localhost:8000/inventory/seed', { 
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    alert('Mock Categories added! Refreshing...');
    fetchData();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#2c3e50', margin: 0 }}>Inventory Management 📦</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          {categories.length === 0 && (
            <button onClick={handleSeedCategories} style={{ backgroundColor: '#8e44ad', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              🌱 Seed Categories
            </button>
          )}
          <button onClick={() => setShowProductForm(!showProductForm)} style={{ backgroundColor: '#4CAF50', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            {showProductForm ? "Cancel" : "+ Add New Product"}
          </button>
        </div>
      </div>

      {/* --- ADD PRODUCT FORM --- */}
      {showProductForm && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0 }}>Create New Product</h3>
          <form onSubmit={handleAddProduct} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <input type="text" placeholder="Product Name" required value={productData.product_name} onChange={e => setProductData({...productData, product_name: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }} />
            <input type="text" placeholder="SKU (e.g. APP-01)" required value={productData.sku} onChange={e => setProductData({...productData, sku: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }} />
            
            <select required value={productData.category_id} onChange={e => setProductData({...productData, category_id: parseInt(e.target.value)})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }}>
              <option value="" disabled>Select Category...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select required value={productData.supplier_id} onChange={e => setProductData({...productData, supplier_id: parseInt(e.target.value)})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }}>
              <option value="" disabled>Select Supplier...</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <select required value={productData.unit_of_measure} onChange={e => setProductData({...productData, unit_of_measure: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}>
              <option value="Units">Units</option>
              <option value="KG">Kilograms (KG)</option>
              <option value="Liters">Liters (L)</option>
            </select>

            <button type="submit" style={{ backgroundColor: '#3498db', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Save Product</button>
          </form>
          
          {(categories.length === 0 || suppliers.length === 0) && (
            <p style={{ color: '#e74c3c', fontSize: '13px', marginTop: '10px' }}>
              ⚠️ You must have at least one Category and one Supplier created before you can add a product.
            </p>
          )}
        </div>
      )}

      {/* --- ADD STOCK BATCH FORM --- */}
      {showStockForm && (
        <div style={{ backgroundColor: '#fff3cd', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #ffeeba' }}>
          <h3 style={{ marginTop: 0, color: '#856404' }}>Receive New Stock Batch</h3>
          <form onSubmit={handleAddStock} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <input type="text" placeholder="Batch Number (e.g. BATCH-01)" required value={stockData.batch_number} onChange={e => setStockData({...stockData, batch_number: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }} />
            <input type="number" step="0.01" placeholder="Quantity Received" required value={stockData.current_quantity} onChange={e => setStockData({...stockData, current_quantity: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }} />
            <input type="number" step="0.01" placeholder="Selling Price (Rs.)" required value={stockData.retail_price} onChange={e => setStockData({...stockData, retail_price: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }} />
            
            <button type="submit" style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Add to Inventory</button>
            <button type="button" onClick={() => setShowStockForm(null)} style={{ backgroundColor: 'transparent', border: '1px solid #856404', color: '#856404', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>
          </form>
        </div>
      )}

      {/* --- INVENTORY TABLE --- */}
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
            {products.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#95a5a6' }}>No products found. Add one above!</td></tr>
            ) : (
              products.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#34495e' }}>{item.sku}</td>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#2c3e50' }}>{item.product_name}</td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ backgroundColor: '#eef2f3', color: '#555', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{item.category_name}</span>
                  </td>
                  <td style={{ padding: '15px', fontWeight: 'bold', fontSize: '16px', color: item.current_quantity > 10 ? '#27ae60' : item.current_quantity > 0 ? '#f39c12' : '#e74c3c' }}>
                    {item.current_quantity}
                  </td>
                  <td style={{ padding: '15px', color: '#7f8c8d' }}>{item.unit_of_measure}</td>
                  <td style={{ padding: '15px', fontWeight: '500' }}>Rs. {item.retail_price.toFixed(2)}</td>
                  <td style={{ padding: '15px' }}>
                    <button onClick={() => setShowStockForm(item.id)} style={{ padding: '8px 12px', backgroundColor: '#eef2f5', color: '#2c3e50', border: '1px solid #dcdde1', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', transition: 'all 0.2s' }}>
                      + Receive Stock
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