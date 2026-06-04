import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";
import { GlobalRouteLoader } from "@/components/global-route-loader";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "SkillBridge",
  description: "Attendance management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <Suspense fallback={null}>
            <GlobalRouteLoader />
          </Suspense>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}