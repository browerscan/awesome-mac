// App constants

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://awesome-mac.com';

export const REVALIDATE_TIME = 3600; // 1 hour in seconds

export const SEARCH_DEFAULT_LIMIT = 20;
export const SEARCH_MAX_LIMIT = 25;
export const SEARCH_MIN_LIMIT = 1;

export const APP_INITIAL_LIMIT = 12;
export const CATEGORY_INITIAL_LIMIT = 12;

export const HOME_FEATURED_APPS_LIMIT = 8;

export const BADGE_STYLES = {
  free: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  openSource: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  appStore: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  awesomeList: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
} as const;

export const BADGE_HOVER_STYLES = {
  free: '',
  openSource: 'hover:bg-blue-200 dark:hover:bg-blue-800',
  appStore: 'hover:bg-purple-200 dark:hover:bg-purple-800',
  awesomeList: 'hover:bg-yellow-200 dark:hover:bg-yellow-800',
} as const;

export const SVG_ICONS = {
  arrowRight: 'M9 5l7 7-7 7',
  menu: 'M4 6h16M4 12h16M4 18h16',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  github:
    'M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z',
  grid: 'M4 6h16M4 10h16M4 14h16M4 18h16',
  folder: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
  externalLink: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
} as const;

export const ERROR_MESSAGES = {
  DATA_FILE_MISSING: 'Missing data file. Run `npm run build:data` first.',
  APP_NOT_FOUND: 'App not found',
  CATEGORY_NOT_FOUND: 'Category not found',
  INVALID_QUERY: 'Invalid search query',
} as const;
