import type { ReactNode } from "react";

/**
 * Full-screen on phones; a centred device frame on tablets/desktop so the
 * mobile-first design keeps its proportions.
 */
export function PhoneShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full items-start justify-center bg-stage md:items-center md:py-6">
      <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-background md:h-[min(880px,calc(100dvh-3rem))] md:max-w-[412px] md:rounded-[48px] md:border-[10px] md:border-stage md:shadow-2xl md:ring-1 md:ring-stage-foreground/10">
        <div id="fh-scroll" className="hide-scrollbar relative flex flex-1 flex-col overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
