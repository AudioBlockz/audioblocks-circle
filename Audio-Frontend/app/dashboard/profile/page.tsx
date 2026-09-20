'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Check, Headphones, History, Wallet } from 'lucide-react';
import Image from 'next/image';
import axios from 'axios';
import { usePrivy } from '@privy-io/react-auth';
import { Auth } from '@/hooks/useAuth';
import { truncateAddress } from '@/lib/utils';

const formatJoinedDate = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

const ProfilePage = () => {
  const router = useRouter();
  const { profile, loading } = Auth();
  const { getAccessToken } = usePrivy();
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);

  const handleEditClick = () => {
    router.push('/dashboard/profile/edit');
  };

  const handleCopyAddress = async () => {
    if (!profile?.walletAddress) return;
    await navigator.clipboard.writeText(profile.walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!profile) return;
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
  }, [profile?.id]);

  if (loading || !profile) {
    return (
      <div className="font-inter">
        <p className="text-xs font-medium text-left text-white mb-2">Profile</p>
        <div className="bg-[#1E1F23] p-8 py-13 rounded-lg text-white animate-pulse h-40" />
      </div>
    );
  }

  const displayName =
    profile.username || profile.name || truncateAddress(profile.walletAddress);

  return (
    <div className="font-inter">
      <p className="text-xs font-medium text-left text-white mb-2">Profile</p>

      <div className="bg-[#1E1F23] p-8 py-13 rounded-lg text-white flex justify-between">
        <div className="flex items-center w-3/5">
          <div className="mr-3">
            <Image
              src={profile.profileImage || '/dashboard/profiledefault.png'}
              alt="profile"
              width={300}
              height={300}
              className="w-26 h-26 m-auto object-cover rounded-lg"
            />
          </div>
          <div className="flex-1 gap-2">
            <h1 className="md:text-6xl text-3xl mb-2 text-white font-extrabold">{displayName}</h1>
            <div className="flex justify-between">
              <div className="flex">
                <History size={15} className="mr-2" />
                <p className="font-semibold text-xs">Joined {formatJoinedDate(profile.createdAt)}</p>
              </div>
              <div className="flex">
                <History size={15} className="mr-2" />
                <p className="font-semibold text-xs">
                  Minutes Listened: {profile.totalStreamTime.toLocaleString()} mins
                </p>
              </div>
              <div className="flex">
                <Headphones size={15} className="mr-2" />
                <p className="font-semibold text-xs">
                  {profile.role === 'artist' ? 'Artist' : 'Casual Listener'}
                </p>
              </div>
            </div>

            {/* This is the app's own (Circle-managed) wallet — the address
                to fund for deposits, tips, or payouts. It's not the same
                as any wallet connected in a browser extension. Balance is
                read live from that address on-chain, not stored/cached. */}
            <div className="mt-3 flex items-center gap-4">
              <button
                type="button"
                onClick={handleCopyAddress}
                className="flex items-center gap-2 text-xs text-[#A3A3A3] hover:text-white transition cursor-pointer"
                title={profile.walletAddress}
              >
                <span>Wallet: {truncateAddress(profile.walletAddress)}</span>
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              </button>
              <div className="flex items-center gap-1 text-xs text-[#A3A3A3]">
                <Wallet size={13} />
                <span>
                  Balance: {loadingBalance ? '…' : balance !== null ? `${Number(balance).toLocaleString()} USDC` : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <button
            onClick={handleEditClick}
            className="bg-[#B81A3C] text-white cursor-pointer text-sm font-semibold px-4 py-2 rounded-full"
          >
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
