import Link from 'next/link';

export type BadgeVariant =
  | 'free'
  | 'opensource'
  | 'appstore'
  | 'awesome'
  | 'new'
  | 'popular'
  | 'trending';

export interface BadgeProps {
  variant: BadgeVariant;
  href?: string;
  className?: string;
  children: React.ReactNode;
}

const badgeStyles: Record<BadgeVariant, { light: string; dark: string; icon?: React.ReactNode }> = {
  free: {
    light: 'bg-green-100 text-green-800 hover:bg-green-200',
    dark: 'dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800',
  },
  opensource: {
    light: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    dark: 'dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800',
  },
  appstore: {
    light: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
    dark: 'dark:bg-purple-900 dark:text-purple-300 dark:hover:bg-purple-800',
  },
  awesome: {
    light: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    dark: 'dark:bg-yellow-900 dark:text-yellow-300 dark:hover:bg-yellow-800',
  },
  new: {
    light: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
    dark: 'dark:bg-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-800',
  },
  popular: {
    light: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
    dark: 'dark:bg-orange-900 dark:text-orange-300 dark:hover:bg-orange-800',
  },
  trending: {
    light: 'bg-red-100 text-red-800 hover:bg-red-200',
    dark: 'dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800',
  },
};

export function Badge({ variant, href, className = '', children }: BadgeProps) {
  const styles = badgeStyles[variant];
  const baseClasses =
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors';
  const combinedClasses = `${baseClasses} ${styles.light} ${styles.dark} ${href ? 'cursor-pointer' : ''} ${className}`;

  const content = (
    <>
      {variant === 'opensource' && (
        <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
          <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {variant === 'appstore' && (
        <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
      )}
      {variant === 'awesome' && (
        <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      )}
      {variant === 'new' && (
        <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      )}
      {variant === 'popular' && (
        <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      )}
      {children}
    </>
  );

  if (href) {
    return (
      <Link href={href} target="_blank" rel="noopener noreferrer" className={combinedClasses}>
        {content}
      </Link>
    );
  }

  return <span className={combinedClasses}>{content}</span>;
}

// Helper function to render badges for an app
export interface AppBadgesProps {
  isFree?: boolean;
  isOpenSource?: boolean;
  isAppStore?: boolean;
  hasAwesomeList?: boolean;
  ossUrl?: string;
  appStoreUrl?: string;
  awesomeListUrl?: string;
  showNew?: boolean;
  showPopular?: boolean;
  className?: string;
}

export function AppBadges({
  isFree,
  isOpenSource,
  isAppStore,
  hasAwesomeList,
  ossUrl,
  appStoreUrl,
  awesomeListUrl,
  showNew,
  showPopular,
  className = '',
}: AppBadgesProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {showNew && <Badge variant="new">New</Badge>}
      {showPopular && <Badge variant="popular">Popular</Badge>}
      {isFree && <Badge variant="free">Free</Badge>}
      {isOpenSource && (
        <Badge variant="opensource" href={ossUrl}>
          Open Source
        </Badge>
      )}
      {isAppStore && (
        <Badge variant="appstore" href={appStoreUrl}>
          App Store
        </Badge>
      )}
      {hasAwesomeList && (
        <Badge variant="awesome" href={awesomeListUrl}>
          Awesome List
        </Badge>
      )}
    </div>
  );
}
