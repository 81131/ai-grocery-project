import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// --- Mini Component for Clickable & Copyable Links ---
const ContactLink = ({ text, type }) => {
  const [copied, setCopied] = useState(false);
  
  if (!text) return <span style={{ color: '#95a5a6', fontSize: '13px' }}>N/A</span>;
  
  const href = type === 'email' ? `mailto:${text}` : `tel:${text}`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset checkmark after 2 seconds
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <a href={href} style={{ color: '#3498db', textDecoration: 'none', fontSize: '14px' }}>
        {text}
      </a>
      <button 
        onClick={handleCopy} 
        style={{ 
          background: 'none', border: 'none', cursor: 'pointer', 
          padding: '2px', color: copied ? '#27ae60' : '#95a5a6',
          transition: 'color 0.2s'
        }}
        title="Copy to clipboard"
      >
        {copied ? '✅' : '📋'}
      </button>
    </div>
  );
};
// ---------------------------------------------------

function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ 
    name: '', contact_email: '', contact_phone: '', contact_person: '', address: '', payment_terms: '' 
  });

  const fetchSuppliers = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    const res = await fetch('http://localhost:8000/suppliers/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setSuppliers(await res.json());
  };

  useEffect(() => { fetchSuppliers(); }, [navigate]);

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    // Clean the data before sending to ensure empty strings become true NULLs
    const payload = {
      name: formData.name.trim(),
      contact_email: formData.contact_email.trim() || null,
      contact_phone: formData.contact_phone.trim() || null,
      contact_person: formData.contact_person.trim() || null,
      address: formData.address.trim() || null,
      payment_terms: formData.payment_terms.trim() || null,
    };

    const res = await fetch('http://localhost:8000/suppliers/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert("Supplier added successfully!");
      setShowForm(false);
      setFormData({ name: '', contact_email: '', contact_phone: '', contact_person: '', address: '', payment_terms: '' });
      fetchSuppliers();
    } else {
      const err = await res.json();
      alert("Error: " + err.detail);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#2c3e50', margin: 0 }}>Supplier Management 🏢</h2>
        <button onClick={() => setShowForm(!showForm)} style={{ backgroundColor: '#2980b9', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          {showForm ? "Cancel" : "+ Add New Supplier"}
        </button>
      </div>

      {showForm && (
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0 }}>Register Supplier</h3>
          <form onSubmit={handleAddSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
            <button type="submit" style={{ padding: '12px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', alignSelf: 'flex-start' }}>Save Supplier</button>
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
              <th style={{ padding: '15px', color: '#7f8c8d' }}>Address</th>
              <th style={{ padding: '15px', color: '#7f8c8d' }}>Terms</th>
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
                  <td style={{ padding: '15px' }}>
                    <ContactLink text={s.contact_email} type="email" />
                  </td>
                  <td style={{ padding: '15px' }}>
                    <ContactLink text={s.contact_phone} type="phone" />
                  </td>
                  <td style={{ padding: '15px', color: '#555', fontSize: '14px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={s.address}>
                    {s.address || <span style={{ color: '#ccc' }}>-</span>}
                  </td>
                  <td style={{ padding: '15px', color: '#555', fontSize: '14px' }}>
                    {s.payment_terms ? <span style={{ backgroundColor: '#eef2f5', padding: '4px 8px', borderRadius: '4px' }}>{s.payment_terms}</span> : <span style={{ color: '#ccc' }}>-</span>}
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

export default AdminSuppliers;