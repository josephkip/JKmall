import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

const Cart = () => {
  const { items, updateQuantity, removeItem, clearCart, subtotal, deliveryFee, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_URL || '';

  const handleCheckout = () => {
    if (!user) return navigate('/login?redirect=checkout');
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="container fade-in" style={{ paddingTop: 80, textAlign: 'center' }}>
        <ShoppingBag size={80} color="var(--gray)" />
        <h2 style={{ marginTop: 20 }}>Your cart is empty</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 30 }}>Add some products to get started!</p>
        <Link to="/" className="btn btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="container fade-in" style={{ paddingTop: 40 }}>
      <h1 style={{ marginBottom: 30 }}>Shopping Cart</h1>
      <div className="cart-layout">
        <div className="cart-items">
          {items.map(item => (
            <div key={item.product_id} className="cart-item card">
              <img src={item.image ? `${apiBase}${item.image}` : '/placeholder-product.png'} alt={item.name} className="item-image" />
              <div className="item-info">
                <Link to={`/product/${item.product_id}`}><h3>{item.name}</h3></Link>
                <p className="item-price">KES {item.price.toLocaleString()}</p>
              </div>
              <div className="item-quantity">
                <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)}><Minus size={16} /></button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.product_id, Math.min(item.stock, item.quantity + 1))}><Plus size={16} /></button>
              </div>
              <p className="item-total">KES {(item.price * item.quantity).toLocaleString()}</p>
              <button className="remove-btn" onClick={() => removeItem(item.product_id)}><Trash2 size={18} /></button>
            </div>
          ))}
          <button onClick={clearCart} style={{ background: 'none', color: 'var(--secondary)', marginTop: 10, fontWeight: 600 }}>Clear Cart</button>
        </div>

        <div className="order-summary card">
          <h3>Order Summary</h3>
          <div className="summary-row"><span>Subtotal</span><span>KES {subtotal.toLocaleString()}</span></div>
          <div className="summary-row"><span>Delivery Fee</span><span>KES {deliveryFee.toLocaleString()}</span></div>
          <hr style={{ margin: '15px 0', border: 'none', borderTop: '1px solid var(--border)' }} />
          <div className="summary-row total"><span>Total</span><span>KES {total.toLocaleString()}</span></div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 20, padding: 14 }} onClick={handleCheckout}>
            Checkout <ArrowRight size={18} />
          </button>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 15, textAlign: 'center' }}>Pay securely via M-Pesa</p>
        </div>
      </div>

      <style jsx>{`
        .cart-layout { display: grid; grid-template-columns: 1fr 360px; gap: 30px; align-items: start; }
        .cart-item { display: flex; align-items: center; gap: 20px; margin-bottom: 15px; }
        .item-image { width: 100px; height: 100px; object-fit: cover; border-radius: var(--radius); }
        .item-info { flex: 1; }
        .item-info h3 { font-size: 1.1rem; margin-bottom: 5px; }
        .item-price { color: var(--text-muted); font-size: 0.9rem; }
        .item-quantity { display: flex; align-items: center; border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
        .item-quantity button { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: var(--light); }
        .item-quantity span { width: 40px; text-align: center; font-weight: 600; }
        .item-total { font-weight: 700; color: var(--primary); min-width: 120px; text-align: right; }
        .remove-btn { background: none; color: var(--text-muted); }
        .remove-btn:hover { color: var(--secondary); }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 0.95rem; }
        .summary-row.total { font-size: 1.3rem; font-weight: 700; color: var(--primary); }
        @media (max-width: 768px) { .cart-layout { grid-template-columns: 1fr; } .cart-item { flex-wrap: wrap; } .item-total { min-width: auto; } }
      `}</style>
    </div>
  );
};

export default Cart;
