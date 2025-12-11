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
            // Light
            "light", "catppuccin-latte", "gruvbox-light", "solarized-light",
            "pinky", "lavender", "mint", "peach", "arctic", "honey",
            // Dark
            "dark", "catppuccin-mocha", "dracula", "nord", "one-dark",
            "tokyo-night", "gruvbox-dark", "solarized-dark", "rose-pine",
            "kanagawa", "ayu-dark", "palenight", "monokai", "everblush",
            "pinky-dark", "midnight", "cherry",
            // Special
            "cyberpunk", "sunset", "ocean", "forest"
          ]}
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
