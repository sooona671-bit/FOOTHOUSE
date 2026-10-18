import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AUTOPLAY_MS, DEFAULT_BANNER, bannerImage, resolveLink, type HomeBanner } from "@/lib/banner";
import { Icon } from "./primitives";

const overlayClasses = {
  light: {
    none: "",
    soft: "bg-[linear-gradient(to_top,rgba(0,0,0,.45),rgba(0,0,0,.15)_35%,transparent_55%)]",
    strong: "bg-gradient-to-t from-black/70 to-transparent",
  },
  dark: {
    none: "",
    soft: "bg-[linear-gradient(to_top,rgba(255,255,255,.7),rgba(255,255,255,.2)_35%,transparent_55%)]",
    strong: "bg-gradient-to-t from-white/70 to-transparent",
  },
} as const;

function BannerLink({ target, className, children }: { target: ReturnType<typeof resolveLink>; className?: string; children: ReactNode }) {
  if (target.to === "/product/$id") return <Link to={target.to} params={target.params} className={className}>{children}</Link>;
  return <Link to={target.to} className={className}>{children}</Link>;
}

export function HeroSlide({ banner, index, total, priority = false, imageUrl, mode = "responsive" }: { banner: HomeBanner; index: number; total: number; priority?: boolean; imageUrl?: string; mode?: "responsive" | "phone" | "laptop" }) {
  const color = banner.text_color === "dark" ? "dark" : "light";
  const align = banner.text_align === "center" ? "items-center text-center" : "items-start text-left";
  const target = resolveLink(banner.button_link);
  const content = (
    <div className={`absolute inset-x-0 bottom-0 z-20 flex flex-col p-5 pb-10 lg:p-12 lg:pb-12 ${align} ${banner.text_align === "left" ? "lg:pl-12" : ""}`}>
      <div className="flex max-w-[75%] flex-col lg:max-w-[520px]">
        {banner.eyebrow && <span className="text-[10px] font-bold uppercase tracking-widest lg:text-xs">{banner.eyebrow}</span>}
        {banner.title && <h2 className="line-clamp-2 text-2xl font-extrabold leading-tight lg:text-5xl">{banner.title}</h2>}
        {banner.subtitle && <p className="line-clamp-2 text-sm opacity-90 lg:text-lg">{banner.subtitle}</p>}
        {banner.button_text && <BannerLink target={target} className={`relative z-20 mt-4 inline-flex w-fit items-center gap-1.5 rounded-full px-4 py-2 text-label-md ${color === "dark" ? "bg-black text-white" : "bg-white text-black"}`}>
          {banner.button_text}<Icon name="arrow_forward" className="text-[16px]" />
        </BannerLink>}
      </div>
    </div>
  );
  const slide = (
    <div className={`relative min-h-[190px] w-full shrink-0 snap-center select-none overflow-hidden rounded-3xl ${mode === "phone" ? "aspect-[16/9]" : mode === "laptop" ? "h-[340px] xl:h-[360px]" : "aspect-[16/9] lg:h-[340px] lg:aspect-auto xl:h-[360px]"} ${color === "dark" ? "text-black" : "text-white"}`} aria-label={`${index + 1} of ${total}`}>
      <img src={imageUrl ?? bannerImage(banner)} alt={banner.title || "FOOT HOUSE banner"} width={1920} height={1080} decoding="async" draggable={false} fetchPriority={priority ? "high" : "auto"} loading={priority ? "eager" : "lazy"} className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
      {banner.overlay !== "none" && <div className={`pointer-events-none absolute inset-0 ${overlayClasses[color][banner.overlay]}`} />}
      {banner.text_align === "center" && banner.overlay !== "none" && <div className="pointer-events-none absolute inset-0" />}
      {banner.button_text ? content : <BannerLink target={target} className="absolute inset-0 z-20">{content}</BannerLink>}
    </div>
  );
  return <div role="group" aria-roledescription="slide" className="contents">{slide}</div>;
}

export function HeroCarousel({ banners }: { banners: HomeBanner[] }) {
  const slides = banners.length ? banners : [DEFAULT_BANNER];
  const scroller = useRef<HTMLDivElement>(null);
  const carousel = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number | null>(null);
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [visible, setVisible] = useState(true);
  const [settling, setSettling] = useState(false);
  const [dotCycle, setDotCycle] = useState(0);
  const [reduced, setReduced] = useState(false);
  const scrollFrame = useRef<number | null>(null);
  const paused = hovered || focused || hidden || !visible || settling;

  const markSettling = () => {
    setSettling(true);
    if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => setSettling(false), 250);
  };

  const goTo = (index: number, behavior: ScrollBehavior = "smooth", manual = true) => {
    const el = scroller.current;
    if (!el) return;
    const next = (index + slides.length) % slides.length;
    el.scrollTo({ left: next * el.clientWidth, behavior });
    setActive(next);
    markSettling();
    setDotCycle((cycle) => cycle + 1);
    if (!manual) setSettling(true);
  };

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (slides.length < 2 || paused || reduced) return;
    const timer = window.setInterval(() => goTo(active + 1, "smooth", false), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [active, paused, reduced, slides.length]);

  useEffect(() => {
    const root = carousel.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.1 });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <div ref={carousel} className="group relative -mb-2" role="region" aria-roledescription="carousel" aria-label="Featured banners" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <style>{"@keyframes banner-dot-fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}"}</style>
      <div
        ref={scroller}
        tabIndex={0}
        className="hide-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain focus:outline-none"
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        onKeyDown={(event) => { if (event.key === "ArrowRight") { event.preventDefault(); goTo(active + 1); } if (event.key === "ArrowLeft") { event.preventDefault(); goTo(active - 1); } }}
        onScroll={() => { markSettling(); if (scrollFrame.current !== null) return; scrollFrame.current = requestAnimationFrame(() => { scrollFrame.current = null; const el = scroller.current; if (el) setActive(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))); }); }}
        onTouchStart={markSettling}
        onTouchEnd={markSettling}
      >
        {slides.map((banner, index) => <HeroSlide key={banner.id} banner={banner} index={index} total={slides.length} priority={index === 0 || index === (active + 1) % slides.length} />)}
      </div>
      {slides.length > 1 && <>
        <button type="button" aria-label="Previous banner" onClick={() => goTo(active - 1)} className="absolute bottom-4 right-16 z-30 hidden h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black shadow lg:flex"><Icon name="chevron_left" /></button>
        <button type="button" aria-label="Next banner" onClick={() => goTo(active + 1)} className="absolute bottom-4 right-4 z-30 hidden h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black shadow lg:flex"><Icon name="chevron_right" /></button>
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 gap-1.5">
          {slides.map((banner, index) => <button key={banner.id} type="button" aria-label={`Go to banner ${index + 1}`} onClick={() => goTo(index)} className={`pointer-events-auto relative h-1.5 overflow-hidden rounded-full ${index === active ? "w-6 bg-white/40" : "w-2 bg-white/60"}`}><span key={`${banner.id}-${index === active ? dotCycle : "idle"}`} style={index === active && !reduced ? { animationDuration: `${AUTOPLAY_MS}ms` } : undefined} className={index === active && !reduced ? "block h-full origin-left animate-[banner-dot-fill_linear_forwards] rounded-full bg-white" : "block h-full w-full rounded-full bg-white/60"} /></button>)}
        </div>
        <img src={bannerImage(slides[(active + 1) % slides.length])} alt="" aria-hidden="true" width={1920} height={800} loading="eager" decoding="async" className="hidden" />
      </>}
    </div>
  );
}
