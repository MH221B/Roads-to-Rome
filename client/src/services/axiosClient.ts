import axios, { type AxiosInstance } from "axios";
import type { InternalAxiosRequestConfig } from "axios";

const API_URL = import.meta.env.VITE_API_URL as string;

type GetToken = () => string | null;
type SetToken = (t: string | null) => void;
type LogoutHandler = () => Promise<void> | void;

let getAccessToken: GetToken = () => null;
let setAccessToken: SetToken = () => {};
let logoutHandler: LogoutHandler = () => {};

let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

export const api: AxiosInstance = axios.create({ baseURL: API_URL, withCredentials: true });

function subscribeToken(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function doRefresh(): Promise<string | null> {
  // Call refresh endpoint using a plain axios call to avoid interceptor loops
  const url = `${API_URL}/user/refresh`;
  const resp = await axios.post(url, {}, { withCredentials: true });
  if (resp.status !== 200) return null;
  const token = resp.data?.token ?? null;
  return token;
}

async function refreshTokenWithQueue(): Promise<string | null> {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      subscribeToken((token) => {
        if (token) resolve(token);
        else reject(new Error("Refresh failed"));
      });
    });
  }

  isRefreshing = true;
  try {
    const token = await doRefresh();
    if (!token) {
      onRefreshed(null);
      // notify caller to logout
      try {
        await Promise.resolve(logoutHandler());
      } catch (_) {}
      return null;
    }
    // update app state
    setAccessToken(token);
    onRefreshed(token);
    return token;
  } catch (err) {
    onRefreshed(null);
    try {
      await Promise.resolve(logoutHandler());
    } catch (_) {}
    throw err;
  } finally {
    isRefreshing = false;
  }
}

export function initAxios(opts: { getAccessToken: GetToken; setAccessToken: SetToken; logout: LogoutHandler }) {
  getAccessToken = opts.getAccessToken;
  setAccessToken = opts.setAccessToken;
  logoutHandler = opts.logout;

  // request interceptor: attach bearer token when available
  api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    try {
      const token = getAccessToken();
      if (token && config) {
        // ensure headers object exists and set Authorization
        config.headers = { ...(config.headers as any || {}), Authorization: `Bearer ${token}` } as any;
      }
    } catch (e) {
      // ignore
    }
    return config;
  }, (error) => Promise.reject(error));

  // response interceptor: try refresh on 401 with queueing
  api.interceptors.response.use((r) => r, async (error) => {
    const originalRequest = error?.config as InternalAxiosRequestConfig & { _retry?: boolean } | undefined;
    if (!originalRequest) return Promise.reject(error);

    const status = error?.response?.status;
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshTokenWithQueue();
        if (!newToken) return Promise.reject(error);
        // ensure headers exist and set Authorization for the retried request
        originalRequest.headers = { ...(originalRequest.headers as any || {}), Authorization: `Bearer ${newToken}` } as any;
        return api(originalRequest);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  });
}

export default api;
