"use client";

import { useEffect, useState, startTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { LoadingOverlay } from "./loading-overlay";

export function GlobalRouteLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  // Whenever pathname or searchParams change, the route transition has finished
  useEffect(() => {
    setLoading(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const anchor = target.closest("a");

      if (anchor) {
        const href = anchor.getAttribute("href");
        const targetAttr = anchor.getAttribute("target");

        // Check if it's a valid internal route transition
        if (
          href &&
          !href.startsWith("#") &&
          !href.startsWith("mailto:") &&
          !href.startsWith("tel:") &&
          targetAttr !== "_blank" &&
          !event.metaKey &&
          !event.ctrlKey
        ) {
          const currentUrl = window.location.pathname + window.location.search;
          const targetUrl = new URL(href, window.location.href);

          if (targetUrl.origin === window.location.origin) {
            const targetPathAndSearch = targetUrl.pathname + targetUrl.search;
            // Only trigger loading if we are navigating to a new URL
            if (targetPathAndSearch !== currentUrl) {
              setLoading(true);
            }
          }
        }
      }
    };

    document.addEventListener("click", handleAnchorClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleAnchorClick, { capture: true });
    };
  }, []);

  // Intercept programmatic navigation (e.g. router.push, router.replace)
  useEffect(() => {
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      setLoading(true);
      return originalPushState.apply(this, args);
    };

    window.history.replaceState = function (...args) {
      setLoading(true);
      return originalReplaceState.apply(this, args);
    };

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  return <LoadingOverlay visible={loading} />;
}
