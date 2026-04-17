'use client';

interface AccentProviderProps {
  children: React.ReactNode;
}

// Phase 2 ships the static-CSS accent only. The provider exists so future
// runtime overrides (Phase 5+) have a mount point that callers already wrap
// around the app tree.
export const AccentProvider = ({
  children,
}: AccentProviderProps): React.ReactElement => <>{children}</>;
