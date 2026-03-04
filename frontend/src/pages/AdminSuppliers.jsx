import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ContactLink = ({ text, type }) => {
  const [copied, setCopied] = useState(false);
  
  if (!text) return <span style={{ color: '#95a5a6', fontSize: '13px' }}>N/A</span>;
  
  const href = type === 'email' ? `mailto:${text}` : `tel:${text}`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); 
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <a href={href} style={{ color: '#3498db', textDecoration: 'none', fontSize: '14px' }}>
        {text}
      </a>
      <button onClick={handleCopy} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: copied ? '#27ae60' : '#95a5a6', transition: 'color 0.2s' }} title="Copy to clipboard">
        {copied ? '✅' : '📋'}
      </button>
    </div>
  );
};

function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // Track if we are editing
  
  // History Modal State
  const [historyLog, setHistoryLog] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  const navigate = useNavigate();
  
  const initialFormState = { name: '', contact_email: '', contact_phone: '', contact_person: '', address: '', payment_terms: '' };
  const [formData, setFormData] = useState(initialFormState);

  const fetchSuppliers = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    const res = await fetch('http://localhost:8000/suppliers/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setSuppliers(await res.json());
  };

  useEffect(() => { fetchSuppliers(); }, [navigate]);

  const handleEditClick = (supplier) => {
    setFormData({
      name: supplier.name || '',
      contact_email: supplier.contact_email || '',
      contact_phone: supplier.contact_phone || '',
      contact_person: supplier.contact_person || '',
      address: supplier.address || '',
      payment_terms: supplier.payment_terms || ''
    });
    setEditingId(supplier.id);
    setShowForm(true);
  };

  const handleViewHistory = async (supplierId) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:8000/suppliers/${supplierId}/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      const data = await res.json();
      setHistoryLog(data);
      setShowHistoryModal(true);
    } else {
      alert("Failed to fetch history");
    }
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    const payload = {
      name: formData.name.trim(),
      contact_email: formData.contact_email.trim() || null,
      contact_phone: formData.contact_phone.trim() || null,
      contact_person: formData.contact_person.trim() || null,
      address: formData.address.trim() || null,
      payment_terms: formData.payment_terms.trim() || null,
    };

    const url = editingId 
      ? `http://localhost:8000/suppliers/${editingId}` 
      : 'http://localhost:8000/suppliers/';
      
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert(`Supplier ${editingId ? 'updated' : 'added'} successfully!`);
      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormState);
      fetchSuppliers();
    } else {
      const err = await res.json();
      alert("Error: " + err.detail);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormState);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#2c3e50', margin: 0 }}>Supplier Management 🏢</h2>
        <button onClick={showForm ? handleCancelForm : () => setShowForm(true)} style={{ backgroundColor: showForm ? '#e74c3c' : '#2980b9', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          {showForm ? "Cancel" : "+ Add New Supplier"}
        </button>
      </div>

      {showForm && (
        <div style={{ backgroundColor: editingId ? '#fdfbf7' : 'white', padding: '25px', borderRadius: '12px', marginBottom: '20px', border: editingId ? '1px solid #f39c12' : 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, color: editingId ? '#e67e22' : '#2c3e50' }}>
            {editingId ? "✏️ Edit Supplier" : "Register Supplier"}
          </h3>
          <form onSubmit={handleSaveSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', gap: '15px' }}>
              <input type="text" placeholder="Company Name *" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }} />
              <input type="text" placeholder="Contact Person" value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }} />
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <input type="email" placeholder="Email Address" value={formData.contact_email} onChange={e => setFormData({...formData, contact_email: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }} />
              <input type="text" placeholder="Phone Number" value={formData.contact_phone} onChange={e => setFormData({...formData, contact_phone: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }} />
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <input type="text" placeholder="Physical Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 2 }} />
              <input type="text" placeholder="Payment Terms (e.g., Net 30)" value={formData.payment_terms} onChange={e => setFormData({...formData, payment_terms: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }} />
            </div>
            <button type="submit" style={{ padding: '12px', backgroundColor: editingId ? '#e67e22' : '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', alignSelf: 'flex-start' }}>
              {editingId ? "Update Supplier Info" : "Save Supplier"}
            </button>
          </form>
        </div>
      )}

      {/* Expanded Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eee' }}>
            <tr>
              <th style={{ padding: '15px', color: '#7f8c8d', width: '60px' }}>ID</th>
              <th style={{ padding: '15px', color: '#7f8c8d' }}>Company</th>
              <th style={{ padding: '15px', color: '#7f8c8d' }}>Contact Person</th>
              <th style={{ padding: '15px', color: '#7f8c8d' }}>Email</th>
              <th style={{ padding: '15px', color: '#7f8c8d' }}>Phone</th>
              <th style={{ padding: '15px', color: '#7f8c8d' }}>Terms</th>
              <th style={{ padding: '15px', color: '#7f8c8d', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#95a5a6' }}>No suppliers registered yet.</td></tr>
            ) : (
              suppliers.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#34495e' }}>#{s.id}</td>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#2c3e50' }}>{s.name}</td>
                  <td style={{ padding: '15px', color: '#555' }}>{s.contact_person || <span style={{ color: '#ccc' }}>-</span>}</td>
                  <td style={{ padding: '15px' }}><ContactLink text={s.contact_email} type="email" /></td>
                  <td style={{ padding: '15px' }}><ContactLink text={s.contact_phone} type="phone" /></td>
                  <td style={{ padding: '15px', color: '#555', fontSize: '14px' }}>
                    {s.payment_terms ? <span style={{ backgroundColor: '#eef2f5', padding: '4px 8px', borderRadius: '4px' }}>{s.payment_terms}</span> : <span style={{ color: '#ccc' }}>-</span>}
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <button onClick={() => handleEditClick(s)} style={{ marginRight: '8px', padding: '6px 10px', backgroundColor: '#f1c40f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                      Edit
                    </button>
                    <button onClick={() => handleViewHistory(s.id)} style={{ padding: '6px 10px', backgroundColor: '#95a5a6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                      History
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* History ModalOverlay */}
      {showHistoryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0 }}>Audit Log</h3>
              <button onClick={() => setShowHistoryModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#7f8c8d' }}>✖</button>
            </div>
            
            {historyLog.length === 0 ? (
              <p style={{ color: '#95a5a6', textAlign: 'center' }}>No edits have been made to this supplier.</p>
            ) : (
              historyLog.map(log => {
                const changes = JSON.parse(log.changes);
                return (
                  <div key={log.id} style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '8px', borderLeft: '4px solid #3498db' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#7f8c8d' }}>
                      <strong>Admin ID:</strong> {log.edited_by} • {new Date(log.timestamp).toLocaleString()}
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#2c3e50' }}>
                      {Object.keys(changes).map(field => (
                        <li key={field}>
                          <strong>{field.replace('_', ' ')}:</strong> <span style={{ textDecoration: 'line-through', color: '#e74c3c' }}>{changes[field].old || 'N/A'}</span> ➔ <span style={{ color: '#27ae60', fontWeight: 'bold' }}>{changes[field].new || 'N/A'}</span>
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

    </div>
  );
}

export default AdminSuppliers;