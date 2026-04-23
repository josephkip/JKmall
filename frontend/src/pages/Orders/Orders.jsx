import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI } from '../../services/api';
import { Package, MapPin, Clock, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const statusColors = { pending: '#f39c12', paid: '#3498db', processing: '#9b59b6', out_for_delivery: '#e67e22', delivered: '#27ae60', cancelled: '#e74c3c' };

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersAPI.getMy().then(r => { setOrders(r.data.data.orders); setLoading(false); }).catch(() => { toast.error('Failed to load orders'); setLoading(false); });
  }, []);

  if (loading) return <div className="loader-container"><div className="loader"></div></div>;

  return (
    <div className="container fade-in" style={{ paddingTop: 40, maxWidth: 900 }}>
      <h1 style={{ marginBottom: 30 }}><Package size={28} style={{ verticalAlign: 'middle' }} /> My Orders</h1>
      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Package size={80} color="var(--gray)" />
          <h3 style={{ marginTop: 20 }}>No orders yet</h3>
          <Link to="/" className="btn btn-primary" style={{ marginTop: 20 }}>Start Shopping</Link>
        </div>
      ) : (
        orders.map(order => (
          <div key={order.id} className="card" style={{ marginBottom: 15, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 15 }}>
              <div>
                <h3 style={{ marginBottom: 5 }}>#{order.order_number}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}><Clock size={14} style={{ verticalAlign: 'middle' }} /> {new Date(order.created_at).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</p>
              </div>
              <span style={{ background: statusColors[order.status] + '20', color: statusColors[order.status], padding: '6px 16px', borderRadius: 20, fontWeight: 600, fontSize: '0.85rem', textTransform: 'capitalize' }}>{order.status.replace('_', ' ')}</span>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--primary)' }}>KES {parseFloat(order.total_amount).toLocaleString()}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{order.items?.length} item(s)</p>
              </div>
              <Link to={`/orders/${order.id}/track`} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                <MapPin size={16} /> Track <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Orders;
