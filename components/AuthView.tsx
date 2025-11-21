import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { Button } from './Button';
import { Store, User as UserIcon, Lock, Mail, AlertCircle, ArrowRight, ShoppingBag, Globe } from 'lucide-react';

interface AuthViewProps {
  onLogin: (email: string, pass: string) => void;
  onSignup: (name: string, email: string, pass: string, role: UserRole) => void;
  error?: string | null;
  isLoading?: boolean;
  onErrorClear?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin, onSignup, error, isLoading, onErrorClear }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [isVisible, setIsVisible] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.SHOPPER);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      onLogin(email, password);
    } else {
      onSignup(name, email, password, role);
    }
  };

  const toggleMode = () => {
      setIsVisible(false);
      setTimeout(() => {
          setMode(mode === 'login' ? 'signup' : 'login');
          if(onErrorClear) onErrorClear();
          setIsVisible(true);
      }, 300);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/20 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-[120px] animate-pulse delay-1000"></div>
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-teal-500/10 blur-[100px]"></div>
      </div>
      
      <div className={`relative z-10 w-full max-w-5xl h-[85vh] bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col md:flex-row transition-all duration-500 transform ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        
        {/* Left Panel (Visual) */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-emerald-600 to-teal-800 relative p-12 text-white flex-col justify-between overflow-hidden group">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay opacity-20 group-hover:scale-105 transition-transform duration-1000"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          
          <div className="relative z-10">
            <div className="h-12 w-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-8 border border-white/20 shadow-lg">
              <Globe className="text-white" size={24} />
            </div>
            <h1 className="text-5xl font-bold leading-tight mb-6">
              {mode === 'login' ? 'Welcome Back.' : 'Join the Community.'}
            </h1>
            <p className="text-emerald-100 text-lg max-w-sm">
              {mode === 'login' 
                ? 'Connecting you to the heartbeat of your local neighborhood market.' 
                : 'Start your journey to support local businesses and find fresh treasures.'}
            </p>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
               <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white/20 bg-white/30 backdrop-blur-sm overflow-hidden">
                       <img src={`https://i.pravatar.cc/100?img=${10+i}`} alt="User" className="w-full h-full object-cover" />
                    </div>
                  ))}
               </div>
               <span className="text-sm font-medium text-emerald-100">Join 10,000+ locals</span>
            </div>
            <div className="flex gap-6 text-xs font-medium text-emerald-200/70">
               <span className="cursor-pointer hover:text-white transition-colors">Privacy Policy</span>
               <span className="cursor-pointer hover:text-white transition-colors">Terms of Service</span>
            </div>
          </div>
        </div>

        {/* Right Panel (Form) */}
        <div className="w-full md:w-1/2 bg-white flex flex-col justify-center p-8 sm:p-12 lg:p-16 relative">
           <div className="max-w-sm mx-auto w-full">
              <div className="text-center mb-10">
                 <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                 </h2>
                 <p className="text-slate-500">
                    {mode === 'login' ? 'Enter your credentials to access your account' : 'Fill in your details to get started'}
                 </p>
              </div>

              {error && (
                <div className="mb-6 bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                   <AlertCircle size={16} />
                   {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                 {mode === 'signup' && (
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Full Name</label>
                       <div className="relative group">
                          <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                          <input 
                             type="text" 
                             value={name}
                             onChange={(e) => setName(e.target.value)}
                             className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-12 py-3.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                             placeholder="John Doe"
                             required
                          />
                       </div>
                    </div>
                 )}

                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Email Address</label>
                    <div className="relative group">
                       <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                       <input 
                          type="email" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-12 py-3.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                          placeholder="name@example.com"
                          required
                       />
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Password</label>
                    <div className="relative group">
                       <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                       <input 
                          type="password" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-12 py-3.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                          placeholder="••••••••"
                          required
                       />
                    </div>
                 </div>

                 {mode === 'signup' && (
                   <div className="grid grid-cols-2 gap-4 pt-2">
                      <button
                        type="button"
                        onClick={() => setRole(UserRole.SHOPPER)}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${role === UserRole.SHOPPER ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                      >
                         <ShoppingBag size={24} />
                         <span className="text-sm font-bold">Shopper</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole(UserRole.MERCHANT)}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${role === UserRole.MERCHANT ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                      >
                         <Store size={24} />
                         <span className="text-sm font-bold">Merchant</span>
                      </button>
                   </div>
                 )}

                 <Button 
                    type="submit" 
                    className="w-full py-4 text-base mt-4 rounded-xl"
                    isLoading={isLoading}
                    variant={mode === 'signup' && role === UserRole.MERCHANT ? 'secondary' : 'primary'}
                 >
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={18} className="ml-2 opacity-80" />
                 </Button>
              </form>

              <div className="mt-8 text-center">
                 <p className="text-slate-500">
                    {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                    <button 
                       onClick={toggleMode}
                       className="ml-2 font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-all"
                    >
                       {mode === 'login' ? 'Sign Up' : 'Sign In'}
                    </button>
                 </p>
              </div>

              {mode === 'login' && (
                 <div className="mt-8 pt-6 border-t border-slate-100">
                    <p className="text-xs text-center text-slate-400 mb-3 uppercase tracking-wide font-semibold">Demo Accounts</p>
                    <div className="flex gap-2 justify-center text-xs">
                       <button 
                          onClick={() => {setEmail('shopper@test.com'); setPassword('password');}}
                          className="px-3 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 text-slate-600 rounded-full transition-colors font-medium"
                       >
                          Shopper
                       </button>
                       <button 
                          onClick={() => {setEmail('merchant@test.com'); setPassword('password');}}
                          className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-full transition-colors font-medium"
                       >
                          Merchant
                       </button>
                    </div>
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
