'use client';

import ArtistHubHero from '@/components/common/artist-hub/ArtistHubHero';
import ArtistFeatures from '@/components/common/artist-hub/ArtistFeatures';
import ArtistUpgrade from '@/components/common/artist-hub/ArtistUpgrade';
import SongUpload from '@/components/common/artist-hub/SongUpload';
import ArtistStats from '@/components/common/artist-hub/ArtistStats';
import Collabs from '@/components/common/artist-hub/Collabs';
import CreateRoom from '@/components/common/artist-hub/CreateRoom';
import { Auth } from '@/hooks/useAuth';

export default function ArtistHub() {
  const { profile, loading } = Auth();

  // `loading` only turns true while an authenticated session is actively
  // syncing with the backend — a logged-out visitor never sees this and
  // goes straight to the marketing content below.
  if (loading) {
    return <div className="min-h-screen animate-pulse" />;
  }

  if (profile?.role === 'artist') {
    return (
      <>
        <ArtistStats />
        <SongUpload />
        <CreateRoom />
        <Collabs />
      </>
    );
  }

  return (
    <>
      <ArtistHubHero />
      <ArtistFeatures />
      <ArtistUpgrade />
    </>
  );
}
