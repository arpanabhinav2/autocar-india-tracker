import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User as UserIcon, Crown } from 'lucide-react';
import { type AppUser } from './LoginModal';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface UserProfileDropdownProps {
  user: AppUser;
  onLogout: () => void;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-red-500/50 transition-all shadow-lg"
      >
        {user.picture ? (
          <img src={user.picture} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <UserIcon className="w-5 h-5 text-gray-300" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-[#111118] border border-white/10 rounded-2xl shadow-2xl py-3 animate-slide-up z-50">
          <div className="px-5 py-3 border-b border-white/5 mb-1 pb-4">
            <p className="text-white font-bold truncate tracking-wide flex items-center gap-2">
              {user.name}
              {user.isPremiumPlus && <Crown className="w-4 h-4 text-yellow-500" />}
            </p>
            <p className="text-gray-400 text-xs truncate mt-1">{user.email}</p>
            {user.isPremiumPlus && (
               <div className="mt-2 inline-flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded text-[10px] text-yellow-500 uppercase tracking-widest font-black">
                 Premium+ Active
               </div>
            )}
          </div>
          
          <div className="px-2 pt-1">
            <button 
              onClick={async () => {
                setIsOpen(false);
                try {
                  await signOut(auth);
                } catch (e) {
                  console.error("Sign out error", e);
                }
                onLogout();
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/5 text-gray-300 hover:text-red-400 transition-colors flex items-center gap-3 text-sm font-bold tracking-wide"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
