import React, { useState, useEffect, useRef } from 'react';
import { Plus, Sparkles, Package, TrendingUp, ShoppingBag, Store as StoreIcon, Settings, Search, MapPin, Upload, X, Phone, Briefcase, MessageCircle, Send, ChevronLeft, User, Bell, CheckSquare, Trash2, CheckCircle, Square, Pencil, LogOut, CreditCard, Moon, Sun, Save } from 'lucide-react';
import { Product, Order, StoreType, Store, User as UserType, Message } from '../types';
import { STORE_TYPES, STORE_CATEGORIES } from '../constants';
import { Button } from './Button';
import { generateProductDescription } from '../services/geminiService';

interface MerchantViewProps {
  products: Product[];
  orders: Order[];
  stores: Store[];
  currentUser: UserType;
  onAddProduct: (product: Product) => void;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onAddStore: (store: Store) => void;
  onUpdateStore: (store: Store) => void;
  messages: Message[];
  onSendMessage: (text: string, receiverId: string) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onUpdateProfile: (data: Partial<UserType>) => void;
}

export const MerchantView: React.FC<MerchantViewProps> = ({ 
  products, 
  orders, 
  stores, 
  currentUser, 
  onAddProduct, 
  onUpdateOrderStatus, 
  onAddStore,
  onUpdateStore,
  messages,
  onSendMessage,
  onLogout,
  isDarkMode,
  toggleDarkMode,
  onUpdateProfile
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'stores' | 'messages' | 'profile'>('inventory');
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingStore, setIsAddingStore] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  
  // Chat State
  const [activeChatPartnerId, setActiveChatPartnerId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter stores for current user
  const myStores = stores.filter(s => s.ownerId === currentUser.id);

  // Product Form State
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [newName, setNewName] = useState('');
  // Derived state for store type based on selectedStoreId
  const [newCategory, setNewCategory] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newKeywords, setNewKeywords] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newImage, setNewImage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Store Form State
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [storeForm, setStoreForm] = useState({
    name: '',
    type: STORE_TYPES[0],
    address: '',
    phoneNumber: ''
  });

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phoneNumber: currentUser.phoneNumber || '',
    bio: currentUser.bio || '',
  });

  // Set default store selection
  useEffect(() => {
    if (myStores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(myStores[0].id);
    }
  }, [myStores]);

  // Clear selections when tab changes
  useEffect(() => {
    setSelectedOrderIds(new Set());
  }, [activeTab]);

  const getSelectedStoreType = (): StoreType => {
    const store = myStores.find(s => s.id === selectedStoreId);
    return store ? store.type : STORE_TYPES[0];
  };

  useEffect(() => {
    // Reset category when store changes (which changes store type)
    const currentType = getSelectedStoreType();
    setNewCategory(STORE_CATEGORIES[currentType][0]);
  }, [selectedStoreId, myStores]);
  
  useEffect(() => {
    if (activeTab === 'messages' && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab, activeChatPartnerId]);

  // Filter messages for current user
  const myMessages = messages.filter(m => m.senderId === currentUser.id || m.receiverId === currentUser.id);
  
  // Get unique contacts (Shoppers)
  const contactIds = Array.from(new Set(myMessages.map(m => m.senderId === currentUser.id ? m.receiverId : m.senderId)));
  
  // Current chat messages
  const activeChatMessages = myMessages
    .filter(m => 
      (m.senderId === currentUser.id && m.receiverId === activeChatPartnerId) || 
      (m.senderId === activeChatPartnerId && m.receiverId === currentUser.id)
    )
    .sort((a, b) => a.timestamp - b.timestamp);

  const unreadMessagesCount = myMessages.filter(m => m.receiverId === currentUser.id).length;

  const handleSendMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChatPartnerId) return;
    onSendMessage(messageInput, activeChatPartnerId);
    setMessageInput('');
  };

  const handleGenerateDescription = async () => {
    if (!newName || !newKeywords) {
      alert("Please enter a product name and some keywords first.");
      return;
    }
    setIsGenerating(true);
    const currentType = getSelectedStoreType();
    const desc = await generateProductDescription(newName, newCategory, newKeywords, currentType);
    setNewDescription(desc);
    setIsGenerating(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Handle case where no stores exist yet (though UI should prevent this)
    let storeIdToUse = selectedStoreId;
    let storeTypeToUse: StoreType = STORE_TYPES[0];
    let storeNameToUse = 'My Store';

    if (myStores.length > 0) {
      const selectedStore = myStores.find(s => s.id === selectedStoreId);
      if (!selectedStore) {
        alert("Please select a store");
        return;
      }
      storeTypeToUse = selectedStore.type;
      storeNameToUse = selectedStore.name;
    }

    const product: Product = {
      id: Math.random().toString(36).substr(2, 9),
      name: newName,
      storeType: storeTypeToUse,
      category: newCategory,
      price: parseFloat(newPrice),
      stock: parseInt(newStock),
      description: newDescription,
      imageUrl: newImage || `https://picsum.photos/400/300?random=${Math.floor(Math.random() * 1000)}`,
      storeName: storeNameToUse,
      storeId: storeIdToUse,
      distance: '0.3 mi' // In a real app, calculate this
    };
    onAddProduct(product);
    setIsAdding(false);
    setNewName('');
    setNewPrice('');
    setNewStock('');
    setNewKeywords('');
    setNewDescription('');
    setNewImage('');
  };

  const handleStoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStoreId) {
      // Update existing store
      const originalStore = stores.find(s => s.id === editingStoreId);
      if (originalStore) {
        const updatedStore: Store = {
          ...originalStore,
          name: storeForm.name,
          type: storeForm.type,
          address: storeForm.address,
          phoneNumber: storeForm.phoneNumber
        };
        onUpdateStore(updatedStore);
      }
    } else {
      // Create new store
      const newStore: Store = {
        id: Math.random().toString(36).substr(2, 9),
        ownerId: currentUser.id,
        name: storeForm.name,
        type: storeForm.type,
        address: storeForm.address,
        phoneNumber: storeForm.phoneNumber
      };
      onAddStore(newStore);
    }
    
    setIsAddingStore(false);
    setEditingStoreId(null);
    setStoreForm({
      name: '',
      type: STORE_TYPES[0],
      address: '',
      phoneNumber: ''
    });
    // Switch to stores tab to show it
    setActiveTab('stores');
  };

  const handleEditStore = (store: Store) => {
    setStoreForm({
      name: store.name,
      type: store.type,
      address: store.address,
      phoneNumber: store.phoneNumber
    });
    setEditingStoreId(store.id);
    setIsAddingStore(true);
  };

  const closeStoreForm = () => {
    setIsAddingStore(false);
    setEditingStoreId(null);
    setStoreForm({
      name: '',
      type: STORE_TYPES[0],
      address: '',
      phoneNumber: ''
    });
  };

  const openAddStoreForm = () => {
    setEditingStoreId(null);
    setStoreForm({
      name: '',
      type: STORE_TYPES[0],
      address: '',
      phoneNumber: ''
    });
    setIsAddingStore(true);
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(profileForm);
    alert("Profile updated successfully!");
  };

  const filteredOrders = orders.filter(order => {
    const query = orderSearchQuery.toLowerCase();
    return (
      order.customerName.toLowerCase().includes(query) ||
      order.address.toLowerCase().includes(query) ||
      order.id.toLowerCase().includes(query) ||
      order.status.toLowerCase().includes(query)
    );
  });

  // Selection Handlers
  const toggleOrderSelection = (id: string) => {
    const newSet = new Set(selectedOrderIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedOrderIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedOrderIds.size === filteredOrders.length && filteredOrders.length > 0) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const handleBulkAction = (status: Order['status']) => {
    if (selectedOrderIds.size === 0) return;
    
    const actionName = status === 'delivered' ? 'mark as delivered' : status === 'cancelled' ? 'cancel' : 'update';
    
    if (window.confirm(`Are you sure you want to ${actionName} ${selectedOrderIds.size} orders?`)) {
      selectedOrderIds.forEach(id => {
        onUpdateOrderStatus(id, status);
      });
      setSelectedOrderIds(new Set()); // Clear selection after action
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pb-16 md:pb-0 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">M</div>
            <span className="font-bold text-xl text-slate-900 dark:text-white">Merchant Portal</span>
          </div>
          <div className="flex items-center gap-4">
            {myStores.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                 <StoreIcon size={16} />
                 <span>{myStores.length} Store{myStores.length !== 1 ? 's' : ''} Active</span>
              </div>
            )}
            
            <button onClick={toggleDarkMode} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors">
               {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button 
              onClick={() => setIsNotificationsOpen(true)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 relative"
            >
              <Bell size={20} />
              <span className="absolute top-1.5 right-2 h-2 w-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
            </button>

            <button 
              onClick={() => setActiveTab('profile')}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hidden md:block"
            >
              <Settings size={20} />
            </button>
            <button onClick={onLogout} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 md:hidden">
               <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Total Products</h3>
              <Package className="text-indigo-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{products.length}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Active Orders</h3>
              <ShoppingBag className="text-emerald-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Revenue</h3>
              <TrendingUp className="text-amber-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">₹{orders.filter(o => o.status !== 'cancelled').reduce((acc, o) => acc + o.total, 0).toFixed(2)}</p>
          </div>
        </div>

        {/* Tabs (Hidden on mobile) */}
        <div className="hidden md:flex space-x-6 border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto">
          <button 
            className={`pb-4 px-2 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'inventory' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            onClick={() => setActiveTab('inventory')}
          >
            Inventory
            {activeTab === 'inventory' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full"></div>}
          </button>
          <button 
            className={`pb-4 px-2 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'orders' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            onClick={() => setActiveTab('orders')}
          >
            Orders
            {orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length > 0 && (
              <span className="ml-2 bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length}
              </span>
            )}
            {activeTab === 'orders' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full"></div>}
          </button>
          <button 
            className={`pb-4 px-2 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'stores' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            onClick={() => setActiveTab('stores')}
          >
            My Stores
            {activeTab === 'stores' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full"></div>}
          </button>
          <button 
            className={`pb-4 px-2 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'messages' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            onClick={() => setActiveTab('messages')}
          >
            Messages
            {unreadMessagesCount > 0 && (
               <span className="ml-2 bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadMessagesCount}
               </span>
            )}
            {activeTab === 'messages' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full"></div>}
          </button>
          <button 
            className={`pb-4 px-2 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'profile' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
            {activeTab === 'profile' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full"></div>}
          </button>
        </div>

        {/* Content */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-8">
             <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
               <User className="text-indigo-600 dark:text-indigo-400" /> Merchant Profile
             </h2>
             <p className="text-slate-500 dark:text-slate-400 mb-8">Manage your personal information and contact details visible to customers.</p>
             
             <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div>
                   <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                   <input 
                     type="text" 
                     value={profileForm.name} 
                     onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                     className="w-full rounded-xl border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                     required
                   />
                </div>
                
                <div>
                   <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                   <input 
                     type="email" 
                     value={profileForm.email} 
                     onChange={e => setProfileForm({...profileForm, email: e.target.value})}
                     className="w-full rounded-xl border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 opacity-70 cursor-not-allowed"
                     disabled
                     title="Email cannot be changed"
                   />
                </div>

                <div>
                   <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Contact Phone</label>
                   <input 
                     type="tel" 
                     value={profileForm.phoneNumber} 
                     onChange={e => setProfileForm({...profileForm, phoneNumber: e.target.value})}
                     className="w-full rounded-xl border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                     placeholder="+91 98765 43210"
                   />
                </div>

                <div>
                   <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Bio / Business Description</label>
                   <textarea 
                     rows={4}
                     value={profileForm.bio} 
                     onChange={e => setProfileForm({...profileForm, bio: e.target.value})}
                     className="w-full rounded-xl border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                     placeholder="Tell customers about your business..."
                   />
                </div>

                <div className="pt-4 flex justify-end">
                   <Button type="submit" icon={<Save size={18} />}>Save Profile</Button>
                </div>
             </form>
          </div>
        )}

        {activeTab === 'messages' && (
           <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex h-[600px]">
              {/* Sidebar */}
              <div className="w-full md:w-1/3 border-r border-slate-100 dark:border-slate-800 flex flex-col">
                 <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-slate-900 dark:text-white">Customers</h3>
                 </div>
                 <div className="flex-1 overflow-y-auto">
                    {contactIds.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 px-4">
                        <p>No messages yet.</p>
                      </div>
                    ) : (
                      contactIds.map(id => {
                        const lastMsg = myMessages
                           .filter(m => (m.senderId === id || m.receiverId === id))
                           .sort((a, b) => b.timestamp - a.timestamp)[0];
                        const contactName = lastMsg.senderId === id ? lastMsg.senderName : 'Customer'; 
                        
                        return (
                          <div 
                            key={id}
                            onClick={() => setActiveChatPartnerId(id)}
                            className={`p-4 cursor-pointer border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${activeChatPartnerId === id ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}
                          >
                             <div className="flex justify-between items-baseline mb-1">
                                <h4 className="font-bold text-slate-800 dark:text-slate-200">{contactName}</h4>
                                <span className="text-xs text-slate-400">{new Date(lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                             </div>
                             <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{lastMsg.content}</p>
                          </div>
                        );
                      })
                    )}
                 </div>
              </div>
              
              {/* Chat Area */}
              <div className={`${activeChatPartnerId ? 'flex' : 'hidden md:flex'} flex-1 flex-col absolute md:relative inset-0 md:inset-auto bg-white dark:bg-slate-900 z-10 md:z-0`}>
                 {!activeChatPartnerId ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                       <MessageCircle size={48} className="mb-4 opacity-20" />
                       <p>Select a customer to start chatting</p>
                    </div>
                 ) : (
                    <>
                       <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setActiveChatPartnerId(null)} className="md:hidden p-1 -ml-2 dark:text-slate-300">
                              <ChevronLeft size={24} />
                            </button>
                            <span className="font-bold text-slate-900 dark:text-white">Chat with Customer</span>
                          </div>
                       </div>
                       
                       <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-slate-950/50">
                          {activeChatMessages.map(msg => (
                             <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                                   msg.senderId === currentUser.id 
                                   ? 'bg-indigo-600 text-white rounded-br-none' 
                                   : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'
                                }`}>
                                   <p>{msg.content}</p>
                                   <span className={`text-[10px] block text-right mt-1 ${msg.senderId === currentUser.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                                      {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                   </span>
                                </div>
                             </div>
                          ))}
                          <div ref={messagesEndRef} />
                       </div>
                       
                       <form onSubmit={handleSendMessageSubmit} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                          <input 
                             type="text" 
                             value={messageInput}
                             onChange={(e) => setMessageInput(e.target.value)}
                             placeholder="Type your reply..."
                             className="flex-1 bg-slate-100 dark:bg-slate-800 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white placeholder:text-slate-500"
                          />
                          <button 
                             type="submit"
                             disabled={!messageInput.trim()}
                             className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                             <Send size={20} />
                          </button>
                       </form>
                    </>
                 )}
              </div>
           </div>
        )}

        {activeTab === 'stores' && (
           <div className="space-y-6">
             {!isAddingStore ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Add New Store Card */}
                  <button 
                    onClick={openAddStoreForm}
                    className="h-full min-h-[200px] flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl shadow-sm border-2 border-slate-200 dark:border-slate-800 border-dashed hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all group p-6"
                  >
                    <div className="h-14 w-14 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                       <Plus className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New Store</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm text-center mt-1">Expand your business with a new location or category</p>
                  </button>

                  {/* Existing Stores */}
                  {myStores.map(store => (
                    <div key={store.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 flex flex-col hover:shadow-md transition-shadow">
                       <div className="flex justify-between items-start mb-4">
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold shadow-sm
                            ${store.type === 'Kirana' ? 'bg-emerald-500' : 
                              store.type === 'Medical' ? 'bg-rose-500' : 
                              store.type === 'Electronics' ? 'bg-blue-500' : 'bg-amber-500'}`}>
                             {store.name.charAt(0)}
                          </div>
                          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg uppercase tracking-wide">
                            {store.type}
                          </span>
                       </div>
                       <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{store.name}</h3>
                       <div className="space-y-2 mt-auto pt-4 text-sm text-slate-500 dark:text-slate-400">
                          <p className="flex items-center gap-2"><MapPin size={14}/> {store.address}</p>
                          {store.phoneNumber && <p className="flex items-center gap-2"><Phone size={14}/> {store.phoneNumber}</p>}
                       </div>
                       <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-sm">
                          <span className="text-slate-400">ID: {store.id.slice(0,6)}</span>
                          <button 
                             onClick={() => handleEditStore(store)}
                             className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
                          >
                             <Pencil size={14} /> Edit
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
             ) : (
               <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-8">
                  <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{editingStoreId ? 'Edit Store' : 'Create New Store'}</h3>
                    <button onClick={closeStoreForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2">
                      <X size={24} />
                    </button>
                  </div>
                  
                  <form onSubmit={handleStoreSubmit} className="space-y-6">
                     <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Store Name</label>
                        <input 
                          required 
                          type="text" 
                          value={storeForm.name} 
                          onChange={e => setStoreForm({...storeForm, name: e.target.value})} 
                          className="w-full rounded-xl border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" 
                          placeholder="e.g. Downtown Electronics" 
                        />
                     </div>

                     <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Store Type</label>
                        <select 
                          value={storeForm.type} 
                          onChange={e => setStoreForm({...storeForm, type: e.target.value as StoreType})} 
                          className="w-full rounded-xl border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        >
                          {STORE_TYPES.map(t => <option key={t} value={t}>{t} Store</option>)}
                        </select>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">This determines the categories of products you can sell.</p>
                     </div>

                     <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Address / Location</label>
                        <input 
                          required 
                          type="text" 
                          value={storeForm.address} 
                          onChange={e => setStoreForm({...storeForm, address: e.target.value})} 
                          className="w-full rounded-xl border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" 
                          placeholder="e.g. 56 Market Street, Indore" 
                        />
                     </div>

                     <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Contact Phone</label>
                        <input 
                          required 
                          type="tel" 
                          value={storeForm.phoneNumber} 
                          onChange={e => setStoreForm({...storeForm, phoneNumber: e.target.value})} 
                          className="w-full rounded-xl border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" 
                          placeholder="e.g. +91 98765 43210" 
                        />
                     </div>

                     <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={closeStoreForm}>Cancel</Button>
                        <Button type="submit">{editingStoreId ? 'Update Store' : 'Create Store'}</Button>
                     </div>
                  </form>
               </div>
             )}
           </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {!isAdding ? (
              <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 border-dashed py-12 px-4">
                <div className="h-16 w-16 bg-indigo-50 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mb-4">
                  <Plus className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Add New Product</h3>
                <p className="text-slate-500 dark:text-slate-400 text-center mb-6 max-w-md">Expand your catalog by listing new items. Use our AI tool to generate descriptions automatically.</p>
                <Button variant="secondary" onClick={() => setIsAdding(true)} icon={<Plus size={18} />}>Add Product</Button>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-8">
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">New Product Details</h3>
                  <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2">
                    <X size={24} />
                  </button>
                </div>
                
                {myStores.length === 0 && onAddStore ? (
                  <div className="text-center py-8">
                    <p className="text-slate-600 mb-4">You need to create a store before adding products.</p>
                    <Button onClick={() => {setIsAdding(false); setActiveTab('stores'); setIsAddingStore(true);}}>Create a Store</Button>
                  </div>
                ) : (
                  <form onSubmit={handleProductSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      {/* Store Selection (if multiple) */}
                      {myStores.length > 0 && (
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Select Store</label>
                          <select 
                            value={selectedStoreId} 
                            onChange={e => setSelectedStoreId(e.target.value)} 
                            className="w-full rounded-xl border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                          >
                            {myStores.map(s => <option key={s.id} value={s.id}>{s.name} ({s.type})</option>)}
                          </select>
                        </div>
                      )}

                      {/* Image Upload */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Product Image</label>
                        {!newImage ? (
                          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer relative bg-slate-50/50 dark:bg-slate-900/50">
                            <input 
                              type="file" 
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              accept="image/*"
                              onChange={handleImageUpload}
                            />
                            <div className="space-y-1 text-center">
                               <div className="mx-auto h-12 w-12 text-indigo-400 flex items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/30 mb-2">
                                  <Upload size={24} />
                               </div>
                               <div className="flex text-sm text-slate-600 dark:text-slate-400 justify-center">
                                 <span className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">Upload a file</span>
                                 <p className="pl-1">or drag and drop</p>
                               </div>
                               <p className="text-xs text-slate-500 dark:text-slate-500">PNG, JPG, GIF up to 5MB</p>
                            </div>
                          </div>
                        ) : (
                          <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                            <img src={newImage} alt="Preview" className="w-full h-64 object-contain bg-slate-50 dark:bg-slate-800" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors">
                               <button 
                                 type="button"
                                 onClick={() => setNewImage('')}
                                 className="absolute top-2 right-2 p-1.5 bg-white text-rose-500 rounded-full shadow-md hover:bg-rose-50 transition-colors"
                               >
                                 <X size={16} />
                               </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Store Type Display (Read Only if selecting store) */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Store Type</label>
                        {myStores.length > 0 ? (
                           <div className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                             {getSelectedStoreType()} Store
                           </div>
                        ) : (
                          <select 
                            value={STORE_TYPES[0]} 
                            disabled
                            className="w-full rounded-xl border-slate-200 p-3 bg-slate-100"
                          >
                            <option>{STORE_TYPES[0]} Store</option>
                          </select>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Product Name</label>
                        <input required type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full rounded-xl border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Organic Sourdough" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Category</label>
                          <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full rounded-xl border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                            {STORE_CATEGORIES[getSelectedStoreType()]?.map(c => <option key={c} value={c}>{c}</option>) || <option>Other</option>}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Stock</label>
                          <input required type="number" value={newStock} onChange={e => setNewStock(e.target.value)} className="w-full rounded-xl border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="0" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Price (₹)</label>
                        <input required type="number" step="0.01" value={newPrice} onChange={e => setNewPrice(e.target.value)} className="w-full rounded-xl border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="0.00" />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6 border border-indigo-100 dark:border-indigo-900/30">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="text-indigo-600 dark:text-indigo-400 h-5 w-5" />
                          <label className="text-sm font-bold text-indigo-900 dark:text-indigo-200">AI Description Generator</label>
                        </div>
                        
                        <div className="flex gap-2 mb-4">
                          <input 
                            type="text" 
                            value={newKeywords} 
                            onChange={e => setNewKeywords(e.target.value)} 
                            className="flex-1 rounded-lg border-indigo-200 dark:border-indigo-700 p-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500" 
                            placeholder="Keywords (e.g. fresh, crispy, local)" 
                          />
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="secondary" 
                            onClick={handleGenerateDescription}
                            isLoading={isGenerating}
                          >
                            Generate
                          </Button>
                        </div>
                        
                        <textarea 
                          required 
                          rows={4} 
                          value={newDescription} 
                          onChange={e => setNewDescription(e.target.value)} 
                          className="w-full rounded-lg border-indigo-200 dark:border-indigo-700 p-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-indigo-500" 
                          placeholder="Generated description will appear here..."
                        />
                      </div>

                      <div className="flex items-center justify-end pt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} className="mr-2">Cancel</Button>
                        <Button type="submit" variant="secondary">Publish Product</Button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              {products.map(product => (
                <div key={product.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 flex items-center gap-6 hover:shadow-md transition-shadow">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="w-20 h-20 rounded-lg object-cover bg-slate-100 dark:bg-slate-800" 
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random&color=fff&size=128`;
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{product.name}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{product.category} • <span className="text-indigo-600 dark:text-indigo-400 font-medium">{product.storeName || 'Unknown Store'}</span></p>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">₹{product.price.toFixed(2)}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${product.stock > 10 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'}`}>
                        {product.stock} in stock
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 truncate max-w-md">{product.description}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                     <Settings size={18} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6">
             {/* Search and Bulk Actions Bar */}
             {orders.length > 0 && (
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    placeholder="Search by customer, address, ID, or status..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  />
                </div>

                {/* Selection & Bulk Actions Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleSelectAll}
                      className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    >
                      {selectedOrderIds.size > 0 && selectedOrderIds.size === filteredOrders.length ? (
                        <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400" />
                      )}
                      Select All
                    </button>
                    {selectedOrderIds.size > 0 && (
                      <span className="text-sm text-slate-500 border-l border-slate-200 dark:border-slate-700 pl-3">
                        {selectedOrderIds.size} selected
                      </span>
                    )}
                  </div>

                  {selectedOrderIds.size > 0 && (
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        onClick={() => handleBulkAction('delivered')}
                        className="whitespace-nowrap"
                        icon={<CheckCircle size={16} />}
                      >
                        Mark Delivered
                      </Button>
                      <Button 
                        size="sm" 
                        variant="danger" 
                        onClick={() => handleBulkAction('cancelled')}
                        className="whitespace-nowrap"
                        icon={<Trash2 size={16} />}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {orders.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="mx-auto w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                   <Package className="text-slate-300 dark:text-slate-600" size={32} />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">No orders yet. They will appear here.</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                 <div className="mx-auto w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                    <Search className="text-slate-300 dark:text-slate-600" size={24} />
                 </div>
                 <p className="text-slate-500 dark:text-slate-400 font-medium">No orders match your search.</p>
                 <button onClick={() => setOrderSearchQuery('')} className="mt-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 text-sm font-medium">
                   Clear Search
                 </button>
              </div>
            ) : (
              filteredOrders.map(order => (
                <div key={order.id} className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border transition-all overflow-hidden hover:shadow-md ${selectedOrderIds.has(order.id) ? 'border-indigo-300 ring-1 ring-indigo-300 bg-indigo-50/30 dark:bg-indigo-900/10' : 'border-slate-100 dark:border-slate-800'}`}>
                  <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                       {/* Selection Checkbox */}
                       <div className="pt-1">
                          <input 
                            type="checkbox"
                            checked={selectedOrderIds.has(order.id)}
                            onChange={() => toggleOrderSelection(order.id)}
                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                          />
                       </div>

                       <div className={`p-3 rounded-xl shrink-0 hidden sm:flex items-center justify-center ${order.status === 'delivered' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : order.status === 'cancelled' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'}`}>
                          <Package size={24} />
                       </div>
                       <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                             <h3 className="font-bold text-slate-900 dark:text-white text-lg">{order.customerName}</h3>
                             <span className="text-slate-400 text-sm">#{order.id.slice(0,6)}</span>
                             <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide
                              ${order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : 
                                order.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 
                                order.status === 'cancelled' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300' :
                                'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                              {order.status}
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-1.5 mt-1">
                             <p className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                                <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0"/> 
                                {order.address}
                             </p>
                             <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                <span>{new Date(order.timestamp).toLocaleString()}</span>
                                {order.phoneNumber && (
                                   <span className="flex items-center gap-1"><Phone size={12}/> {order.phoneNumber}</span>
                                )}
                                <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 font-semibold">
                                  <CreditCard size={12}/> {order.paymentMethod || 'COD'}
                                </span>
                             </div>
                          </div>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0 pl-9 sm:pl-0">
                       {order.status === 'pending' && (
                         <Button size="sm" onClick={() => onUpdateOrderStatus(order.id, 'preparing')}>Accept Order</Button>
                       )}
                       {order.status === 'preparing' && (
                         <Button size="sm" onClick={() => onUpdateOrderStatus(order.id, 'delivering')}>Mark Ready</Button>
                       )}
                       {order.status === 'delivering' && (
                         <Button size="sm" onClick={() => onUpdateOrderStatus(order.id, 'delivered')}>Complete Delivery</Button>
                       )}
                    </div>
                  </div>
                  <div className="bg-slate-50/50 dark:bg-slate-950/30 p-4 pl-16 sm:pl-20 md:pl-6">
                     <div className="space-y-2">
                        {order.items.map(item => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-sm">{item.quantity}x</span>
                              <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                            </div>
                            <span className="font-medium text-slate-900 dark:text-white">₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                     </div>
                     <div className="border-t border-slate-200 dark:border-slate-700 mt-4 pt-3 flex justify-between font-bold text-slate-900 dark:text-white">
                        <span>Total Revenue</span>
                        <span>₹{order.total.toFixed(2)}</span>
                     </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 pb-safe shadow-lg">
        <div className="flex justify-around items-center h-16">
          <button onClick={() => setActiveTab('inventory')} className={`flex flex-col items-center justify-center w-full h-full active:scale-95 transition-transform ${activeTab === 'inventory' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
            <Package size={24} />
            <span className="text-[10px] mt-1 font-medium">Items</span>
          </button>
          <button onClick={() => setActiveTab('orders')} className={`flex flex-col items-center justify-center w-full h-full active:scale-95 transition-transform ${activeTab === 'orders' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
            <ShoppingBag size={24} />
            <span className="text-[10px] mt-1 font-medium">Orders</span>
          </button>
          <button onClick={() => setActiveTab('stores')} className={`flex flex-col items-center justify-center w-full h-full active:scale-95 transition-transform ${activeTab === 'stores' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
            <StoreIcon size={24} />
            <span className="text-[10px] mt-1 font-medium">Stores</span>
          </button>
          <button onClick={() => setActiveTab('messages')} className={`flex flex-col items-center justify-center w-full h-full active:scale-95 transition-transform relative ${activeTab === 'messages' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
            <MessageCircle size={24} />
            <span className="text-[10px] mt-1 font-medium">Chat</span>
             {unreadMessagesCount > 0 && <span className="absolute top-3 right-6 h-2 w-2 bg-rose-500 rounded-full animate-pulse"></span>}
          </button>
          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center justify-center w-full h-full active:scale-95 transition-transform relative ${activeTab === 'profile' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
            <User size={24} />
            <span className="text-[10px] mt-1 font-medium">Profile</span>
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
                 <button onClick={() => setIsNotificationsOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                   <X size={24} />
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                     <div className="flex gap-3">
                        <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                           <ShoppingBag size={20} />
                        </div>
                        <div>
                           <h4 className="font-bold text-slate-900 dark:text-white text-sm">New Order Received</h4>
                           <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">You received a new order #123456 from Jane Doe worth ₹1500.00.</p>
                           <span className="text-[10px] text-slate-400 mt-2 block">5 mins ago</span>
                        </div>
                     </div>
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                     <div className="flex gap-3">
                        <div className="h-10 w-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
                           <Package size={20} />
                        </div>
                        <div>
                           <h4 className="font-bold text-slate-900 dark:text-white text-sm">Low Stock Alert</h4>
                           <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Organic Avocados are running low (only 5 items left).</p>
                           <span className="text-[10px] text-slate-400 mt-2 block">2 hours ago</span>
                        </div>
                     </div>
                  </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};