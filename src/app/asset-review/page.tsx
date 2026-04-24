// Dev-only asset review route. Renders a single interactive-asset GLB
// in isolation with a clip picker + scrubber, so the artist's iteration
// loop is "drop GLB in /public, refresh, scrub clips" — not
// "restart the whole scene and hope the dock lifts the right object".
//
// Gated at the server level: `NODE_ENV === 'production'` returns 404.
// Dev + preview builds serve it. See ADR-016.

import { notFound } from 'next/navigation';
import { AssetReviewClient } from './AssetReviewClient';
import { INTERACTIVE_ASSET_KINDS } from '@/asset/interactive-asset-contract';
import type { InteractiveAssetKind } from '@/asset/interactive-asset-contract';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ asset?: string }>;
}

const AssetReviewPage = async ({
  searchParams,
}: PageProps): Promise<React.ReactElement> => {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const params = await searchParams;
  const requested = params.asset;
  const asset: InteractiveAssetKind | null =
    requested && INTERACTIVE_ASSET_KINDS.includes(requested as InteractiveAssetKind)
      ? (requested as InteractiveAssetKind)
      : null;

  return <AssetReviewClient asset={asset} />;
};

export default AssetReviewPage;
