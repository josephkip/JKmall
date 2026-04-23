import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

const STORAGE_KEY = 'jkmall_cart';

const loadCart = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        toast.success(`Updated "${product.name}" quantity`);
        return prev.map(i =>
          i.product_id === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      toast.success(`Added "${product.name}" to cart`);
      return [...prev, {
        product_id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        original_price: product.original_price ? parseFloat(product.original_price) : null,
        image: product.images?.[0] || null,
        quantity,
        stock: product.stock,
      }];
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) return removeItem(productId);
    setItems(prev => prev.map(i =>
      i.product_id === productId ? { ...i, quantity } : i
    ));
  };

  const removeItem = (productId) => {
    setItems(prev => prev.filter(i => i.product_id !== productId));
    toast.success('Item removed from cart');
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const deliveryFee = items.length > 0 ? 150 : 0;
  const total = subtotal + deliveryFee;

  return (
    <CartContext.Provider value={{
      items, addItem, updateQuantity, removeItem, clearCart,
      itemCount, subtotal, deliveryFee, total,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
