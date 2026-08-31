"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, type User } from "@/lib/api";

type AuthStatus = "loading" | "authenticated" | "guest";

type AuthContextValue = {
  user: User | null;
  status: AuthStatus;
  isSignedIn: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  signOut: () => Promise<void>;
  updateProfile: (input: ProfileInput) => Promise<User>;
  /** Re-read the account from the API, e.g. after confirming an email. */
  refreshUser: () => Promise<User | null>;
};

export type RegisterInput = {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  /** Which language to write the confirmation email in. */
  language?: string;
};

export type ProfileInput = {
  first_name?: string;
  last_name?: string;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  // The session lives in httpOnly cookies, which this code cannot read, so
  // the only way to know whether anyone is signed in is to ask. The api()
  // wrapper silently refreshes an expired access token along the way.
  useEffect(() => {
    let cancelled = false;

    api<User>("/api/auth/me/")
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        setStatus("authenticated");
      })
      .catch(() => {
        if (cancelled) return;
        setUser(null);
        setStatus("guest");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const me = await api<User>("/api/auth/login/", {
      method: "POST",
      body: { email, password },
    });
    setUser(me);
    setStatus("authenticated");
    return me;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const me = await api<User>("/api/auth/register/", { method: "POST", body: input });
    setUser(me);
    setStatus("authenticated");
    return me;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api("/api/auth/logout/", { method: "POST" });
    } finally {
      // Even if the call failed, this browser is done with the session.
      setUser(null);
      setStatus("guest");
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await api<User>("/api/auth/me/");
      setUser(me);
      setStatus("authenticated");
      return me;
    } catch {
      // A failure here says nothing new — the caller already has whatever the
      // context last knew, and signing them out over it would be worse.
      return null;
    }
  }, []);

  const updateProfile = useCallback(async (input: ProfileInput) => {
    const me = await api<User>("/api/auth/me/", { method: "PATCH", body: input });
    setUser(me);
    return me;
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isSignedIn: status === "authenticated",
      signIn,
      register,
      signOut,
      updateProfile,
      refreshUser,
    }),
    [user, status, signIn, register, signOut, updateProfile, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
