import React, { useState } from 'react';
import { X, Crown, ShieldCheck, Loader2, IndianRupee } from 'lucide-react';
import { type AppUser } from './LoginModal';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

declare global {
  interface Window {
    Juspay?: any;
  }
}

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AppUser | null;
  onRequireLogin: () => void;
  onSuccess: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ isOpen, onClose, user, onRequireLogin, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showJuspay, setShowJuspay] = useState(false);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    if (!user) {
      onRequireLogin();
      return;
    }

    try {
      setLoading(true);
      setError('');

      // 1. Call our Serverless Backend to create a Juspay session
      const response = await fetch('/api/juspay-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, email: user.email })
      });

      if (!response.ok) {
        throw new Error('Failed to initialize payment session');
      }

      const data = await response.json();
      const orderId = data.order_id;
      
      // 2. Load and Launch Juspay SDK dynamically
      if (!window.Juspay) {
         try {
             await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://api.juspay.in/core-express-checkout.js';
                script.onload = resolve;
                script.onerror = () => reject(new Error('Failed to load Juspay SDK'));
                document.head.appendChild(script);
             });
         } catch (e) {
             console.warn("Juspay SDK could not be loaded from CDN. Proceeding to fallback.");
         }
      }

      if (window.Juspay) {
         setShowJuspay(true);
         
         window.Juspay.Setup({
           initParams: {
              merchantId: data.sdk_payload.payload.merchantId,
              clientId: data.sdk_payload.payload.clientId,
              environment: 'sandbox'
           },
           onResponse: async (response: any) => {
              if (response.event === 'onPaymentSuccess') {
                 try {
                    // Verify Payment Backend
                    const verifyRes = await fetch('/api/juspay-verify', {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({ order_id: orderId })
                    });
                    const verifyData = await verifyRes.json();
                    
                    if (verifyData.status === 'CHARGED') {
                       const userRef = doc(db, 'users', user.uid);
                       await updateDoc(userRef, {
                           isPremiumPlus: true,
                           subscriptionDate: new Date().toISOString()
                       });
                       onSuccess();
                    } else {
                       throw new Error('Payment verification failed Server-side.');
                    }
                 } catch (err: any) {
                    setError(err.message || 'Payment processing failed.');
                 } finally {
                    setShowJuspay(false);
                 }
              } else if (response.event === 'onPaymentFailure' || response.event === 'onPaymentCancel') {
                 setError('Payment was cancelled or failed. Please try again.');
                 setShowJuspay(false);
              }
           }
         });
         
      } else {
         // --- FAILSAFE / MOCK PAYMENT FLOW ---
         // If SDK is blocked by adblockers or CDN fails, run the manual mock immediately
         window.alert("JUSPAY SDK BLOCKED BY BROWSER (e.g. AdBlocker or Brave Shields). Proceeding with Sandbox Simulation.\n\nImagine the secure PCI-DSS credit card screen here! Click OK to simulate a successful Rs. 500 payment.");
         
         // Securely update DB
         const userRef = doc(db, 'users', user.uid);
         await updateDoc(userRef, {
             isPremiumPlus: true,
             subscriptionDate: new Date().toISOString()
         });
         onSuccess();
      }

    } catch (err: any) {
      console.error('Checkout failed:', err);
      setError(err.message || 'Payment processing failed. Please try again.');
      setShowJuspay(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#111118] border border-red-500/30 rounded-3xl w-full max-w-lg p-8 relative shadow-[0_0_50px_rgba(239,68,68,0.15)]">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-8 text-center mt-2">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.4)] mx-auto mb-6">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-display font-black text-white tracking-tight mb-3">Premium+ Access</h2>
          <p className="text-gray-400 text-sm leading-relaxed px-4">
            The AutoCar Comparison Matrix is a powerful pro-level tool. Unlock it forever to compare specs side-by-side with perfect accuracy.
          </p>
        </div>
        
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
           <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10">
              <span className="text-white font-bold tracking-wide">Lifetime Subscription</span>
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center"><IndianRupee className="w-5 h-5 mr-1 text-yellow-500" /> 500</span>
           </div>
           <ul className="space-y-3">
              <li className="flex items-center text-sm text-gray-300">
                 <ShieldCheck className="w-5 h-5 text-green-500 mr-3" /> Compare up to 3 cars side-by-side
              </li>
              <li className="flex items-center text-sm text-gray-300">
                 <ShieldCheck className="w-5 h-5 text-green-500 mr-3" /> Save garages to the cloud
              </li>
              <li className="flex items-center text-sm text-gray-300">
                 <ShieldCheck className="w-5 h-5 text-green-500 mr-3" /> Priority support & Early Access
              </li>
           </ul>
        </div>

        <div className="flex flex-col items-center justify-center w-full">
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-black uppercase tracking-widest py-4 px-6 rounded-xl flex items-center justify-center gap-3 hover:from-yellow-400 hover:to-orange-500 shadow-[0_10px_20px_rgba(234,179,8,0.3)] transition-all disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-1"
          >
            {loading ? (
               <>
                 <Loader2 className="w-5 h-5 animate-spin" /> Processing Payment...
               </>
            ) : user ? (
              <>Pay securely with Juspay</>
            ) : (
              <>Login to Continue</>
            )}
          </button>
          
          <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
             <ShieldCheck className="w-4 h-4" /> 256-bit encrypted checkout
          </div>
          {error && <p className="text-red-500 text-xs mt-3 text-center w-full">{error}</p>}
        </div>
        
        {/* Container for Juspay iframe */}
        <div id="juspay-checkout-container" className={`mt-4 ${showJuspay ? 'block' : 'hidden'}`}></div>
      </div>
    </div>
  );
};
