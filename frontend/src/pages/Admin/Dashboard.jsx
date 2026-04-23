import React, { useState, useEffect, useRef } from 'react';
import { adminAPI, ordersAPI, productsAPI, authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LayoutDashboard, Package, ShoppingCart, Users, TrendingUp, AlertTriangle, Plus, Edit, Trash2, Settings, Lock, Upload, X, Image } from 'lucide-react';
import toast from 'react-hot-toast';

const tabs = ['Dashboard', 'Products', 'Orders', 'Users', 'Settings'];
const statusColors = { pending: '#f39c12', paid: '#3498db', processing: '#9b59b6', out_for_delivery: '#e67e22', delivered: '#27ae60', cancelled: '#e74c3c' };
const tabIcons = { Dashboard: <LayoutDashboard size={18}/>, Products: <Package size={18}/>, Orders: <ShoppingCart size={18}/>, Users: <Users size={18}/>, Settings: <Settings size={18}/> };

const Dashboard = () => {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', description: '', price: '', original_price: '', stock: '', category_id: '', is_featured: false });
  const [productImages, setProductImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { loadData(); }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'Dashboard') { const r = await adminAPI.getDashboard(); setStats(r.data.data); }
      else if (activeTab === 'Products') { const [p, c] = await Promise.all([productsAPI.getAll({ limit: 50 }), adminAPI.getCategories()]); setProducts(p.data.data.products); setCategories(c.data.data); }
      else if (activeTab === 'Orders') { const r = await ordersAPI.getAll({ limit: 50 }); setOrders(r.data.data.orders); }
      else if (activeTab === 'Users') { const r = await adminAPI.getUsers({ limit: 50 }); setUsers(r.data.data.users); }
    } catch (err) { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  // Image handling
  const handleImageSelect = (e) => {
    const files = [...e.target.files];
    setProductImages(prev => [...prev, ...files]);
    const previews = files.map(f => URL.createObjectURL(f));
    setImagePreview(prev => [...prev, ...previews]);
  };
  const removeNewImage = (idx) => {
    setProductImages(prev => prev.filter((_, i) => i !== idx));
    setImagePreview(prev => { URL.revokeObjectURL(prev[idx]); return prev.filter((_, i) => i !== idx); });
  };
  const removeExistingImage = (imgPath) => { setExistingImages(prev => prev.filter(p => p !== imgPath)); };

  const openProductModal = (product = null) => {
    if (product) {
      setEditProduct(product);
      setProductForm({ name: product.name, description: product.description || '', price: product.price, original_price: product.original_price || '', stock: product.stock, category_id: product.category_id || '', is_featured: product.is_featured });
      setExistingImages(product.images || []);
    } else {
      setEditProduct(null);
      setProductForm({ name: '', description: '', price: '', original_price: '', stock: '', category_id: '', is_featured: false });
      setExistingImages([]);
    }
    setProductImages([]);
    setImagePreview([]);
    setShowProductModal(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(productForm).forEach(([k, v]) => { if (v !== '' && v !== null) fd.append(k, v); });
    productImages.forEach(f => fd.append('images', f));
    if (editProduct) {
      const removed = (editProduct.images || []).filter(img => !existingImages.includes(img));
      if (removed.length) fd.append('remove_images', JSON.stringify(removed));
    }
    try {
      if (editProduct) await productsAPI.update(editProduct.id, fd);
      else await productsAPI.create(fd);
      toast.success(editProduct ? 'Product updated!' : 'Product created!');
      setShowProductModal(false);
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDeleteProduct = async (id) => { if (!confirm('Deactivate this product?')) return; try { await productsAPI.delete(id); toast.success('Deactivated'); loadData(); } catch { toast.error('Failed'); } };
  const handleOrderStatus = async (id, status) => { try { await ordersAPI.updateStatus(id, { status }); toast.success('Updated'); loadData(); } catch { toast.error('Failed'); } };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) return toast.error('Passwords do not match');
    if (passwordForm.new_password.length < 6) return toast.error('Password must be at least 6 characters');
    setPwLoading(true);
    try {
      await authAPI.changePassword({ current_password: passwordForm.current_password, new_password: passwordForm.new_password });
      toast.success('Password changed successfully!');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally { setPwLoading(false); }
  };

  const apiBase = import.meta.env.VITE_API_URL || '';
  const statCards = stats ? [
    { label: 'Total Revenue', value: `KES ${(stats.stats.totalRevenue || 0).toLocaleString()}`, icon: <TrendingUp size={24} />, color: '#27ae60' },
    { label: 'Total Orders', value: stats.stats.totalOrders, icon: <ShoppingCart size={24} />, color: '#3498db' },
    { label: 'Products', value: stats.stats.totalProducts, icon: <Package size={24} />, color: '#9b59b6' },
    { label: 'Customers', value: stats.stats.totalCustomers, icon: <Users size={24} />, color: '#e67e22' },
    { label: 'Today Orders', value: stats.stats.todayOrders, icon: <ShoppingCart size={24} />, color: '#1abc9c' },
    { label: 'Low Stock', value: stats.stats.lowStockProducts, icon: <AlertTriangle size={24} />, color: '#e74c3c' },
  ] : [];

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>
      <aside className="admin-sidebar">
        <h2 className="sidebar-title"><LayoutDashboard size={20} /> Admin Panel</h2>
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`sidebar-btn ${activeTab === t ? 'active' : ''}`}>
            {tabIcons[t]} {t}
          </button>
        ))}
      </aside>

      <main style={{ flex: 1, padding: 30, overflow: 'auto' }}>
        {loading && activeTab !== 'Settings' ? <div className="loader-container"><div className="loader"></div></div> : (
          <>
            {/* Dashboard */}
            {activeTab === 'Dashboard' && stats && (
              <div className="fade-in">
                <h2 style={{ marginBottom: 25 }}>Dashboard Overview</h2>
                <div className="stat-grid">{statCards.map((c, i) => (
                  <div key={i} className="card stat-card">
                    <div className="stat-icon" style={{ background: c.color + '20', color: c.color }}>{c.icon}</div>
                    <div><p className="stat-label">{c.label}</p><p className="stat-value">{c.value}</p></div>
                  </div>
                ))}</div>
                {stats.revenueChart?.length > 0 && (
                  <div className="card" style={{ marginBottom: 30 }}>
                    <h3 style={{ marginBottom: 20 }}>Revenue (Last 7 Days)</h3>
                    <ResponsiveContainer width="100%" height={300}><BarChart data={stats.revenueChart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip formatter={v => `KES ${Number(v).toLocaleString()}`} /><Bar dataKey="revenue" fill="var(--primary)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
                  </div>
                )}
                <div className="card">
                  <h3 style={{ marginBottom: 15 }}>Recent Orders</h3>
                  <table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
                  <tbody>{stats.recentOrders?.map(o => (
                    <tr key={o.id}><td>{o.order_number}</td><td>{o.customer?.name}</td><td style={{ fontWeight: 600 }}>KES {parseFloat(o.total_amount).toLocaleString()}</td>
                    <td><span className="status-badge" style={{ background: (statusColors[o.status]||'#999')+'20', color: statusColors[o.status] }}>{o.status.replace('_',' ')}</span></td></tr>
                  ))}</tbody></table>
                </div>
              </div>
            )}

            {/* Products */}
            {activeTab === 'Products' && (
              <div className="fade-in">
                <div className="flex justify-between items-center" style={{ marginBottom: 25 }}>
                  <h2>Products ({products.length})</h2>
                  <button className="btn btn-primary" onClick={() => openProductModal()}><Plus size={18} /> Add Product</button>
                </div>
                <div className="card" style={{ overflowX: 'auto' }}>
                  <table className="admin-table"><thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Category</th><th>Images</th><th>Actions</th></tr></thead>
                  <tbody>{products.map(p => (
                    <tr key={p.id}>
                      <td style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {p.images?.[0] ? <img src={`${apiBase}${p.images[0]}`} alt="" className="product-thumb" /> : <div className="product-thumb-empty"><Image size={16}/></div>}
                        <span style={{ fontWeight: 600 }}>{p.name}</span>
                      </td>
                      <td>KES {parseFloat(p.price).toLocaleString()}</td>
                      <td style={{ color: p.stock <= 5 ? 'var(--secondary)' : 'inherit', fontWeight: p.stock <= 5 ? 700 : 400 }}>{p.stock}</td>
                      <td>{p.category?.name || '-'}</td>
                      <td>{p.images?.length || 0} imgs</td>
                      <td>
                        <button onClick={() => openProductModal(p)} className="icon-btn edit"><Edit size={16} /></button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="icon-btn delete"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}</tbody></table>
                </div>

                {/* Product Modal with Image Upload */}
                {showProductModal && (
                  <div className="modal-overlay">
                    <div className="card modal-card">
                      <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
                        <h2>{editProduct ? 'Edit Product' : 'Add Product'}</h2>
                        <button onClick={() => setShowProductModal(false)} style={{ background: 'none' }}><X size={24} /></button>
                      </div>
                      <form onSubmit={handleProductSubmit}>
                        <input type="text" placeholder="Product Name *" required value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="form-input" />
                        <textarea rows={3} placeholder="Description" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} className="form-input" />
                        <div className="form-row">
                          <input type="number" placeholder="Price (KES) *" required value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="form-input" />
                          <input type="number" placeholder="Original Price" value={productForm.original_price} onChange={e => setProductForm({...productForm, original_price: e.target.value})} className="form-input" />
                        </div>
                        <div className="form-row">
                          <input type="number" placeholder="Stock" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} className="form-input" />
                          <select value={productForm.category_id} onChange={e => setProductForm({...productForm, category_id: e.target.value})} className="form-input">
                            <option value="">Select Category</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                        <label className="checkbox-label"><input type="checkbox" checked={productForm.is_featured} onChange={e => setProductForm({...productForm, is_featured: e.target.checked})} /> Featured Product</label>

                        {/* Image Upload Section */}
                        <div className="image-upload-section">
                          <label className="upload-label">Product Images</label>
                          {existingImages.length > 0 && (
                            <div className="image-grid">
                              {existingImages.map((img, i) => (
                                <div key={`ex-${i}`} className="image-thumb">
                                  <img src={`${apiBase}${img}`} alt="" />
                                  <button type="button" onClick={() => removeExistingImage(img)} className="remove-img"><X size={14} /></button>
                                </div>
                              ))}
                            </div>
                          )}
                          {imagePreview.length > 0 && (
                            <div className="image-grid">
                              {imagePreview.map((url, i) => (
                                <div key={`new-${i}`} className="image-thumb new">
                                  <img src={url} alt="" />
                                  <button type="button" onClick={() => removeNewImage(i)} className="remove-img"><X size={14} /></button>
                                  <span className="new-badge">NEW</span>
                                </div>
                              ))}
                            </div>
                          )}
                          <button type="button" className="upload-btn" onClick={() => fileInputRef.current?.click()}>
                            <Upload size={18} /> Add Images
                          </button>
                          <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
                        </div>

                        <div className="form-row" style={{ marginTop: 20 }}>
                          <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>{editProduct ? 'Update Product' : 'Create Product'}</button>
                          <button type="button" className="btn" style={{ background: 'var(--light)' }} onClick={() => setShowProductModal(false)}>Cancel</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Orders */}
            {activeTab === 'Orders' && (
              <div className="fade-in">
                <h2 style={{ marginBottom: 25 }}>Orders ({orders.length})</h2>
                <div className="card" style={{ overflowX: 'auto' }}>
                  <table className="admin-table"><thead><tr><th>Order #</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Update</th></tr></thead>
                  <tbody>{orders.map(o => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 600 }}>{o.order_number}</td><td>{o.customer?.name}</td><td>{o.items?.length}</td>
                      <td style={{ fontWeight: 600 }}>KES {parseFloat(o.total_amount).toLocaleString()}</td>
                      <td><span className="status-badge" style={{ background: (statusColors[o.status]||'#999')+'20', color: statusColors[o.status] }}>{o.status.replace('_',' ')}</span></td>
                      <td><select value={o.status} onChange={e => handleOrderStatus(o.id, e.target.value)} className="status-select">
                        {['pending','paid','processing','out_for_delivery','delivered','cancelled'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                      </select></td>
                    </tr>
                  ))}</tbody></table>
                </div>
              </div>
            )}

            {/* Users */}
            {activeTab === 'Users' && (
              <div className="fade-in">
                <h2 style={{ marginBottom: 25 }}>Users ({users.length})</h2>
                <div className="card" style={{ overflowX: 'auto' }}>
                  <table className="admin-table"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th></tr></thead>
                  <tbody>{users.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.name}</td><td>{u.email}</td><td>{u.phone || '-'}</td>
                      <td><select value={u.role} onChange={async e => { try { await adminAPI.updateUser(u.id, { role: e.target.value }); toast.success('Updated'); loadData(); } catch { toast.error('Failed'); }}} className="status-select">
                        <option value="customer">Customer</option><option value="admin">Admin</option><option value="rider">Rider</option>
                      </select></td>
                      <td><span style={{ color: u.is_active ? 'var(--primary)' : 'var(--secondary)', fontWeight: 600 }}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                    </tr>
                  ))}</tbody></table>
                </div>
              </div>
            )}

            {/* Settings - Password Change */}
            {activeTab === 'Settings' && (
              <div className="fade-in">
                <h2 style={{ marginBottom: 25 }}><Settings size={24} style={{ verticalAlign: 'middle' }} /> Account Settings</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>
                  <div className="card">
                    <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}><Lock size={20} color="var(--primary)" /> Change Password</h3>
                    <form onSubmit={handlePasswordChange}>
                      <div style={{ marginBottom: 15 }}>
                        <label className="form-label">Current Password</label>
                        <input type="password" className="form-input" placeholder="Enter current password" required value={passwordForm.current_password} onChange={e => setPasswordForm({...passwordForm, current_password: e.target.value})} />
                      </div>
                      <div style={{ marginBottom: 15 }}>
                        <label className="form-label">New Password</label>
                        <input type="password" className="form-input" placeholder="Enter new password (min 6 chars)" required value={passwordForm.new_password} onChange={e => setPasswordForm({...passwordForm, new_password: e.target.value})} />
                      </div>
                      <div style={{ marginBottom: 20 }}>
                        <label className="form-label">Confirm New Password</label>
                        <input type="password" className="form-input" placeholder="Confirm new password" required value={passwordForm.confirm_password} onChange={e => setPasswordForm({...passwordForm, confirm_password: e.target.value})} />
                      </div>
                      <button type="submit" className="btn btn-primary" disabled={pwLoading} style={{ width: '100%', justifyContent: 'center' }}>
                        {pwLoading ? 'Changing...' : 'Change Password'}
                      </button>
                    </form>
                  </div>
                  <div className="card">
                    <h3 style={{ marginBottom: 20 }}>Admin Profile</h3>
                    <div style={{ textAlign: 'center', padding: 20 }}>
                      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, margin: '0 auto 15px' }}>{user?.name?.[0]}</div>
                      <h3>{user?.name}</h3>
                      <p style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 5 }}>{user?.phone}</p>
                      <span style={{ display: 'inline-block', marginTop: 10, background: 'var(--primary)' + '20', color: 'var(--primary)', padding: '4px 16px', borderRadius: 20, fontWeight: 600, textTransform: 'capitalize' }}>{user?.role}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <style>{`
        .admin-sidebar { width: 240px; background: var(--dark); color: white; padding: 30px 0; }
        .sidebar-title { padding: 0 20px; margin-bottom: 30px; font-size: 1.3rem; display: flex; align-items: center; gap: 10px; }
        .sidebar-btn { display: flex; align-items: center; gap: 12px; width: 100%; text-align: left; padding: 12px 25px; background: transparent; color: rgba(255,255,255,0.7); font-size: 0.95rem; border-left: 3px solid transparent; transition: all 0.2s; }
        .sidebar-btn:hover { background: rgba(255,255,255,0.1); color: white; }
        .sidebar-btn.active { background: var(--primary); color: white; border-left-color: white; }
        .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { display: flex; align-items: center; gap: 15px; }
        .stat-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .stat-label { font-size: 0.85rem; color: var(--text-muted); }
        .stat-value { font-size: 1.4rem; font-weight: 700; }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th { text-align: left; padding: 12px 10px; border-bottom: 2px solid var(--border); font-size: 0.9rem; color: var(--text-muted); }
        .admin-table td { padding: 12px 10px; border-bottom: 1px solid var(--border); }
        .status-badge { padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; text-transform: capitalize; }
        .status-select { padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border); font-size: 0.85rem; }
        .product-thumb { width: 40px; height: 40px; border-radius: 6px; object-fit: cover; }
        .product-thumb-empty { width: 40px; height: 40px; border-radius: 6px; background: var(--light); display: flex; align-items: center; justify-content: center; color: var(--text-muted); }
        .icon-btn { background: none; margin-right: 8px; transition: transform 0.2s; }
        .icon-btn:hover { transform: scale(1.2); }
        .icon-btn.edit { color: var(--primary); }
        .icon-btn.delete { color: var(--secondary); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 2000; backdrop-filter: blur(4px); }
        .modal-card { width: 560px; max-height: 90vh; overflow-y: auto; padding: 30px; }
        .form-input { width: 100%; padding: 12px 15px; margin-bottom: 12px; border: 1px solid var(--border); border-radius: var(--radius); font-size: 1rem; transition: border 0.2s; }
        .form-input:focus { outline: none; border-color: var(--primary); }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .form-label { display: block; font-weight: 600; margin-bottom: 8px; font-size: 0.9rem; }
        .checkbox-label { display: flex; align-items: center; gap: 8px; margin-bottom: 15px; cursor: pointer; }
        .image-upload-section { border: 2px dashed var(--border); border-radius: var(--radius); padding: 20px; margin-bottom: 15px; }
        .upload-label { display: block; font-weight: 600; margin-bottom: 12px; font-size: 0.9rem; }
        .image-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
        .image-thumb { position: relative; width: 80px; height: 80px; border-radius: 8px; overflow: hidden; border: 2px solid var(--border); }
        .image-thumb.new { border-color: var(--primary); }
        .image-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .remove-img { position: absolute; top: 2px; right: 2px; width: 22px; height: 22px; border-radius: 50%; background: rgba(231,76,60,0.9); color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; }
        .new-badge { position: absolute; bottom: 2px; left: 2px; background: var(--primary); color: white; font-size: 0.6rem; padding: 1px 5px; border-radius: 3px; font-weight: 700; }
        .upload-btn { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: var(--light); border: 1px solid var(--border); border-radius: var(--radius); cursor: pointer; font-weight: 600; color: var(--text-main); }
        .upload-btn:hover { border-color: var(--primary); color: var(--primary); }
      `}</style>
    </div>
  );
};

export default Dashboard;
