'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { usePrivy } from '@privy-io/react-auth';
import { Auth } from '@/hooks/useAuth';

interface AdminRound {
  id: string;
  roundNumber: number;
  status: 'open' | 'closed';
  totalDeposited: string;
  voteCount: number;
  depositCount: number;
  openedAt: string;
  closesAt: string | null;
  closedAt: string | null;
}

// Minimal admin surface for the pool voting rounds — list every round with
// its vote/deposit counts, and let an admin close the open one early. Most
// rounds close on their own once closesAt passes (see the backend's
// autoCloseDueRounds); this exists for closing one ahead of schedule or
// for rounds opened before that feature existed (closesAt = null).
const AdminRoundsPage = () => {
  const { getAccessToken } = usePrivy();
  const { profile, loading: authLoading } = Auth();

  const [rounds, setRounds] = useState<AdminRound[]>([]);
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [closingId, setClosingId] = useState<string | null>(null);

  const url = process.env.NEXT_PUBLIC_API_URL;
  const isAdmin = profile?.role === 'admin';

  const fetchRounds = async () => {
    setLoadingRounds(true);
    try {
      const accessToken = await getAccessToken();
      const res = await axios.get(`${url}/api/pool/admin/rounds`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setRounds(res.data?.data ?? []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to load rounds');
      setRounds([]);
    } finally {
      setLoadingRounds(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchRounds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const handleCloseRound = async (roundId: string, roundNumber: number) => {
    if (closingId) return;
    if (!window.confirm(`Close round #${roundNumber} now? This pays out the current top 5 songs on-chain and cannot be undone.`)) {
      return;
    }

    setClosingId(roundId);
    try {
      const accessToken = await getAccessToken();
      const res = await axios.post(
        `${url}/api/pool/admin/rounds/${roundId}/close`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const payoutTxHash = res.data?.data?.payoutTxHash;
      toast.success(
        payoutTxHash
          ? `Round #${roundNumber} closed — payout tx ${payoutTxHash.slice(0, 10)}…`
          : `Round #${roundNumber} closed — no votes, nothing to pay out`
      );
      fetchRounds();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to close round');
    } finally {
      setClosingId(null);
    }
  };

  if (authLoading) {
    return <div className="h-40 rounded-lg bg-[#1A1A1A] animate-pulse" />;
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <h1 className="text-[#DACFD3] text-2xl font-bold mb-2">Admins only</h1>
        <p className="text-[#A3A3A3] text-sm">You don&apos;t have access to this page.</p>
      </div>
    );
  }

  return (
    <>
      <p className="text-xs capitalize font-medium text-left text-[#A3A3A3] mb-2">
        Admin / <span className="text-white">Pool Rounds</span>
      </p>
      <div className="border-b mt-7 mb-6">
        <h1 className="text-[#DACFD3] text-3xl font-bold mb-2">Pool Rounds</h1>
      </div>

      <p className="text-white text-sm mb-6">
        Rounds close automatically once their deadline passes. Use this to close the current round
        early if needed — it pays out the top 5 songs on-chain immediately and cannot be undone.
      </p>

      {loadingRounds ? (
        <div className="h-40 rounded-lg bg-[#1A1A1A] animate-pulse" />
      ) : rounds.length === 0 ? (
        <p className="text-[#A3A3A3] text-sm">No rounds yet.</p>
      ) : (
        <table className="w-full text-sm text-left text-gray-300 border border-gray-800 rounded-lg overflow-hidden">
          <thead className="text-[#A3A3A3] font-semibold text-sm">
            <tr>
              <th className="px-6 py-3">#</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Votes</th>
              <th className="px-6 py-3">Deposits</th>
              <th className="px-6 py-3">Total USDC</th>
              <th className="px-6 py-3">Opened</th>
              <th className="px-6 py-3">Closes</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {rounds.map((r) => (
              <tr key={r.id} className="text-[#666C6C] hover:bg-[#121212B8]">
                <td className="px-6 py-6 font-medium text-[#DACFD3]">#{r.roundNumber}</td>
                <td className="px-6 py-6">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      r.status === 'open' ? 'bg-emerald-900 text-emerald-400' : 'bg-[#242424] text-[#A3A3A3]'
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-6 py-6">{r.voteCount}</td>
                <td className="px-6 py-6">{r.depositCount}</td>
                <td className="px-6 py-6">{r.totalDeposited}</td>
                <td className="px-6 py-6">{new Date(r.openedAt).toLocaleString()}</td>
                <td className="px-6 py-6">
                  {r.status === 'closed'
                    ? r.closedAt
                      ? new Date(r.closedAt).toLocaleString()
                      : '—'
                    : r.closesAt
                    ? new Date(r.closesAt).toLocaleString()
                    : 'No deadline set'}
                </td>
                <td className="px-6 py-6">
                  {r.status === 'open' && (
                    <button
                      onClick={() => handleCloseRound(r.id, r.roundNumber)}
                      disabled={closingId === r.id}
                      className="bg-[#D2045B] hover:bg-pink-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      {closingId === r.id ? 'Closing…' : 'Close Round'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
};

export default AdminRoundsPage;
