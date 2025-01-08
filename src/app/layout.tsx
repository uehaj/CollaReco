import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";
import { SuspenseWithoutSsr } from "./_components/SuspenseWithoutSsr";
export const metadata: Metadata = {
  title: "CollaReco",
  description: "Colaborative Speech Recognition",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body>
        <SuspenseWithoutSsr fallback={<div>Loading...</div>}>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </SuspenseWithoutSsr>
      </body>
    </html>
  );
}
