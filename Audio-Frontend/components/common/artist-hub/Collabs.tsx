'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { toast } from 'sonner';
import { usePrivy } from '@privy-io/react-auth';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@radix-ui/react-tabs';
import { X } from 'lucide-react';
import { Auth } from '@/hooks/useAuth';

interface ApiArtist {
  id: string;
  username: string | null;
  name: string | null;
  profileImage: string | null;
  bio: string | null;
}

interface CollectionMemberView {
  userId: string;
  username: string | null;
  name: string | null;
  profileImage: string | null;
  splitBps: number;
  status: 'pending' | 'accepted' | 'declined';
  respondedAt: string | null;
}

interface CollectionView {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'archived';
  creatorId: string;
  createdAt: string;
  members: CollectionMemberView[];
}

interface PendingInvite {
  collectionId: string;
  title: string | null;
  description: string | null;
  splitBps: number;
  invitedBy: { id: string; username: string | null; name: string | null; profileImage: string | null } | null;
  createdAt: string;
}

const displayName = (a: { username?: string | null; name?: string | null }) =>
  a.username || a.name || 'Unnamed Artist';

const statusColor: Record<string, string> = {
  draft: 'bg-[#4B4B4B] text-white',
  active: 'bg-emerald-600 text-white',
  archived: 'bg-[#1A1A1A] text-[#A3A3A3]',
};

const Collabs = () => {
  const { getAccessToken } = usePrivy();
  const { profile } = Auth();
  const url = process.env.NEXT_PUBLIC_API_URL;

  const [tab, setTab] = useState<'mine' | 'invites' | 'create'>('mine');

  const [artists, setArtists] = useState<ApiArtist[]>([]);
  const [myCollections, setMyCollections] = useState<CollectionView[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  // Create form. Splits are edited as whole percentages in the UI and
  // converted to basis points (×100) only when sent to the backend.
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mySplitPercent, setMySplitPercent] = useState(50);
  const [members, setMembers] = useState<{ userId: string; splitPercent: number }[]>([]);
  const [pickerId, setPickerId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const authHeaders = async () => {
    const accessToken = await getAccessToken();
    return { Authorization: `Bearer ${accessToken}` };
  };

  const fetchAll = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const headers = await authHeaders();
      const [artistsRes, mineRes, invitesRes] = await Promise.all([
        axios.get(`${url}/api/pool/artists`),
        axios.get(`${url}/api/collections/mine`, { headers }),
        axios.get(`${url}/api/collections/invites/pending`, { headers }),
      ]);
      setArtists((artistsRes.data?.data ?? []).filter((a: ApiArtist) => a.id !== profile.id));
      setMyCollections(mineRes.data?.data ?? []);
      setInvites(invitesRes.data?.data ?? []);
    } catch {
      // Keep whatever was already loaded rather than blanking the page.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const totalSplit = mySplitPercent + members.reduce((sum, m) => sum + m.splitPercent, 0);

  const addMember = () => {
    if (!pickerId) return;
    if (members.some((m) => m.userId === pickerId)) return;
    setMembers((prev) => [...prev, { userId: pickerId, splitPercent: 0 }]);
    setPickerId('');
  };

  const removeMember = (userId: string) => {
    setMembers((prev) => prev.filter((m) => m.userId !== userId));
  };

  const updateMemberSplit = (userId: string, value: number) => {
    setMembers((prev) => prev.map((m) => (m.userId === userId ? { ...m, splitPercent: value } : m)));
  };

  const resetCreateForm = () => {
    setTitle('');
    setDescription('');
    setMySplitPercent(50);
    setMembers([]);
    setPickerId('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Give the collab a title');
      return;
    }
    if (members.length === 0) {
      toast.error('Invite at least one other artist');
      return;
    }
    if (totalSplit !== 100) {
      toast.error(`Splits must add up to 100% (currently ${totalSplit}%)`);
      return;
    }

    setSubmitting(true);
    try {
      const headers = await authHeaders();
      await axios.post(
        `${url}/api/collections`,
        {
          title,
          description: description || undefined,
          creatorSplitBps: Math.round(mySplitPercent * 100),
          members: members.map((m) => ({ userId: m.userId, splitBps: Math.round(m.splitPercent * 100) })),
        },
        { headers }
      );
      toast.success('Collab created — invites sent');
      resetCreateForm();
      setTab('mine');
      fetchAll();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create collab');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespond = async (collectionId: string, status: 'accepted' | 'declined') => {
    setRespondingId(collectionId);
    try {
      const headers = await authHeaders();
      await axios.post(`${url}/api/collections/${collectionId}/respond`, { status }, { headers });
      toast.success(status === 'accepted' ? 'Invite accepted' : 'Invite declined');
      fetchAll();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to respond');
    } finally {
      setRespondingId(null);
    }
  };

  if (!profile || profile.role !== 'artist') return null;

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-white">
      <h1 className="font-['Poppins'] font-semibold text-[36px] mb-2">Collabs</h1>
      <p className="text-[#A3A3A3] mb-8">
        Team up with other artists on a joint record and split the rewards automatically.
      </p>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full">
        <TabsList className="flex gap-4 mb-8">
          <TabsTrigger
            value="mine"
            className="data-[state=active]:bg-[#D2045B] font-medium text-sm cursor-pointer data-[state=active]:text-white text-[#A3A3A3] bg-[#1C2022] px-3 py-2 rounded-xl"
          >
            My Collabs
          </TabsTrigger>
          <TabsTrigger
            value="invites"
            className="data-[state=active]:bg-[#D2045B] font-medium text-sm cursor-pointer data-[state=active]:text-white text-[#A3A3A3] bg-[#1C2022] px-3 py-2 rounded-xl"
          >
            Invites{invites.length > 0 ? ` (${invites.length})` : ''}
          </TabsTrigger>
          <TabsTrigger
            value="create"
            className="data-[state=active]:bg-[#D2045B] font-medium text-sm cursor-pointer data-[state=active]:text-white text-[#A3A3A3] bg-[#1C2022] px-3 py-2 rounded-xl"
          >
            Start a Collab
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mine">
          {loading ? (
            <div className="h-32 rounded-lg bg-[#1A1A1A] animate-pulse" />
          ) : myCollections.length === 0 ? (
            <p className="text-[#A3A3A3] text-sm">No collabs yet — start one from the "Start a Collab" tab.</p>
          ) : (
            <div className="space-y-4">
              {myCollections.map((c) => (
                <div key={c.id} className="bg-[#1A1A1A] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{c.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColor[c.status]}`}>
                      {c.status}
                    </span>
                  </div>
                  {c.description && <p className="text-sm text-[#A3A3A3] mb-3">{c.description}</p>}
                  <div className="flex flex-wrap gap-3">
                    {c.members.map((m) => (
                      <div key={m.userId} className="flex items-center gap-2 bg-[#111] rounded-full pl-1 pr-3 py-1">
                        <Image
                          src={m.profileImage || '/dashboard/profiledefault.png'}
                          alt={displayName(m)}
                          width={24}
                          height={24}
                          className="rounded-full object-cover w-6 h-6"
                        />
                        <span className="text-xs">
                          {displayName(m)} · {(m.splitBps / 100).toFixed(0)}%
                        </span>
                        <span
                          className={`text-[10px] ${
                            m.status === 'accepted'
                              ? 'text-emerald-400'
                              : m.status === 'declined'
                                ? 'text-red-400'
                                : 'text-yellow-400'
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invites">
          {loading ? (
            <div className="h-32 rounded-lg bg-[#1A1A1A] animate-pulse" />
          ) : invites.length === 0 ? (
            <p className="text-[#A3A3A3] text-sm">No pending invites.</p>
          ) : (
            <div className="space-y-4">
              {invites.map((inv) => (
                <div
                  key={inv.collectionId}
                  className="bg-[#1A1A1A] rounded-xl p-5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src={inv.invitedBy?.profileImage || '/dashboard/profiledefault.png'}
                      alt={inv.invitedBy ? displayName(inv.invitedBy) : 'Artist'}
                      width={40}
                      height={40}
                      className="rounded-full object-cover w-10 h-10"
                    />
                    <div>
                      <p className="font-semibold">{inv.title}</p>
                      <p className="text-xs text-[#A3A3A3]">
                        Invited by {inv.invitedBy ? displayName(inv.invitedBy) : 'an artist'} · your share{' '}
                        {(inv.splitBps / 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={respondingId === inv.collectionId}
                      onClick={() => handleRespond(inv.collectionId, 'declined')}
                      className="border border-[#4B4B4B] text-sm px-4 py-2 rounded-md hover:bg-[#1A1A1A] disabled:opacity-50"
                    >
                      Decline
                    </button>
                    <button
                      disabled={respondingId === inv.collectionId}
                      onClick={() => handleRespond(inv.collectionId, 'accepted')}
                      className="bg-pink-600 text-sm px-4 py-2 rounded-md font-semibold disabled:opacity-50"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create">
          <form onSubmit={handleCreate} className="space-y-6 max-w-2xl">
            <div>
              <label className="block mb-2 text-sm font-medium">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Joint EP with..."
                className="w-full bg-[#1A1A1A] text-white rounded-lg px-4 py-2 placeholder:text-sm placeholder:text-[#4B4B4B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">Description (optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this collab about?"
                className="w-full bg-[#1A1A1A] text-white rounded-lg px-4 py-2 placeholder:text-sm placeholder:text-[#4B4B4B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">Your split</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={mySplitPercent}
                  onChange={(e) => setMySplitPercent(Number(e.target.value))}
                  className="w-24 bg-[#1A1A1A] text-white rounded-lg px-4 py-2 focus:outline-none"
                />
                <span className="text-sm text-[#A3A3A3]">%</span>
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">Invite artists</label>
              <div className="flex gap-2 mb-3">
                <select
                  value={pickerId}
                  onChange={(e) => setPickerId(e.target.value)}
                  className="flex-1 bg-[#1A1A1A] text-white rounded-lg px-4 py-2 focus:outline-none"
                >
                  <option value="">Select an artist…</option>
                  {artists
                    .filter((a) => !members.some((m) => m.userId === a.id))
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {displayName(a)}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={addMember}
                  className="border border-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-white hover:text-black transition"
                >
                  Add
                </button>
              </div>

              <div className="space-y-2">
                {members.map((m) => {
                  const artist = artists.find((a) => a.id === m.userId);
                  return (
                    <div key={m.userId} className="flex items-center gap-3 bg-[#1A1A1A] rounded-lg px-4 py-2">
                      <span className="flex-1 text-sm">{artist ? displayName(artist) : m.userId}</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={m.splitPercent}
                        onChange={(e) => updateMemberSplit(m.userId, Number(e.target.value))}
                        className="w-20 bg-[#111] text-white rounded-md px-2 py-1 text-sm focus:outline-none"
                      />
                      <span className="text-sm text-[#A3A3A3]">%</span>
                      <button
                        type="button"
                        onClick={() => removeMember(m.userId)}
                        className="text-[#A3A3A3] hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className={`text-sm ${totalSplit === 100 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                Total split: {totalSplit}%
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="bg-pink-600 text-white px-6 py-2 rounded-md font-semibold disabled:opacity-50"
              >
                {submitting ? 'Creating…' : 'Create Collab'}
              </button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default Collabs;
