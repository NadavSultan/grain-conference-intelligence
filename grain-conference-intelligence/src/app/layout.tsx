import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { AppShell } from "@/components/app-shell";
import { IntegrationStatusProvider } from "@/hooks/use-integration-status";
import { WorkspaceProvider } from "@/workspace/provider";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Grain Conference Intelligence",
  description: "Operational workspace for Grain sales conference planning, prep, capture, and follow-up.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <WorkspaceProvider>
          <IntegrationStatusProvider>
            <AppShell>{children}</AppShell>
          </IntegrationStatusProvider>
        </WorkspaceProvider>
      </body>
    </html>
  );
}
