import "./globals.css";
import Sidebar from "./components/Sidebar";

export const metadata = {
  title: "CheckrideAI",
  description: "Ace your Checkride",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex h-screen bg-gray-100 text-gray-900 font-sans tracking-wide">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}