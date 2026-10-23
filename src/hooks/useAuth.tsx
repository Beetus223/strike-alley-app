import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { passwordSetupFlow } from "@/lib/staff-auth";

type Role = "admin" | "staff" | "player";

type AuthState = {
  user: User | null;
  session: Session | null;
  roles: Role[];
  isStaff: boolean;
  loading: boolean;
  accessError: boolean;
  retryAccess: () => void;
  passwordSetup: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  roles: [],
  isStaff: false,
  loading: true,
  accessError: false,
  retryAccess: () => {},
  passwordSetup: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordSetup, setPasswordSetup] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let initialPasswordSetup = passwordSetupFlow(window.location.hash);
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "PASSWORD_RECOVERY" || (next && initialPasswordSetup)) setPasswordSetup(true);
      if (next || event === "SIGNED_OUT") initialPasswordSetup = false;
      if (event === "SIGNED_OUT") {
        setPasswordSetup(false);
      }
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void router.invalidate();
        if (event !== "SIGNED_OUT") void queryClient.invalidateQueries();
      }
    });
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      if (!data.user) setSession(null);
      setLoading(false);
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, [queryClient, router]);

  const userId = session?.user.id;
  const roleQuery = useQuery({
    queryKey: ["auth", "roles", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      // A failed check is not evidence that this account lacks staff access.
      if (error) throw error;
      return (data ?? []).map((r) => r.role as Role);
    },
    retry: 2,
  });

  const roles = userId ? roleQuery.data ?? [] : [];
  const value: AuthState = {
    user: session?.user ?? null,
    session,
    roles,
    isStaff: roles.includes("admin") || roles.includes("staff"),
    loading: loading || Boolean(userId && (roleQuery.isPending || (roleQuery.isFetching && !roleQuery.data))),
    accessError: Boolean(userId && roleQuery.isError),
    retryAccess: () => { void roleQuery.refetch(); },
    passwordSetup,
    signOut: async () => {
      await queryClient.cancelQueries();
      queryClient.clear();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      await navigate({ to: "/auth", replace: true });
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
