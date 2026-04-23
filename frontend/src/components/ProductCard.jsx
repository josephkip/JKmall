import React from 'react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Eye } from 'lucide-react';

const ProductCard = ({ product }) => {
  const { addItem } = useCart();
  const imageUrl = product.images?.[0] 
    ? (product.images[0].startsWith('http') ? product.images[0] : `${import.meta.env.VITE_API_URL || ''}${product.images[0]}`)
    : '/placeholder-product.png';

  return (
    <div className="card product-card fade-in">
      <div className="product-image-container">
        <img src={imageUrl} alt={product.name} className="product-image" />
        <div className="product-actions">
          <button className="action-btn"><Heart size={18} /></button>
          <Link to={`/product/${product.id}`} className="action-btn"><Eye size={18} /></Link>
        </div>
      </div>
      <div className="product-info">
        <Link to={`/product/${product.id}`}>
          <h3 className="product-title">{product.name}</h3>
        </Link>
        <p className="product-category">{product.category?.name}</p>
        <div className="product-price-row">
          <span className="price">KES {parseFloat(product.price).toLocaleString()}</span>
          {product.original_price && (
            <span className="original-price">KES {parseFloat(product.original_price).toLocaleString()}</span>
          )}
        </div>
        <button 
          className="btn btn-primary add-to-cart-btn"
          onClick={() => addItem(product)}
          disabled={product.stock <= 0}
        >
          <ShoppingCart size={18} />
          {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
      
      <style jsx>{`
        .product-card {
          padding: 0;
          overflow: hidden;
          transition: transform 0.3s ease;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .product-card:hover {
          transform: translateY(-5px);
        }
        .product-image-container {
          position: relative;
          height: 200px;
          overflow: hidden;
          background: #f9f9f9;
        }
        .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .product-card:hover .product-image {
          transform: scale(1.1);
        }
        .product-actions {
          position: absolute;
          top: 10px;
          right: -50px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: right 0.3s ease;
        }
        .product-card:hover .product-actions {
          right: 10px;
        }
        .action-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          color: var(--text-main);
        }
        .action-btn:hover {
          background: var(--primary);
          color: white;
        }
        .product-info {
          padding: 15px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .product-title {
          font-size: 1.1rem;
          margin-bottom: 5px;
          color: var(--text-main);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .product-category {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 10px;
        }
        .product-price-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
          margin-top: auto;
        }
        .price {
          font-weight: 700;
          font-size: 1.2rem;
          color: var(--primary);
        }
        .original-price {
          text-decoration: line-through;
          color: var(--text-muted);
          font-size: 0.9rem;
        }
        .add-to-cart-btn {
          width: 100%;
          justify-content: center;
          padding: 10px;
        }
      `}</style>
    </div>
  );
};

export default ProductCard;
