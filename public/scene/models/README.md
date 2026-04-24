# Interactive asset GLBs land here

Each file matches a kind defined in `src/asset/interactive-asset-contract.ts`:

- `projectBook.glb`
- `heroBook.glb`
- `skillsCatalog.glb`
- `contactCard.glb`
- `globe.glb`

The files themselves are not version-controlled (artist deliverables;
gitignored). Validation runs against them in CI when present (see
`tests/unit/glb-validation.test.ts`).

The client reviews delivered assets interactively at
`/asset-review?asset={kind}` (dev only, local tool). Artists are not
expected to run this tool — they deliver per the artist brief
(`docs/phase-10-artist-brief.md`) and the client handles review.
