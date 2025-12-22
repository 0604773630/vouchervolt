import React, { useState } from 'react';
import PhoneInterface from './components/PhoneInterface';
import ArchitectureBlueprint from './components/ArchitectureBlueprint';
import FraudConsole from './components/FraudConsole';
import { Transaction, UserContextState, VirtualCard, UserProfile, KycTier } from './types';
import { generateVirtualCard, MOCK_USER } from './services/mockBanking';

export default function App() {
  const [activeTab, setActiveTab] = useState<'APP' | 'ARCHITECT' | 'FRAUD'>('APP');
  
  // Simulated Global State
  const [user, setUser] = useState<UserProfile>(MOCK_USER);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [virtualCard] = useState<VirtualCard>(generateVirtualCard());

  const userContext: UserContextState = {
    user,
    balance,
    transactions,
    virtualCard,
    addTransaction: (tx) => setTransactions(prev => [...prev, tx]),
    updateBalance: (amt) => setBalance(prev => prev + amt),
    upgradeKyc: () => setUser(prev => ({ ...prev, kycTier: KycTier.TIER_2 }))
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-brand-accent w-8 h-8 rounded flex items-center justify-center text-slate-900 font-bold">
              V
            </div>
            <span className="text-white font-bold tracking-tight">VoucherVault</span>
          </div>
          
          <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
             <button 
                onClick={() => setActiveTab('APP')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${activeTab === 'APP' ? 'bg-brand-accent text-slate-900' : 'text-slate-400 hover:text-white'}`}
             >
                Prototype
             </button>
             <button 
                onClick={() => setActiveTab('ARCHITECT')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${activeTab === 'ARCHITECT' ? 'bg-brand-accent text-slate-900' : 'text-slate-400 hover:text-white'}`}
             >
                Blueprint
             </button>
             <button 
                onClick={() => setActiveTab('FRAUD')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${activeTab === 'FRAUD' ? 'bg-brand-accent text-slate-900' : 'text-slate-400 hover:text-white'}`}
             >
                AI Sentinel
             </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none"></div>
        
        <div className="relative z-10 h-full">
          {activeTab === 'APP' && (
            <div className="h-full flex flex-col items-center justify-center py-8">
               <PhoneInterface userState={userContext} />
               <p className="text-slate-600 mt-4 text-xs font-mono text-center">
                   Test Data:<br/> 
                   Voucher: 1234567890<br/>
                   PIN: 123456
               </p>
            </div>
          )}

          {activeTab === 'ARCHITECT' && <ArchitectureBlueprint />}
          
          {activeTab === 'FRAUD' && <FraudConsole transactions={transactions} />}
        </div>
      </main>
    </div>
  );
}