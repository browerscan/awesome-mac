'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getFallbackIcon, getGradientColor, getAppIconUrl } from '@/lib/app-icon';
import { App } from '@/types';

interface AppIconProps {
  app: Pick<App, 'name' | 'url' | 'isOpenSource' | 'ossUrl' | 'appStoreUrl'>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  priority?: boolean;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-12 w-12 text-xl',
  lg: 'h-16 w-16 text-2xl',
  xl: 'h-24 w-24 text-4xl',
};

export function AppIcon({ app, size = 'md', className = '', priority = false }: AppIconProps) {
  const [iconUrl, setIconUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const gradientColor = getGradientColor(app.name);
  const fallbackChar = getFallbackIcon(app.name);

  useEffect(() => {
    let mounted = true;

    async function loadIcon() {
      try {
        const url = await getAppIconUrl(app);
        if (mounted && url) {
          setIconUrl(url);
        }
      } catch {
        // Silently fail and use fallback
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadIcon();

    return () => {
      mounted = false;
    };
  }, [app]);

  const handleImageError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const sizeClass = sizeClasses[size];

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-gradient-to-br ${gradientColor} ${sizeClass} ${className} animate-pulse`}
        aria-hidden="true"
      />
    );
  }

  if (hasError || !iconUrl) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-gradient-to-br ${gradientColor} text-white font-semibold ${sizeClass} ${className}`}
        title={app.name}
      >
        {fallbackChar}
      </div>
    );
  }

  return (
    <div className={`relative ${sizeClass} ${className}`}>
      <Image
        src={iconUrl}
        alt={`${app.name} icon`}
        fill
        className="rounded-lg object-cover"
        onError={handleImageError}
        onLoad={handleImageLoad}
        priority={priority}
        sizes="(max-width: 640px) 64px, (max-width: 1024px) 96px, 128px"
      />
    </div>
  );
}

// Simplified version for static rendering (no client-side fetching)
interface StaticAppIconProps {
  app: Pick<App, 'name' | 'url' | 'isOpenSource' | 'ossUrl' | 'appStoreUrl'>;
  iconUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function StaticAppIcon({ app, iconUrl, size = 'md', className = '' }: StaticAppIconProps) {
  const gradientColor = getGradientColor(app.name);
  const fallbackChar = getFallbackIcon(app.name);
  const sizeClass = sizeClasses[size];

  if (!iconUrl) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-gradient-to-br ${gradientColor} text-white font-semibold ${sizeClass} ${className}`}
        title={app.name}
      >
        {fallbackChar}
      </div>
    );
  }

  return (
    <div className={`relative ${sizeClass} ${className}`}>
      <Image
        src={iconUrl}
        alt={`${app.name} icon`}
        fill
        className="rounded-lg object-cover"
        sizes="(max-width: 640px) 64px, (max-width: 1024px) 96px, 128px"
      />
    </div>
  );
}
