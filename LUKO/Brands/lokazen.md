---
category: brand
tier: LIVE
proxe_url: https://proxe.lokazen.in
website: https://lokazen.in
supabase_ref: egwwpngaoaeqemieawcx
features: [brain, pipelineFunnel, scouts, leadAccess]
---

# lokazen — LIVE

Commercial real estate, Bangalore. Three audiences: **brand / property owner / scout**.

| | |
|---|---|
| PROXe URL | https://proxe.lokazen.in |
| Website | https://lokazen.in |
| Vercel project | `lokazen-proxe` |
| Supabase ref | `egwwpngaoaeqemieawcx` |

## Features on

voice ❌ · brain ✅ · pipelineFunnel ✅ · followUpSequence ❌ · **scouts ✅** (Scout module: /dashboard/scouts + scout widget mode + scout KB scope) · **leadAccess ✅** (Owner/Brand/Scout chips, Humans overview — needs migration 005)

Most actively developed brand right now — the last ~15 commits are all lokazen (booking loop fixes, audience-aware templates, Humans/lead-access).

## Health snapshot (2026-07-16)

- Version **0.2.11** — the newest of all brands
- `/api/status` self-reports **error**:
  - Supabase URL env value has a **leading space** (`" https://egwwpngaoaeqemieawcx…"`) → `urlValid: false`, auth check fails
  - Status checker probes legacy `NEXT_PUBLIC_LOKAZEN_*` key names → reported unset (checker is stale post generic-env migration)

## Known issue themes

Booking loop (lock time on tap) · lost bookings recovered from chat · callback-only booking rule · web-chat lead source capture (UTM vs "Web Chat")

Related: [[2026-07-16 PROXe Health Brief]] · [[Checks]]
