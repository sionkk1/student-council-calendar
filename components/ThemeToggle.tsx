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
      <button className="p-2 rounded-full" aria-label="테마 변경">
        <Moon size={20} className="text-gray-600" />
      </button>
    );
  }

  return <ThemeToggleClient />;
}

function ThemeToggleClient() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="테마 변경"
    >
      {resolvedTheme === 'dark' ? (
        <Sun size={20} className="text-yellow-400" />
      ) : (
        <Moon size={20} className="text-gray-600" />
      )}
    </button>
  );
}
