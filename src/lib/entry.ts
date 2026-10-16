// Pure routing rules for where a visitor lands after the splash / sign-in.
export type EntryRoute = "/home" | "/profile-setup" | "/auth" | "/onboarding";

export function resolveEntry(opts: {
  hasSession: boolean;
  profileCompleted: boolean;
  onboardingSeen: boolean;
}): EntryRoute {
  if (opts.hasSession) return opts.profileCompleted ? "/home" : "/profile-setup";
  return opts.onboardingSeen ? "/auth" : "/onboarding";
}

export function checkPassword(pw: string) {
  const length = pw.length >= 8;
  const numberAndSymbol = /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw);
  return { length, numberAndSymbol, valid: length && numberAndSymbol };
}

const ONBOARDING_KEY = "fh_onboarding_seen";
export const onboarding = {
  seen: () => typeof window !== "undefined" && localStorage.getItem(ONBOARDING_KEY) === "1",
  markSeen: () => localStorage.setItem(ONBOARDING_KEY, "1"),
};

// "Remember me" off => session ends when the browser is closed.
const EPHEMERAL_KEY = "fh_ephemeral";
const TAB_KEY = "fh_tab_alive";
export const rememberMe = {
  set(remember: boolean) {
    if (remember) localStorage.removeItem(EPHEMERAL_KEY);
    else localStorage.setItem(EPHEMERAL_KEY, "1");
    sessionStorage.setItem(TAB_KEY, "1");
  },
  /** True when a non-remembered session survived a browser restart and must be dropped. */
  shouldDrop() {
    const drop = localStorage.getItem(EPHEMERAL_KEY) === "1" && !sessionStorage.getItem(TAB_KEY);
    sessionStorage.setItem(TAB_KEY, "1");
    if (drop) localStorage.removeItem(EPHEMERAL_KEY);
    return drop;
  },
};
