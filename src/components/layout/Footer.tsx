'use client';

import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations();

  return (
    <footer className="border-t border-gray-200 bg-white px-4 py-8 dark:border-gray-800 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('footer.dataSourcedFrom')}{' '}
            <a
              href="https://github.com/jaywcjlove/awesome-mac"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              awesome-mac
            </a>{' '}
            {t('footer.byAuthor')} jaywcjlove
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('footer.builtWith')}</p>
        </div>
      </div>
    </footer>
  );
}
