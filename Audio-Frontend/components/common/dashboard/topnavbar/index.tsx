'use client';

import { useEffect, useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import { Bell } from 'lucide-react';
import UserMenu from './UserMenu';
import { Auth } from '@/hooks/useAuth';

const TopNavbar = () => {
  const { profile } = Auth();
  const [now, setNow] = useState<Date | null>(null);

  // Rendered once on the client after mount (not during SSR) so the
  // formatted date/time reflects the viewer's own clock/timezone instead of
  // the server's — avoids a hydration mismatch between the two.
  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const displayName = profile?.username || profile?.name || profile?.email?.split('@')[0];
  const greeting = !now
    ? 'Welcome'
    : now.getHours() < 12
      ? 'Good morning'
      : now.getHours() < 18
        ? 'Good afternoon'
        : 'Good evening';
  const dateLabel = now?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const timeLabel = now?.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  return (
    <header className="w-full px-4 md:px-8  py-4 shadow-md bg-[#161616] flex items-center justify-between">
      {/* Left Side: Welcome + Date */}
      <div>
        <h2 className="text-sm md:text-base font-semibold">
          {greeting}
          {displayName ? `, ${displayName}` : ''}
        </h2>
        <p className="text-xs text-gray-400">
          {dateLabel && timeLabel ? `${dateLabel} | ${timeLabel}` : ' '}
        </p>
      </div>

      {/* Center: Search */}
      <div className="flex-1 mx-4 max-w-2xl hidden md:flex">
        <div className="flex items-center w-full bg-[#1E1E1E] rounded-xl px-4 py-2">
          <FiSearch className="text-gray-400 text-lg" />
          <input
            type="text"
            placeholder="Search by artists, songs or albums"
            className="ml-3 w-full bg-transparent outline-none text-sm text-gray-200 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Right: Notifications + Avatar */}
      <div className="flex items-center gap-4">
        <button className="relative ">
          <Bell className="text-white" size={20}/>
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <UserMenu />
      </div>
    </header>
  );
};

export default TopNavbar;
