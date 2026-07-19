# Deploy Model

## Branches

| Branch | Production for |
|---|---|
| `main` | bcon, windchasers, lokazen, proxe |
| `migrate/one-core` | pop (temporary — until merged back) |

Shared `core/` changes must go to **both** branches until pop returns to main.

## Per-brand build scoping

`core/vercel.json` → `scripts/vercel-ignore.sh` reads the **commit scope**:

- `fix(lokazen): …` → only lokazen rebuilds (even if it touches `core/`)
- `fix(core):` / generic scope → ALL brands rebuild
- touching `brands/<id>/` → that brand rebuilds

⚠️ **This is the root cause of version drift**: a brand-scoped commit that also changes shared `core/` behavior leaves every other brand stale. Observed 2026-07-16: lokazen 0.2.11 vs bcon/windchasers 0.2.7 vs pop 0.2.6.

## Safety rails

- **Live guard**: `scripts/git-hooks/pre-push` blocks pushes deploying to LIVE brands unless `PUSH_LIVE=1`
- Pre-commit hook auto-bumps `core/package.json` patch version
- Deploy verification: `curl https://<brand-domain>/api/build-info` until version bumps — *a push is not a deploy*

## Vercel projects (bconclub team)

`bcon-proxe` · `windhcasers-proxe` (sic, typo in project name) · `lokazen-proxe` · `pop-proxe` · proxe TBD

## Legacy (stale, still in repo)

`.github/workflows/deploy-*.yml` rsync old `brands/<id>/agent/` apps to a VPS via PM2 — deprecated by the one-core model; partially decommissioned.

Related: [[PROXe Architecture]] · [[2026-07-16 PROXe Health Brief]]
