import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// After a new publish, old chunk files disappear; reload once to fetch the fresh version.
if (typeof window !== "undefined") {
  const KEY = "chunk-reload-at";
  const recover = () => {
    const last = Number(sessionStorage.getItem(KEY) || 0);
    if (Date.now() - last < 10000) return;
    sessionStorage.setItem(KEY, String(Date.now()));
    window.location.reload();
  };
  window.addEventListener("vite:preloadError", (e) => { e.preventDefault(); recover(); });
  window.addEventListener("unhandledrejection", (e) => {
    const msg = String((e.reason as Error)?.message ?? e.reason ?? "");
    if (/Failed to fetch dynamically imported module|Importing a module script failed/i.test(msg)) recover();
  });
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
