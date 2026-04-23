import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, User, Search, Menu, X, LogOut, LayoutDashboard, Bike } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${searchQuery}`);
      setIsMenuOpen(false);
    }
  };

  return (
    <nav className="navbar glass">
      <div className="container nav-content">
        <Link to="/" className="logo">
          JK<span>mall</span>
        </Link>

        <form className="search-bar" onSubmit={handleSearch}>
          <input 
            type="text" 
            placeholder="Search products..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit"><Search size={20} /></button>
        </form>

        <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <Link to="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
          <Link to="/" onClick={() => setIsMenuOpen(false)}>Shop</Link>
          
          <div className="nav-actions">
            <Link to="/cart" className="cart-icon" onClick={() => setIsMenuOpen(false)}>
              <ShoppingCart size={24} />
              {itemCount > 0 && <span className="badge">{itemCount}</span>}
            </Link>

            {user ? (
              <div className="user-menu-container">
                <button className="user-btn">
                  <User size={24} />
                  <span className="user-name">{user.name.split(' ')[0]}</span>
                </button>
                <div className="user-dropdown">
                  <Link to="/orders">My Orders</Link>
                  {user.role === 'admin' && <Link to="/admin"><LayoutDashboard size={16} /> Admin Panel</Link>}
                  {user.role === 'rider' && <Link to="/rider"><Bike size={16} /> Deliveries</Link>}
                  <button onClick={logout} className="logout-btn"><LogOut size={16} /> Logout</button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary login-btn" onClick={() => setIsMenuOpen(false)}>Login</Link>
            )}
          </div>
        </div>

        <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      <style jsx>{`
        .navbar {
          position: sticky;
          top: 0;
          z-index: 1000;
          padding: 15px 0;
          background: rgba(255, 255, 255, 0.95);
          border-bottom: 1px solid var(--border);
        }
        .nav-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }
        .logo {
          font-size: 1.8rem;
          font-weight: 800;
          color: var(--dark);
          letter-spacing: -1px;
        }
        .logo span {
          color: var(--primary);
        }
        .search-bar {
          flex: 1;
          max-width: 500px;
          display: flex;
          background: var(--light);
          border-radius: 50px;
          padding: 5px 15px;
          border: 1px solid var(--border);
        }
        .search-bar input {
          flex: 1;
          background: transparent;
          border: none;
          padding: 8px;
          outline: none;
        }
        .search-bar button {
          background: transparent;
          color: var(--text-muted);
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 30px;
        }
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .cart-icon {
          position: relative;
          color: var(--dark);
        }
        .badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: var(--secondary);
          color: white;
          font-size: 0.7rem;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }
        .user-menu-container {
          position: relative;
        }
        .user-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          color: var(--dark);
        }
        .user-name {
          font-weight: 600;
          font-size: 0.9rem;
        }
        .user-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          width: 180px;
          background: white;
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          padding: 10px 0;
          display: none;
          margin-top: 10px;
          border: 1px solid var(--border);
        }
        .user-menu-container:hover .user-dropdown {
          display: block;
        }
        .user-dropdown a, .user-dropdown button {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 20px;
          width: 100%;
          text-align: left;
          font-size: 0.9rem;
          color: var(--text-main);
        }
        .user-dropdown a:hover, .user-dropdown button:hover {
          background: var(--light);
          color: var(--primary);
        }
        .logout-btn {
          color: var(--secondary) !important;
          border-top: 1px solid var(--border);
        }
        .menu-toggle {
          display: none;
          background: transparent;
        }
        @media (max-width: 992px) {
          .search-bar { display: none; }
          .nav-links {
            position: fixed;
            top: 75px;
            left: 0;
            right: 0;
            background: white;
            flex-direction: column;
            padding: 30px;
            transform: translateY(-150%);
            transition: transform 0.3s ease;
            box-shadow: var(--shadow);
          }
          .nav-links.active {
            transform: translateY(0);
          }
          .menu-toggle { display: block; }
          .nav-actions { width: 100%; justify-content: center; }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
