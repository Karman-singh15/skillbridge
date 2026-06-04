import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/invite(.*)",
]);

const defaultMiddleware = clerkMiddleware(async (auth, req) => {
  // Only enforce login on non-public routes
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export default async function middleware(req: any, event: any) {
  // Bypass Clerk middleware entirely in development/testing if bypass header is present
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    if (req.headers.get("x-bypass-user-id")) {
      return; // Proceed to the route handler without Clerk interception
    }
  }

  return defaultMiddleware(req, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
