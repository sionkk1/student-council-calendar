'use client';

import { X } from 'lucide-react';

interface CategoryFilterProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}

// 기존 단일 선택 필터 (호환성 유지)
export default function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 min-h-[40px] ${selected === category
              ? 'bg-primary text-primary-foreground shadow-md scale-105'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

// 다중 선택 필터
interface MultiSelectFilterProps {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
  onClear: () => void;
}

export function MultiSelectFilter({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: MultiSelectFilterProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground/80">{label}</span>
        {selected.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <X size={12} />
            초기화
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onToggle(option)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${selected.includes(option)
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
              }`}
          >
            {option}
          </button>
        ))}
      </div>
      {selected.length === 0 && (
        <p className="text-xs text-muted-foreground/60">선택 안 함 = 전체 표시</p>
      )}
    </div>
  );
}
