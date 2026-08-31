export interface ThemePalette {
  id: string;
  name: string;
  colors: [string, string]; // 2 preview colors for swatches
}

export const THEME_PALETTES: Record<string, ThemePalette[]> = {
  default: [
    { id: 'classic', name: 'Classic Gold & Cyan', colors: ['#f59e0b', '#00e5ff'] },
    { id: 'emerald', name: 'Titanium Emerald', colors: ['#10b981', '#fbbf24'] },
    { id: 'crimson', name: 'Obsidian Crimson', colors: ['#f43f5e', '#38bdf8'] },
    { id: 'bronze', name: 'Carbon Bronze', colors: ['#d97706', '#94a3b8'] }
  ],
  cyberpunk: [
    { id: 'yellow-pink', name: 'Night City 2077', colors: ['#fcee09', '#ff003c'] },
    { id: 'netrunner', name: 'Netrunner Acid', colors: ['#39ff14', '#00f0ff'] },
    { id: 'synthwave', name: 'Synthwave Outrun', colors: ['#ff007f', '#a855f7'] },
    { id: 'arasaka', name: 'Arasaka Blood', colors: ['#ff1122', '#ffffff'] }
  ],
  brutalist: [
    { id: 'shibuya', name: 'Shibuya Street', colors: ['#ff5500', '#a6ff00'] },
    { id: 'tokyo-cyan', name: 'Tokyo Underground', colors: ['#00e5ff', '#ff0066'] },
    { id: 'graffiti', name: 'Golden Tag', colors: ['#ffe600', '#0055ff'] },
    { id: 'poison-jam', name: 'Poison Jam', colors: ['#9900ff', '#00ff99'] }
  ],
  liquid: [
    { id: 'aurora', name: 'Aurora Borealis', colors: ['#ff4b91', '#00f0ff'] },
    { id: 'ocean-deep', name: 'Ocean Abyss', colors: ['#00b4d8', '#52b788'] },
    { id: 'sunset-magma', name: 'Sunset Magma', colors: ['#ff6b35', '#f72585'] },
    { id: 'plasma', name: 'Hyper Plasma', colors: ['#b5179e', '#4cc9f0'] }
  ],
  glassmorphism: [
    { id: 'crystal-ice', name: 'Arctic Crystal', colors: ['#38bdf8', '#e0e7ff'] },
    { id: 'emerald-frost', name: 'Beryl Frost', colors: ['#34d399', '#a7f3d0'] },
    { id: 'amethyst', name: 'Amethyst Quartz', colors: ['#c084fc', '#f472b6'] },
    { id: 'smoked-amber', name: 'Smoked Topaz', colors: ['#fbbf24', '#f97316'] }
  ],
  neumorphism: [
    { id: 'slate-cyan', name: 'Slate Laser', colors: ['#38bdf8', '#111827'] },
    { id: 'warm-clay', name: 'Warm Terracotta', colors: ['#f97316', '#2e140a'] },
    { id: 'forest-mint', name: 'Matte Forest', colors: ['#10b981', '#092416'] },
    { id: 'rose-shadow', name: 'Obsidian Rose', colors: ['#f43f5e', '#2c0b19'] }
  ]
};
