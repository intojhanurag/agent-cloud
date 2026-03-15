import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agent Cloud - AI-Powered Cloud Deployment CLI",
  description:
    "Deploy to AWS, GCP, or Azure with a single command. AI agents analyze your project, generate deployment plans, and execute them with human-in-the-loop approval.",
  keywords: ["cloud deployment", "CLI", "AWS", "GCP", "Azure", "AI", "DevOps", "Mastra"],
  openGraph: {
    title: "Agent Cloud - AI-Powered Cloud Deployment CLI",
    description: "Deploy to AWS, GCP, or Azure with a single command.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
      >
        {children}
      </body>
    </html>
  );
}
