# Decision: which LLM for the twin — OPEN

Routine health checks use **zero** LLM calls (pure curl + jq + SQL). The LLM only enters for: summarizing reports into briefs, triaging screenshot feedback, and later the daily "what needs doing" brief.

## Options

| Option | Cost | Fit |
|---|---|---|
| **Claude on demand** (this session / claude CLI) | tokens only when you ask | Best quality; zero standing cost; matches "local-only, low token" goal since checks don't call it |
| **Claude Haiku via API** in the checker | very cheap per run | Only if we want automated narrative summaries per scheduled run |
| **Local model (Ollama — llama3/qwen)** | free, private | Good enough for report summarization + screenshot OCR triage; zero token spend; slower, needs setup |

## Current lean

Start with **Claude on demand** (no LLM in the loop at all). Revisit once the check cadence is scheduled — if runs are every couple of days, on-demand stays fine. Add Ollama only if screenshot-feedback triage volume grows.

Related: [[Checks]] · [[Intake Design]] · [[Home]]
