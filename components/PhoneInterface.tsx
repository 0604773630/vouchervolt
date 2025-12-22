import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, TransactionStatus, UserContextState, KycTier } from '../types';
import { validateVoucher, redeemVoucherFinalize, verifyPin } from '../services/mockBanking';

interface PhoneInterfaceProps {
  userState: UserContextState;
}

type Screen = 'HOME' | 'REDEEM_INPUT' | 'THE_SWITCH' | 'PIN_ENTRY' | 'SUCCESS' | 'KYC_INTRO' | 'KYC_SCAN' | 'CARD_VIEW';

const PhoneInterface: React.FC<PhoneInterfaceProps> = ({ userState }) => {
  const [activeScreen, setActiveScreen] = useState<Screen>('HOME');
  const [voucherInput, setVoucherInput] = useState('');
  const [pendingVoucher, setPendingVoucher] = useState<{amount: number, fee: number, provider: string} | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [kycStep, setKycStep] = useState(0);

  // --- LOGIC HANDLERS ---

  const handleVoucherCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await validateVoucher(voucherInput);
      if (result.success && result.amount) {
        setPendingVoucher({
          amount: result.amount,
          fee: result.fee || 7.50,
          provider: result.provider || 'Unknown'
        });
        setActiveScreen('THE_SWITCH');
      } else {
        setError(result.error || "Invalid Voucher");
      }
    } catch (e) {
      setError("Connection Error");
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async () => {
    setLoading(true);
    const isValid = await verifyPin(pinInput, userState.user.pinHash);
    setLoading(false);

    if (isValid && pendingVoucher) {
      // Process Transaction
      await redeemVoucherFinalize(voucherInput);
      
      const netAmount = pendingVoucher.amount - pendingVoucher.fee;
      
      userState.addTransaction({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        amount: netAmount,
        type: TransactionType.DEPOSIT,
        description: `Redeemed ${pendingVoucher.provider}`,
        status: TransactionStatus.SUCCESS,
        metadata: {
            originalAmount: pendingVoucher.amount,
            fee: pendingVoucher.fee
        }
      });
      
      userState.updateBalance(netAmount);
      setActiveScreen('SUCCESS');
    } else {
      setError("Incorrect PIN");
      setPinInput('');
    }
  };

  const runKycSimulation = () => {
    // Simulating Face Liveness + ID Extraction
    // Logic: 
    // 1. Capture Image -> 2. Biometric API (AWS Rekognition/Google Vision)
    // 3. Compare Face(Selfie) vs Face(ID Card)
    // 4. Extract Text (OCR) -> 5. Validate SA ID Checksum
    
    let step = 0;
    const interval = setInterval(() => {
        step++;
        setKycStep(step);
        if (step > 3) {
            clearInterval(interval);
            userState.upgradeKyc();
            setActiveScreen('HOME');
        }
    }, 1500);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(val);

  // --- SUB-COMPONENTS ---

  const PinPad = ({ onEnter }: { onEnter: () => void }) => (
    <div className="grid grid-cols-3 gap-4 px-6 mb-6">
        {[1,2,3,4,5,6,7,8,9].map(num => (
            <button key={num} onClick={() => setPinInput(prev => (prev.length < 6 ? prev + num : prev))} className="h-16 rounded-full bg-slate-800 text-white text-2xl font-bold hover:bg-slate-700 active:bg-brand-accent active:text-black transition">
                {num}
            </button>
        ))}
        <button className="h-16 flex items-center justify-center text-slate-400" onClick={() => setPinInput('')}>Clear</button>
        <button onClick={() => setPinInput(prev => (prev.length < 6 ? prev + '0' : prev))} className="h-16 rounded-full bg-slate-800 text-white text-2xl font-bold hover:bg-slate-700">0</button>
        <button className="h-16 flex items-center justify-center text-brand-accent" onClick={onEnter}>
             {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-arrow-right text-2xl"></i>}
        </button>
    </div>
  );

  // --- RENDER ---

  return (
    <div className="flex justify-center items-center h-full p-4">
      <div className="relative w-[375px] h-[780px] bg-slate-950 rounded-[3rem] border-[8px] border-slate-900 shadow-2xl overflow-hidden flex flex-col font-sans">
        
        {/* Status Bar */}
        <div className="bg-slate-900/90 backdrop-blur h-10 w-full flex justify-between items-center px-6 text-xs text-white z-20 absolute top-0">
          <span>12:45</span>
          <div className="flex gap-2 text-xs">
            <i className="fa-solid fa-wifi"></i>
            <i className="fa-solid fa-battery-three-quarters"></i>
          </div>
        </div>

        {/* --- SCREENS --- */}

        {/* 1. HOME SCREEN */}
        {activeScreen === 'HOME' && (
            <div className="flex flex-col h-full bg-slate-950 pt-14">
                {/* Top Bar */}
                <div className="px-6 flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3" onClick={() => setActiveScreen('KYC_INTRO')}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${userState.user.kycTier > 0 ? 'border-green-500 bg-green-900/20' : 'border-slate-700 bg-slate-800'}`}>
                            <i className={`fa-solid ${userState.user.kycTier > 0 ? 'fa-user-check text-green-400' : 'fa-user text-slate-400'}`}></i>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-400">Welcome back,</span>
                            <span className="text-sm font-bold text-white">{userState.user.name}</span>
                        </div>
                    </div>
                    <button className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white relative">
                        <i className="fa-regular fa-bell"></i>
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>
                </div>

                {/* Balance Section */}
                <div className="px-6 mb-8 text-center">
                    <span className="text-slate-400 text-sm uppercase tracking-widest">Available Balance</span>
                    <h1 className="text-4xl font-bold text-white mt-2">{formatCurrency(userState.balance)}</h1>
                </div>

                {/* Action Center (Grid) */}
                <div className="px-6 grid grid-cols-2 gap-4 mb-8">
                    <button 
                        onClick={() => setActiveScreen('REDEEM_INPUT')}
                        className="col-span-2 bg-brand-accent p-4 rounded-xl flex items-center justify-between group active:scale-95 transition"
                    >
                        <div className="flex flex-col items-start">
                            <span className="font-bold text-slate-900 text-lg">Redeem Voucher</span>
                            <span className="text-slate-800 text-xs">FNB, Absa, Standard Bank</span>
                        </div>
                        <div className="bg-white/30 w-10 h-10 rounded-full flex items-center justify-center text-slate-900">
                             <i className="fa-solid fa-plus"></i>
                        </div>
                    </button>

                    <button 
                        onClick={() => setShowCardDetails(!showCardDetails)}
                        className={`p-4 rounded-xl flex flex-col gap-3 transition border ${showCardDetails ? 'bg-slate-800 border-brand-accent' : 'bg-slate-900 border-slate-800'}`}
                    >
                        <i className="fa-regular fa-credit-card text-2xl text-white"></i>
                        <span className="text-slate-300 text-sm font-medium">{showCardDetails ? 'Hide Card' : 'View Card'}</span>
                    </button>

                    <button className="bg-slate-900 p-4 rounded-xl flex flex-col gap-3 border border-slate-800 opacity-50">
                        <i className="fa-solid fa-paper-plane text-2xl text-white"></i>
                        <span className="text-slate-300 text-sm font-medium">Send Cash</span>
                    </button>
                </div>

                {/* Card Detail Toggle Area */}
                {showCardDetails && (
                    <div className="mx-6 p-4 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl border border-indigo-500/30 mb-6 animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <i className="fa-brands fa-cc-visa text-3xl text-white"></i>
                            <span className="text-white/50 text-xs">PREPAID</span>
                        </div>
                        <div className="font-mono text-xl text-white tracking-widest mb-2">
                            {userState.virtualCard.cardNumber}
                        </div>
                        <div className="flex gap-4 text-sm text-slate-300 font-mono">
                            <span>EXP: {userState.virtualCard.expiry}</span>
                            <span>CVV: {userState.virtualCard.cvv}</span>
                        </div>
                    </div>
                )}

                {/* KYC Banner */}
                <div 
                    onClick={() => userState.user.kycTier === 0 && setActiveScreen('KYC_INTRO')}
                    className={`mt-auto mx-6 mb-6 p-4 rounded-lg flex items-center gap-3 cursor-pointer ${userState.user.kycTier === 0 ? 'bg-orange-500/10 border border-orange-500/50' : 'bg-green-500/10 border border-green-500/50'}`}
                >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${userState.user.kycTier === 0 ? 'bg-orange-500 text-black' : 'bg-green-500 text-black'}`}>
                        <i className={`fa-solid ${userState.user.kycTier === 0 ? 'fa-exclamation' : 'fa-check'}`}></i>
                    </div>
                    <div className="flex-1">
                        <h4 className={`text-sm font-bold ${userState.user.kycTier === 0 ? 'text-orange-400' : 'text-green-400'}`}>
                            {userState.user.kycTier === 0 ? 'Tier 1: Unverified' : 'Tier 2: Verified'}
                        </h4>
                        <p className="text-xs text-slate-400">
                            {userState.user.kycTier === 0 ? 'Tap to scan ID & upgrade limits.' : 'FICA compliant. High limits active.'}
                        </p>
                    </div>
                </div>
            </div>
        )}

        {/* 2. REDEEM INPUT */}
        {activeScreen === 'REDEEM_INPUT' && (
            <div className="flex flex-col h-full bg-slate-950 pt-14 px-6">
                <button onClick={() => setActiveScreen('HOME')} className="text-slate-400 mb-6 flex items-center gap-2">
                    <i className="fa-solid fa-arrow-left"></i> Cancel
                </button>
                <h2 className="text-2xl font-bold text-white mb-2">Redeem Voucher</h2>
                <p className="text-slate-400 text-sm mb-8">Enter the 10-12 digit PIN sent via SMS.</p>
                
                <input 
                    type="text" 
                    value={voucherInput}
                    onChange={(e) => setVoucherInput(e.target.value.replace(/\D/g, ''))}
                    maxLength={12}
                    className="bg-transparent border-b-2 border-brand-accent text-3xl text-white font-mono w-full py-2 mb-8 outline-none placeholder-slate-700"
                    placeholder="0000 0000 000"
                    autoFocus
                />
                
                {error && <p className="text-red-500 text-sm mb-4"><i className="fa-solid fa-circle-exclamation mr-1"></i> {error}</p>}

                <div className="mt-auto mb-6">
                    <button 
                        onClick={handleVoucherCheck}
                        disabled={loading || voucherInput.length < 10}
                        className={`w-full py-4 rounded-xl font-bold text-slate-900 transition ${loading || voucherInput.length < 10 ? 'bg-slate-800 text-slate-500' : 'bg-brand-accent'}`}
                    >
                        {loading ? 'Verifying...' : 'Next'}
                    </button>
                    {/* Demo Hint */}
                    <div className="mt-4 flex gap-2 justify-center">
                        <span onClick={() => setVoucherInput('1234567890')} className="text-xs text-slate-600 border border-slate-800 px-2 py-1 rounded cursor-pointer">Demo: FNB</span>
                    </div>
                </div>
            </div>
        )}

        {/* 3. THE SWITCH (Confirmation) */}
        {activeScreen === 'THE_SWITCH' && pendingVoucher && (
            <div className="flex flex-col h-full bg-slate-950 pt-14 px-6 relative">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-accent to-transparent opacity-50"></div>
                 
                 <h2 className="text-xl font-bold text-white text-center mb-10">Confirm Transaction</h2>

                 <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 mb-8">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-800">
                        <span className="text-slate-400">Voucher Value</span>
                        <span className="text-white font-bold">{formatCurrency(pendingVoucher.amount)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-800">
                        <span className="text-slate-400">Network Fee</span>
                        <span className="text-red-400 font-mono">-{formatCurrency(pendingVoucher.fee)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                        <span className="text-brand-accent font-bold">Total Credit</span>
                        <span className="text-3xl font-bold text-brand-accent">{formatCurrency(pendingVoucher.amount - pendingVoucher.fee)}</span>
                    </div>
                 </div>

                 <p className="text-center text-slate-500 text-sm mb-auto">
                    Funds will be immediately available on your virtual card.
                 </p>

                 <button 
                    onClick={() => setActiveScreen('PIN_ENTRY')}
                    className="w-full py-4 rounded-xl font-bold bg-white text-slate-900 mb-6 hover:bg-slate-200 transition"
                 >
                    Confirm & Load Funds
                 </button>
            </div>
        )}

        {/* 4. PIN ENTRY */}
        {activeScreen === 'PIN_ENTRY' && (
             <div className="flex flex-col h-full bg-slate-950 pt-14">
                <div className="px-6 text-center mb-10">
                    <i className="fa-solid fa-lock text-brand-accent text-3xl mb-4"></i>
                    <h2 className="text-xl font-bold text-white mb-2">Enter PIN</h2>
                    <p className="text-slate-400 text-sm">Please enter your 6-digit security PIN to authorize this transaction.</p>
                </div>

                <div className="flex justify-center gap-4 mb-12">
                    {[0,1,2,3,4,5].map(i => (
                        <div key={i} className={`w-4 h-4 rounded-full border border-slate-600 ${pinInput.length > i ? 'bg-brand-accent border-brand-accent' : 'bg-transparent'}`}></div>
                    ))}
                </div>

                {error && <p className="text-center text-red-500 mb-4 animate-pulse">{error}</p>}

                <div className="mt-auto">
                    <PinPad onEnter={handlePinSubmit} />
                    <p className="text-center text-slate-600 text-xs mb-6">Demo PIN: 123456</p>
                </div>
             </div>
        )}

        {/* 5. SUCCESS */}
        {activeScreen === 'SUCCESS' && (
            <div className="flex flex-col h-full bg-green-500 text-slate-900 items-center justify-center p-6 text-center">
                 <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl">
                    <i className="fa-solid fa-check text-4xl text-green-600"></i>
                 </div>
                 <h1 className="text-3xl font-bold text-white mb-2">Success!</h1>
                 <p className="text-green-900 font-medium mb-8">Your balance has been updated.</p>
                 <button onClick={() => { setActiveScreen('HOME'); setVoucherInput(''); setPinInput(''); }} className="bg-white px-8 py-3 rounded-full font-bold shadow-lg">
                    Return Home
                 </button>
            </div>
        )}

        {/* 6. KYC FLOW */}
        {activeScreen === 'KYC_INTRO' && (
            <div className="flex flex-col h-full bg-slate-950 pt-14 px-6">
                <button onClick={() => setActiveScreen('HOME')} className="text-slate-400 mb-4"><i className="fa-solid fa-xmark"></i> Close</button>
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-brand-accent relative">
                        <i className="fa-solid fa-id-card text-4xl text-white"></i>
                        <div className="absolute -bottom-2 bg-brand-accent text-slate-900 text-xs font-bold px-2 py-1 rounded">FICA</div>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Verify Identity</h2>
                    <p className="text-slate-400 text-sm mb-6 max-w-xs">
                        To remove limits and enable withdrawals, we need to verify your South African ID and take a selfie.
                    </p>
                    <div className="bg-slate-900 p-4 rounded-lg text-left w-full mb-8 border border-slate-800">
                        <div className="flex gap-3 mb-3">
                            <i className="fa-solid fa-camera text-brand-accent mt-1"></i>
                            <div>
                                <h4 className="text-white text-sm font-bold">Liveness Check</h4>
                                <p className="text-slate-500 text-xs">Selfie video to ensure you are real.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <i className="fa-solid fa-address-book text-brand-accent mt-1"></i>
                            <div>
                                <h4 className="text-white text-sm font-bold">Document Scan</h4>
                                <p className="text-slate-500 text-xs">Scan of Green ID Book or Smart Card.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <button onClick={() => { setActiveScreen('KYC_SCAN'); runKycSimulation(); }} className="w-full py-4 rounded-xl bg-brand-accent font-bold mb-6">Start Verification</button>
            </div>
        )}

        {activeScreen === 'KYC_SCAN' && (
            <div className="flex flex-col h-full bg-black relative">
                 {/* Mock Camera View */}
                 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40"></div>
                 
                 <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <div className="w-64 h-64 border-2 border-brand-accent rounded-full relative overflow-hidden mb-8">
                         <div className="absolute inset-0 bg-brand-accent/20 animate-pulse"></div>
                         <div className="absolute top-1/2 left-0 w-full h-0.5 bg-brand-accent shadow-[0_0_20px_#00d4ff]"></div>
                    </div>
                    <h3 className="text-white font-bold text-xl mb-2">
                        {kycStep === 1 && "Align Face..."}
                        {kycStep === 2 && "Hold Still..."}
                        {kycStep === 3 && "Scanning ID..."}
                        {kycStep > 3 && "Uploading securely..."}
                    </h3>
                    <p className="text-slate-300 text-xs">
                         {kycStep === 1 && "Position your face in the circle"}
                         {kycStep === 2 && "Checking for liveness..."}
                         {kycStep === 3 && "Extracting text via OCR..."}
                    </p>
                 </div>

                 {/* System Logs (for the Architect Demo) */}
                 <div className="absolute bottom-0 left-0 w-full bg-slate-900/90 p-4 font-mono text-[10px] text-green-400 border-t border-slate-800">
                    <p>> INIT_CAMERA_STREAM</p>
                    {kycStep >= 1 && <p>> FACE_DETECTED (Confidence: 99.8%)</p>}
                    {kycStep >= 2 && <p>> LIVENESS_CHECK: PASSED</p>}
                    {kycStep >= 3 && <p>> ID_SCAN: RECOGNIZED 'SA_SMART_ID'</p>}
                    {kycStep >= 3 && <p>> ENCRYPTING_DATA -> S3_SECURE_BUCKET</p>}
                 </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default PhoneInterface;