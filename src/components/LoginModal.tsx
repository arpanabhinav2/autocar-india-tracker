/**
 * LoginModal.tsx
 * A secure OAuth Google login modal using Firebase Authentication.
 */
import React, { useState } from 'react';
import { X, ShieldCheck, Loader2 } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';

export interface AppUser {
  name: string;
  email: string;
  picture: string;
  uid: string;
  isPremiumPlus?: boolean;
}

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: AppUser) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      let isPremiumPlus = false;
      if (userSnap.exists()) {
        isPremiumPlus = userSnap.data().isPremiumPlus || false;
      } else {
        await setDoc(userRef, {
          email: user.email,
          name: user.displayName,
          isPremiumPlus: false,
          createdAt: new Date().toISOString()
        });
      }
      
      onLogin({
        name: user.displayName || 'User',
        email: user.email || '',
        picture: user.photoURL || '',
        uid: user.uid,
        isPremiumPlus
      });
      onClose();
    } catch (err: any) {
      console.error('Firebase Login Failed:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#111118] border border-white/10 rounded-3xl w-full max-w-md p-8 relative shadow-[0_0_50px_rgba(239,68,68,0.1)]">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-8 text-center mt-2">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.4)] mx-auto mb-6">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-display font-black text-white tracking-tight mb-2">Sign In</h2>
          <p className="text-gray-400 text-sm mb-8">Authenticate with Google to safely sync your garage and access your comparisons anywhere.</p>
        </div>

        <div className="flex flex-col items-center justify-center w-full min-h-[50px] mb-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-black font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.31v2.85C4.14 20.59 7.74 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.31C1.58 8.52 1.17 10.2 1.17 12s.41 3.48 1.14 4.94l3.53-2.85z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.74 1 4.14 3.41 2.31 7.06l3.53 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google
              </>
            )}
          </button>
          {error && <p className="text-red-500 text-xs mt-3">{error}</p>}
        </div>
        
        <p className="mt-8 text-center text-xs text-gray-500">
          Continuing confirms you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
};
