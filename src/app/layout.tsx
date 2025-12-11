import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "driver.js/dist/driver.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Minimax Simulator",
  description: "Interactive Minimax and Alpha-Beta Pruning Simulator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          themes={[
            "light", "dark", 
            "catppuccin-latte", "catppuccin-mocha", 
            "cyberpunk", "nord", "dracula", 
            "sunset", "ocean", "forest",
            "everblush", "gruvbox-dark", "gruvbox-light",
            "tokyo-night", "one-dark", 
            "solarized-dark", "solarized-light",
            "rose-pine", "kanagawa", "ayu-dark",
            "palenight", "monokai"
          ]}
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
