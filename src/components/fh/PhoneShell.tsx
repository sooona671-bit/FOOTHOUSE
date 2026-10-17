import type { ReactNode } from "react";

/**
 * Full-screen on phones; a centred device frame on tablets/desktop so the
 * mobile-first design keeps its proportions.
 */
export function PhoneShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full items-start justify-center bg-background lg:items-start lg:bg-background lg:py-0">
      {/* Keep translucent status-bar text readable over the white phone UI. */}
      {/* Delete this overlay and change status-bar-style to "default" to restore the old white-bar look. */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 h-[env(safe-area-inset-top)] bg-gradient-to-b from-black/50 to-transparent lg:hidden" />
      <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-background lg:mx-auto lg:max-w-[1280px] lg:px-8">
        <div id="fh-scroll" className="hide-scrollbar relative flex flex-1 flex-col overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
