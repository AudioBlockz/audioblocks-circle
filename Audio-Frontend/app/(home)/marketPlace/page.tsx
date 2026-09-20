'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';
import { Radio, Clock, Lock } from 'lucide-react';

interface RoomListing {
  id: string;
  title: string;
  description: string | null;
  price: string;
  accessStartsAt: string;
  accessEndsAt: string;
  state: 'upcoming' | 'live' | 'closed';
  song: { id: string; title: string; coverArtPath: string | null; duration: number | null } | null;
  artist: { id: string; username: string | null; name: string | null; profileImage: string | null };
}

const stateBadge: Record<RoomListing['state'], { label: string; className: string }> = {
  live: { label: 'Live now', className: 'bg-[#D2045B] text-white' },
  upcoming: { label: 'Upcoming', className: 'bg-[#242424] text-[#A3A3A3] border border-[#3A3A3A]' },
  closed: { label: 'Closed', className: 'bg-[#1A1A1A] text-[#4B4B4B]' },
};

const artistDisplayName = (a: RoomListing['artist']) => a.username || a.name || 'Unnamed Artist';

const formatWindow = (room: RoomListing) => {
  const start = new Date(room.accessStartsAt);
  const end = new Date(room.accessEndsAt);
  const fmt = (d: Date) => d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  return `${fmt(start)} – ${fmt(end)}`;
};

export default function MarketPlacePage() {
  const [rooms, setRooms] = useState<RoomListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_API_URL;
    (async () => {
      try {
        const res = await axios.get(`${url}/api/rooms`);
        setRooms(res.data?.data ?? []);
      } catch {
        setRooms([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center gap-2 text-[#D2045B] text-sm font-semibold mb-3">
          <Radio size={16} />
          Listening Rooms
        </div>
        <h1 className="font-['Poppins'] font-semibold text-3xl sm:text-4xl mb-3">
          Virtual listening parties
        </h1>
        <p className="text-[#A3A3A3] max-w-2xl mb-12">
          Artists open a room and drop an unreleased track for a limited window. Buy a ticket to
          unlock it, listen, and leave your review.
        </p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 rounded-xl bg-[#1A1A1A] animate-pulse" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <p className="text-[#A3A3A3] text-sm">No rooms open right now — check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => {
              const badge = stateBadge[room.state];
              return (
                <Link
                  key={room.id}
                  href={`/marketPlace/${room.id}`}
                  className="group rounded-xl bg-[#1A1A1A] hover:bg-[#1E1E1E] transition overflow-hidden border border-[#242424]"
                >
                  <div className="relative aspect-square">
                    <Image
                      src={room.song?.coverArtPath || '/dashboard/profiledefault.png'}
                      alt={room.title}
                      fill
                      className="object-cover"
                    />
                    <span
                      className={`absolute top-3 left-3 text-[10px] font-semibold px-2 py-1 rounded-full ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                    <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-black/60 text-white">
                      <Lock size={10} />
                      {room.price} USDC
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-white truncate">{room.title}</h3>
                    <p className="text-xs text-[#A3A3A3] truncate mb-2">
                      {artistDisplayName(room.artist)}
                    </p>
                    <div className="flex items-center gap-1 text-[11px] text-[#4B4B4B]">
                      <Clock size={11} />
                      {formatWindow(room)}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
