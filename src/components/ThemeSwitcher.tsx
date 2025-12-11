"use client"

import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { Palette, Check } from "lucide-react"

const themes = [
  // Light Themes
  { id: "light", name: "Light", color: "#f8fafc", category: "Light" },
  { id: "catppuccin-latte", name: "Catppuccin Latte", color: "#eff1f5", category: "Light" },
  { id: "gruvbox-light", name: "Gruvbox Light", color: "#fbf1c7", category: "Light" },
  { id: "solarized-light", name: "Solarized Light", color: "#fdf6e3", category: "Light" },
  { id: "pinky", name: "Pinky 🌸", color: "#ffe4ec", category: "Light" },
  { id: "lavender", name: "Lavender 💜", color: "#e8e0f0", category: "Light" },
  { id: "mint", name: "Mint 🍃", color: "#e0f5f0", category: "Light" },
  { id: "peach", name: "Peach 🍑", color: "#ffe8d6", category: "Light" },
  { id: "arctic", name: "Arctic ❄️", color: "#e8f4f8", category: "Light" },
  { id: "honey", name: "Honey 🍯", color: "#fff3c4", category: "Light" },
  
  // Dark Themes
  { id: "dark", name: "Dark", color: "#0f172a", category: "Dark" },
  { id: "catppuccin-mocha", name: "Catppuccin Mocha", color: "#1e1e2e", category: "Dark" },
  { id: "dracula", name: "Dracula 🧛", color: "#282a36", category: "Dark" },
  { id: "nord", name: "Nord 🌲", color: "#2e3440", category: "Dark" },
  { id: "one-dark", name: "One Dark", color: "#282c34", category: "Dark" },
  { id: "tokyo-night", name: "Tokyo Night 🌃", color: "#1a1b26", category: "Dark" },
  { id: "gruvbox-dark", name: "Gruvbox Dark", color: "#282828", category: "Dark" },
  { id: "solarized-dark", name: "Solarized Dark", color: "#002b36", category: "Dark" },
  { id: "rose-pine", name: "Rosé Pine 🌹", color: "#191724", category: "Dark" },
  { id: "kanagawa", name: "Kanagawa 🌊", color: "#1f1f28", category: "Dark" },
  { id: "ayu-dark", name: "Ayu Dark", color: "#0b0e14", category: "Dark" },
  { id: "palenight", name: "Palenight", color: "#292d3e", category: "Dark" },
  { id: "monokai", name: "Monokai Pro", color: "#2d2a2e", category: "Dark" },
  { id: "everblush", name: "Everblush", color: "#181f21", category: "Dark" },
  { id: "pinky-dark", name: "Pinky Dark 🌸", color: "#2a1520", category: "Dark" },
  { id: "midnight", name: "Midnight 🌙", color: "#0f1729", category: "Dark" },
  { id: "cherry", name: "Cherry 🍒", color: "#1f0f14", category: "Dark" },
  
  // Special Themes
  { id: "cyberpunk", name: "Cyberpunk 💜", color: "#0d0221", category: "Special" },
  { id: "sunset", name: "Sunset 🌅", color: "#1a1310", category: "Special" },
  { id: "ocean", name: "Ocean 🌊", color: "#0a1929", category: "Special" },
  { id: "forest", name: "Forest 🌲", color: "#0f1a14", category: "Special" },
]

const categories = ["Light", "Dark", "Special"]

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button className="p-2 rounded-lg bg-card border border-border">
        <Palette size={18} />
      </button>
    )
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors flex items-center gap-2"
        title="Change Theme"
      >
        <Palette size={18} />
      </button>

      {open && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full mt-2 right-0 z-50 bg-card border border-border rounded-lg shadow-xl overflow-hidden w-72">
            <div className="text-xs font-medium text-muted-foreground px-3 py-2 border-b border-border bg-muted/50">
              🎨 Select Theme ({themes.length} themes)
            </div>
            <div className="max-h-[400px] overflow-y-auto p-2">
              {categories.map(category => (
                <div key={category} className="mb-3">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1 sticky top-0 bg-card/95 backdrop-blur">
                    {category} ({themes.filter(t => t.category === category).length})
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {themes.filter(t => t.category === category).map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setTheme(t.id)
                          setOpen(false)
                        }}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                          theme === t.id 
                            ? "bg-primary/20 text-foreground ring-1 ring-primary" 
                            : "hover:bg-muted text-foreground/80"
                        }`}
                      >
                        <div 
                          className="w-3 h-3 rounded-full border border-border flex-shrink-0"
                          style={{ background: t.color }}
                        />
                        <span className="truncate text-[11px]">{t.name}</span>
                        {theme === t.id && <Check size={10} className="text-primary ml-auto flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
