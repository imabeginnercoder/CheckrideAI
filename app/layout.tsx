import "./globals.css";
import AuthProvider from "./components/AuthProvider";
import Sidebar from "./components/Sidebar";

export const metadata = {
  title: "CheckrideAI",
  description: "Ace your Checkride",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex h-screen bg-slate-50 text-slate-900">
        <AuthProvider>
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
