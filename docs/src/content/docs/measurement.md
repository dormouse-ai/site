---
title: Measurement
description: How a number is produced here, what the current record is, and where the raw evidence lives.
---

## The rule

A result is always three things: **a loss, a window, a budget**.

> Held-out bits per byte on a fixed window, after one pass over the corpus, on a single RTX 5070 Ti
> — compared against the same model with the mechanism removed.

The absolute height moves whenever the architecture or the corpus changes, and it will keep moving.
The comparison is what survives.

- **Window:** `data_local/best/fwedu_eval.bin`, 196,608 bytes, `off=0`. It changed on 2026-11-08
  when the corpus was refetched, so a figure from before that date is a different measurement and
  cannot be put in the same column.
- **Noise:** ±0.011 BPB per seed at the current budget. A delta below that is not a result,
  whatever the table says.
- **Seeds:** three per arm, paired deltas. A single-seed delta is a hypothesis.

## The current record

The window is the post-refetch one. The comparison that matters is row 1 against row 2 — same
model, same budget, one difference: the format it was trained in.

| run | held-out BPB | corpus | time | log |
|---|---:|---:|---:|---|
| 95M gated FFN, ternary (QAT from step 0) | 1.2220 | 2.64 GB | 9.5 h | `logs/arch/run2640_ternary.jsonl` |
| 95M gated FFN, bf16 control | **1.1871** | 2.64 GB | 8.4 h | `logs/arch/run2640_s1.jsonl` |
| 95M dense GELU, bf16 | 1.1940 | 2.00 GB | 6.6 h | `logs/arch/run2gb_s1.jsonl` |
| xz on the same window | 2.31 | — | — | reference compressor |

**+2.94% BPB is the price of the format** at this scale, paid for roughly eight times fewer bytes
on disk. That is the trade, stated as a number rather than as a hope about quantization.

An earlier record — 1.936 BPB on the pre-refetch corpus, after 60,000 steps over 1.47 GB — is
still in the archive of this project. It is not comparable with the table above, and it is not on
the landing page, because a number from a different window is a different number.

## How fast it learns

| model | measured throughput | bytes covered in 60 days |
|---|---:|---:|
| 95M dense | 87.2 kB/s | 452 GB |
| 275M dense | 20.4 kB/s | 106 GB |
| 1B MoE, 1024 experts | 6.1 kB/s | 32 GB |

One card, 1,440 hours a month. The table is why the next model is a **275M** and not a 1B: at
20.4 kB/s a 13 GB corpus is covered eight times over, which is what the scaling arithmetic asks
for, and a 1B is covered twice at six times the cost per byte.

## What was measured and dropped

Eleven mechanisms were measured on the live model and dropped. The short list, because the reason
matters more than the count:

| mechanism | measured | verdict |
|---|---|---|
| MoE, 32 experts | +0.004 BPB, needs a bigger corpus to pay | deferred, not deleted |
| low-rank at r=64 | 1.95× faster, **+28% loss** | the cost is capacity, not under-training |
| attention factorisation | 2.57×, **+27%** | refused |
| low-rank Muon (Orth-Dion) | 1.25×, **+33%** | refused |
| fewer Newton–Schulz steps | 1.08×, **+10%** | refused |
| gated FFN | 0.00% params, **−1.2%** | **shipped** |

The pattern is the argument: at a fixed budget, speed comes from writing the same function more
cheaply — width, precision, format — never from dropping work.

## Where the raw evidence is

| what | where |
|---|---|
| every arm and every seed of the architecture matrix | `docs/records/reviews/2026-11-09-architecture-matrix.md` |
| the ternary artifact, its cost and two corrections to earlier claims | `docs/records/reviews/2026-11-12-ternary-artifact.md` |
| the gated-FFN A/B, three paired seeds | `docs/records/reviews/2026-11-10-gated-ffn-ab.md` |
| the protocol a number must satisfy | `docs/protocols/AB-PROTOCOL.md` |
| every review, by date | `docs/records/reviews/` |

---

## References

The measuring conventions are borrowed, and the borrowing is the point:

- **Bits per byte** as a unit that does not depend on a vocabulary — MegaByte, [arXiv:2305.07185](https://arxiv.org/abs/2305.07185); BLT, [arXiv:2412.09871](https://arxiv.org/abs/2412.09871)
- **The scaling form** used for every projection on this site — Hoffmann et al., Chinchilla, [arXiv:2203.15556](https://arxiv.org/abs/2203.15556)
- **Ternary weights**, the format whose cost row 1 prices — BitNet b1.58, [arXiv:2402.17764](https://arxiv.org/abs/2402.17764)
