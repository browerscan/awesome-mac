import { ImageResponse } from 'next/og';
import { getCategoryById } from '@/lib/data';
import { siteConfig } from '@/lib/seo';

export const runtime = 'nodejs';
export const alt = 'Category';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
  const category = await getCategoryById(params.slug);
  const hostname = siteConfig.url.replace(/^https?:\/\//, '');

  if (!category) {
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
        Category Not Found
      </div>,
      { ...size }
    );
  }

  const appCount = category.apps.length;
  const subcategoryCount = category.subcategories?.length || 0;

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
      {/* Category Icon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 120,
          height: 120,
          borderRadius: 24,
          background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
          marginBottom: 32,
        }}
      >
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      </div>

      {/* Category Name */}
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
        {category.name}
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'flex',
          gap: 32,
          marginTop: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: '#60a5fa',
            }}
          >
            {appCount}
          </div>
          <div
            style={{
              fontSize: 18,
              color: '#94a3b8',
            }}
          >
            Apps
          </div>
        </div>

        {subcategoryCount > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontSize: 48,
                fontWeight: 700,
                color: '#c084fc',
              }}
            >
              {subcategoryCount}
            </div>
            <div
              style={{
                fontSize: 18,
                color: '#94a3b8',
              }}
            >
              Subcategories
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      {category.description && (
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
          {category.description.length > 150
            ? category.description.slice(0, 147) + '...'
            : category.description}
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
        {hostname}/category/{category.slug}
      </div>
    </div>,
    {
      ...size,
    }
  );
}
