import { ImageResponse } from 'next/og';
import { getAppBySlug } from '@/lib/data';
import { siteConfig } from '@/lib/seo';

export const runtime = 'nodejs';
export const alt = 'App Details';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
  const app = await getAppBySlug(params.slug);
  const hostname = siteConfig.url.replace(/^https?:\/\//, '');

  if (!app) {
    return new ImageResponse(
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          fontSize: 48,
          color: 'white',
        }}
      >
        App Not Found
      </div>,
      { ...size }
    );
  }

  const badges: { label: string; color: string; bg: string }[] = [];
  if (app.isFree) {
    badges.push({
      label: 'Free',
      color: '#4ade80',
      bg: 'rgba(34, 197, 94, 0.2)',
    });
  }
  if (app.isOpenSource) {
    badges.push({
      label: 'Open Source',
      color: '#60a5fa',
      bg: 'rgba(59, 130, 246, 0.2)',
    });
  }
  if (app.isAppStore) {
    badges.push({
      label: 'App Store',
      color: '#c084fc',
      bg: 'rgba(168, 85, 247, 0.2)',
    });
  }

  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        backgroundImage:
          'radial-gradient(circle at 25% 25%, #1e3a5f 0%, transparent 50%), radial-gradient(circle at 75% 75%, #1e3a5f 0%, transparent 50%)',
        padding: 60,
      }}
    >
      {/* App Icon Placeholder */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 140,
          height: 140,
          borderRadius: 28,
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          marginBottom: 32,
          fontSize: 72,
          fontWeight: 700,
          color: 'white',
        }}
      >
        {app.name.charAt(0).toUpperCase()}
      </div>

      {/* App Name */}
      <div
        style={{
          display: 'flex',
          fontSize: 56,
          fontWeight: 700,
          color: 'white',
          marginBottom: 16,
          textAlign: 'center',
        }}
      >
        {app.name}
      </div>

      {/* Category */}
      <div
        style={{
          display: 'flex',
          fontSize: 24,
          color: '#94a3b8',
          marginBottom: 24,
        }}
      >
        {app.parentCategoryName ? `${app.parentCategoryName} / ` : ''}
        {app.categoryName}
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 16,
          }}
        >
          {badges.map((badge) => (
            <div
              key={badge.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 20px',
                borderRadius: 9999,
                background: badge.bg,
                color: badge.color,
                fontSize: 18,
              }}
            >
              {badge.label}
            </div>
          ))}
        </div>
      )}

      {/* Description */}
      {app.description && (
        <div
          style={{
            display: 'flex',
            fontSize: 20,
            color: '#64748b',
            textAlign: 'center',
            maxWidth: 800,
            marginTop: 32,
            lineHeight: 1.5,
          }}
        >
          {app.description.length > 150 ? app.description.slice(0, 147) + '...' : app.description}
        </div>
      )}

      {/* URL */}
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          bottom: 40,
          fontSize: 18,
          color: '#64748b',
        }}
      >
        {hostname}/apps/{app.slug}
      </div>
    </div>,
    {
      ...size,
    }
  );
}
