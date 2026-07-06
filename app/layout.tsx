import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Session Cue",
  description: "A private language-pattern cueing tool for therapy sessions."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
