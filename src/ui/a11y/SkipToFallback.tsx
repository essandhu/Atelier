import { TAB_ORDER } from '@/interaction/tab-order';

const BASE: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  padding: '0.5rem 0.875rem',
  background: 'var(--color-ink, #111)',
  color: 'var(--color-parchment, #fefaf0)',
  textDecoration: 'none',
  fontSize: '0.875rem',
  fontWeight: 500,
  borderRadius: '0 0 4px 0',
  border: '2px solid var(--accent, #c77a3b)',
  zIndex: 10000,
  transform: 'translateY(-200%)',
  transition: 'transform 120ms ease-out',
};

export const SkipToFallback = (): React.ReactElement => (
  <a
    href="/fallback"
    tabIndex={TAB_ORDER.skipToFallback}
    style={BASE}
    className="skip-to-fallback"
    data-testid="skip-to-fallback"
  >
    Skip to text-only version
  </a>
);
