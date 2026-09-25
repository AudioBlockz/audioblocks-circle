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

// Minimal admin surface for the pool voting rounds. Rounds don't open
// themselves — an admin explicitly opens the next one (choosing how long it
// runs) once the previous one has closed, and can also close the open one
// early if needed. A round left open past its chosen duration closes itself
// automatically (see the backend's autoCloseDueRounds) and pays out —
// "Close Round" here is just for closing one ahead of schedule.
const DEFAULT_DURATION_HOURS = 24 * 7;

const AdminRoundsPage = () => {
  const { getAccessToken } = usePrivy();
  const { profile, loading: authLoading } = Auth();

  const [rounds, setRounds] = useState<AdminRound[]>([]);
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [durationHours, setDurationHours] = useState(String(DEFAULT_DURATION_HOURS));

  const url = process.env.NEXT_PUBLIC_API_URL;
  const isAdmin = profile?.role === 'admin';
  const hasOpenRound = rounds.some((r) => r.status === 'open');

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

  const handleCreateRound = async () => {
    if (creating) return;
    const hours = Number(durationHours);
    if (!Number.isFinite(hours) || hours <= 0) {
      toast.error('Enter a duration greater than zero');
      return;
    }

    setCreating(true);
    try {
      const accessToken = await getAccessToken();
      const res = await axios.post(
        `${url}/api/pool/admin/rounds`,
        { durationHours: hours },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      toast.success(`Round #${res.data?.data?.roundNumber} opened for ${hours} hour(s)`);
      fetchRounds();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create round');
    } finally {
      setCreating(false);
    }
  };

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
        Rounds don&apos;t open on their own — start the next one below, and it&apos;ll close and pay
        out automatically once its duration passes, or you can close it early anytime.
      </p>

      <div className="flex flex-wrap items-end gap-4 bg-[#1A1A1A] rounded-xl px-6 py-4 mb-6">
        {hasOpenRound ? (
          <p className="text-[#A3A3A3] text-sm">
            A round is already open — close it before starting a new one.
          </p>
        ) : (
          <>
            <div>
              <label className="block text-[#A3A3A3] text-xs mb-1">Duration (hours)</label>
              <input
                type="number"
                min={1}
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                className="w-32 bg-[#242424] text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <button
              onClick={handleCreateRound}
              disabled={creating}
              className="bg-[#D2045B] hover:bg-pink-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer"
            >
              {creating ? 'Opening…' : 'Create Round'}
            </button>
          </>
        )}
      </div>

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
