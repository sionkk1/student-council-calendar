export const CATEGORIES = ['회의', '행사', '공지', '학교', '기타'] as const;

export const DEPARTMENTS = [
  '회장단',
  '총괄기획실',
  '문화체육부',
  '창의진로부',
  '미디어소통부',
  '환경복지부',
  '생활지도부',
] as const;

export const EVENT_COLORS = [
  { name: '파랑', value: '#3b82f6' },
  { name: '빨강', value: '#ef4444' },
  { name: '초록', value: '#22c55e' },
  { name: '노랑', value: '#eab308' },
  { name: '보라', value: '#a855f7' },
] as const;

export const DEFAULT_EVENT_COLOR = EVENT_COLORS[0].value;

export const CATEGORY_COLOR_CLASSES: Record<string, string> = {
  '회의': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  '행사': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  '공지': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  '학교': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  '기타': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};
