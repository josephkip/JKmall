import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { productsAPI } from '../../services/api';
import ProductCard from '../../components/ProductCard';
import { Filter, ChevronRight, ChevronLeft, Star, ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const { addItem } = useCart();
  const carouselRef = useRef(null);
  const [carouselIdx, setCarouselIdx] = useState(0);

  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('category') || '';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [prodRes, catRes, featRes] = await Promise.all([
          productsAPI.getAll({ search, category_id: categoryId }),
          productsAPI.getCategories(),
          productsAPI.getAll({ featured: 'true', limit: 8 })
        ]);
        setProducts(prodRes.data.data.products);
        setCategories(catRes.data.data);
        setFeatured(featRes.data.data.products);
      } catch (err) {
        toast.error('Failed to load products');
      } finally { setLoading(false); }
    };
    fetchData();
  }, [search, categoryId]);

  // Auto-slide carousel
  useEffect(() => {
    if (featured.length <= 1) return;
    const timer = setInterval(() => {
      setCarouselIdx(prev => (prev + 1) % featured.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [featured.length]);

  const scrollCarousel = (dir) => {
    setCarouselIdx(prev => {
      if (dir === 'left') return prev <= 0 ? featured.length - 1 : prev - 1;
      return (prev + 1) % featured.length;
    });
  };

  const apiBase = import.meta.env.VITE_API_URL || '';

  return (
    <div className="home-page fade-in">
      {/* Hero */}
      <section className="hero">
        <div className="container hero-content">
          <div className="hero-text">
            <span className="hero-tag">🇰🇪 Made for Kenya</span>
            <h1>Fastest Delivery in <span>Nairobi</span></h1>
            <p>Shop from the best local vendors and get your items delivered in minutes by our boda-boda fleet.</p>
            <div className="hero-buttons">
              <Link to="/?featured=true" className="btn btn-primary btn-lg">Shop Now <ChevronRight size={20} /></Link>
              <Link to="/register" className="btn btn-outline">Create Account</Link>
            </div>
          </div>
          <div className="hero-image">
            <img src="https://images.unsplash.com/photo-1519125323398-675f0ddb6308?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" alt="Nairobi Delivery" />
          </div>
        </div>
      </section>

      {/* Featured Products Carousel */}
      {featured.length > 0 && (
        <section className="carousel-section container">
          <div className="section-header">
            <h2>🔥 Trending Products</h2>
            <div className="carousel-controls">
              <button className="carousel-btn" onClick={() => scrollCarousel('left')}><ChevronLeft size={20} /></button>
              <button className="carousel-btn" onClick={() => scrollCarousel('right')}><ChevronRight size={20} /></button>
            </div>
          </div>
          <div className="carousel-wrapper">
            <div className="carousel-track" style={{ transform: `translateX(-${carouselIdx * (180 + 20)}px)` }}>
              {featured.concat(featured).map((p, i) => (
                <div key={`${p.id}-${i}`} className="carousel-item">
                  <Link to={`/product/${p.id}`}>
                    <div className="carousel-img-wrap">
                      {p.images?.[0] ? (
                        <img src={p.images[0].startsWith('http') ? p.images[0] : `${apiBase}${p.images[0]}`} alt={p.name} />
                      ) : (
                        <div className="carousel-placeholder"><ShoppingCart size={30} /></div>
                      )}
                      {p.original_price && (
                        <span className="carousel-discount">-{Math.round((1 - p.price / p.original_price) * 100)}%</span>
                      )}
                    </div>
                    <div className="carousel-info">
                      <h4>{p.name}</h4>
                      <div className="carousel-rating">
                        <Star size={12} fill="#f39c12" color="#f39c12" />
                        <span>{parseFloat(p.rating).toFixed(1)}</span>
                      </div>
                      <p className="carousel-price">KES {parseFloat(p.price).toLocaleString()}</p>
                    </div>
                  </Link>
                  <button className="carousel-add" onClick={(e) => { e.preventDefault(); addItem(p); }}>
                    <ShoppingCart size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="carousel-dots">
            {featured.map((_, i) => (
              <button key={i} className={`dot ${carouselIdx === i ? 'active' : ''}`} onClick={() => setCarouselIdx(i)} />
            ))}
          </div>
        </section>
      )}

      {/* Categories Bar */}
      <section className="categories-bar container">
        <div className="cat-scroll">
          <a href="/" className={`cat-chip ${!categoryId ? 'active' : ''}`}>All</a>
          {categories.map(cat => (
            <a key={cat.id} href={`/?category=${cat.id}`} className={`cat-chip ${categoryId === cat.id ? 'active' : ''}`}>
              {cat.name}
            </a>
          ))}
        </div>
      </section>

      {/* Product Grid */}
      <div className="container">
        <section className="products-section">
          <div className="section-header">
            <h2>{search ? `Results for "${search}"` : 'All Products'}</h2>
            <span className="results-count">{products.length} items</span>
          </div>
          {loading ? (
            <div className="product-grid">
              {[...Array(8)].map((_, i) => <div key={i} className="skeleton-card"></div>)}
            </div>
          ) : products.length > 0 ? (
            <div className="product-grid">
              {products.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No products found</h3>
              <p>Try adjusting your search or category filters.</p>
            </div>
          )}
        </section>
      </div>

      <style>{`
        .hero { background: linear-gradient(135deg, var(--dark) 0%, #1a252f 100%); color: white; padding: 80px 0; overflow: hidden; }
        .hero-content { display: flex; align-items: center; gap: 50px; }
        .hero-text { flex: 1; }
        .hero-tag { display: inline-block; background: rgba(0,166,90,0.2); color: var(--primary); padding: 6px 16px; border-radius: 20px; font-size: 0.9rem; font-weight: 600; margin-bottom: 15px; }
        .hero-text h1 { font-size: 3.5rem; line-height: 1.1; margin-bottom: 20px; font-weight: 800; }
        .hero-text span { color: var(--primary); }
        .hero-text p { font-size: 1.15rem; color: var(--gray); margin-bottom: 30px; max-width: 500px; }
        .hero-buttons { display: flex; gap: 15px; }
        .btn-lg { padding: 14px 30px; font-size: 1.1rem; }
        .btn-outline { padding: 14px 30px; border: 2px solid rgba(255,255,255,0.3); color: white; border-radius: var(--radius); font-weight: 600; }
        .btn-outline:hover { border-color: var(--primary); color: var(--primary); }
        .hero-image { flex: 1; }
        .hero-image img { width: 100%; border-radius: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); }

        /* Carousel */
        .carousel-section { padding: 40px 0; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .carousel-controls { display: flex; gap: 8px; }
        .carousel-btn { width: 38px; height: 38px; border-radius: 50%; background: var(--light); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; }
        .carousel-btn:hover { background: var(--primary); color: white; border-color: var(--primary); }
        .carousel-wrapper { overflow: hidden; border-radius: var(--radius); }
        .carousel-track { display: flex; gap: 20px; transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
        .carousel-item { min-width: 180px; background: white; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); overflow: hidden; position: relative; transition: transform 0.3s, box-shadow 0.3s; animation: float 6s ease-in-out infinite; }
        .carousel-item:nth-child(2n) { animation-delay: -1s; }
        .carousel-item:nth-child(3n) { animation-delay: -2s; }
        
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }

        .carousel-item:hover { transform: translateY(-15px) scale(1.02) !important; box-shadow: 0 12px 30px rgba(0,0,0,0.15); animation-play-state: paused; }
        .carousel-img-wrap { width: 180px; height: 160px; overflow: hidden; position: relative; background: #f9f9f9; }
        .carousel-img-wrap img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
        .carousel-item:hover .carousel-img-wrap img { transform: scale(1.15); }
        .carousel-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--gray); background: linear-gradient(135deg, #f0f0f0, #e8e8e8); }
        .carousel-discount { position: absolute; top: 8px; left: 8px; background: var(--secondary); color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; font-weight: 700; }
        .carousel-info { padding: 12px; }
        .carousel-info h4 { font-size: 0.85rem; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-main); }
        .carousel-rating { display: flex; align-items: center; gap: 4px; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px; }
        .carousel-price { font-weight: 700; color: var(--primary); font-size: 0.95rem; }
        .carousel-add { position: absolute; bottom: 12px; right: 12px; width: 32px; height: 32px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s, transform 0.3s; transform: scale(0.8); }
        .carousel-item:hover .carousel-add { opacity: 1; transform: scale(1); }
        .carousel-add:hover { background: var(--primary-dark); }
        .carousel-dots { display: flex; justify-content: center; gap: 8px; margin-top: 20px; }
        .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--gray); border: none; cursor: pointer; transition: all 0.3s; }
        .dot.active { background: var(--primary); width: 28px; border-radius: 5px; }

        /* Category Chips */
        .categories-bar { margin-bottom: 30px; }
        .cat-scroll { display: flex; gap: 10px; overflow-x: auto; padding: 10px 0; -ms-overflow-style: none; scrollbar-width: none; }
        .cat-scroll::-webkit-scrollbar { display: none; }
        .cat-chip { padding: 10px 22px; border-radius: 50px; background: white; color: var(--text-main); font-weight: 600; font-size: 0.9rem; white-space: nowrap; border: 1px solid var(--border); transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .cat-chip:hover, .cat-chip.active { background: var(--primary); color: white; border-color: var(--primary); }

        /* Product Grid */
        .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 25px; }
        .results-count { color: var(--text-muted); font-size: 0.9rem; }
        .skeleton-card { height: 350px; background: linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%); background-size: 200% 100%; border-radius: var(--radius); animation: shimmer 1.5s infinite; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .empty-state { text-align: center; padding: 60px 20px; }
        .empty-state h3 { margin-bottom: 10px; }
        .empty-state p { color: var(--text-muted); }

        @media (max-width: 992px) {
          .hero-content { flex-direction: column; text-align: center; }
          .hero-text h1 { font-size: 2.5rem; }
          .hero-buttons { justify-content: center; }
          .carousel-item { min-width: 160px; }
          .carousel-img-wrap { width: 160px; height: 140px; }
        }
        @media (max-width: 600px) {
          .hero-text h1 { font-size: 2rem; }
          .product-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
        }
      `}</style>
    </div>
  );
};

export default Home;
