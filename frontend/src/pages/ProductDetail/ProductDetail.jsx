import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { productsAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { ShoppingCart, Minus, Plus, Star, Truck, Shield, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const ProductDetail = () => {
  const { id } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    productsAPI.getOne(id)
      .then(res => { setProduct(res.data.data); setLoading(false); })
      .catch(() => { toast.error('Product not found'); setLoading(false); });
  }, [id]);

  if (loading) return <div className="loader-container"><div className="loader"></div></div>;
  if (!product) return <div className="container" style={{ padding: '50px', textAlign: 'center' }}><h2>Product not found</h2></div>;

  const apiBase = import.meta.env.VITE_API_URL || '';
  const images = product.images?.length ? product.images : ['/placeholder-product.png'];
  const discount = product.original_price ? Math.round((1 - product.price / product.original_price) * 100) : 0;

  return (
    <div className="container fade-in" style={{ paddingTop: 40 }}>
      <div className="detail-grid">
        <div className="images-section">
          <div className="main-image">
            <img src={`${apiBase}${images[selectedImage]}`} alt={product.name} />
            {discount > 0 && <span className="discount-badge">-{discount}%</span>}
          </div>
          {images.length > 1 && (
            <div className="thumbnails">
              {images.map((img, i) => (
                <img key={i} src={`${apiBase}${img}`} alt="" className={i === selectedImage ? 'active' : ''} onClick={() => setSelectedImage(i)} />
              ))}
            </div>
          )}
        </div>

        <div className="info-section">
          <span className="category-tag">{product.category?.name || 'Uncategorized'}</span>
          <h1>{product.name}</h1>
          
          <div className="rating-row">
            {[...Array(5)].map((_, i) => <Star key={i} size={18} fill={i < Math.round(product.rating) ? '#f39c12' : 'none'} color="#f39c12" />)}
            <span>({product.review_count} reviews)</span>
          </div>

          <div className="price-block">
            <span className="price">KES {parseFloat(product.price).toLocaleString()}</span>
            {product.original_price && <span className="old-price">KES {parseFloat(product.original_price).toLocaleString()}</span>}
          </div>

          <p className="description">{product.description || 'No description available.'}</p>

          <div className="stock-info">
            {product.stock > 0 ? (
              <span className="in-stock">✓ In Stock ({product.stock} available)</span>
            ) : (
              <span className="out-of-stock">✗ Out of Stock</span>
            )}
          </div>

          <div className="quantity-row">
            <div className="quantity-control">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={18} /></button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}><Plus size={18} /></button>
            </div>
            <button className="btn btn-primary btn-lg" onClick={() => addItem(product, quantity)} disabled={product.stock <= 0}>
              <ShoppingCart size={20} /> Add to Cart
            </button>
          </div>

          <div className="features-grid">
            <div className="feature"><Truck size={20} color="var(--primary)" /><div><strong>Boda-Boda Delivery</strong><span>Fast delivery across Nairobi</span></div></div>
            <div className="feature"><Shield size={20} color="var(--primary)" /><div><strong>Secure Payment</strong><span>M-Pesa STK Push</span></div></div>
            <div className="feature"><RotateCcw size={20} color="var(--primary)" /><div><strong>Easy Returns</strong><span>7-day return policy</span></div></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; }
        .main-image { position: relative; border-radius: var(--radius); overflow: hidden; background: white; box-shadow: var(--shadow); }
        .main-image img { width: 100%; height: 450px; object-fit: cover; }
        .discount-badge { position: absolute; top: 15px; left: 15px; background: var(--secondary); color: white; padding: 5px 12px; border-radius: 20px; font-weight: 700; font-size: 0.9rem; }
        .thumbnails { display: flex; gap: 10px; margin-top: 15px; }
        .thumbnails img { width: 80px; height: 80px; object-fit: cover; border-radius: var(--radius); cursor: pointer; border: 2px solid transparent; transition: border 0.2s; }
        .thumbnails img.active { border-color: var(--primary); }
        .category-tag { display: inline-block; background: var(--light); color: var(--text-muted); padding: 5px 15px; border-radius: 20px; font-size: 0.85rem; margin-bottom: 10px; }
        .info-section h1 { font-size: 2rem; margin-bottom: 10px; }
        .rating-row { display: flex; align-items: center; gap: 5px; margin-bottom: 20px; color: var(--text-muted); font-size: 0.9rem; }
        .price-block { margin-bottom: 20px; }
        .price { font-size: 2rem; font-weight: 800; color: var(--primary); }
        .old-price { font-size: 1.2rem; color: var(--text-muted); text-decoration: line-through; margin-left: 15px; }
        .description { color: var(--text-muted); margin-bottom: 20px; line-height: 1.8; }
        .in-stock { color: var(--primary); font-weight: 600; }
        .out-of-stock { color: var(--secondary); font-weight: 600; }
        .stock-info { margin-bottom: 25px; }
        .quantity-row { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; }
        .quantity-control { display: flex; align-items: center; border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
        .quantity-control button { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: var(--light); }
        .quantity-control span { width: 50px; text-align: center; font-weight: 600; }
        .btn-lg { padding: 14px 30px; font-size: 1.1rem; }
        .features-grid { display: grid; grid-template-columns: 1fr; gap: 15px; padding-top: 20px; border-top: 1px solid var(--border); }
        .feature { display: flex; align-items: center; gap: 12px; }
        .feature strong { display: block; font-size: 0.9rem; }
        .feature span { font-size: 0.8rem; color: var(--text-muted); }
        @media (max-width: 768px) { .detail-grid { grid-template-columns: 1fr; gap: 30px; } .main-image img { height: 300px; } }
      `}</style>
    </div>
  );
};

export default ProductDetail;
