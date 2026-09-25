"use client";

import { usePrivy, useCreateWallet, type User } from "@privy-io/react-auth";
import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "sonner";

// The app's own User row (AudioBlock_Backend/src/entities/User.ts), as
// returned by POST /api/auth/sync and PATCH /api/artist/update-profile —
// distinct from Privy's `User` type above, which only knows about identity
// (email/wallet), not app-specific profile fields.
export interface BackendUser {
  id: string;
  privyUserId?: string;
  username?: string;
  name?: string;
  email?: string;
  walletAddress: string;
  role: "listener" | "artist" | "admin";
  profileImage?: string;
  pageCover?: string;
  bio?: string;
  website?: string;
  rewardPoints: number;
  totalStreams: number;
  totalStreamTime: number;
  uniqueListeners: number;
  createdAt: string;
}

interface AuthContextValue {
  user: User | null | undefined;
  profile: BackendUser | null;
  setProfile: (profile: BackendUser) => void;
  login: () => void;
  loginAsArtist: () => void;
  // For a session that's already authenticated — loginAsArtist() only
  // carries role through Privy's login modal, so an already-logged-in
  // listener needs this instead to actually upgrade. Resolves true once
  // profile.role is "artist" (including if it already was), false if the
  // upgrade call itself failed.
  becomeArtist: () => Promise<boolean>;
  handleLogOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Mounted once, here, at the root (see context/provider.tsx) — this is the
// only place the backend sync runs. `Auth()` used to be a plain hook called
// independently from several components (Hero, Experience, Navbar,
// UserMenu); each instance ran its own copy of this effect, so on login
// every mounted instance fired its own POST /api/auth/sync at once — a race
// that both duplicated the "logged in" toast and, on the backend, could
// collide on the privyUserId unique constraint. A module-level "shared
// promise" guard isn't reliable here either: Next.js can bundle the same
// hook module into more than one route chunk, giving each chunk its own
// copy of that module-level state. A React Context mounted once in the tree
// doesn't have that problem — there is structurally only one instance.
export function AuthProvider({ children }: { children: ReactNode }) {
  const { ready, authenticated, user, login, logout, getAccessToken } = usePrivy();
  const { createWallet } = useCreateWallet();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<BackendUser | null>(null);
  const syncedUserId = useRef<string | null>(null);

  // Set by loginAsArtist() right before opening Privy's login modal, and
  // read once the resulting session actually syncs — every brand-new
  // signup defaults to listener unless the artist entry point was used
  // instead. For an *existing* session, use becomeArtist() below instead:
  // AuthService.sync only applies `role` on first-ever signup through this
  // effect, but does separately allow an existing LISTENER to upgrade to
  // ARTIST when `role: "artist"` is passed — becomeArtist() calls /sync
  // directly with that, bypassing this pendingRole/login-modal path
  // entirely since there's no need to re-authenticate.
  const pendingRole = useRef<"artist" | null>(null);

  useEffect(() => {
    const syncWithBackend = async () => {
      if (!ready || !authenticated || !user || syncedUserId.current === user.id) return;

      // Set before the first `await` below, not after the call resolves —
      // ready/authenticated can settle across more than one render before
      // user.id does, re-firing this effect for the same user while the
      // first call is still in flight. Marking it synchronously closes that
      // gap; on failure it's reset in the catch so a real retry isn't
      // permanently blocked.
      syncedUserId.current = user.id;

      const url = process.env.NEXT_PUBLIC_API_URL;
      const role = pendingRole.current;

      try {
        setLoading(true);

        // `createOnLogin` in the PrivyProvider config creates an embedded
        // wallet in the background on login, but it can still be in flight
        // by the time we get here — the backend requires a wallet address,
        // so make sure one exists before asking it to sync.
        if (!user.wallet) {
          await createWallet();
        }

        const accessToken = await getAccessToken();

        const response = await axios.post(
          `${url}/api/auth/sync`,
          role ? { role } : {},
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        // Only used by middleware.ts to gate routes client-side; every
        // authenticated request re-fetches a fresh token via getAccessToken().
        Cookies.set("audioblocks_session", accessToken ?? "");
        setProfile(response.data?.user ?? null);
        toast.success(response.data?.message);

        // Only redirect when this session actually went through the artist
        // sign-up/login entry point (loginAsArtist) — not on every ordinary
        // session resume, which would otherwise yank an already-browsing
        // artist back to /artist-hub on every page refresh.
        if (role === "artist") {
          router.push("/artist-hub");
        }
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Sign-in failed");
        syncedUserId.current = null;
        await logout();
      } finally {
        pendingRole.current = null;
        setLoading(false);
      }
    };

    syncWithBackend();
  }, [ready, authenticated, user?.id]);

  const loginAsArtist = () => {
    pendingRole.current = "artist";
    login();
  };

  const becomeArtist = async (): Promise<boolean> => {
    if (profile?.role === "artist") return true;

    const url = process.env.NEXT_PUBLIC_API_URL;
    try {
      const accessToken = await getAccessToken();
      const response = await axios.post(
        `${url}/api/auth/sync`,
        { role: "artist" },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const updated: BackendUser | null = response.data?.user ?? null;
      setProfile(updated as BackendUser);
      return updated?.role === "artist";
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not switch to an artist account");
      return false;
    }
  };

  const handleLogOut = async () => {
    Cookies.remove("audioblocks_session");
    syncedUserId.current = null;
    setProfile(null);
    await logout();
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, setProfile, login, loginAsArtist, becomeArtist, handleLogOut, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext() must be used within <AuthProvider>");
  }
  return ctx;
}
