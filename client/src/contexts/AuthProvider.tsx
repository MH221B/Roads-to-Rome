import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useQueryClient } from '@tanstack/react-query'
import { initAxios } from "../services/axiosClient";
import api from "../services/axiosClient";
import { broadcast, subscribe } from "../lib/broadcast";

type AuthContextType = {
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJwtExp(token: string | null): number | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (typeof payload.exp === "number") return payload.exp;
    return null;
  } catch (e) {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const refreshTimer = useRef<number | null>(null);
  const queryClient = useQueryClient();
  const clientIdRef = useRef<string>(
    typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function"
      ? (crypto as any).randomUUID()
      : Math.random().toString(36).slice(2)
  );
  const pendingLoginBroadcast = useRef(false);
  // tracks whether the user explicitly logged out so we avoid
  // attempting background refreshes (which can cause 401 noise)
  const isLoggedOutRef = useRef(false);

  const clearRefresh = () => {
    if (refreshTimer.current !== null) {
      window.clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
  };

  const scheduleRefresh = useCallback((token: string | null) => {
    clearRefresh();
    const exp = parseJwtExp(token);
    if (!exp) return;
    // schedule refresh 60 seconds before expiry (or immediately if already expired)
    const msUntilExp = exp * 1000 - Date.now();
    const refreshIn = Math.max(0, msUntilExp - 60_000);
    refreshTimer.current = window.setTimeout(() => {
      silentRefresh().catch(() => {});
    }, refreshIn) as unknown as number;
  }, []);

  const silentRefresh = useCallback(async (): Promise<void> => {
    try {
      // Use centralized axios instance so interceptors/queueing apply
      const res = await api.post(`/user/refresh`);
      const data = res.data;
      // backend returns the access token in the `token` field
      const token = data?.token ?? null;
      if (!token) {
        setAccessToken(null);
        clearRefresh();
        return;
      }
      // successful refresh implies we're not logged-out
      isLoggedOutRef.current = false;
      setAccessToken(token);
      scheduleRefresh(token);
    } catch (err) {
      setAccessToken(null);
      clearRefresh();
    }
  }, [scheduleRefresh]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await api.post(`/user/login`, { email, password });
      const data = res.data;
      // backend returns the access token in the `token` field
      const token = data?.token ?? null;
      // clear logged-out flag when login succeeds
      isLoggedOutRef.current = false;
      setAccessToken(token);
      scheduleRefresh(token);
      // notify other tabs that a login occurred so they can attempt
      // a background silent refresh to obtain an access token.
      // mark that we should broadcast the login after state flush
      pendingLoginBroadcast.current = true;
    } catch (err) {
      throw new Error("Login failed");
    }
  }, [scheduleRefresh]);

  const logout = useCallback(async () => {
    try {
      await api.post(`/user/logout`);
    } finally {
      // mark explicit logout so background refresh attempts are skipped
      isLoggedOutRef.current = true;
      try {
        broadcast("logout", clientIdRef.current);
      } catch (e) {
        // ignore
      }
      setAccessToken(null);
      clearRefresh();
      // clear react-query in-memory cache so sensitive data is removed
      try {
        await queryClient.cancelQueries();
        // remove all queries from cache
        queryClient.removeQueries();
      } catch (e) {
        // ignore cache clearing errors
      }
    }
  }, [queryClient]);

  const getAccessToken = useCallback(() => accessToken, [accessToken]);

  // Attempt a single background silent refresh on initial mount if we don't
  // already have an access token (e.g. user reloads page but httpOnly
  // refresh cookie still exists). Also, if we do have a token on mount,
  // ensure the refresh timer is scheduled.
  const initialRefreshTried = useRef(false);
  useEffect(() => {
    if (!initialRefreshTried.current) {
      initialRefreshTried.current = true;
      if (!accessToken && !isLoggedOutRef.current) {
        // background attempt; failures are swallowed inside silentRefresh
        silentRefresh().catch(() => {});
      } else {
        // ensure we have a scheduled refresh for an existing token
        scheduleRefresh(accessToken);
      }
    }

    return () => clearRefresh();
  }, [accessToken, scheduleRefresh, silentRefresh]);

  useEffect(() => {
    // initialize axios client so it can attach tokens and handle refresh/logout
    initAxios({ getAccessToken, setAccessToken, logout });
  }, [getAccessToken, logout]);

  useEffect(() => {
    // subscribe to cross-tab auth events
    const unsub = subscribe((action) => {
      if (action === "login") {
        // another tab logged in; clear logged-out marker
        isLoggedOutRef.current = false;
        // another tab logged in; if we don't have a token try to silently refresh
        if (!accessToken && !isLoggedOutRef.current) {
          silentRefresh().catch(() => {});
        }
      } else if (action === "logout") {
        // another tab logged out; mark logged-out so we skip background refresh
        isLoggedOutRef.current = true;
        // another tab logged out; clear immediately
        setAccessToken(null);
        clearRefresh();
        try {
          queryClient.cancelQueries();
          queryClient.removeQueries();
        } catch (e) {
          // ignore
        }
      }
    }, clientIdRef.current);
    // pass our local client id so we don't react to our own broadcasts
    // (subscribe already ignores messages from the same clientId)
    // Note: subscribe returns an unsubscribe function
    // We reassign using the clientId below by creating the subscription with clientId
    // (Implementation detail: the subscribe call above will be replaced by the one below via redeclaration)
    return unsub;
  }, [accessToken, silentRefresh, queryClient]);

  // If login just occurred in this tab, broadcast it now that
  // `accessToken` has been updated (prevents same-tab double refresh).
  useEffect(() => {
    if (pendingLoginBroadcast.current) {
      try {
        broadcast("login", clientIdRef.current);
      } catch (e) {
        // ignore errors
      } finally {
        pendingLoginBroadcast.current = false;
      }
    }
  }, [accessToken]);

  const value: AuthContextType = {
    accessToken,
    isAuthenticated: !!accessToken,
    login,
    logout,
    getAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default AuthProvider;
