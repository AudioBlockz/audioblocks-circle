// Thin re-export so existing call sites (`import { Auth } from '@/hooks/useAuth'`)
// don't need to change. The actual implementation lives in a Context
// mounted once at the root — see context/AuthContext.tsx for why.
export { useAuthContext as Auth } from "@/context/AuthContext";
