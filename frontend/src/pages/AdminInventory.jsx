import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  
  // UI Toggles
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false); 
  const [showStockForm, setShowStockForm] = useState(null); 
  const [editingProductId, setEditingProductId] = useState(null);

  // Forms
  const [categoryData, setCategoryData] = useState({ name: '', description: '', discount_percentage: '' });
  
  const initialProductState = { product_name: '', sku: '', category_ids: [], supplier_id: '', unit_of_measure: 'Units', keywords: '', description: '' };
  const [productData, setProductData] = useState(initialProductState);
  
  const initialStockState = { batch_number: '', buying_price: '', retail_price: '', current_quantity: '', unit_weight_kg: '', manufacture_date: '', expiry_date: '' };
  const [stockData, setStockData] = useState(initialStockState);

  // AI & Keywords
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [suggestedKeywords, setSuggestedKeywords] = useState([]);
  const [keywordInput, setKeywordInput] = useState('');
  
  // --- DRAG AND DROP & IMAGE STATES ---
  const [dragActive, setDragActive] = useState({ product: false, batch: false });
  const productFileInputRef = useRef(null);
  const batchFileInputRef = useRef(null);
  const [productImageFile, setProductImageFile] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState(null);
  const [batchImageFile, setBatchImageFile] = useState(null);
  const [batchImagePreview, setBatchImagePreview] = useState(null);

  // Cropper States
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropTarget, setCropTarget] = useState(null); 
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState({ unit: '%', width: 50, aspect: 1 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);

  // --- RESTORED: BATCH MANAGEMENT STATES ---
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
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchData(); }, []);

  // --- AI Keyword Logic ---
  const handleGenerateKeywords = async () => {
    if (!productData.product_name) {
      alert("Please enter a product name first!"); return;
    }
    setIsGeneratingAI(true);
    const token = localStorage.getItem('token');
    const catNames = categories.filter(c => productData.category_ids.includes(c.id)).map(c => c.name).join(", ");
    
    try {
      const res = await fetch('http://localhost:8000/inventory/generate-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          product_name: productData.product_name,
          description: productData.description || "",
          categories: catNames
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestedKeywords(data.keywords);
      }
    } catch (err) { console.error("AI Error:", err); }
    setIsGeneratingAI(false);
  };

  const formatKeyword = (text) => {
    let cleaned = text.trim();
    if (!cleaned.startsWith('#')) cleaned = '#' + cleaned;
    cleaned = cleaned.replace(/([a-z])([A-Z])/g, '$1 $2');
    return '#' + cleaned.charAt(1).toUpperCase() + cleaned.slice(2);
  };

  const handleKeywordKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); 
      if (!keywordInput.trim()) return;
      const newKw = formatKeyword(keywordInput);
      const currentList = productData.keywords ? productData.keywords.split(',').map(k => k.trim()).filter(k=>k) : [];
      if (!currentList.includes(newKw)) setProductData({...productData, keywords: [...currentList, newKw].join(', ')});
      setKeywordInput(''); 
    }
  };

  const toggleKeyword = (kw) => {
    const currentList = productData.keywords ? productData.keywords.split(',').map(k => k.trim()).filter(k=>k) : [];
    if (currentList.includes(kw)) {
      setProductData({...productData, keywords: currentList.filter(k => k !== kw).join(', ')});
    } else {
      setProductData({...productData, keywords: [...currentList, kw].join(', ')});
    }
  };

  const removeKeyword = (kwToRemove) => {
    const currentList = productData.keywords ? productData.keywords.split(',').map(k => k.trim()).filter(k=>k) : [];
    setProductData({...productData, keywords: currentList.filter(k => k !== kwToRemove).join(', ')});
  };

  const toggleCategory = (id) => {
    setProductData(prev => {
      const ids = prev.category_ids.includes(id) ? prev.category_ids.filter(cid => cid !== id) : [...prev.category_ids, id];
      return { ...prev, category_ids: ids };
    });
  };

  // --- RESTORED: DRAG & DROP LOGIC ---
  const processImageFile = (file, target) => {
    if (!file || !file.type.startsWith('image/')) {
      alert("Please upload a valid image file."); return;
    }
    setCropTarget(target);
    setCrop({ unit: '%', width: 50, aspect: 1 }); 
    const reader = new FileReader();
    reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
    reader.readAsDataURL(file);
    setCropModalOpen(true);
  };

  const handleFileSelect = (e, target) => {
    if (e.target.files && e.target.files.length > 0) processImageFile(e.target.files[0], target);
    e.target.value = null; 
  };

  const handleDragOver = (e, target) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(prev => ({ ...prev, [target]: true }));
  };

  const handleDragLeave = (e, target) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(prev => ({ ...prev, [target]: false }));
  };

  const handleDrop = (e, target) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(prev => ({ ...prev, [target]: false }));
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) processImageFile(e.dataTransfer.files[0], target);
  };

  const handleSaveCrop = () => {
    if (!completedCrop || !imgRef.current) return;
    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = completedCrop.width; canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, completedCrop.x * scaleX, completedCrop.y * scaleY, completedCrop.width * scaleX, completedCrop.height * scaleY, 0, 0, completedCrop.width, completedCrop.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(blob);
      if (cropTarget === 'product') { setProductImageFile(file); setProductImagePreview(previewUrl); } 
      else if (cropTarget === 'batch') { setBatchImageFile(file); setBatchImagePreview(previewUrl); }
      setCropModalOpen(false); setImgSrc(''); setCompletedCrop(null);
    }, 'image/jpeg', 0.95);
  };

  const uploadImageToServer = async (file) => {
    const token = localStorage.getItem('token');
    const formData = new FormData(); formData.append("file", file);
    const res = await fetch('http://localhost:8000/inventory/upload-image', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
    if (res.ok) return (await res.json()).image_url;
    return null;
  };

  // --- Submissions ---
  const handleAddCategory = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const payload = { name: categoryData.name, description: categoryData.description, discount_percentage: categoryData.discount_percentage || 0 };
    try {
      const res = await fetch('http://localhost:8000/inventory/categories', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert("Category created successfully! 🏷️");
        setShowCategoryForm(false); setCategoryData({ name: '', description: '', discount_percentage: '' }); fetchData();
      } else { alert("Failed to create category"); }
    } catch (error) { console.error(error); }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const payload = { ...productData };
    if (!payload.sku.trim()) delete payload.sku; 
    if (payload.category_ids.length === 0) { alert("Please select at least one category."); return; }

    if (productImageFile) {
      const uploadedUrl = await uploadImageToServer(productImageFile);
      if (uploadedUrl) payload.image_url = uploadedUrl;
    }
    
    const url = editingProductId ? `http://localhost:8000/inventory/products/${editingProductId}` : 'http://localhost:8000/inventory/products';
    const method = editingProductId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method: method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert(`Product ${editingProductId ? 'updated' : 'created'} successfully! 📦`);
      setShowProductForm(false); setEditingProductId(null);
      setProductData(initialProductState); setProductImageFile(null); setProductImagePreview(null); setSuggestedKeywords([]);
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
      current_quantity: parseFloat(stockData.current_quantity),
      unit_weight_kg: stockData.unit_weight_kg ? parseFloat(stockData.unit_weight_kg) : null,
      manufacture_date: stockData.manufacture_date ? new Date(stockData.manufacture_date).toISOString() : null,
      expiry_date: stockData.expiry_date ? new Date(stockData.expiry_date).toISOString() : null
    };

    if (batchImageFile) {
      const uploadedUrl = await uploadImageToServer(batchImageFile);
      if (uploadedUrl) payload.image_url = uploadedUrl;
    }

    const res = await fetch('http://localhost:8000/inventory/batches', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert("Stock received successfully!");
      setShowStockForm(null); setStockData(initialStockState); setBatchImageFile(null); setBatchImagePreview(null);
      fetchData(); 
    }
  };

  const handleCloneBatch = (batchId) => {
    if (!batchId) { setStockData(initialStockState); return; }
    const batch = productBatches.find(b => b.id === parseInt(batchId));
    if (batch) {
      setStockData({
        ...stockData, buying_price: batch.buying_price, retail_price: batch.retail_price, unit_weight_kg: batch.unit_weight_kg || '',
      });
    }
  };

  const openReceiveStock = async (product) => {
    setShowStockForm(product.id);
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:8000/inventory/products/${product.id}/batches`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setProductBatches(await res.json());
  };

  const handleEditProduct = (product) => {
    setProductData({
      product_name: product.product_name, sku: product.sku, category_ids: [], supplier_id: product.supplier_id || '', unit_of_measure: product.unit_of_measure, keywords: product.keywords || '', description: ''
    });
    setProductImagePreview(product.image_url); setEditingProductId(product.id); setShowProductForm(true); window.scrollTo(0,0);
  };

  // --- RESTORED: BATCH MANAGER MODAL FUNCTIONS ---
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
    } else { alert('Failed to update batch'); }
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
          <button onClick={() => {setShowProductForm(!showProductForm); setEditingProductId(null); setProductData(initialProductState); setProductImagePreview(null); setSuggestedKeywords([]);}} style={{ backgroundColor: '#4CAF50', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            {showProductForm ? "Cancel Product" : "+ Add Product"}
          </button>
        </div>
      </div>

      {/* --- CATEGORY FORM --- */}
      {showCategoryForm && (
        <div style={{ backgroundColor: '#fdfbf7', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #f39c12' }}>
          <h3 style={{ marginTop: 0, color: '#e67e22' }}>Create New Category</h3>
          <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input type="text" placeholder="Category Name" required value={categoryData.name || ''} onChange={e => setCategoryData({...categoryData, name: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }} />
            <input type="text" placeholder="Description (Optional)" value={categoryData.description || ''} onChange={e => setCategoryData({...categoryData, description: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 2 }} />
            <input type="number" step="0.01" placeholder="Discount %" value={categoryData.discount_percentage || ''} onChange={e => setCategoryData({...categoryData, discount_percentage: parseFloat(e.target.value)})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', width: '120px' }} title="Apply a global discount to this category" />
            <button type="submit" style={{ backgroundColor: '#e67e22', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Save Category</button>
          </form>
        </div>
      )}

      {/* --- FULL PRODUCT FORM (CREATE & EDIT) --- */}
      {showProductForm && (
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderTop: editingProductId ? '4px solid #f39c12' : '4px solid #3498db' }}>
          <h3 style={{ marginTop: 0 }}>{editingProductId ? "✏️ Edit Product details" : "Create New Product"}</h3>
          
          <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Top Row: Image & Core Info */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              
              {/* RESTORED: Draggable Product Image Box */}
              <div 
                onDragOver={(e) => handleDragOver(e, 'product')}
                onDragLeave={(e) => handleDragLeave(e, 'product')}
                onDrop={(e) => handleDrop(e, 'product')}
                onClick={() => productFileInputRef.current?.click()}
                style={{ width: '120px', height: '120px', backgroundColor: dragActive.product ? '#e8f4fd' : '#f8f9fa', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', border: dragActive.product ? '2px dashed #3498db' : '2px dashed #bdc3c7', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s ease' }}
                title="Click to browse or drag an image here"
              >
                {productImagePreview ? <img src={productImagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '12px', color: dragActive.product ? '#3498db' : '#7f8c8d', textAlign: 'center', fontWeight: dragActive.product ? 'bold' : 'normal' }}>{dragActive.product ? "Drop\nHere" : "Drag & Drop\nor Click"}</span>}
              </div>
              <input ref={productFileInputRef} type="file" accept="image/*" onChange={(e) => handleFileSelect(e, 'product')} style={{ display: 'none' }} />
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <input type="text" placeholder="Product Name" required value={productData.product_name} onChange={e => setProductData({...productData, product_name: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 2 }} />
                  <input type="text" placeholder="SKU (Leave blank to auto-generate)" value={productData.sku} onChange={e => setProductData({...productData, sku: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }} disabled={editingProductId} />
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <select required value={productData.supplier_id} onChange={e => setProductData({...productData, supplier_id: parseInt(e.target.value)})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }}>
                    <option value="" disabled>Select Supplier...</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <select required value={productData.unit_of_measure} onChange={e => setProductData({...productData, unit_of_measure: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }}>
                    <option value="Units">Units</option><option value="KG">Kilograms (KG)</option><option value="Liters">Liters (L)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Middle Row: Multi-Categories */}
            <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #eee' }}>
              <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#2c3e50', display: 'block', marginBottom: '10px' }}>Select Categories (Check all that apply)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                {categories.map(c => (
                  <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '14px' }}>
                    <input type="checkbox" checked={productData.category_ids.includes(c.id)} onChange={() => toggleCategory(c.id)} /> {c.name}
                  </label>
                ))}
              </div>
            </div>

            {/* Bottom Row: AI Keywords */}
            <div style={{ backgroundColor: '#fdfdfd', padding: '15px', borderRadius: '8px', border: '1px solid #eee' }}>
              <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#2c3e50', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                Search Keywords / SEO Tags
                <button type="button" onClick={handleGenerateKeywords} disabled={isGeneratingAI} style={{ padding: '6px 12px', backgroundColor: '#8e44ad', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {isGeneratingAI ? "⏳ Thinking..." : "✨ Generate AI Keywords"}
                </button>
              </label>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {(productData.keywords ? productData.keywords.split(',').map(k => k.trim()).filter(k=>k) : []).map((kw, i) => (
                  <span key={i} style={{ padding: '6px 12px', backgroundColor: '#3498db', color: 'white', borderRadius: '15px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    {kw}
                    <button type="button" onClick={() => removeKeyword(kw)} style={{ background: 'none', border: 'none', color: '#e0f7fa', cursor: 'pointer', fontWeight: 'bold', padding: 0, fontSize: '14px', display: 'flex', alignItems: 'center' }}>✖</button>
                  </span>
                ))}
              </div>

              <input 
                type="text" 
                placeholder="Type a keyword and press Enter (e.g. #Fresh Produce)" 
                value={keywordInput} 
                onChange={e => setKeywordInput(e.target.value)} 
                onKeyDown={handleKeywordKeyDown}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box', fontSize: '14px' }} 
              />
              <p style={{ margin: '5px 0 10px 0', fontSize: '11px', color: '#95a5a6' }}>Press <strong>Enter</strong> to add a tag.</p>
              
              {suggestedKeywords.length > 0 && (
                <div style={{ backgroundColor: '#f4ebf9', padding: '12px', borderRadius: '8px', border: '1px dashed #c39bd3', marginTop: '10px' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#8e44ad', fontWeight: 'bold' }}>AI Suggestions (Click to Add):</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {suggestedKeywords.map((kw, i) => {
                      const currentList = productData.keywords ? productData.keywords.split(',').map(k => k.trim()) : [];
                      if (currentList.includes(kw)) return null; 
                      return (
                        <span key={i} onClick={() => toggleKeyword(kw)} style={{ padding: '5px 12px', backgroundColor: 'white', color: '#8e44ad', border: '1px solid #8e44ad', borderRadius: '15px', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                          + {kw}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <button type="submit" style={{ backgroundColor: editingProductId ? '#e67e22' : '#3498db', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', alignSelf: 'flex-end', fontSize: '16px' }}>
              {editingProductId ? "Save Changes" : "Save Product"}
            </button>
          </form>
        </div>
      )}

      {/* --- RECEIVE STOCK FORM --- */}
      {showStockForm && (
        <div style={{ backgroundColor: '#fffdf7', padding: '25px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #f1c40f', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#f39c12' }}>📦 Receive New Stock Batch</h3>
            {productBatches.length > 0 && (
              <select onChange={(e) => handleCloneBatch(e.target.value)} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '13px' }}>
                <option value="">-- Copy Pricing from Existing Batch --</option>
                {productBatches.map(b => (
                  <option key={b.id} value={b.id}>Batch {b.batch_number} (Retail: Rs.{b.retail_price})</option>
                ))}
              </select>
            )}
          </div>

          <form onSubmit={handleAddStock} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              
              {/* RESTORED: Draggable Batch Image Box */}
              <div 
                onDragOver={(e) => handleDragOver(e, 'batch')}
                onDragLeave={(e) => handleDragLeave(e, 'batch')}
                onDrop={(e) => handleDrop(e, 'batch')}
                onClick={() => batchFileInputRef.current?.click()}
                style={{ width: '100px', height: '100px', backgroundColor: dragActive.batch ? '#fff8cc' : '#fcf8e3', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', border: dragActive.batch ? '2px dashed #d35400' : '2px dashed #d8c383', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s ease' }}
              >
                {batchImagePreview ? <img src={batchImagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '11px', color: dragActive.batch ? '#d35400' : '#856404', textAlign: 'center', fontWeight: dragActive.batch ? 'bold' : 'normal' }}>{dragActive.batch ? "Drop\nHere" : "Drag/Click"}</span>}
              </div>
              <input ref={batchFileInputRef} type="file" accept="image/*" onChange={(e) => handleFileSelect(e, 'batch')} style={{ display: 'none' }} />
              
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <input type="text" placeholder="Batch No. (e.g. BATCH-01)" required value={stockData.batch_number} onChange={e => setStockData({...stockData, batch_number: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
                <input type="number" step="0.01" placeholder="Quantity Received" required value={stockData.current_quantity} onChange={e => setStockData({...stockData, current_quantity: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
                
                {products.find(p => p.id === showStockForm)?.unit_of_measure === 'Units' ? (
                  <input type="number" step="0.001" placeholder="Weight per Unit (KG)" required value={stockData.unit_weight_kg} onChange={e => setStockData({...stockData, unit_weight_kg: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #f39c12', backgroundColor: '#fffaf0' }} title="Required for delivery fee calculations" />
                ) : <div />}

                <input type="number" step="0.01" placeholder="Cost Price (Rs.)" required value={stockData.buying_price} onChange={e => setStockData({...stockData, buying_price: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
                <input type="number" step="0.01" placeholder="Retail Price (Rs.)" required value={stockData.retail_price} onChange={e => setStockData({...stockData, retail_price: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
              <label style={{ flex: 1, fontSize: '13px', color: '#2c3e50', fontWeight: 'bold' }}>Manufacture Date
                <input type="date" value={stockData.manufacture_date} onChange={e => setStockData({...stockData, manufacture_date: e.target.value})} style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
              </label>
              <label style={{ flex: 1, fontSize: '13px', color: '#2c3e50', fontWeight: 'bold' }}>Expiry Date
                <input type="date" required value={stockData.expiry_date} onChange={e => setStockData({...stockData, expiry_date: e.target.value})} style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px', borderRadius: '5px', border: '1px solid #e74c3c', boxSizing: 'border-box' }} />
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => { setShowStockForm(null); setStockData(initialStockState); }} style={{ backgroundColor: 'transparent', border: '1px solid #95a5a6', color: '#7f8c8d', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Add Inventory to DB</button>
            </div>
          </form>
        </div>
      )}

{/* MAIN INVENTORY TABLE */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
          <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eee' }}>
            <tr>
              <th style={{ padding: '15px', color: '#7f8c8d', fontSize: '14px' }}>SKU</th>
              <th style={{ padding: '15px', color: '#7f8c8d', fontSize: '14px' }}>Product Name</th>
              <th style={{ padding: '15px', color: '#7f8c8d', fontSize: '14px' }}>Total Stock</th>
              <th style={{ padding: '15px', color: '#7f8c8d', fontSize: '14px' }}>Cost</th>
              <th style={{ padding: '15px', color: '#7f8c8d', fontSize: '14px' }}>Retail</th>
              <th style={{ padding: '15px', color: '#7f8c8d', fontSize: '14px' }}>Profit/Unit</th>
              <th style={{ padding: '15px', color: '#7f8c8d', fontSize: '14px' }}>Est. Total Profit</th>
              <th style={{ padding: '15px', color: '#7f8c8d', fontSize: '14px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((item) => {
              // Calculate financial metrics dynamically based on the latest batch
              const profitPerUnit = item.retail_price - item.buying_price;
              const estTotalProfit = profitPerUnit * item.current_quantity;

              return (
                <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#34495e', fontSize: '14px' }}>{item.sku}</td>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {item.image_url ? <img src={item.image_url} alt="Product" style={{ width: '30px', height: '30px', borderRadius: '4px', objectFit: 'cover' }} /> : <div style={{ width: '30px', height: '30px', backgroundColor: '#eee', borderRadius: '4px' }}></div>}
                    <div>
                      <span style={{ fontSize: '14px' }}>{item.product_name}</span> <br/>
                      <span style={{ fontSize: '11px', color: '#95a5a6', fontWeight: 'normal' }}>{item.category_name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: item.current_quantity > 0 ? '#27ae60' : '#e74c3c', fontSize: '14px' }}>{item.current_quantity} {item.unit_of_measure}</td>
                  
                  {/* NEW FINANCIAL COLUMNS */}
                  <td style={{ padding: '15px', fontWeight: '500', color: '#7f8c8d', fontSize: '14px' }}>Rs. {item.buying_price.toFixed(2)}</td>
                  <td style={{ padding: '15px', fontWeight: '500', color: '#2c3e50', fontSize: '14px' }}>Rs. {item.retail_price.toFixed(2)}</td>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#2980b9', fontSize: '14px' }}>Rs. {profitPerUnit.toFixed(2)}</td>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#8e44ad', fontSize: '14px' }}>Rs. {estTotalProfit.toFixed(2)}</td>
                  
                  <td style={{ padding: '15px', display: 'flex', gap: '8px' }}>
                    <button onClick={() => openReceiveStock(item)} style={{ padding: '8px 12px', backgroundColor: '#eef2f5', color: '#2c3e50', border: '1px solid #dcdde1', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>+ Stock</button>
                    <button onClick={() => handleEditProduct(item)} style={{ padding: '8px 12px', backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Edit Product</button>
                    {/* RESTORED: Batch Manager Button */}
                    <button onClick={() => handleOpenBatchManager(item)} style={{ padding: '8px 12px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Manage Prices</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* --- RESTORED: BATCH MANAGER MODAL (WITH EDIT/CANCEL & HISTORY BUTTONS) --- */}
      {selectedProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 900 }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '800px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, color: '#2c3e50' }}>Stock Batches: {selectedProduct.product_name}</h3>
              <button onClick={() => {setSelectedProduct(null); setEditingBatchId(null);}} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✖</button>
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

      {/* --- RESTORED: BATCH AUDIT LOG MODAL --- */}
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
              <ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={(c) => setCompletedCrop(c)} aspect={1} circularCrop={false}>
                <img ref={imgRef} src={imgSrc} alt="Crop preview" style={{ maxWidth: '100%' }} />
              </ReactCrop>
            </div>
            <div style={{ display: 'flex', gap: '15px', width: '100%', justifyContent: 'flex-end' }}>
              <button onClick={() => { setCropModalOpen(false); setImgSrc(''); }} style={{ padding: '10px 20px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
              <button onClick={handleSaveCrop} style={{ padding: '10px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Crop & Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminInventory;