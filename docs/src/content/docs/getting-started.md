---
title: Getting started
description: Install, train the live recipe, gate it, and export the file. Every command that matters, in order.
---

Everything runs on one machine. A shape-check arm takes about twenty-five minutes; a full pass
over the corpus takes a night.

## Install

```bash
git clone https://github.com/dormouse-ai/dormouse && cd dormouse/port
uv sync        # Python 3.12 + torch + triton, pinned
```

The GPU must be `sm_120` or newer (RTX 50-series and later). A CPU-only box runs the whole test
suite; it cannot train.

## Train

```bash
PYTHONPATH=src .venv/bin/python -m dormouse.cli train configs/arch_gated_swiglu.toml \
  --data ../data_local/best/fwedu_train.bin \
  --eval ../data_local/best/fwedu_eval.bin \
  --set mix_plan=configs/mix_refetch.toml \
  --set steps=4880 --set batch=24 --set seq_len=1024 \
  --set opt=mix --set muon_lr_mult=12 --set lr=3e-4 \
  --set ns_dtype=bf16 --set muon_state_dtype=bf16 \
  --set dense_qat=ternary --set factor_qat_anneal_steps=2000
```

That is the 120 MB shape-check arm. Raise `steps` for the full corpus run.

:::caution[Muon's scale is not optional]
`muon_lr_mult=12` exists because Muon's update is about 12× smaller than AdamW's on these shapes.
Without it the matrix half of the model trains at 8–52% of the intended step and every number
afterwards is garbage. The CLI prints a banner about it at every start.
:::

:::note[The format is a training flag]
`dense_qat=ternary` puts the *forward pass* on three levels from step 0, and
`factor_qat_anneal_steps` ramps the projection from full precision to hard ternary over that
window. The optimizer still holds one bf16 master per weight — a three-valued number cannot
absorb a gradient — but the network always computes in ternary. Nothing is quantized afterwards.
:::

## Gate

```bash
cd .. && bash scripts/gate_fast.sh        # ruff, dead knobs, doc references
cd port && PYTHONPATH=src .venv/bin/python -m pytest -q -m "not slow and not pins"
```

- `-m "not pins"` — 2,500 tests, the ones that gate a commit.
- `-m pins` — 82 exact-fingerprint tests. They compare sha256 of logits and state dicts, so they
  break on any legitimate change; they report, they do not gate.

## Export

```bash
PYTHONPATH=src .venv/bin/python -m dormouse.cli export checkpoints/last.pt --out dormouse-95m.tq2
```

The export packs every weight to 2-bit codes plus one fp16 scale per tensor, writes a container,
and reloads it to check the round trip. The recovered model differs from the trained one by 0.15%
of the quantizer's own error — the file is the network, not a lossy copy of it. See
[Formats](/formats/) for what is in the container.

## Read the result

A run writes `runs/<id>/run.jsonl`: the config, the seed, the versions, the counters each
mechanism reported, and one line per evaluation. If a number is not in that file, it is not a
result — the [measurement rules](/measurement/) are the reason.

---

## References

Three pieces of this page are other people's work, and the commands above only make sense with
them:

- **Muon**, the orthogonalized update — [arXiv:2502.16982](https://arxiv.org/abs/2502.16982); the
  quintic Newton–Schulz iteration used here — Polar Express, [arXiv:2505.16932](https://arxiv.org/abs/2505.16932)
- **Quantized-aware training** with a straight-through estimator — Bengio et al.,
  [arXiv:1308.3432](https://arxiv.org/abs/1308.3432)
- **Bits per byte** as the loss unit — MegaByte, [arXiv:2305.07185](https://arxiv.org/abs/2305.07185)
