import "./globals.css";
import AuthProvider from "./components/AuthProvider";

export const metadata = {
  title: "CheckrideAI",
  description: "PPL prep designed for student pilots preparing for the oral and written checkride.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
