# Fine-tuning the decider

Only the decider is trained. The rooms' agents generate code with a general model; GBrain holds
what is true; the decider learns how to judge. Two classification jobs behind one signature:

- `kind`: `contract | decision | verdict | private_note | noise`
- `verdict`: `share | hold | discard`, with target rooms

## Training row format (`data/train.jsonl`)

```json
{"input": {"text": "...", "from_room": "backend", "kind": "contract|null", "options": ["share","hold","discard"]},
 "label": {"kind": "contract", "verdict": "share", "targets": ["frontend","qa"]},
 "source": "commitsuite|mast|adr|codereviewer|demo", "override": false}
```

`options` is the order shown to the model; log it, because order sensitivity is a known Jev limit
and it must be measurable. `override: true` marks a row a human flipped in the demo (beat 5).

## Public data, and what each gives

| Source | Rows | Gives | Mapping |
|---|---|---|---|
| [MAST-Data](https://huggingface.co/datasets/mcemri/MAST-Data) / [MAD](https://huggingface.co/datasets/mcemri/MAD) (Hugging Face, 66 MB) | 1,642 traces, 14 binary failure labels | verdict | traces flagged inter-agent misalignment: extract the message that should have crossed; label `share` to the agent that acted on stale state |
| [CommitSuite](https://arxiv.org/html/2605.02256) | 63,533 Conventional Commits from 243 repos | kind | `BREAKING CHANGE` or `!` → `contract`; `feat`/`fix` with public scope → `decision`; `chore`/`style`/`docs` → `noise` |
| [Quad4/commit-messages-high-quality](https://huggingface.co/datasets/Quad4/commit-messages-high-quality) | commit subject, body, type, scope, breaking flag | kind | same mapping; loads directly with `datasets` |
| Architecture Decision Records ([GitHub search: `path:docs/adr`](https://github.com/search?q=path%3Adocs%2Fadr+extension%3Amd&type=code)) | thousands of markdown files | kind | each ADR → `decision`; its "consequences" section names who it crosses to |
| [CodeReviewer](https://github.com/microsoft/CodeBERT/tree/master/CodeReviewer) (Microsoft) | review comments paired with diffs | verdict | a review comment → `verdict`, `share` to the diff's author |
| `data/audit.jsonl` (ours) | whatever the demo produced | both, held-out | `private_note` and `noise` have no public corpus; hand-label a few hundred rows here |

Download MAST:

```python
from huggingface_hub import hf_hub_download
import json
p = hf_hub_download(repo_id="mcemri/MAD", filename="MAD_human_labelled_dataset.json", repo_type="dataset")
traces = json.load(open(p))
```

## Method

1. Build `data/train.jsonl` from the public sources with `scripts/build-train.mjs` (to write on the day
   if there is time; otherwise a notebook). Keep the mapping above in one function so it can be argued with.
2. Stratified split by `kind`, 80/20. Hold the demo log out entirely as a second test set.
3. Baseline: `src/decider.mjs` rules (`TALOS_DECIDER=rules`) on both test sets. Report a confusion matrix
   per label, not one accuracy number.
4. Fine-tune on River: small instruction model, supervised, one epoch first, low learning rate, early stop
   on held-out loss. Pin the model version in `RIVER_MODEL`. Start at hour three on event credits.
5. Evaluate the tuned model the same way. The bar is beating rules on held-out rows; if it does not,
   say so on stage and show the matrix.
6. Wire it behind `TALOS_DECIDER=river` only if the eval is done; otherwise show the job page.

## Honest limits

- MAST traces are benchmark tasks, not software factories; the mapping to `share` is an interpretation.
- Commit types are noisy labels for `kind`; a `feat` can be a contract change without a `!`.
- `private_note` and `noise` are the classes Jev and the tuned model will most likely get wrong,
  and the override key exists for exactly that.
- Never say the model "learned the team". It learned a few thousand public rows and a demo log.
