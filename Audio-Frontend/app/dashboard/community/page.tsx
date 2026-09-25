'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@radix-ui/react-tabs';
import { Card } from '@/components/ui/card';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiSearch } from 'react-icons/fi';
import Image from 'next/image';
import axios from 'axios';
import { toast } from 'sonner';
import { usePrivy } from '@privy-io/react-auth';
import ShareModal from '@/components/common/dashboard/Share';
import { SquareCheck, Users, Copy, Check, CreditCard } from 'lucide-react';
import { Auth } from '@/hooks/useAuth';
import { truncateAddress } from '@/lib/utils';

interface ApiSong {
  id: string;
  title: string;
  coverArtPath: string | null;
  artist: { id: string; username: string | null; name: string | null };
  collab: { id: string; title: string } | null;
}

interface CurrentRound {
  roundId: string;
  roundNumber: number;
  status: string;
  totalDeposited: string;
  hasVoted?: boolean;
  votedSongId?: string | null;
}

interface ClosedRound {
  id: string;
  roundNumber: number;
  totalDeposited: string;
  payoutTxHash: string | null;
  closedAt: string;
}

interface RoundResult {
  rank: number;
  song: { id: string; title: string; coverArtPath: string | null } | null;
  artist: { id: string; username: string | null; name: string | null; profileImage: string | null };
  voteCount: number;
  amountPaid: string;
}

interface StandingSong extends ApiSong {
  voteCount: number;
}

const CommunityTabs = () => {
  const { getAccessToken } = usePrivy();
  const { profile, login } = Auth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedTab, setSelectedTab] = useState('vote');
  const [search, setSearch] = useState('');

  const [songs, setSongs] = useState<ApiSong[]>([]);
  const [currentRound, setCurrentRound] = useState<CurrentRound | null>(null);
  const [loadingVoteTab, setLoadingVoteTab] = useState(true);
  const [votingSongId, setVotingSongId] = useState<string | null>(null);
  const [addressCopied, setAddressCopied] = useState(false);

  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [cardDepositing, setCardDepositing] = useState(false);
  const [nairaDepositing, setNairaDepositing] = useState(false);

  const [closedRounds, setClosedRounds] = useState<ClosedRound[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [currentStandings, setCurrentStandings] = useState<StandingSong[]>([]);

  const url = process.env.NEXT_PUBLIC_API_URL;

  const fetchVoteTabData = async () => {
    setLoadingVoteTab(true);
    try {
      const headers: Record<string, string> = {};
      if (profile) {
        const accessToken = await getAccessToken();
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const [songsRes, roundRes] = await Promise.all([
        axios.get(`${url}/api/pool/songs`),
        axios.get(`${url}/api/pool/current`, { headers }),
      ]);

      setSongs(songsRes.data?.data ?? []);
      setCurrentRound(roundRes.data?.data ?? null);
    } catch {
      setSongs([]);
      setCurrentRound(null);
    } finally {
      setLoadingVoteTab(false);
    }
  };

  const fetchLeaderboardData = async () => {
    setLoadingLeaderboard(true);
    try {
      const [roundsRes, standingsRes] = await Promise.all([
        axios.get(`${url}/api/pool/rounds`),
        axios.get(`${url}/api/pool/current-standings`),
      ]);
      const rounds: ClosedRound[] = roundsRes.data?.data ?? [];
      setClosedRounds(rounds);
      setCurrentStandings(standingsRes.data?.data ?? []);

      if (rounds.length > 0) {
        setSelectedRoundId(rounds[0].id);
        const resultsRes = await axios.get(`${url}/api/pool/rounds/${rounds[0].id}/results`);
        setRoundResults(resultsRes.data?.data ?? []);
      } else {
        setRoundResults([]);
      }
    } catch {
      setClosedRounds([]);
      setRoundResults([]);
      setCurrentStandings([]);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    fetchVoteTabData();
    fetchLeaderboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const handleSelectRound = async (roundId: string) => {
    setSelectedRoundId(roundId);
    try {
      const res = await axios.get(`${url}/api/pool/rounds/${roundId}/results`);
      setRoundResults(res.data?.data ?? []);
    } catch {
      setRoundResults([]);
    }
  };

  const handleVote = async (songId: string) => {
    if (!profile) {
      toast.info('Log in to vote for a song');
      login();
      return;
    }
    if (votingSongId) return;

    setVotingSongId(songId);
    try {
      const accessToken = await getAccessToken();
      await axios.post(
        `${url}/api/pool/vote`,
        { songId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setCurrentRound((prev) => (prev ? { ...prev, hasVoted: true, votedSongId: songId } : prev));
      toast.success('Vote recorded');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to vote');
    } finally {
      setVotingSongId(null);
    }
  };

  const handleCopyAddress = async () => {
    if (!profile?.walletAddress) return;
    await navigator.clipboard.writeText(profile.walletAddress);
    setAddressCopied(true);
    setTimeout(() => setAddressCopied(false), 2000);
  };

  const handleDeposit = async () => {
    if (!profile) {
      toast.info('Log in to deposit into the pool');
      login();
      return;
    }
    const amount = Number(depositAmount);
    if (!depositAmount || Number.isNaN(amount) || amount <= 0) {
      toast.error('Enter an amount greater than zero');
      return;
    }

    setDepositing(true);
    try {
      const accessToken = await getAccessToken();
      const res = await axios.post(
        `${url}/api/pool/deposit`,
        { amount: depositAmount },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      toast.success(`Deposited ${depositAmount} — tx ${res.data?.data?.depositTxHash?.slice(0, 10)}…`);
      setDepositAmount('');
      fetchVoteTabData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Deposit failed');
    } finally {
      setDepositing(false);
    }
  };

  const handleCardDeposit = async () => {
    if (!profile) {
      toast.info('Log in to deposit into the pool');
      login();
      return;
    }
    const amount = Number(depositAmount);
    if (!depositAmount || Number.isNaN(amount) || amount <= 0) {
      toast.error('Enter an amount greater than zero');
      return;
    }

    setCardDepositing(true);
    try {
      const accessToken = await getAccessToken();
      const res = await axios.post(
        `${url}/api/pool/deposit/fiat/stripe/init`,
        { amount: depositAmount },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const checkoutUrl = res.data?.data?.checkoutUrl;
      if (!checkoutUrl) throw new Error('No checkout URL returned');
      window.location.href = checkoutUrl;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not start card checkout');
      setCardDepositing(false);
    }
  };

  const handleNairaDeposit = async () => {
    if (!profile) {
      toast.info('Log in to deposit into the pool');
      login();
      return;
    }
    if (!profile.email) {
      toast.error('Add an email to your profile first — Paystack requires one for checkout');
      return;
    }
    const amount = Number(depositAmount);
    if (!depositAmount || Number.isNaN(amount) || amount <= 0) {
      toast.error('Enter an amount greater than zero');
      return;
    }

    setNairaDepositing(true);
    try {
      const accessToken = await getAccessToken();
      const res = await axios.post(
        `${url}/api/pool/deposit/fiat/paystack/init`,
        { amount: depositAmount, email: profile.email },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const checkoutUrl = res.data?.data?.checkoutUrl;
      if (!checkoutUrl) throw new Error('No checkout URL returned');
      window.location.href = checkoutUrl;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not start Paystack checkout');
      setNairaDepositing(false);
    }
  };

  // After returning from Stripe/Paystack Checkout, poll our own status
  // endpoint (not the provider's) since the webhook — not the browser
  // redirect — is what actually confirms payment and triggers the
  // on-chain treasury deposit.
  useEffect(() => {
    const fiatDepositId = searchParams.get('fiatDepositId');
    if (!fiatDepositId || !profile) return;

    const cancelled = searchParams.get('cancelled');
    if (cancelled) {
      toast.info('Checkout cancelled');
      router.replace('/dashboard/community');
      return;
    }

    let stopped = false;
    const poll = async () => {
      try {
        const accessToken = await getAccessToken();
        const res = await axios.get(`${url}/api/pool/deposit/fiat/${fiatDepositId}/status`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const status = res.data?.data?.status;
        if (status === 'succeeded') {
          const txHash = res.data?.data?.depositTxHash;
          toast.success(`Deposit confirmed — tx ${txHash?.slice(0, 10)}…`);
          fetchVoteTabData();
          stopped = true;
        } else if (status === 'failed') {
          toast.error('Payment succeeded but the on-chain deposit failed — contact support');
          stopped = true;
        } else if (!stopped) {
          setTimeout(poll, 3000);
          return;
        }
      } catch {
        stopped = true;
      }
      router.replace('/dashboard/community');
      setCardDepositing(false);
      setNairaDepositing(false);
    };
    poll();

    return () => {
      stopped = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, searchParams]);

  const artistDisplayName = (a: { username: string | null; name: string | null }) =>
    a.username || a.name || 'Unnamed Artist';

  const filteredSongs = songs.filter((s) => {
    const label = `${s.title} ${artistDisplayName(s.artist)}`.toLowerCase();
    return label.includes(search.toLowerCase());
  });

  return (
    <>
      <p className="text-xs capitalize font-medium text-left text-[#A3A3A3] mb-2">
        Community / <span className="text-white">{selectedTab}</span>
      </p>
      <div className="border-b mt-7">
        <h1 className="text-[#DACFD3] text-3xl font-bold mb-2">Community</h1>
      </div>

      <Tabs
        defaultValue="vote"
        value={selectedTab}
        onValueChange={(value) => setSelectedTab(value)}
        className="w-full"
      >
        <TabsList className="flex gap-4 py-4">
          <TabsTrigger
            value="vote"
            className="data-[state=active]:bg-[#D2045B] font-medium text-sm cursor-pointer data-[state=active]:text-white text-[#A3A3A3] bg-[#1C2022] px-3 py-2 rounded-xl"
          >
            Vote
          </TabsTrigger>
          <TabsTrigger
            value="leaderboard"
            className="data-[state=active]:bg-[#D2045B] font-medium text-sm cursor-pointer data-[state=active]:text-white text-[#A3A3A3] bg-[#1C2022] px-3 py-2 rounded-xl"
          >
            Leaderboards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vote">
          <p className="text-white text-sm mb-6">
            Vote for your favorite song once per round — the top 5 most-voted songs split the
            community pool when a round closes. A collab song's share splits automatically between
            its collaborators.
          </p>

          {currentRound && (
            <div className="flex flex-wrap items-center gap-6 bg-[#1A1A1A] rounded-xl px-6 py-4 mb-6 text-white">
              <div>
                <p className="text-[#A3A3A3] text-xs">Pool balance</p>
                <p className="text-xl font-semibold">{currentRound.totalDeposited} USDC</p>
              </div>
              <div>
                <p className="text-[#A3A3A3] text-xs">Round</p>
                <p className="text-xl font-semibold">#{currentRound.roundNumber}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto md:ml-auto">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Amount"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-28 bg-[#242424] text-white rounded-lg px-3 py-2 text-sm placeholder:text-[#4B4B4B] focus:outline-none"
                />
                <button
                  onClick={handleDeposit}
                  disabled={depositing || cardDepositing || nairaDepositing}
                  className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer"
                >
                  {depositing ? 'Depositing…' : 'Deposit'}
                </button>
                <button
                  onClick={handleCardDeposit}
                  disabled={depositing || cardDepositing || nairaDepositing}
                  title="Pay with a card — converted to USDC and deposited on your behalf"
                  className="flex items-center gap-1.5 bg-[#242424] hover:bg-[#2E2E2E] disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer border border-[#3A3A3A]"
                >
                  <CreditCard size={14} />
                  {cardDepositing ? 'Redirecting…' : 'Pay with Card (USD)'}
                </button>
                <button
                  onClick={handleNairaDeposit}
                  disabled={depositing || cardDepositing || nairaDepositing}
                  title="Pay with Naira via Paystack — converted to USDC and deposited on your behalf"
                  className="flex items-center gap-1.5 bg-[#242424] hover:bg-[#2E2E2E] disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer border border-[#3A3A3A]"
                >
                  <CreditCard size={14} />
                  {nairaDepositing ? 'Redirecting…' : 'Pay with Naira (NGN)'}
                </button>
              </div>

              {profile?.walletAddress && (
                <div className="w-full text-xs text-[#A3A3A3]">
                  The Deposit button pays from your app wallet, not a connected browser wallet — fund{' '}
                  <button
                    type="button"
                    onClick={handleCopyAddress}
                    title={profile.walletAddress}
                    className="inline-flex items-center gap-1 text-white hover:text-pink-400 transition cursor-pointer"
                  >
                    {truncateAddress(profile.walletAddress)}
                    {addressCopied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  </button>{' '}
                  with USDC first, or use Pay with Card/Naira instead — those don&apos;t need your wallet funded.
                </div>
              )}
            </div>
          )}

          {!loadingVoteTab && !currentRound && (
            <div className="bg-[#1A1A1A] rounded-xl px-6 py-4 mb-6 text-[#A3A3A3] text-sm">
              No voting round is open right now — check back soon.
            </div>
          )}

          <div className="flex flex-col md:flex-row mb-6">
            <div className="flex items-center bg-transparent border rounded-full px-4 py-2 mr-6">
              <FiSearch className="text-gray-400 text-lg" />
              <input
                type="text"
                placeholder="Search by song or artist"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ml-3 w-full bg-transparent outline-none text-sm text-gray-200 placeholder:text-[#A3A3A3]"
              />
            </div>
          </div>

          {loadingVoteTab ? (
            <div className="h-40 rounded-lg bg-[#1A1A1A] animate-pulse" />
          ) : filteredSongs.length === 0 ? (
            <p className="text-[#A3A3A3] text-sm">No songs to vote for yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-7">
              {filteredSongs.map((song) => {
                const isVotedFor = currentRound?.votedSongId === song.id;
                return (
                  <Card
                    key={song.id}
                    className="hover:bg-[#1E1E1E] bg-transparent border-none p-4 rounded-xl text-white flex justify-center flex-col items-center w-full"
                  >
                    <Image
                      src={song.coverArtPath || '/dashboard/profiledefault.png'}
                      alt={song.title}
                      width={300}
                      height={300}
                      className="w-2/3 m-auto h-20 object-cover rounded-md"
                    />
                    <div className="text-[#A3A3A3] text-center -mt-4 w-full">
                      <h3 className="text-lg text-white font-bold truncate" title={song.title}>
                        {song.title}
                      </h3>
                      <p className="text-xs mb-1 truncate">{artistDisplayName(song.artist)}</p>
                      {song.collab && (
                        <div className="flex items-center justify-center gap-1 text-[10px] text-[#885FA8] mb-1">
                          <Users size={11} />
                          <span>Collab</span>
                        </div>
                      )}
                      <div className="py-2 flex items-center justify-center gap-3">
                        {isVotedFor && (
                          <div className="flex items-center text-pink-500">
                            <SquareCheck size={15} />
                            <span className="text-[10px] ml-1 font-bold">Your vote</span>
                          </div>
                        )}
                        <ShareModal link={`${typeof window !== 'undefined' ? window.location.origin : ''}/artist/${song.artist.id}`} />
                      </div>
                      <button
                        onClick={() => handleVote(song.id)}
                        disabled={votingSongId === song.id || !currentRound}
                        title={!currentRound ? 'No voting round is open right now' : undefined}
                        className={`mt-auto w-full px-4 py-2 rounded-xl text-sm font-semibold shadow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                          isVotedFor
                            ? 'bg-[#242424] text-white border border-pink-600'
                            : 'bg-[#D2045B] hover:bg-pink-700 text-white'
                        }`}
                      >
                        {votingSongId === song.id ? 'Voting…' : isVotedFor ? 'Voted' : 'Vote'}
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="leaderboard">
          <p className="text-white text-sm mb-6">
            Past rounds and the songs that split the pool.
          </p>

          {currentRound && (
            <div className="mb-10">
              <h3 className="text-[#DACFD3] text-lg font-semibold mb-1">
                Live — Round #{currentRound.roundNumber} (in progress)
              </h3>
              <p className="text-xs text-[#A3A3A3] mb-4">
                Every voteable song, ranked by votes so far this round — not final until the round closes.
              </p>
              {loadingLeaderboard ? (
                <div className="h-32 rounded-lg bg-[#1A1A1A] animate-pulse" />
              ) : currentStandings.length === 0 ? (
                <p className="text-[#A3A3A3] text-sm">No songs to vote for yet.</p>
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm text-left text-gray-300 border border-gray-800 rounded-lg overflow-hidden">
                  <thead className="text-[#A3A3A3] font-semibold text-sm">
                    <tr>
                      <th className="px-6 py-3">#</th>
                      <th className="px-6 py-3">Song</th>
                      <th className="px-6 py-3">Artist</th>
                      <th className="px-6 py-3">Votes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentStandings.map((s, i) => (
                      <tr key={s.id} className="text-[#666C6C] hover:border cursor-pointer hover:bg-[#121212B8]">
                        <td className="px-6 py-6 font-normal">{i + 1}</td>
                        <td className="px-6 py-6 font-medium text-[#DACFD3]">
                          {s.title}
                          {s.collab && (
                            <span className="ml-2 text-[10px] text-[#885FA8] align-middle">Collab</span>
                          )}
                        </td>
                        <td className="px-6 py-6">{s.artist.username || s.artist.name || 'Unnamed Artist'}</td>
                        <td className="px-6 py-6">{s.voteCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          )}

          <p className="text-white text-sm mb-4">Past closed rounds:</p>

          {closedRounds.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {closedRounds.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleSelectRound(r.id)}
                  className={`px-4 py-1 font-medium cursor-pointer text-sm rounded-2xl border ${
                    selectedRoundId === r.id ? 'bg-[#D2045B] text-white' : 'bg-[#1C2022] text-[#A3A3A3]'
                  }`}
                >
                  Round #{r.roundNumber}
                </button>
              ))}
            </div>
          )}

          {loadingLeaderboard ? (
            <div className="h-40 rounded-lg bg-[#1A1A1A] animate-pulse" />
          ) : closedRounds.length === 0 ? (
            <p className="text-[#A3A3A3] text-sm">No rounds closed yet — check back after the first payout.</p>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm text-left text-gray-300 border border-gray-800 rounded-lg overflow-hidden">
              <thead className="text-[#A3A3A3] font-semibold text-sm">
                <tr>
                  <th className="px-6 py-3">#</th>
                  <th className="px-6 py-3">Song</th>
                  <th className="px-6 py-3">Artist</th>
                  <th className="px-6 py-3">Votes</th>
                  <th className="px-6 py-3">USDC Won</th>
                </tr>
              </thead>
              <tbody>
                {roundResults.map((r) => (
                  <tr key={`${r.rank}-${r.artist.id}`} className="text-[#666C6C] hover:border cursor-pointer hover:bg-[#121212B8]">
                    <td className="px-6 py-6 font-normal">{r.rank}</td>
                    <td className="px-6 py-6 font-medium text-[#DACFD3]">{r.song?.title ?? '—'}</td>
                    <td className="px-6 py-6">{r.artist.username || r.artist.name || 'Unnamed Artist'}</td>
                    <td className="px-6 py-6">{r.voteCount}</td>
                    <td className="px-6 py-6">{r.amountPaid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
};

const CommunityTabsPage = () => (
  <Suspense fallback={null}>
    <CommunityTabs />
  </Suspense>
);

export default CommunityTabsPage;
