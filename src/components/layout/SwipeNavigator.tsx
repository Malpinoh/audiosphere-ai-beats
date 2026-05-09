import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { hapticLight } from "@/lib/native";

/**
 * Native-style horizontal swipe navigation between the four bottom-nav tabs.
 * Mounted once at the app root. No-op on desktop (>= lg) and ignored when
 * the gesture starts inside a horizontally-scrollable element (carousels,
 * sliders, modals, drawers, the bottom sheet, etc.).
 */
export function SwipeNavigator() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const startX = useRef(0);
  const startY = useRef(0);
  const startT = useRef(0);
  const tracking = useRef(false);

  // Order matches MobileBottomNav.
  const tabs = ["/", "/browse", "/library", user ? "/account-settings" : "/auth"];

  useEffect(() => {
    const SWIPE_DIST = 70;       // px horizontal travel
    const MAX_OFF_AXIS = 50;     // px vertical drift allowed
    const MAX_TIME = 600;        // ms — must be a flick, not a drag
    const EDGE_IGNORE = 20;      // px from screen edge (system back gesture)

    const findScrollableX = (el: EventTarget | null): boolean => {
      let n = el as HTMLElement | null;
      while (n && n !== document.body) {
        const s = window.getComputedStyle(n);
        if ((s.overflowX === "auto" || s.overflowX === "scroll") && n.scrollWidth > n.clientWidth) return true;
        // Skip swipe inside drawers/dialogs/sheets/modals + custom sliders.
        if (n.dataset && (n.dataset.noSwipe === "true" || n.getAttribute("role") === "dialog")) return true;
        if (n.closest && n.closest('[data-no-swipe="true"], [role="dialog"], [role="slider"], input[type="range"]')) return true;
        n = n.parentElement;
      }
      return false;
    };

    const onStart = (e: TouchEvent) => {
      if (window.innerWidth >= 1024) return;
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      if (t.clientX < EDGE_IGNORE || t.clientX > window.innerWidth - EDGE_IGNORE) return;
      if (findScrollableX(e.target)) return;
      startX.current = t.clientX;
      startY.current = t.clientY;
      startT.current = Date.now();
      tracking.current = true;
    };

    const onEnd = (e: TouchEvent) => {
      if (!tracking.current) return;
      tracking.current = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX.current;
      const dy = t.clientY - startY.current;
      const dt = Date.now() - startT.current;
      if (dt > MAX_TIME) return;
      if (Math.abs(dy) > MAX_OFF_AXIS) return;
      if (Math.abs(dx) < SWIPE_DIST) return;

      const idx = tabs.findIndex((p) => p === "/" ? location.pathname === "/" : location.pathname.startsWith(p));
      if (idx === -1) return;
      const nextIdx = dx < 0 ? idx + 1 : idx - 1;
      if (nextIdx < 0 || nextIdx >= tabs.length) return;
      hapticLight();
      navigate(tabs[nextIdx]);
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, [navigate, location.pathname, user]);

  return null;
}