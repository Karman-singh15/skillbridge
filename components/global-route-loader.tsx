"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { LoadingOverlay } from "./loading-overlay";

export function GlobalRouteLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  // Whenever pathname or searchParams change, the route transition has finished — hide loader
  useEffect(() => {
    setLoading(false);
  }, [pathname, searchParams]);

  // Listen for anchor clicks to detect user-initiated navigations
  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const anchor = target.closest("a");

      if (!anchor) return;

      const href = anchor.getAttribute("href");
      const targetAttr = anchor.getAttribute("target");

      // Only intercept valid internal links (not hash, mailto, tel, external, or new-tab)
      if (
        href &&
        !href.startsWith("#") &&
        !href.startsWith("mailto:") &&
        !href.startsWith("tel:") &&
        targetAttr !== "_blank" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey
      ) {
        try {
          const targetUrl = new URL(href, window.location.href);
          if (targetUrl.origin === window.location.origin) {
            const currentPathAndSearch = window.location.pathname + window.location.search;
            const targetPathAndSearch = targetUrl.pathname + targetUrl.search;
            // Only show loader if actually navigating somewhere new
            if (targetPathAndSearch !== currentPathAndSearch) {
              setLoading(true);
            }
          }
        } catch {
          // Ignore malformed URLs
        }
      }
    };

    document.addEventListener("click", handleAnchorClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleAnchorClick, { capture: true });
    };
  }, []);

  return <LoadingOverlay visible={loading} />;
}
