import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CommitGuard Dashboard",
  description: "Commit analysis and risk detection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
