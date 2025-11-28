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
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors min-h-[40px] ${
            selected === category
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
        {selected.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors min-h-[36px] ${
              selected.includes(option)
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      {selected.length === 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500">선택 안 함 = 전체 표시</p>
      )}
    </div>
  );
}
