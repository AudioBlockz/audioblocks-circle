'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { usePrivy } from '@privy-io/react-auth';
import { FiUser, FiRepeat, FiFolder, FiX } from 'react-icons/fi';
import { FaWallet } from 'react-icons/fa';
import Link from 'next/link';
import { Auth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { truncateAddress } from '@/lib/utils';

const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { profile, handleLogOut } = Auth();
  const { getAccessToken } = usePrivy();
   const route = useRouter();

  const displayName = profile?.username || profile?.name || profile?.email?.split('@')[0] || 'there';
  const avatarSrc = profile?.profileImage || '/dashboard/profiledefault.png';

  const [balance, setBalance] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetched fresh each time the menu opens rather than once on mount, so it
  // reflects deposits/payouts that happened since the last open.
  useEffect(() => {
    if (!isOpen || !profile) return;
    setLoadingBalance(true);
    (async () => {
      try {
        const accessToken = await getAccessToken();
        const url = process.env.NEXT_PUBLIC_API_URL;
        const res = await axios.get(`${url}/api/wallet/balance`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setBalance(res.data?.data?.balance ?? null);
      } catch {
        setBalance(null);
      } finally {
        setLoadingBalance(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, profile?.id]);

  const logOut = async () => {
    await handleLogOut();
    route.push("/");
  }

  return (
    <div className="relative z-50" ref={menuRef}>
      {/* Avatar trigger */}
      <div
        onClick={() => setIsOpen(true)}
        className="w-8 h-8 rounded-full overflow-hidden border border-gray-700 cursor-pointer"
      >
        <Image
          src={avatarSrc}
          alt="User"
          width={40}
          height={40}
          className="object-cover w-full h-full"
        />
      </div>

      {/* Full height sliding menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed top-0 right-0 w-60 h-screen bg-[#111111] shadow-lg border-l border-[#2B2B2B] px-5 py-6 flex flex-col"
          >
            {/* Close Icon */}
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#A3A3A3] cursor-pointer hover:text-white absolute top-4 right-4"
            >
              <FiX size={22} />
            </button>

            <div className="flex items-center truncate border-b pb-3 gap-3 mb-8 mt-2">
              <Image
                src={avatarSrc}
                alt="User Avatar"
                width={50}
                height={50}
                className="rounded-full w-[50px] h-[50px] object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white text-sm truncate">{displayName}</p>
                <p className="text-xs truncate text-[#A3A3A3]" title={profile?.email}>
                  {profile?.email ?? (profile?.walletAddress && truncateAddress(profile.walletAddress))}
                </p>
              </div>
            </div>

            {/* Menu items */}
            <div className="space-y-6 text-sm text-[#A3A3A3] font-semibold">
              <Link
                href="/dashboard/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 cursor-pointer hover:text-[#666C6C] transition"
              >
                <FiUser />
                <span>Profile</span>
              </Link>
              <Link
                href="#"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 cursor-pointer hover:text-[#666C6C] transition"
              >
                <FiRepeat />
                <span>Swap</span>
              </Link>
              <Link
                href="/dashboard/collection"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 cursor-pointer hover:text-[#666C6C] transition"
              >
                <FiFolder />
                <span>My Collections</span>
              </Link>
              <div className="flex items-center gap-3 text-gray-400 mt-8">
                <FaWallet />
                <span>Balance:</span>
                <span className="font-medium text-[#666C6C]">
                  {loadingBalance ? '…' : balance !== null ? `${Number(balance).toLocaleString()} USDC` : '—'}
                </span>
              </div>
              <button className='cursor-pointer hover:text-[#666C6C] transition' onClick={logOut}>Log out</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserMenu;
