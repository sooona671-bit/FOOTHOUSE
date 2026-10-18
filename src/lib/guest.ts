const RETURN_TO_KEY = "fh_return_to";

export function isPublicPath(pathname: string) {
  return pathname === "/home" || pathname === "/search" || pathname.startsWith("/product/") || pathname.startsWith("/info/");
}

export function setReturnTo(path: string) {
  if (typeof window !== "undefined" && path && path !== "/auth" && path !== "/") {
    window.sessionStorage.setItem(RETURN_TO_KEY, path);
  }
}

export function consumeReturnTo() {
  if (typeof window === "undefined") return null;
  const path = window.sessionStorage.getItem(RETURN_TO_KEY);
  window.sessionStorage.removeItem(RETURN_TO_KEY);
  return path || null;
}
