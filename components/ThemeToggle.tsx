'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 마운트 전에는 빈 버튼 렌더링 (SSR 에러 방지)
  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full bg-muted/50" />
    );
  }

  return <ThemeToggleClient />;
}

function ThemeToggleClient() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative w-10 h-10 rounded-full glass hover:bg-white/20 transition-colors flex items-center justify-center overflow-hidden group"
      aria-label="테마 변경"
    >
      <div className="relative w-5 h-5">
        <Sun
          size={20}
          className={`absolute inset-0 text-amber-400 transition-all duration-500 ease-in-out ${isDark ? 'rotate-90 opacity-0 scale-0' : 'rotate-0 opacity-100 scale-100'
            }`}
        />
        <Moon
          size={20}
          className={`absolute inset-0 text-blue-400 transition-all duration-500 ease-in-out ${isDark ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-0'
            }`}
        />
      </div>
    </button>
  );
}
