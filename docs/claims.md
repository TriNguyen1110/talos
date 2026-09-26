# Every product-capability claim in the deck, and its source (checked Sep 26, 2026)

Rule: a capability claimed on a slide must be on the product's own page. If it is not, the slide
says "we assume" or the claim comes off. This ledger is re-checked before the deck is shown.

| Slide | Claim | Source | Status |
|---|---|---|---|
| Why build | 1 of 3 failure categories is inter-agent misalignment; 41 to 86.7% failure rate on 7 frameworks; 1,642 traces | MAST, arXiv 2503.13657 v3 | Verified in text |
| Why build | Agents ~4x chat tokens, multi-agent ~15x | Anthropic engineering blog, multi-agent research system | Verified, quoted |
| Why build | Over 40% of agentic AI projects cancelled by end of 2027 | Gartner press release, June 25, 2025 | Verified |
| Why build | Dollar cost per team | Our estimate | Labeled as ours |
| Decider | Jev returns a choice, a probability per option and a confidence score; 70 to 500 ms; 64k context; 255 options; injection can move the answer; versions like jev-1.13 | TypeSafe docs via firecrawl.dev/blog/what-is-jev; VentureBeat security piece | Verified. The slide's 0.55 s figure is Cheney Zhang's Sep 22, 2026 measurement, inside TypeSafe's stated range |
| Decider | Plain LLM call ~3,000 ms | Typical; Zhang measured 2.23 s for the baseline | Labeled typical |
| Decider | Detection via the room's memory route or a watcher on its brain | QM README (external memory provider routing); GBrain README (Markdown brain, git-backed sync) | Verified |
| Access | One token per role, scoped, revocable, audit row per read, sub-second revoke | Talos, ours to build | Our claim; measured on the day |
| Training | River: LoRA on open-weight models via its API | River API preview v0.1, Python client; models ~35B to 1T | Verified via coverage of the API docs; not tested by us |
| Training | Jev as v1 baseline | TypeSafe | Verified |
| Datasets | MAST-Data: 1,642 traces, 14 binary labels, ~66 MB, files MAD_full_dataset.json and MAD_human_labelled_dataset.json | huggingface.co/datasets/mcemri/MAST-Data and mcemri/MAD; MAST GitHub | Verified |
| Datasets | CommitSuite: 63,533 Conventional-Commits-compliant commits from 243 repos, AST-level info | arXiv 2605.02256 | Verified in abstract |
| Datasets | Quad4 commit set: subject, body, style, type (13 types), scope, breaking flag; 292,269 rows from 15 repos; loads with `datasets` | Hugging Face dataset card | Verified |
| Datasets | ADRs on GitHub | GitHub code search for docs/adr | Plausible; count unverified, say "thousands" loosely or "many" |
| Datasets | CodeReviewer: review comments paired with diff hunks (old_file, diff_hunk, comment, target); tasks cls/msg/ref; data on Zenodo | microsoft/CodeBERT/CodeReviewer README | Verified. Language count not stated on the page; do not say "across languages" |
| Stack | GBrain: one brain per room, Markdown indexed into a graph, durable | GBrain README | Verified |
| Stack | QM: one room per role; memory can be routed to an external provider; no documented tool-call or write hook | QM README | Verified; "write-path plugin" removed |
| Stack | Superset: multiple Claude Code or Codex sessions in parallel workspaces and worktrees, open source | Superset YC launch; github.com/superset-sh/superset | Verified |
| Proof | OpenTelemetry traces via Langfuse (50k observations/month free, OTel native) or Phoenix (open source, self-hosted, OTel) | langfuse.com; github.com/arize-ai/phoenix | Verified |
| Proof | Git receipts, timeline, negative tests | Talos, ours to build | Our claim |
| Why after | Talos attaches where QM routes memory out | QM README | Verified as a surface; the integration is ours to build |

Not claimed anywhere, on purpose: anything about UFO (no public page found); a percentage share for
any MAST category (not in the paper's text); Jev being "safe"; River's job finishing on the day.
