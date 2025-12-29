import { ImageResponse } from 'next/og';
import { siteConfig } from '@/lib/seo';

export const runtime = 'nodejs';
export const alt = 'Awesome Mac Apps - Best macOS Applications';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  const hostname = siteConfig.url.replace(/^https?:\/\//, '');
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
      }}
    >
      {/* Logo/Icon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 120,
          height: 120,
          borderRadius: 24,
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          marginBottom: 32,
          fontSize: 64,
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
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </svg>
      </div>

      {/* Title */}
      <div
        style={{
          display: 'flex',
          fontSize: 64,
          fontWeight: 700,
          color: 'white',
          marginBottom: 16,
          textAlign: 'center',
        }}
      >
        {siteConfig.name}
      </div>

      {/* Subtitle */}
      <div
        style={{
          display: 'flex',
          fontSize: 28,
          color: '#94a3b8',
          textAlign: 'center',
          maxWidth: 800,
          lineHeight: 1.4,
        }}
      >
        Curated collection of awesome Mac applications for developers and designers
      </div>

      {/* Badges */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginTop: 40,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 20px',
            borderRadius: 9999,
            background: 'rgba(34, 197, 94, 0.2)',
            color: '#4ade80',
            fontSize: 18,
          }}
        >
          Free Apps
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 20px',
            borderRadius: 9999,
            background: 'rgba(59, 130, 246, 0.2)',
            color: '#60a5fa',
            fontSize: 18,
          }}
        >
          Open Source
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 20px',
            borderRadius: 9999,
            background: 'rgba(168, 85, 247, 0.2)',
            color: '#c084fc',
            fontSize: 18,
          }}
        >
          App Store
        </div>
      </div>

      {/* URL */}
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          bottom: 40,
          fontSize: 20,
          color: '#64748b',
        }}
      >
        {hostname}
      </div>
    </div>,
    {
      ...size,
    }
  );
}
