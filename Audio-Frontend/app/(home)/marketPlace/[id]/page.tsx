'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import axios from 'axios';
import { toast } from 'sonner';
import { usePrivy } from '@privy-io/react-auth';
import { CreditCard, Lock, Pause, Play, Star } from 'lucide-react';
import { Auth } from '@/hooks/useAuth';
import { usePlayerContext } from '@/context/PlayerContext';

interface RoomReview {
  id: string;
  rating: number;
  content: string;
  createdAt: string;
  user: { id: string; username: string | null; name: string | null; profileImage: string | null };
}

interface RoomDetail {
  id: string;
  title: string;
  description: string | null;
  price: string;
  accessStartsAt: string;
  accessEndsAt: string;
  state: 'upcoming' | 'live' | 'closed';
  song: { id: string; title: string; coverArtPath: string | null; duration: number | null } | null;
  artist: { id: string; username: string | null; name: string | null; profileImage: string | null };
  hasTicket: boolean;
  reviewCount: number;
  avgRating: number | null;
  reviews: RoomReview[];
}

const artistDisplayName = (a: RoomDetail['artist']) => a.username || a.name || 'Unnamed Artist';

function RoomDetailContent() {
  const params = useParams<{ id: string }>();
  const roomId = params.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getAccessToken, authenticated } = usePrivy();
  const { profile, login } = Auth();
  const { currentTrack, isPlaying, playTrack, setIsPlaying } = usePlayerContext();

  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [buyingCrypto, setBuyingCrypto] = useState(false);
  const [buyingCard, setBuyingCard] = useState(false);
  const [buyingNaira, setBuyingNaira] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const url = process.env.NEXT_PUBLIC_API_URL;

  const fetchRoom = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (authenticated) {
        const accessToken = await getAccessToken();
        headers.Authorization = `Bearer ${accessToken}`;
      }
      const res = await axios.get(`${url}/api/rooms/${roomId}`, { headers });
      setRoom(res.data?.data ?? null);
    } catch {
      setRoom(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, profile?.id]);

  // After returning from Stripe/Paystack Checkout, poll our own status
  // endpoint — the webhook, not the browser redirect, is what actually
  // confirms payment and pays the artist. Mirrors community/page.tsx.
  useEffect(() => {
    const ticketId = searchParams.get('ticketId');
    if (!ticketId || !profile) return;

    if (searchParams.get('cancelled')) {
      toast.info('Checkout cancelled');
      router.replace(`/marketPlace/${roomId}`);
      return;
    }

    let stopped = false;
    const poll = async () => {
      try {
        const accessToken = await getAccessToken();
        const res = await axios.get(`${url}/api/rooms/ticket/${ticketId}/status`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const status = res.data?.data?.status;
        if (status === 'succeeded') {
          toast.success('Ticket confirmed — enjoy the room!');
          fetchRoom();
          stopped = true;
        } else if (status === 'failed') {
          toast.error('Payment succeeded but the on-chain payout failed — contact support');
          stopped = true;
        } else if (!stopped) {
          setTimeout(poll, 3000);
          return;
        }
      } catch {
        stopped = true;
      }
      router.replace(`/marketPlace/${roomId}`);
      setBuyingCard(false);
      setBuyingNaira(false);
    };
    poll();

    return () => {
      stopped = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, searchParams]);

  const requireLogin = () => {
    if (!profile) {
      toast.info('Log in to buy a ticket');
      login();
      return true;
    }
    return false;
  };

  const handleBuyCrypto = async () => {
    if (requireLogin()) return;
    setBuyingCrypto(true);
    try {
      const accessToken = await getAccessToken();
      const res = await axios.post(
        `${url}/api/rooms/${roomId}/ticket/crypto`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      toast.success(`Ticket bought — tx ${res.data?.data?.txHash?.slice(0, 10)}…`);
      fetchRoom();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Purchase failed');
    } finally {
      setBuyingCrypto(false);
    }
  };

  const handleBuyCard = async () => {
    if (requireLogin()) return;
    setBuyingCard(true);
    try {
      const accessToken = await getAccessToken();
      const res = await axios.post(
        `${url}/api/rooms/${roomId}/ticket/stripe/init`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const checkoutUrl = res.data?.data?.checkoutUrl;
      if (!checkoutUrl) throw new Error('No checkout URL returned');
      window.location.href = checkoutUrl;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not start card checkout');
      setBuyingCard(false);
    }
  };

  const handleBuyNaira = async () => {
    if (requireLogin()) return;
    if (!profile?.email) {
      toast.error('Add an email to your profile first — Paystack requires one for checkout');
      return;
    }
    setBuyingNaira(true);
    try {
      const accessToken = await getAccessToken();
      const res = await axios.post(
        `${url}/api/rooms/${roomId}/ticket/paystack/init`,
        { email: profile.email },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const checkoutUrl = res.data?.data?.checkoutUrl;
      if (!checkoutUrl) throw new Error('No checkout URL returned');
      window.location.href = checkoutUrl;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not start Paystack checkout');
      setBuyingNaira(false);
    }
  };

  const handlePlay = () => {
    if (!room?.song) return;
    if (currentTrack?.id === room.song.id) {
      setIsPlaying(!isPlaying);
      return;
    }
    playTrack({
      id: room.song.id,
      title: room.song.title,
      artist: artistDisplayName(room.artist),
      cover: room.song.coverArtPath || '/dashboard/profiledefault.png',
      streamUrl: `${url}/api/song/stream/${room.song.id}`,
    });
  };

  const handleSubmitReview = async () => {
    if (requireLogin()) return;
    if (!reviewText.trim()) {
      toast.error('Say something about the track first');
      return;
    }
    setSubmittingReview(true);
    try {
      const accessToken = await getAccessToken();
      await axios.post(
        `${url}/api/rooms/${roomId}/reviews`,
        { rating, content: reviewText.trim() },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      toast.success('Review posted');
      setReviewText('');
      setRating(5);
      fetchRoom();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not post review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-black animate-pulse" />;
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-[#A3A3A3]">Room not found.</p>
      </div>
    );
  }

  const buying = buyingCrypto || buyingCard || buyingNaira;
  const isThisTrackPlaying = currentTrack?.id === room.song?.id && isPlaying;
  const closed = room.state === 'closed';

  return (
    <div className="min-h-screen bg-black text-white">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-10">
          <div className="relative aspect-square rounded-xl overflow-hidden">
            <Image
              src={room.song?.coverArtPath || '/dashboard/profiledefault.png'}
              alt={room.title}
              fill
              className="object-cover"
            />
          </div>

          <div>
            <p className="text-xs text-[#A3A3A3] mb-1">{artistDisplayName(room.artist)}</p>
            <h1 className="font-['Poppins'] font-semibold text-3xl mb-3">{room.title}</h1>
            {room.description && <p className="text-[#A3A3A3] mb-4">{room.description}</p>}

            {room.avgRating !== null && (
              <div className="flex items-center gap-1 text-sm text-[#DACFD3] mb-4">
                <Star size={14} className="fill-[#D2045B] text-[#D2045B]" />
                {room.avgRating.toFixed(1)} ({room.reviewCount} review{room.reviewCount === 1 ? '' : 's'})
              </div>
            )}

            {room.hasTicket ? (
              <button
                onClick={handlePlay}
                className="flex items-center gap-2 bg-[#D2045B] hover:bg-pink-700 text-white px-6 py-3 rounded-xl font-semibold cursor-pointer"
              >
                {isThisTrackPlaying ? <Pause size={16} /> : <Play size={16} />}
                {isThisTrackPlaying ? 'Pause' : 'Play unreleased track'}
              </button>
            ) : closed ? (
              <p className="text-sm text-[#4B4B4B] flex items-center gap-2">
                <Lock size={14} /> This room's access window has closed.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-[#A3A3A3]">
                  <Lock size={12} className="inline mr-1" />
                  {room.price} USDC to unlock — access window: {new Date(room.accessStartsAt).toLocaleString()} to{' '}
                  {new Date(room.accessEndsAt).toLocaleString()}
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleBuyCrypto}
                    disabled={buying}
                    className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer"
                  >
                    {buyingCrypto ? 'Buying…' : `Pay ${room.price} USDC`}
                  </button>
                  <button
                    onClick={handleBuyCard}
                    disabled={buying}
                    className="flex items-center gap-1.5 bg-[#242424] hover:bg-[#2E2E2E] disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer border border-[#3A3A3A]"
                  >
                    <CreditCard size={14} />
                    {buyingCard ? 'Redirecting…' : 'Pay with Card (USD)'}
                  </button>
                  <button
                    onClick={handleBuyNaira}
                    disabled={buying}
                    className="flex items-center gap-1.5 bg-[#242424] hover:bg-[#2E2E2E] disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer border border-[#3A3A3A]"
                  >
                    <CreditCard size={14} />
                    {buyingNaira ? 'Redirecting…' : 'Pay with Naira (NGN)'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-xl font-semibold mb-4">Reviews</h2>

          {room.hasTicket && (
            <div className="bg-[#1A1A1A] rounded-xl p-5 mb-8">
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)} className="cursor-pointer">
                    <Star
                      size={18}
                      className={n <= rating ? 'fill-[#D2045B] text-[#D2045B]' : 'text-[#4B4B4B]'}
                    />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="What did you think of the track?"
                rows={3}
                className="w-full bg-[#242424] text-white rounded-lg px-4 py-2 text-sm placeholder:text-[#4B4B4B] focus:outline-none"
              />
              <button
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="mt-3 bg-[#D2045B] hover:bg-pink-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold cursor-pointer"
              >
                {submittingReview ? 'Posting…' : 'Post review'}
              </button>
            </div>
          )}

          {room.reviews.length === 0 ? (
            <p className="text-[#A3A3A3] text-sm">No reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {room.reviews.map((rv) => (
                <div key={rv.id} className="flex gap-3">
                  <Image
                    src={rv.user.profileImage || '/dashboard/profiledefault.png'}
                    alt={rv.user.username || rv.user.name || 'Fan'}
                    width={36}
                    height={36}
                    className="rounded-full object-cover h-9 w-9"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {rv.user.username || rv.user.name || 'Fan'}
                      </span>
                      <span className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            size={11}
                            className={n <= rv.rating ? 'fill-[#D2045B] text-[#D2045B]' : 'text-[#4B4B4B]'}
                          />
                        ))}
                      </span>
                    </div>
                    <p className="text-sm text-[#A3A3A3]">{rv.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function RoomDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black animate-pulse" />}>
      <RoomDetailContent />
    </Suspense>
  );
}
