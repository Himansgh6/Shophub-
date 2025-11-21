import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, MapPin, Sparkles, X, Plus, Store, ChevronLeft, ChevronDown, Phone, Home, Facebook, Twitter, Instagram, Linkedin, Package, Clock, AlertCircle, User, Save, MessageCircle, Send, Bell, CreditCard, Wallet, Banknote, Moon, Sun } from 'lucide-react';
import { Product, CartItem, StoreType, Order, User as UserType, Store as StoreModel, Message } from '../types';
import { STORE_TYPES, STORE_CATEGORIES, STORE_IMAGES } from '../constants';
import { Button } from './Button';
import { getShopperRecommendations } from '../services/geminiService';

interface ShopperViewProps {
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  stores: StoreModel[];
  onAddToCart: (product: Product) => void;
  onRemoveFromCart: (productId: string) => void;
  onCheckout: (address: string, phone: string, paymentMethod: string) => void;
  onCancelOrder: (orderId: string) => void;
  currentUser: UserType;
  onUpdateProfile: (data: Partial<UserType>) => void;
  messages: Message[];
  onSendMessage: (text: string, receiverId: string) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const ShopperView: React.FC<ShopperViewProps> = ({ 
  products, 
  cart,
  orders,
  stores,
  onAddToCart, 
  onRemoveFromCart, 
  onCheckout,
  onCancelOrder,
  currentUser,
  onUpdateProfile,
  messages,
  onSendMessage,
  onLogout,
  isDarkMode,
  toggleDarkMode
}) => {
  const [selectedStoreType, setSelectedStoreType] = useState<StoreType | 'All'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeChatPartnerId, setActiveChatPartnerId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');

  const [aiQuery, setAiQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [highlightedProductIds, setHighlightedProductIds] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Location State
  const [location, setLocation] = useState('Indore');
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');

  const cities = [
    'Indore', 'Bhopal', 'Rewa', 'Satna', 'Mumbai', 'Delhi', 'Pune', 'Gujrat', 
    'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Bangalore', 'Hyderabad'
  ];

  const filteredLocations = cities.filter(city => 
    city.toLowerCase().includes(locationSearch.toLowerCase())
  );

  // Checkout Form State
  const [deliveryAddress, setDeliveryAddress] = useState(currentUser.address || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phoneNumber || '');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('COD');

  const paymentMethods = [
    { id: 'PayPal', name: 'PayPal', icon: CreditCard },
    { id: 'Paytm', name: 'Paytm', icon: Wallet },
    { id: 'Google Pay', name: 'Google Pay', icon: Wallet },
    { id: 'COD', name: 'Cash on Delivery', icon: Banknote },
  ];

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: currentUser.name,
    phoneNumber: currentUser.phoneNumber || '',
    address: currentUser.address || '',
    bio: currentUser.bio || ''
  });

  useEffect(() => {
    // Sync checkout form with profile if profile updates
    if (currentUser.address) setDeliveryAddress(currentUser.address);
    if (currentUser.phoneNumber) setPhoneNumber(currentUser.phoneNumber);
    
    // Sync profile form
    setProfileForm({
      name: currentUser.name,
      phoneNumber: currentUser.phoneNumber || '',
      address: currentUser.address || '',
      bio: currentUser.bio || ''
    });
  }, [currentUser]);

  useEffect(() => {
    if (isMessagesOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isMessagesOpen, activeChatPartnerId]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Message Helpers
  const getStoreByOwnerId = (ownerId: string) => stores.find(s => s.ownerId === ownerId);
  const getStoreByProductId = (storeId?: string) => stores.find(s => s.id === storeId);

  // Filter messages for current user
  const myMessages = messages.filter(m => m.senderId === currentUser.id || m.receiverId === currentUser.id);
  
  // Get unique contacts (Store Owners)
  const contactIds: string[] = Array.from(new Set(myMessages.map(m => m.senderId === currentUser.id ? m.receiverId : m.senderId)));
  
  // Current chat messages
  const activeChatMessages = myMessages
    .filter(m => 
      (m.senderId === currentUser.id && m.receiverId === activeChatPartnerId) || 
      (m.senderId === activeChatPartnerId && m.receiverId === currentUser.id)
    )
    .sort((a, b) => a.timestamp - b.timestamp);

  const handleSendMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChatPartnerId) return;
    onSendMessage(messageInput, activeChatPartnerId);
    setMessageInput('');
  };

  const openChatWithStore = (storeId?: string) => {
    const store = getStoreByProductId(storeId);
    if (store) {
      setActiveChatPartnerId(store.ownerId);
      setIsMessagesOpen(true);
    } else {
      alert("Cannot chat with this store at the moment.");
    }
  };

  const unreadCount = myMessages.filter(m => m.receiverId === currentUser.id).length; // Simple unread count logic (total received)

  const filteredProducts = products.filter(p => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
                          p.name.toLowerCase().includes(query) || 
                          p.description.toLowerCase().includes(query) ||
                          p.category.toLowerCase().includes(query);
    
    const isHighlighted = highlightedProductIds.length === 0 || highlightedProductIds.includes(p.id);

    if (highlightedProductIds.length > 0) return isHighlighted && matchesSearch;

    // Store ID Filter (takes precedence over store type if selected)
    if (selectedStoreId) {
      return p.storeId === selectedStoreId && 
             (selectedCategory === 'All' || p.category === selectedCategory) &&
             matchesSearch;
    }

    const matchesStore = selectedStoreType === 'All' || p.storeType === selectedStoreType;
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    
    return matchesStore && matchesCategory && matchesSearch;
  });

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    
    setAiLoading(true);
    setHighlightedProductIds([]);
    setSearchQuery(''); 
    setSelectedStoreId(null);
    
    const recommendedIds = await getShopperRecommendations(aiQuery, products);
    
    setHighlightedProductIds(recommendedIds);
    setAiLoading(false);
    
    if (recommendedIds.length === 0) {
      alert("AI couldn't find specific matches, but feel free to browse!");
    }
  };

  const clearAiSearch = () => {
    setHighlightedProductIds([]);
    setAiQuery('');
  };

  const handleStoreSelect = (type: StoreType | 'All') => {
    setSelectedStoreType(type);
    setSelectedStoreId(null); // Clear specific store selection
    setSelectedCategory('All');
  };

  const handleSpecificStoreSelect = (storeId: string) => {
    setSelectedStoreId(storeId);
    setSelectedStoreType('All'); // Reset broad type filter
    setSelectedCategory('All');
    setHighlightedProductIds([]); // Clear AI search
    setSearchQuery('');
  };

  const handleCheckoutClick = () => {
    if (!deliveryAddress || !phoneNumber) {
      alert("Please enter your delivery address and phone number.");
      return;
    }
    onCheckout(deliveryAddress, phoneNumber, selectedPaymentMethod);
    setIsCartOpen(false);
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(profileForm);
    setIsProfileOpen(false);
  };

  // Helper to close other drawers when one is opened
  const closeAllDrawers = () => {
    setIsCartOpen(false);
    setIsOrdersOpen(false);
    setIsProfileOpen(false);
    setIsMessagesOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pb-16 md:pb-0 transition-colors">
      {/* Navbar */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => {handleStoreSelect('All'); clearAiSearch(); setSearchQuery('');}}>
            <div className="h-9 w-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">L</div>
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">LocalLink Market</span>
          </div>
          
          <div className="flex items-center gap-2 md:gap-6">
            {/* Location Selector */}
            <div className="relative hidden md:block">
              <button 
                onClick={() => setIsLocationOpen(!isLocationOpen)}
                className="flex items-center text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:border-emerald-200 transition-colors cursor-pointer"
              >
                <MapPin className="w-4 h-4 mr-2 text-emerald-600" />
                <span>Delivering to <span className="font-semibold text-slate-900 dark:text-white">{location}</span></span>
                <ChevronDown className="w-3 h-3 ml-1 text-slate-400"/>
              </button>
              
              {isLocationOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsLocationOpen(false)}></div>
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-20 overflow-hidden">
                     <div className="px-3 pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                       <div className="relative">
                         <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                         <input 
                           type="text" 
                           placeholder="Search city..." 
                           className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-black dark:text-white"
                           value={locationSearch}
                           onChange={(e) => setLocationSearch(e.target.value)}
                           autoFocus
                         />
                       </div>
                     </div>
                     <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                       <button 
                          onClick={() => { setLocation('Current Location'); setIsLocationOpen(false); }} 
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 text-emerald-600 font-medium flex items-center gap-2 transition-colors"
                        >
                          <MapPin size={14} /> Use Current Location
                        </button>
                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>
                        {filteredLocations.map(loc => (
                          <button 
                            key={loc} 
                            onClick={() => { setLocation(loc); setIsLocationOpen(false); }} 
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between ${location === loc ? 'text-emerald-600 font-medium bg-emerald-50/50 dark:bg-emerald-900/20' : 'text-slate-600 dark:text-slate-300'}`}
                          >
                            {loc}
                            {location === loc && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                          </button>
                       ))}
                       {filteredLocations.length === 0 && (
                         <div className="px-4 py-3 text-sm text-slate-400 text-center">No cities found</div>
                       )}
                     </div>
                  </div>
                </>
              )}
            </div>

            <button onClick={toggleDarkMode} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 transition-colors">
               {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notification Button (Visible on Mobile too) */}
            <button 
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-600 dark:text-slate-300 hover:text-emerald-600"
              title="Notifications"
            >
              <Bell className="w-6 h-6" />
              <span className="absolute top-1.5 right-2 h-2 w-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
            </button>

            <div className="hidden md:flex items-center gap-2">
              <button 
                onClick={() => {closeAllDrawers(); setIsMessagesOpen(true);}}
                className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-600 dark:text-slate-300 hover:text-emerald-600"
                title="Messages"
              >
                <MessageCircle className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
                )}
              </button>

              <button 
                onClick={() => {closeAllDrawers(); setIsProfileOpen(true);}}
                className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-600 dark:text-slate-300 hover:text-emerald-600"
                title="My Profile"
              >
                <User className="w-6 h-6" />
              </button>

              <button 
                onClick={() => {closeAllDrawers(); setIsOrdersOpen(true);}}
                className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-600 dark:text-slate-300 hover:text-emerald-600"
                title="My Orders"
              >
                <Package className="w-6 h-6" />
              </button>

              <button 
                onClick={() => {closeAllDrawers(); setIsCartOpen(true);}}
                className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all group"
              >
                <ShoppingCart className="w-6 h-6 text-slate-600 dark:text-slate-300 group-hover:text-emerald-600 transition-colors" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-emerald-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section with AI Search */}
      <div className="relative bg-emerald-900 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1573855619003-97b4799dcd8b?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/50 to-emerald-900"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 tracking-tight">
            Your local market, <br/><span className="text-emerald-300">reimagined.</span>
          </h1>
          <p className="text-emerald-100 mb-10 text-lg max-w-2xl mx-auto">
            Shop from neighborhood stores with the help of AI. Fresh groceries, essentials, and more delivered in minutes.
          </p>

          <form onSubmit={handleAiSearch} className="relative max-w-2xl mx-auto group">
            <div className="relative transform transition-all duration-300 group-hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex items-center p-2">
                <div className="pl-4 text-emerald-500">
                  <Sparkles className="w-6 h-6" />
                </div>
                <input 
                  type="text" 
                  value={aiQuery}
                  onChange={e => setAiQuery(e.target.value)}
                  placeholder="Describe what you need (e.g. 'ingredients for italian dinner')"
                  className="w-full pl-4 pr-4 py-3 text-lg text-black dark:text-white placeholder-slate-400 outline-none bg-transparent"
                />
                {highlightedProductIds.length > 0 && (
                  <button 
                    type="button"
                    onClick={clearAiSearch}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <X size={20} />
                  </button>
                )}
                <button 
                  type="submit"
                  disabled={aiLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-md disabled:opacity-70 disabled:cursor-wait min-w-[100px]"
                >
                  {aiLoading ? 'Thinking...' : 'Ask AI'}
                </button>
              </div>
            </div>
          </form>
          
          {highlightedProductIds.length > 0 && (
             <div className="mt-6 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-emerald-100 border border-white/20">
               <Sparkles className="w-4 h-4 text-emerald-300" />
               <span>Found {highlightedProductIds.length} recommendations for you</span>
             </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 w-full">
        
        {/* Filters Container */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-6 mb-10">
          
          {/* Standard Search - Only show if AI inactive */}
          {highlightedProductIds.length === 0 && (
             <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Or search specifically..."
                  className="w-full pl-12 pr-10 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-black dark:text-white"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={18} />
                  </button>
                )}
             </div>
          )}

          {/* Neighborhood Stores List */}
          {!searchQuery && highlightedProductIds.length === 0 && stores.length > 0 && (
            <div className="mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">Visit Neighborhood Stores</h3>
                  {selectedStoreId && (
                     <button 
                       onClick={() => handleStoreSelect('All')}
                       className="text-sm text-emerald-600 font-medium hover:text-emerald-700 flex items-center"
                     >
                       View All Products <ChevronLeft className="w-4 h-4 rotate-180" />
                     </button>
                  )}
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                   {stores.map(store => (
                      <button
                        key={store.id}
                        onClick={() => handleSpecificStoreSelect(store.id)}
                        className={`flex flex-col items-start min-w-[200px] p-4 rounded-xl transition-all border ${
                          selectedStoreId === store.id 
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-500 border-emerald-500' 
                          : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                         <div className="flex items-center gap-3 mb-3">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${
                                store.type === 'Kirana' ? 'bg-emerald-500' : 
                                store.type === 'Medical' ? 'bg-rose-500' : 
                                store.type === 'Electronics' ? 'bg-blue-500' : 'bg-amber-500'
                            }`}>
                              {store.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1 text-left">{store.name}</h4>
                              <span className="text-xs text-slate-500 dark:text-slate-400">{store.type}</span>
                            </div>
                         </div>
                         <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <MapPin size={12} />
                            <span className="truncate max-w-[150px]">{store.address}</span>
                         </div>
                      </button>
                   ))}
                </div>
            </div>
          )}

          {/* Store Types - Horizontal Scroll */}
          {!searchQuery && highlightedProductIds.length === 0 && !selectedStoreId && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">Shop by Category</h3>
                {selectedStoreType !== 'All' && (
                  <button 
                    onClick={() => handleStoreSelect('All')}
                    className="text-sm text-emerald-600 font-medium hover:text-emerald-700 flex items-center"
                  >
                    View all <ChevronLeft className="w-4 h-4 rotate-180" />
                  </button>
                )}
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                <button
                  onClick={() => handleStoreSelect('All')}
                  className={`flex flex-col items-center min-w-[100px] p-3 rounded-xl transition-all ${selectedStoreType === 'All' ? 'bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-500' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700'}`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${selectedStoreType === 'All' ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'}`}>
                    <Store size={20} />
                  </div>
                  <span className={`text-sm font-semibold ${selectedStoreType === 'All' ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400'}`}>All</span>
                </button>

                {STORE_TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => handleStoreSelect(type)}
                    className={`flex flex-col items-center min-w-[100px] p-3 rounded-xl transition-all ${selectedStoreType === type ? 'bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-500' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700'}`}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden mb-3 relative bg-slate-100 dark:bg-slate-700">
                      <img 
                        src={STORE_IMAGES[type]} 
                        alt={type} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                           e.currentTarget.onerror = null;
                           e.currentTarget.src = `https://ui-avatars.com/api/?name=${type}&background=random&color=fff&size=128`;
                        }}
                      />
                    </div>
                    <span className={`text-sm font-semibold ${selectedStoreType === type ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400'}`}>{type}</span>
                  </button>
                ))}
              </div>

              {/* Sub Categories (Only visible when store selected) */}
              {selectedStoreType !== 'All' && (
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => setSelectedCategory('All')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === 'All' ? 'bg-slate-800 dark:bg-slate-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    >
                      All Items
                    </button>
                    {STORE_CATEGORIES[selectedStoreType].map(cat => (
                      <button 
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === cat ? 'bg-slate-800 dark:bg-slate-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Product Grid */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {searchQuery ? `Results for "${searchQuery}"` : 
             highlightedProductIds.length > 0 ? 'Recommended for you' : 
             selectedStoreId ? stores.find(s => s.id === selectedStoreId)?.name || 'Store Products' :
             selectedStoreType === 'All' ? `Popular in ${location}` : `${selectedStoreType} in ${location}`}
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">{filteredProducts.length} items</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map(product => (
            <div key={product.id} className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col">
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random&color=fff&size=256`;
                  }}
                />
                
                <div className="absolute top-3 left-3">
                  <span className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-slate-800 dark:text-white text-xs px-2.5 py-1 rounded-md font-bold shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-1">
                    {product.storeType}
                  </span>
                </div>

                {/* Quick Add Button overlay on desktop */}
                <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  <button 
                    onClick={() => openChatWithStore(product.storeId)}
                    className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 p-3 rounded-full shadow-lg hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-600 active:scale-95 transition-colors"
                    title="Chat with Seller"
                  >
                    <MessageCircle size={20} />
                  </button>
                  <button 
                    onClick={() => onAddToCart(product)}
                    className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-3 rounded-full shadow-lg hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 active:scale-95 transition-colors"
                    title="Add to Cart"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
              
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{product.name}</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1 flex items-center gap-1">
                        <Store size={12} /> {product.storeName || 'Local Store'} • {product.distance || 'Nearby'}
                    </p>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">₹{product.price.toFixed(2)}</span>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                   <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs rounded font-medium">{product.category}</span>
                   {product.stock < 10 && (
                     <span className="text-xs text-orange-500 font-medium">Only {product.stock} left</span>
                   )}
                </div>

                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2 flex-1">{product.description}</p>
                
                <div className="flex items-center gap-2 pt-4 border-t border-slate-50 dark:border-slate-800 mt-auto lg:hidden">
                  <button 
                    onClick={() => openChatWithStore(product.storeId)}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex justify-center items-center gap-1"
                  >
                    <MessageCircle size={16} /> Chat
                  </button>
                  <button 
                    onClick={() => onAddToCart(product)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
             <div className="bg-slate-50 dark:bg-slate-800 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="text-slate-300 dark:text-slate-600 w-10 h-10" />
             </div>
             <h3 className="text-lg font-medium text-slate-900 dark:text-white">No products found</h3>
             <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2">Try adjusting your search, selecting a different category, or visiting another store.</p>
             {(searchQuery || selectedStoreId) && (
               <Button variant="outline" onClick={() => {setSearchQuery(''); handleStoreSelect('All');}} className="mt-6">
                 Clear Filters
               </Button>
             )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pt-16 pb-8 mt-20 mb-16 md:mb-0 transition-colors">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center">
               <p className="text-slate-400 dark:text-slate-500 text-sm">© 2024 LocalLink Market Inc. All rights reserved.</p>
            </div>
         </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16">
          <button onClick={() => {closeAllDrawers(); setIsCartOpen(false);}} className="flex flex-col items-center justify-center w-full h-full text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-95 transition-transform">
            <Home size={24} />
            <span className="text-[10px] mt-1 font-medium">Home</span>
          </button>
          <button onClick={() => {closeAllDrawers(); setIsMessagesOpen(true);}} className="flex flex-col items-center justify-center w-full h-full text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-95 transition-transform relative">
            <MessageCircle size={24} />
            <span className="text-[10px] mt-1 font-medium">Chat</span>
            {unreadCount > 0 && <span className="absolute top-3 right-6 h-2 w-2 bg-rose-500 rounded-full animate-pulse"></span>}
          </button>
          <button onClick={() => {closeAllDrawers(); setIsOrdersOpen(true);}} className="flex flex-col items-center justify-center w-full h-full text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-95 transition-transform">
            <Package size={24} />
            <span className="text-[10px] mt-1 font-medium">Orders</span>
          </button>
          <button onClick={() => {closeAllDrawers(); setIsProfileOpen(true);}} className="flex flex-col items-center justify-center w-full h-full text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-95 transition-transform">
            <User size={24} />
            <span className="text-[10px] mt-1 font-medium">Profile</span>
          </button>
          <button onClick={() => {closeAllDrawers(); setIsCartOpen(true);}} className="flex flex-col items-center justify-center w-full h-full text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-95 transition-transform relative">
            <ShoppingCart size={24} />
            <span className="text-[10px] mt-1 font-medium">Cart</span>
            {cartCount > 0 && <span className="absolute top-3 right-6 h-2 w-2 bg-emerald-500 rounded-full"></span>}
          </button>
        </div>
      </div>

      {/* Notifications Drawer */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsNotificationsOpen(false)}></div>
           <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col transform transition-transform">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 z-10">
                 <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Notifications</h2>
                 </div>
                 <button onClick={() => setIsNotificationsOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                   <X size={24} />
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                     <div className="flex gap-3">
                        <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                           <Package size={20} />
                        </div>
                        <div>
                           <h4 className="font-bold text-slate-900 dark:text-white text-sm">Order Delivered</h4>
                           <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Your order from Golden Crust Bakery has been delivered successfully.</p>
                           <span className="text-[10px] text-slate-400 mt-2 block">2 mins ago</span>
                        </div>
                     </div>
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                     <div className="flex gap-3">
                        <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                           <Sparkles size={20} />
                        </div>
                        <div>
                           <h4 className="font-bold text-slate-900 dark:text-white text-sm">New Recommendations</h4>
                           <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Based on your recent purchase, we found some items you might like.</p>
                           <span className="text-[10px] text-slate-400 mt-2 block">1 hour ago</span>
                        </div>
                     </div>
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingCart className="text-emerald-600 dark:text-emerald-400" /> Your Cart
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-300 dark:text-slate-600">
                    <ShoppingCart size={40} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Your cart is empty</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6">Looks like you haven't added anything yet.</p>
                  <Button onClick={() => setIsCartOpen(false)}>Start Shopping</Button>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <img src={item.imageUrl} alt={item.name} className="w-20 h-20 rounded-lg object-cover bg-slate-100 dark:bg-slate-700" />
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-900 dark:text-white line-clamp-2">{item.name}</h4>
                        <button onClick={() => onRemoveFromCart(item.id)} className="text-slate-400 hover:text-rose-500 p-1">
                          <X size={16} />
                        </button>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{item.storeName}</p>
                      <div className="mt-auto flex justify-between items-center">
                        <span className="text-sm font-medium bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-700 dark:text-slate-300">Qty: {item.quantity}</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span>₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Delivery Fee</span>
                    <span>₹40.00</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span>Total</span>
                    <span>₹{(cartTotal + 40).toFixed(2)}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Delivery Address</label>
                    <input 
                      type="text" 
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Enter address"
                      className="w-full text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-400 bg-transparent"
                    />
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Phone Number</label>
                    <input 
                      type="tel" 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter phone"
                      className="w-full text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-400 bg-transparent"
                    />
                  </div>
                  
                  <div className="space-y-2 mt-2">
                     <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Payment Method</label>
                     <div className="grid grid-cols-2 gap-2">
                        {paymentMethods.map(method => (
                           <button
                              key={method.id}
                              onClick={() => setSelectedPaymentMethod(method.id)}
                              className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${selectedPaymentMethod === method.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                           >
                              <method.icon size={20} />
                              <span className="text-xs font-medium">{method.name}</span>
                           </button>
                        ))}
                     </div>
                  </div>

                  <Button className="w-full py-3 mt-2" onClick={handleCheckoutClick}>
                    Checkout (₹{(cartTotal + 40).toFixed(2)})
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Orders Modal */}
      {isOrdersOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsOrdersOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="text-indigo-600 dark:text-indigo-400" /> My Orders
              </h2>
              <button onClick={() => setIsOrdersOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-slate-950">
              {orders.filter(o => o.customerName === currentUser.name).length === 0 ? (
                <div className="text-center py-12">
                   <p className="text-slate-500 dark:text-slate-400">No orders found.</p>
                </div>
              ) : (
                orders.filter(o => o.customerName === currentUser.name).map(order => (
                  <div key={order.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">Order #{order.id.slice(0,6)}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(order.timestamp).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                        ${order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : 
                          order.status === 'cancelled' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300' : 
                          'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="space-y-2 mb-4">
                        {order.items.map((item, idx) => (
                           <div key={idx} className="flex justify-between text-sm">
                              <span className="text-slate-600 dark:text-slate-300"><span className="font-bold text-slate-900 dark:text-white">{item.quantity}x</span> {item.name}</span>
                              <span className="font-medium text-slate-900 dark:text-white">₹{(item.price * item.quantity).toFixed(2)}</span>
                           </div>
                        ))}
                      </div>
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                           Total Amount <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded ml-2 text-slate-700 dark:text-slate-300">{order.paymentMethod || 'COD'}</span>
                        </div>
                        <div className="text-lg font-bold text-slate-900 dark:text-white">
                           ₹{order.total.toFixed(2)}
                        </div>
                      </div>
                      {order.status === 'pending' && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                           <Button variant="danger" size="sm" onClick={() => onCancelOrder(order.id)}>Cancel Order</Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsProfileOpen(false)}></div>
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="text-indigo-600 dark:text-indigo-400" /> Edit Profile
              </h2>
              <button onClick={() => setIsProfileOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
               <form onSubmit={handleProfileSave} className="space-y-4">
                  <div>
                     <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                     <input 
                       type="text" 
                       value={profileForm.name} 
                       onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                       className="w-full rounded-xl border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                       placeholder="John Doe"
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                     <input 
                       type="tel" 
                       value={profileForm.phoneNumber} 
                       onChange={e => setProfileForm({...profileForm, phoneNumber: e.target.value})}
                       className="w-full rounded-xl border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                       placeholder="+91 98765 43210"
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Default Delivery Address</label>
                     <textarea 
                       value={profileForm.address} 
                       onChange={e => setProfileForm({...profileForm, address: e.target.value})}
                       className="w-full rounded-xl border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                       rows={3}
                       placeholder="Enter your full address"
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Bio</label>
                     <textarea 
                       value={profileForm.bio} 
                       onChange={e => setProfileForm({...profileForm, bio: e.target.value})}
                       className="w-full rounded-xl border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                       rows={2}
                       placeholder="Tell us about yourself"
                     />
                  </div>
                  <div className="pt-4 space-y-3">
                     <Button type="submit" className="w-full">Save Changes</Button>
                     <Button type="button" variant="danger" className="w-full" onClick={onLogout}>Log Out</Button>
                  </div>
               </form>
            </div>
          </div>
        </div>
      )}

      {/* Messages Modal/Drawer */}
      {isMessagesOpen && (
         <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsMessagesOpen(false)}></div>
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right duration-300">
              {/* Messages Content - Similar layout to MerchantView but simplified for Shopper */}
               <div className="flex h-full">
                  {/* List (Hidden on mobile if chat active) */}
                  <div className={`${activeChatPartnerId ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 border-r border-slate-100 dark:border-slate-800 flex-col bg-white dark:bg-slate-900`}>
                     <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <h3 className="font-bold text-slate-900 dark:text-white">Messages</h3>
                        <button onClick={() => setIsMessagesOpen(false)} className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400">
                          <X size={20} />
                        </button>
                     </div>
                     <div className="flex-1 overflow-y-auto">
                        {contactIds.length === 0 ? (
                           <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                              <MessageCircle size={32} className="mx-auto mb-2 opacity-20" />
                              <p className="text-sm">No messages yet. Chat with a store from their product page.</p>
                           </div>
                        ) : (
                           contactIds.map(id => {
                              const store = getStoreByOwnerId(id);
                              const lastMsg = myMessages
                                 .filter(m => (m.senderId === id || m.receiverId === id))
                                 .sort((a, b) => b.timestamp - a.timestamp)[0];
                              
                              return (
                                 <div 
                                    key={id}
                                    onClick={() => setActiveChatPartnerId(id)}
                                    className={`p-4 cursor-pointer border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 ${activeChatPartnerId === id ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}
                                 >
                                    <div className="flex justify-between items-baseline mb-1">
                                       <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{store?.name || 'Store Owner'}</h4>
                                       {lastMsg && <span className="text-[10px] text-slate-400">{new Date(lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{lastMsg?.content}</p>
                                 </div>
                              );
                           })
                        )}
                     </div>
                  </div>

                  {/* Chat Area */}
                  <div className={`${activeChatPartnerId ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-slate-50 dark:bg-slate-950 relative w-full`}>
                      {activeChatPartnerId ? (
                         <>
                            <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shadow-sm z-10">
                               <div className="flex items-center gap-2">
                                  <button onClick={() => setActiveChatPartnerId(null)} className="md:hidden p-1 -ml-2 text-slate-500 dark:text-slate-400">
                                     <ChevronLeft size={24} />
                                  </button>
                                  <div className="flex items-center gap-2">
                                     <div className="h-8 w-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                                        {getStoreByOwnerId(activeChatPartnerId)?.name.charAt(0) || 'S'}
                                     </div>
                                     <span className="font-bold text-slate-900 dark:text-white">{getStoreByOwnerId(activeChatPartnerId)?.name || 'Store Support'}</span>
                                  </div>
                               </div>
                               <button onClick={() => setIsMessagesOpen(false)} className="hidden md:block p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400">
                                  <X size={20} />
                               </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                               {activeChatMessages.map(msg => (
                                  <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                     <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                                        msg.senderId === currentUser.id 
                                        ? 'bg-emerald-600 text-white rounded-br-none' 
                                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'
                                     }`}>
                                        <p>{msg.content}</p>
                                        <span className={`text-[10px] block text-right mt-1 ${msg.senderId === currentUser.id ? 'text-emerald-200' : 'text-slate-400'}`}>
                                           {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                     </div>
                                  </div>
                               ))}
                               <div ref={messagesEndRef} />
                            </div>

                            <form onSubmit={handleSendMessageSubmit} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                               <input 
                                  type="text" 
                                  value={messageInput}
                                  onChange={(e) => setMessageInput(e.target.value)}
                                  placeholder="Type a message..."
                                  className="flex-1 bg-slate-100 dark:bg-slate-800 border-0 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-500"
                               />
                               <button 
                                  type="submit"
                                  disabled={!messageInput.trim()}
                                  className="p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                               >
                                  <Send size={18} />
                               </button>
                            </form>
                         </>
                      ) : (
                         <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                               <MessageCircle size={32} />
                            </div>
                            <p>Select a conversation to start chatting</p>
                            <button onClick={() => setIsMessagesOpen(false)} className="hidden md:block mt-4 text-emerald-600 dark:text-emerald-400 text-sm hover:underline">Close Messages</button>
                         </div>
                      )}
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};