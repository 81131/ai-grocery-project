import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false); 
  const [showStockForm, setShowStockForm] = useState(null); 

  const [categoryData, setCategoryData] = useState({ name: '', description: '' });
  
  const [productData, setProductData] = useState({ 
    product_name: '', sku: '', category_id: '', supplier_id: '', unit_of_measure: 'Units' 
  });
  const [productImageFile, setProductImageFile] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState(null);
  
  const [stockData, setStockData] = useState({ 
    batch_number: '', buying_price: '', retail_price: '', current_quantity: '' 
  });
  const [batchImageFile, setBatchImageFile] = useState(null);
  const [batchImagePreview, setBatchImagePreview] = useState(null);

  // --- Interactive Cropper States ---
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropTarget, setCropTarget] = useState(null); 
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState({ unit: '%', width: 50, aspect: 1 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);

  // --- NEW: Drag & Drop States & Refs ---
  const [dragActive, setDragActive] = useState({ product: false, batch: false });
  const productFileInputRef = useRef(null);
  const batchFileInputRef = useRef(null);

  // Batch Management States
  const [selectedProduct, setSelectedProduct] = useState(null); 
  const [productBatches, setProductBatches] = useState([]);
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [batchEditData, setBatchEditData] = useState({ buying_price: '', retail_price: '', current_quantity: '' });
  const [batchHistoryLog, setBatchHistoryLog] = useState([]);
  const [showBatchHistoryModal, setShowBatchHistoryModal] = useState(false);

  const navigate = useNavigate();

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    const headers = { 'Authorization': `Bearer ${token}` };

    try {
      const [prodRes, catRes, supRes] = await Promise.all([
        fetch('http://localhost:8000/inventory/products/all', { headers }),
        fetch('http://localhost:8000/inventory/categories', { headers }),
        fetch('http://localhost:8000/suppliers/', { headers })
      ]);

      if (prodRes.ok) setProducts(await prodRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (supRes.ok) setSuppliers(await supRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => { fetchData(); }, [navigate]);

  // --- NEW: Unified Image Processing (Handles both Click and Drop) ---
  const processImageFile = (file, target) => {
    if (!file || !file.type.startsWith('image/')) {
      alert("Please upload a valid image file.");
      return;
    }
    setCropTarget(target);
    setCrop({ unit: '%', width: 50, aspect: 1 }); 
    
    const reader = new FileReader();
    reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
    reader.readAsDataURL(file);
    
    setCropModalOpen(true);
  };

  const handleFileSelect = (e, target) => {
    if (e.target.files && e.target.files.length > 0) {
      processImageFile(e.target.files[0], target);
    }
    e.target.value = null; // Reset input
  };

  // --- NEW: Drag & Drop Event Handlers ---
  const handleDragOver = (e, target) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [target]: true }));
  };

  const handleDragLeave = (e, target) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [target]: false }));
  };

  const handleDrop = (e, target) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [target]: false }));
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFile(e.dataTransfer.files[0], target);
    }
  };

  // --- Cropper Save Handler ---
  const handleSaveCrop = () => {
    if (!completedCrop || !imgRef.current) return;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0, 0, completedCrop.width, completedCrop.height
    );

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(blob);

      if (cropTarget === 'product') {
        setProductImageFile(file);
        setProductImagePreview(previewUrl);
      } else if (cropTarget === 'batch') {
        setBatchImageFile(file);
        setBatchImagePreview(previewUrl);
      }

      setCropModalOpen(false);
      setImgSrc('');
      setCompletedCrop(null);
    }, 'image/jpeg', 0.95);
  };

  const uploadImageToServer = async (file) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch('http://localhost:8000/inventory/upload-image', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      return data.image_url;
    }
    return null;
  };

  // --- Submissions ---
  const handleAddCategory = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:8000/inventory/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(categoryData)
    });
    if (res.ok) {
      alert("Category created successfully! 🏷️");
      setShowCategoryForm(false);
      setCategoryData({ name: '', description: '' });
      fetchData();
    }
  };
  
  const handleAddProduct = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const payload = { ...productData };
    if (!payload.sku.trim()) delete payload.sku; 

    if (productImageFile) {
      const uploadedUrl = await uploadImageToServer(productImageFile);
      if (uploadedUrl) payload.image_url = uploadedUrl;
    }
    
    const res = await fetch('http://localhost:8000/inventory/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert("Product created successfully! 📦");
      setShowProductForm(false);
      setProductData({ product_name: '', sku: '', category_id: '', supplier_id: '', unit_of_measure: 'Units' });
      setProductImageFile(null);
      setProductImagePreview(null);
      fetchData(); 
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    const payload = {
      product_id: showStockForm,
      batch_number: stockData.batch_number,
      buying_price: parseFloat(stockData.buying_price),
      retail_price: parseFloat(stockData.retail_price),
      current_quantity: parseFloat(stockData.current_quantity)
    };

    if (batchImageFile) {
      const uploadedUrl = await uploadImageToServer(batchImageFile);
      if (uploadedUrl) payload.image_url = uploadedUrl;
    }

    const res = await fetch('http://localhost:8000/inventory/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert("Stock received successfully!");
      setShowStockForm(null);
      setStockData({ batch_number: '', buying_price: '', retail_price: '', current_quantity: '' });
      setBatchImageFile(null);
      setBatchImagePreview(null);
      fetchData(); 
    }
  };

  // --- Batch Management Functions ---
  const handleOpenBatchManager = async (product) => {
    setSelectedProduct(product);
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:8000/inventory/products/${product.id}/batches`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setProductBatches(await res.json());
  };

  const handleSaveBatchEdit = async (batchId) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:8000/inventory/batches/${batchId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        buying_price: parseFloat(batchEditData.buying_price),
        retail_price: parseFloat(batchEditData.retail_price),
        current_quantity: parseFloat(batchEditData.current_quantity)
      })
    });

    if (res.ok) {
      setEditingBatchId(null);
      handleOpenBatchManager(selectedProduct); 
      fetchData(); 
    }
  };

  const handleViewBatchHistory = async (batchId) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:8000/inventory/batches/${batchId}/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      setBatchHistoryLog(await res.json());
      setShowBatchHistoryModal(true);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#2c3e50', margin: 0 }}>Inventory Management 📦</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowCategoryForm(!showCategoryForm)} style={{ backgroundColor: '#f39c12', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            {showCategoryForm ? "Cancel Category" : "+ Add Category"}
          </button>
          <button onClick={() => setShowProductForm(!showProductForm)} style={{ backgroundColor: '#4CAF50', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            {showProductForm ? "Cancel Product" : "+ Add Product"}
          </button>
        </div>
      </div>

      {/* CATEGORY FORM */}
      {showCategoryForm && (
        <div style={{ backgroundColor: '#fdfbf7', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #f39c12' }}>
          <h3 style={{ marginTop: 0, color: '#e67e22' }}>Create New Category</h3>
          <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <input type="text" placeholder="Category Name" required value={categoryData.name} onChange={e => setCategoryData({...categoryData, name: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }} />
            <input type="text" placeholder="Description (Optional)" value={categoryData.description} onChange={e => setCategoryData({...categoryData, description: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 2 }} />
            <button type="submit" style={{ backgroundColor: '#e67e22', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Save Category</button>
          </form>
        </div>
      )}

      {/* PRODUCT FORM */}
      {showProductForm && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0 }}>Create New Product</h3>
          <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              {/* --- NEW: Draggable Product Image Box --- */}
              <div 
                onDragOver={(e) => handleDragOver(e, 'product')}
                onDragLeave={(e) => handleDragLeave(e, 'product')}
                onDrop={(e) => handleDrop(e, 'product')}
                onClick={() => productFileInputRef.current?.click()}
                style={{ 
                  width: '100px', height: '100px', backgroundColor: dragActive.product ? '#e8f4fd' : '#f0f0f0', 
                  borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center',
                  overflow: 'hidden', border: dragActive.product ? '2px dashed #3498db' : '2px dashed #ccc', flexShrink: 0,
                  cursor: 'pointer', transition: 'all 0.2s ease'
                }}
                title="Click to browse or drag an image here"
              >
                {productImagePreview ? (
                  <img src={productImagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '12px', color: dragActive.product ? '#3498db' : '#7f8c8d', textAlign: 'center', fontWeight: dragActive.product ? 'bold' : 'normal' }}>
                    {dragActive.product ? "Drop\nHere" : "Drag & Drop\nor Click"}
                  </span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#2c3e50', display: 'block', marginBottom: '5px' }}>
                  Product Base Image (Optional)
                </label>
                <input type="file" accept="image/*" ref={productFileInputRef} onChange={(e) => handleFileSelect(e, 'product')} style={{ display: 'none' }} />
                <p style={{ fontSize: '12px', color: '#95a5a6', margin: 0 }}>Supports JPG, PNG, WEBP. Drag and drop onto the box.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <input type="text" placeholder="Product Name" required value={productData.product_name} onChange={e => setProductData({...productData, product_name: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }} />
              <input type="text" placeholder="SKU (Leave blank to auto-generate)" value={productData.sku} onChange={e => setProductData({...productData, sku: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }} />
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
            </div>
            <button type="submit" style={{ backgroundColor: '#3498db', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', alignSelf: 'flex-start' }}>Save Product</button>
          </form>
        </div>
      )}

      {/* BATCH STOCK FORM */}
      {showStockForm && (
        <div style={{ backgroundColor: '#fff3cd', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #ffeeba' }}>
          <h3 style={{ marginTop: 0, color: '#856404' }}>Receive New Stock Batch</h3>
          <form onSubmit={handleAddStock} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              {/* --- NEW: Draggable Batch Image Box --- */}
              <div 
                onDragOver={(e) => handleDragOver(e, 'batch')}
                onDragLeave={(e) => handleDragLeave(e, 'batch')}
                onDrop={(e) => handleDrop(e, 'batch')}
                onClick={() => batchFileInputRef.current?.click()}
                style={{ 
                  width: '80px', height: '80px', backgroundColor: dragActive.batch ? '#fff8cc' : '#fcf8e3', 
                  borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center',
                  overflow: 'hidden', border: dragActive.batch ? '2px dashed #d35400' : '2px dashed #d8c383', flexShrink: 0,
                  cursor: 'pointer', transition: 'all 0.2s ease'
                }}
              >
                {batchImagePreview ? (
                  <img src={batchImagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '11px', color: dragActive.batch ? '#d35400' : '#856404', textAlign: 'center', fontWeight: dragActive.batch ? 'bold' : 'normal' }}>
                    {dragActive.batch ? "Drop\nHere" : "Drag/Click"}
                  </span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#856404', display: 'block', marginBottom: '5px' }}>
                  Specific Batch Packaging Image (Optional. Overrides default product image)
                </label>
                <input type="file" accept="image/*" ref={batchFileInputRef} onChange={(e) => handleFileSelect(e, 'batch')} style={{ display: 'none' }} />
                <p style={{ fontSize: '12px', color: '#a0883d', margin: 0 }}>Drag your image directly onto the box.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="text" placeholder="Batch No. (e.g. BATCH-01)" required value={stockData.batch_number} onChange={e => setStockData({...stockData, batch_number: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }} />
              <input type="number" step="0.01" placeholder="Quantity Received" required value={stockData.current_quantity} onChange={e => setStockData({...stockData, current_quantity: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }} />
              <input type="number" step="0.01" placeholder="Buying Price (Rs.)" required value={stockData.buying_price} onChange={e => setStockData({...stockData, buying_price: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }} />
              <input type="number" step="0.01" placeholder="Selling Price (Rs.)" required value={stockData.retail_price} onChange={e => setStockData({...stockData, retail_price: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }} />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Add to Inventory</button>
              <button type="button" onClick={() => { setShowStockForm(null); setBatchImageFile(null); setBatchImagePreview(null); }} style={{ backgroundColor: 'transparent', border: '1px solid #856404', color: '#856404', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* MAIN TABLE */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eee' }}>
            <tr>
              <th style={{ padding: '15px', color: '#7f8c8d' }}>SKU</th>
              <th style={{ padding: '15px', color: '#7f8c8d' }}>Product Name</th>
              <th style={{ padding: '15px', color: '#7f8c8d' }}>Total Stock</th>
              <th style={{ padding: '15px', color: '#7f8c8d' }}>Cost Price</th>
              <th style={{ padding: '15px', color: '#7f8c8d' }}>Retail Price</th>
              <th style={{ padding: '15px', color: '#7f8c8d' }}>Profit / Unit</th>
              <th style={{ padding: '15px', color: '#7f8c8d' }}>Est. Total Profit</th>
              <th style={{ padding: '15px', color: '#7f8c8d' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((item) => {
              const costPrice = item.buying_price || 0;
              const retailPrice = item.retail_price || 0;
              const profitPerUnit = retailPrice - costPrice;
              const totalProfit = profitPerUnit * item.current_quantity;
              
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#34495e' }}>{item.sku}</td>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {item.image_url ? (
                      <img src={item.image_url} alt="Product" style={{ width: '30px', height: '30px', borderRadius: '4px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '30px', height: '30px', backgroundColor: '#eee', borderRadius: '4px' }}></div>
                    )}
                    {item.product_name}
                  </td>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: item.current_quantity > 0 ? '#27ae60' : '#e74c3c' }}>
                    {item.current_quantity} {item.unit_of_measure}
                  </td>
                  <td style={{ padding: '15px', color: '#7f8c8d' }}>Rs. {costPrice.toFixed(2)}</td>
                  <td style={{ padding: '15px', fontWeight: '500' }}>Rs. {retailPrice.toFixed(2)}</td>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: profitPerUnit >= 0 ? '#27ae60' : '#e74c3c' }}>
                    Rs. {profitPerUnit.toFixed(2)}
                  </td>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: totalProfit >= 0 ? '#27ae60' : '#e74c3c' }}>
                    Rs. {totalProfit.toFixed(2)}
                  </td>
                  <td style={{ padding: '15px', display: 'flex', gap: '8px' }}>
                    <button onClick={() => setShowStockForm(item.id)} style={{ padding: '8px 12px', backgroundColor: '#eef2f5', color: '#2c3e50', border: '1px solid #dcdde1', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                      + Receive Stock
                    </button>
                    <button onClick={() => handleOpenBatchManager(item)} style={{ padding: '8px 12px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                      Manage Prices
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* BATCH MANAGER MODAL */}
      {selectedProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 900 }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '800px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, color: '#2c3e50' }}>Stock Batches: {selectedProduct.product_name}</h3>
              <button onClick={() => setSelectedProduct(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✖</button>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr>
                  <th style={{ padding: '10px' }}>Batch No.</th>
                  <th style={{ padding: '10px' }}>Cost (Buying)</th>
                  <th style={{ padding: '10px' }}>Retail (Selling)</th>
                  <th style={{ padding: '10px' }}>Qty Left</th>
                  <th style={{ padding: '10px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {productBatches.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>No batches found.</td></tr>
                ) : (
                  productBatches.map(batch => (
                    <tr key={batch.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{batch.batch_number}</td>
                      
                      {editingBatchId === batch.id ? (
                        <>
                          <td style={{ padding: '10px' }}><input type="number" step="0.01" value={batchEditData.buying_price} onChange={e => setBatchEditData({...batchEditData, buying_price: e.target.value})} style={{ width: '80px', padding: '5px' }} /></td>
                          <td style={{ padding: '10px' }}><input type="number" step="0.01" value={batchEditData.retail_price} onChange={e => setBatchEditData({...batchEditData, retail_price: e.target.value})} style={{ width: '80px', padding: '5px' }} /></td>
                          <td style={{ padding: '10px' }}><input type="number" step="0.01" value={batchEditData.current_quantity} onChange={e => setBatchEditData({...batchEditData, current_quantity: e.target.value})} style={{ width: '60px', padding: '5px' }} /></td>
                          <td style={{ padding: '10px' }}>
                            <button onClick={() => handleSaveBatchEdit(batch.id)} style={{ padding: '5px 10px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}>Save</button>
                            <button onClick={() => setEditingBatchId(null)} style={{ padding: '5px 10px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '10px' }}>Rs. {batch.buying_price}</td>
                          <td style={{ padding: '10px' }}>Rs. {batch.retail_price}</td>
                          <td style={{ padding: '10px' }}>{batch.current_quantity}</td>
                          <td style={{ padding: '10px', display: 'flex', gap: '5px' }}>
                            <button onClick={() => { setEditingBatchId(batch.id); setBatchEditData({ buying_price: batch.buying_price, retail_price: batch.retail_price, current_quantity: batch.current_quantity }); }} style={{ padding: '5px 10px', backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Edit</button>
                            <button onClick={() => handleViewBatchHistory(batch.id)} style={{ padding: '5px 10px', backgroundColor: '#7f8c8d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>History</button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BATCH AUDIT LOG MODAL */}
      {showBatchHistoryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0 }}>Price / Quantity Audit Log</h3>
              <button onClick={() => setShowBatchHistoryModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#7f8c8d' }}>✖</button>
            </div>
            
            {batchHistoryLog.length === 0 ? (
              <p style={{ color: '#95a5a6', textAlign: 'center' }}>No modifications have been made to this batch.</p>
            ) : (
              batchHistoryLog.map(log => {
                const changes = JSON.parse(log.changes);
                return (
                  <div key={log.id} style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '8px', borderLeft: '4px solid #f39c12' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#7f8c8d' }}>
                      <strong>Admin ID:</strong> {log.edited_by} • {new Date(log.timestamp).toLocaleString()}
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#2c3e50' }}>
                      {Object.keys(changes).map(field => (
                        <li key={field}>
                          <strong>{field.replace('_', ' ')}:</strong> <span style={{ textDecoration: 'line-through', color: '#e74c3c' }}>{changes[field].old}</span> ➔ <span style={{ color: '#27ae60', fontWeight: 'bold' }}>{changes[field].new}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* INTERACTIVE IMAGE CROP MODAL */}
      {cropModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2c3e50' }}>Frame Your Image</h3>
            
            <div style={{ width: '100%', maxHeight: '50vh', overflowY: 'auto', marginBottom: '20px', display: 'flex', justifyContent: 'center', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop={false}
              >
                <img ref={imgRef} src={imgSrc} alt="Crop preview" style={{ maxWidth: '100%' }} />
              </ReactCrop>
            </div>

            <div style={{ display: 'flex', gap: '15px', width: '100%', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => { setCropModalOpen(false); setImgSrc(''); }} 
                style={{ padding: '10px 20px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveCrop} 
                style={{ padding: '10px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Crop & Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminInventory;