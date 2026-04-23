import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';

// Lazy load pages
const Home = lazy(() => import('./pages/Home/Home'));
const ProductDetail = lazy(() => import('./pages/ProductDetail/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart/Cart'));
const Checkout = lazy(() => import('./pages/Checkout/Checkout'));
const Orders = lazy(() => import('./pages/Orders/Orders'));
const OrderTracking = lazy(() => import('./pages/Tracking/Tracking'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'));

// Protected Route Component
const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="loader-container"><div className="loader"></div></div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;

  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <div className="app-wrapper">
            <Navbar />
            <main className="main-content">
              <Suspense fallback={<div className="loader-container"><div className="loader"></div></div>}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Customer Routes */}
                  <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                  <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                  <Route path="/orders/:id/track" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />

                  {/* Admin Routes */}
                  <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
                </Routes>
              </Suspense>
            </main>
            <Toaster position="bottom-right" />
          </div>
        </BrowserRouter>

        <style jsx global>{`
          .app-wrapper {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }
          .main-content {
            flex: 1;
            padding-bottom: 50px;
          }
          .loader-container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 60vh;
          }
          .loader {
            width: 50px;
            height: 50px;
            border: 5px solid var(--gray);
            border-top-color: var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
