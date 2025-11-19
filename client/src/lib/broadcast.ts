export type AuthMessage = "login" | "logout";

const CHANNEL = "auth_broadcast_v1";

type BroadcastPayload = {
  action: AuthMessage;
  ts?: number;
  clientId?: string;
};

// include optional clientId so tabs can ignore messages originating from themselves
export function broadcast(action: AuthMessage, clientId?: string) {
  const payload: BroadcastPayload = { action, ts: Date.now(), clientId };
  try {
    const g = typeof globalThis !== "undefined" ? globalThis : (typeof window !== "undefined" ? window as any : undefined as any);
    if (g && typeof g.BroadcastChannel !== "undefined") {
      const bc = new g.BroadcastChannel(CHANNEL);
      bc.postMessage(payload);
      bc.close();
      return;
    }
  } catch (e) {
    // fallthrough to localStorage fallback
  }

  try {
    // Write a small object so storage events fire across tabs.
    const g = typeof globalThis !== "undefined" ? globalThis : (typeof window !== "undefined" ? window as any : undefined as any);
    if (!g || !g.localStorage) return;
    // Ensure the storage event has time to propagate to other tabs by removing on next tick
    g.localStorage.setItem(CHANNEL, JSON.stringify(payload));
    setTimeout(() => {
      try {
        g.localStorage.removeItem(CHANNEL);
      } catch (e) {
        // ignore
      }
    }, 0);
  } catch (e) {
    // ignore
  }
}

// subscribe will ignore messages whose clientId matches `localClientId` if provided
export function subscribe(handler: (action: AuthMessage) => void, localClientId?: string) {
  try {
    const g = typeof globalThis !== "undefined" ? globalThis : (typeof window !== "undefined" ? window as any : undefined as any);
    if (g && typeof g.BroadcastChannel !== "undefined") {
      const bc = new g.BroadcastChannel(CHANNEL);
      const listener = (ev: MessageEvent) => {
        try {
          const data = ev.data as BroadcastPayload | string;
          let payload: BroadcastPayload;
          if (typeof data === "string") {
            try {
              payload = JSON.parse(data);
            } catch (e) {
              return;
            }
          } else {
            payload = data as BroadcastPayload;
          }
          if (localClientId && payload.clientId && payload.clientId === localClientId) return;
          handler(payload.action);
        } catch (e) {
          // ignore handler errors
        }
      };
      bc.addEventListener("message", listener as EventListener);
      return () => {
        bc.removeEventListener("message", listener as EventListener);
        bc.close();
      };
    }
  } catch (e) {
    // fallback to storage event
  }

  const g = typeof globalThis !== "undefined" ? globalThis : (typeof window !== "undefined" ? window as any : undefined as any);
  if (!g || !g.addEventListener) {
    return () => {};
  }

  const storageListener = (ev: StorageEvent) => {
    if (ev.key !== CHANNEL) return;
    if (!ev.newValue) return;
    try {
      const parsed = JSON.parse(ev.newValue) as BroadcastPayload;
      if (!parsed || typeof parsed.action !== "string") return;
      if (localClientId && parsed.clientId && parsed.clientId === localClientId) return;
      handler(parsed.action as AuthMessage);
    } catch (e) {
      // ignore
    }
  };

  g.addEventListener("storage", storageListener as EventListener);
  return () => g.removeEventListener("storage", storageListener as EventListener);
}
