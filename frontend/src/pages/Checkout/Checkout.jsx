import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ordersAPI, mpesaAPI } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { MapPin, Phone, CreditCard, Loader, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Checkout = () => {
  const { items, subtotal, deliveryFee, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [checkoutId, setCheckoutId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [form, setForm] = useState({ delivery_address: '', delivery_notes: '', phone: user?.phone || '' });

  const { on } = useSocket(orderId);

  React.useEffect(() => {
    if (!orderId) return;
    const u1 = on('payment_confirmed', () => { setPaymentStatus('success'); setStep(3); clearCart(); toast.success('Payment confirmed! 🎉'); });
    const u2 = on('payment_failed', (d) => { setPaymentStatus('failed'); toast.error(`Payment failed: ${d.reason}`); });
    return () => { u1(); u2(); };
  }, [orderId]);

  const handleCreateOrder = async () => {
    if (!form.delivery_address.trim()) return toast.error('Enter delivery address');
    if (!form.phone.trim()) return toast.error('Enter M-Pesa phone');
    setLoading(true);
    try {
      const res = await ordersAPI.create({ items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })), delivery_address: form.delivery_address, delivery_notes: form.delivery_notes });
      setOrderId(res.data.data.id);
      setStep(2);
      const mpesa = await mpesaAPI.stkPush({ order_id: res.data.data.id, phone: form.phone });
      setCheckoutId(mpesa.data.data.checkout_request_id);
      setPaymentStatus('pending');
      toast.success('Check your phone for M-Pesa prompt!');
    } catch (err) { toast.error(err.response?.data?.message || 'Order failed'); }
    finally { setLoading(false); }
  };

  const pollStatus = async () => {
    if (!checkoutId) return;
    try {
      const r = await mpesaAPI.checkStatus(checkoutId);
      if (r.data.data.status === 'success') { setPaymentStatus('success'); setStep(3); clearCart(); }
      else if (r.data.data.status === 'failed') setPaymentStatus('failed');
    } catch (e) { console.error(e); }
  };

  if (items.length === 0 && step !== 3) { navigate('/cart'); return null; }

  return (
    <div className="container fade-in" style={{ paddingTop: 40, maxWidth: 700 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30 }}>
        {['Delivery Info', 'M-Pesa Payment', 'Confirmation'].map((l, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, background: step > i ? 'var(--primary)' : 'var(--light)', color: step > i ? 'white' : 'var(--text-muted)', border: `2px solid ${step > i ? 'var(--primary)' : 'var(--border)'}` }}>{step > i + 1 ? '✓' : i + 1}</div>
            <span style={{ fontSize: '0.85rem', marginTop: 5 }}>{l}</span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="card" style={{ padding: 30 }}>
          <h2 style={{ marginBottom: 20 }}><MapPin size={22} style={{ verticalAlign: 'middle' }} /> Delivery Details</h2>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Delivery Address *</label>
            <textarea rows={3} placeholder="e.g., Westlands, Nairobi" value={form.delivery_address} onChange={e => setForm({ ...form, delivery_address: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '1rem' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Delivery Notes</label>
            <input type="text" placeholder="Special instructions" value={form.delivery_notes} onChange={e => setForm({ ...form, delivery_notes: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius)' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}><Phone size={16} style={{ verticalAlign: 'middle' }} /> M-Pesa Phone *</label>
            <input type="tel" placeholder="0712345678" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={{ width: '100%', padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius)' }} />
          </div>
          <div style={{ background: 'var(--light)', padding: 20, borderRadius: 'var(--radius)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span>Subtotal</span><span>KES {subtotal.toLocaleString()}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span>Delivery</span><span>KES {deliveryFee}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.2rem', color: 'var(--primary)', borderTop: '1px solid var(--border)', paddingTop: 10 }}><span>Total</span><span>KES {total.toLocaleString()}</span></div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 14, marginTop: 20 }} onClick={handleCreateOrder} disabled={loading}>
            {loading ? <><Loader size={18} /> Processing...</> : <><CreditCard size={18} /> Pay KES {total.toLocaleString()} via M-Pesa</>}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}><Phone size={50} color="var(--primary)" /></div>
          <h2>M-Pesa Payment</h2>
          <p style={{ color: 'var(--text-muted)', margin: '15px 0' }}>A prompt has been sent to <strong>{form.phone}</strong>. Enter your PIN to pay <strong>KES {total.toLocaleString()}</strong>.</p>
          {paymentStatus === 'pending' && <><div className="loader" style={{ margin: '20px auto' }}></div><p>Waiting for confirmation...</p><button onClick={pollStatus} className="btn" style={{ marginTop: 15, background: 'var(--light)' }}>Check Status</button></>}
          {paymentStatus === 'failed' && <><p style={{ color: 'var(--secondary)', fontWeight: 600 }}>Payment failed.</p><button className="btn btn-primary" style={{ marginTop: 15 }} onClick={() => { setStep(1); setPaymentStatus(null); }}>Retry</button></>}
        </div>
      )}

      {step === 3 && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <CheckCircle size={80} color="var(--primary)" />
          <h2 style={{ marginTop: 20 }}>Order Confirmed! 🎉</h2>
          <p style={{ color: 'var(--text-muted)', margin: '15px 0 30px' }}>Our boda-boda rider will be on the way soon!</p>
          <div style={{ display: 'flex', gap: 15, justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => navigate(`/orders/${orderId}/track`)}>Track Order</button>
            <button className="btn" style={{ background: 'var(--light)' }} onClick={() => navigate('/')}>Continue Shopping</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
