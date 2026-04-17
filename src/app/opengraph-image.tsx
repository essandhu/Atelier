import { ImageResponse } from 'next/og';
import { loadProfile } from '@/data/loaders/projects';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Static evening-state OG poster. Satori (the ImageResponse backend) runs on
 * the edge — no WebGL, no R3F. The layout evokes the evening palette using
 * tokens-consistent colours.
 */
const OpengraphImage = async (): Promise<ImageResponse> => {
  const profile = loadProfile();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          background:
            'radial-gradient(circle at 78% 72%, rgba(199, 122, 59, 0.35) 0%, rgba(15, 12, 10, 1) 55%)',
          color: '#e8e2d4',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            fontSize: '22px',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: '#c77a3b',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '2px',
              backgroundColor: '#c77a3b',
            }}
          />
          Atelier
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: '96px',
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: '-0.03em',
              marginBottom: '16px',
            }}
          >
            {profile.name}
          </div>
          <div
            style={{
              fontSize: '36px',
              opacity: 0.82,
              marginBottom: '24px',
            }}
          >
            {profile.role}
          </div>
          <div
            style={{
              fontSize: '26px',
              lineHeight: 1.4,
              opacity: 0.78,
              maxWidth: '900px',
            }}
          >
            {profile.positioning}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontSize: '20px',
            opacity: 0.5,
          }}
        >
          <span>{profile.city}</span>
          <span style={{ color: '#c77a3b' }}>Evening edition</span>
        </div>
      </div>
    ),
    size,
  );
};

export default OpengraphImage;
