import "./globals.css";
import { Inter } from "next/font/google";
import Sidebar from "./components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "CheckrideAI",
  description: "Ace your Checkride",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex h-screen bg-slate-50 text-slate-900`}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}