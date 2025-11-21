import React, { useState, useEffect } from 'react';
import { Truck, LogOut } from 'lucide-react';
import { UserRole, Product, CartItem, Order, User, Store, Message } from './types';
import { MOCK_PRODUCTS, MOCK_STORES } from './constants';
import { MerchantView } from './components/MerchantView';
import { ShopperView } from './components/ShopperView';
import { AuthView } from './components/AuthView';

const App: React.FC = () => {
  // User State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Initialize users from localStorage or defaults
  const [users, setUsers] = useState<Array<User & { password: string }>>(() => {
    try {
      const savedUsers = localStorage.getItem('locallink_users');
      if (savedUsers) {
        return JSON.parse(savedUsers);
      }
    } catch (error) {
      console.error('Error loading users from local storage:', error);
    }
    
    return [
      { id: '1', name: 'Local Merchant', email: 'merchant@test.com', role: UserRole.MERCHANT, password: 'password' },
      { id: '2', name: 'Jane Doe', email: 'shopper@test.com', role: UserRole.SHOPPER, password: 'password' }
    ];
  });

  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('locallink_dark_mode');
      if (saved) return JSON.parse(saved);
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('locallink_dark_mode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  // App Data State with Persistence
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('locallink_products');
      return saved ? JSON.parse(saved) : MOCK_PRODUCTS;
    } catch (e) { return MOCK_PRODUCTS; }
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('locallink_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('locallink_orders');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [stores, setStores] = useState<Store[]>(() => {
    try {
      const saved = localStorage.getItem('locallink_stores');
      return saved ? JSON.parse(saved) : MOCK_STORES;
    } catch (e) { return MOCK_STORES; }
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('locallink_messages');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  // Save data to local storage whenever it changes
  useEffect(() => localStorage.setItem('locallink_users', JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem('locallink_products', JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem('locallink_stores', JSON.stringify(stores)), [stores]);
  useEffect(() => localStorage.setItem('locallink_orders', JSON.stringify(orders)), [orders]);
  useEffect(() => localStorage.setItem('locallink_messages', JSON.stringify(messages)), [messages]);
  useEffect(() => localStorage.setItem('locallink_cart', JSON.stringify(cart)), [cart]);

  const handleLogin = (email: string, pass: string) => {
    setAuthLoading(true);
    setAuthError(null);
    
    // Simulate network delay
    setTimeout(() => {
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
      if (user) {
        setCurrentUser(user);
      } else {
        setAuthError('Invalid email or password');
      }
      setAuthLoading(false);
    }, 800);
  };

  const handleSignup = (name: string, email: string, pass: string, role: UserRole) => {
    setAuthLoading(true);
    setAuthError(null);
    
    setTimeout(() => {
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        setAuthError('Email already registered');
        setAuthLoading(false);
        return;
      }

      const newUser = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        email,
        password: pass,
        role
      };

      setUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);

      // Auto-create a default store for new merchants so they have data
      if (role === UserRole.MERCHANT) {
        const newStore: Store = {
          id: Math.random().toString(36).substr(2, 9),
          ownerId: newUser.id,
          name: `${name}'s Store`,
          type: 'General',
          address: 'Main Market',
          phoneNumber: ''
        };
        setStores(prev => [...prev, newStore]);
      }

      setAuthLoading(false);
    }, 800);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCart([]); // Clear active session cart, though it is persisted
  };

  const handleUpdateProfile = (updates: Partial<User>) => {
    if (!currentUser) return;
    
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, ...updates } : u));
  };

  const handleAddProduct = (product: Product) => {
    setProducts(prev => [...prev, product]);
  };

  const handleAddStore = (store: Store) => {
    setStores(prev => [...prev, store]);
  };

  const handleUpdateStore = (updatedStore: Store) => {
    setStores(prev => prev.map(s => s.id === updatedStore.id ? updatedStore : s));
    // Update denormalized store data in products
    setProducts(prev => prev.map(p => {
      if (p.storeId === updatedStore.id) {
        return {
          ...p,
          storeName: updatedStore.name,
          storeType: updatedStore.type
        };
      }
      return p;
    }));
  };

  const handleSendMessage = (text: string, receiverId: string) => {
    if (!currentUser) return;
    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: currentUser.id,
      receiverId,
      content: text,
      timestamp: Date.now(),
      senderName: currentUser.name
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const handleCheckout = (address: string, phone: string, paymentMethod: string) => {
    if (!currentUser) return;
    
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      items: [...cart],
      total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: 'pending',
      timestamp: Date.now(),
      customerName: currentUser.name,
      address: address,
      phoneNumber: phone,
      paymentMethod: paymentMethod,
    };
    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
    alert(`Order placed successfully via ${paymentMethod}! A merchant will review it shortly.`);
  };

  const handleCancelOrder = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
  };

  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  // Render Auth View if not logged in
  if (!currentUser) {
    return (
      <AuthView 
        onLogin={handleLogin} 
        onSignup={handleSignup} 
        error={authError}
        isLoading={authLoading}
        onErrorClear={() => setAuthError(null)}
      />
    );
  }

  return (
    <div>
      {/* Logout Button (Desktop) */}
      <div className="fixed bottom-4 left-4 z-50 hidden md:block">
        <button 
          onClick={handleLogout}
          className="bg-gray-800 text-white px-4 py-2 rounded-full text-xs font-medium shadow-lg hover:bg-gray-700 transition-all flex items-center gap-2 opacity-50 hover:opacity-100"
        >
          <LogOut size={14} />
          Log Out ({currentUser.name})
        </button>
      </div>

      {currentUser.role === UserRole.MERCHANT ? (
        <MerchantView 
          products={products} 
          orders={orders}
          stores={stores}
          currentUser={currentUser}
          onAddProduct={handleAddProduct}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onAddStore={handleAddStore}
          onUpdateStore={handleUpdateStore}
          messages={messages}
          onSendMessage={handleSendMessage}
          onLogout={handleLogout}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
          onUpdateProfile={handleUpdateProfile}
        />
      ) : (
        <ShopperView 
          products={products} 
          cart={cart} 
          orders={orders}
          stores={stores}
          onAddToCart={handleAddToCart}
          onRemoveFromCart={handleRemoveFromCart}
          onCheckout={handleCheckout}
          onCancelOrder={handleCancelOrder}
          currentUser={currentUser}
          onUpdateProfile={handleUpdateProfile}
          messages={messages}
          onSendMessage={handleSendMessage}
          onLogout={handleLogout}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
        />
      )}
      
      {/* Global Order Status Notification for Shopper */}
      {currentUser.role === UserRole.SHOPPER && orders.filter(o => o.customerName === currentUser.name).length > 0 && (
        <div className="fixed bottom-20 md:bottom-4 right-4 z-40 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 p-4 hidden md:block">
          <div className="flex items-center gap-3 mb-2">
            <Truck className="text-indigo-600 dark:text-indigo-400" size={20} />
            <h4 className="font-bold text-sm dark:text-white">Latest Order Status</h4>
          </div>
          {(() => {
            // Get most recent order for this user
            const latestOrder = orders.filter(o => o.customerName === currentUser.name)[0];
            return (
              <>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Order #{latestOrder.id.slice(0,6)} is <span className={`font-bold ${latestOrder.status === 'cancelled' ? 'text-red-600' : 'text-indigo-600 dark:text-indigo-400'}`}>{latestOrder.status.toUpperCase()}</span>
                </div>
                {latestOrder.status !== 'cancelled' && (
                  <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 mt-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-500" 
                      style={{ 
                        width: latestOrder.status === 'pending' ? '25%' : 
                              latestOrder.status === 'preparing' ? '50%' : 
                              latestOrder.status === 'delivering' ? '75%' : '100%' 
                      }}
                    ></div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default App;