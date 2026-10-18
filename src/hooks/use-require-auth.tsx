import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useAuth } from "./use-auth";
import { isPublicPath, setReturnTo } from "@/lib/guest";
import { SignInPrompt } from "@/components/fh/SignInPrompt";

type RequireAuthContext = {
  requireAuth: (action?: () => void) => boolean;
};

const Context = createContext<RequireAuthContext | null>(null);

export function SignInPromptProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const requireAuth = (action?: () => void) => {
    if (/^\/(auth|onboarding|reset-password|admin)(\/|$)/.test(pathname)) {
      return false;
    }
    if (user) {
      action?.();
      return true;
    }
    if (isPublicPath(pathname)) {
      setReturnTo(pathname);
    }
    setOpen(true);
    return false;
  };

  return (
    <Context.Provider value={{ requireAuth }}>
      {children}
      <SignInPrompt open={open} onOpenChange={setOpen} />
    </Context.Provider>
  );
}

export function useRequireAuth() {
  const context = useContext(Context);
  if (!context) throw new Error("useRequireAuth must be used inside SignInPromptProvider");
  return context.requireAuth;
}
