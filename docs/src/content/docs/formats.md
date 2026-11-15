---
title: Formats
description: bf16, 4-bit activations, ternary weights — and the export path that ships them as one file.
---

The project trains in the format it ships in. There is no "train float, quantize later" step: the
forward pass is quantized from the first step, and a schedule anneals the projection from full
precision to hard ternary.

## The ladder

| format | bits | what it is for |
|---|---:|---|
| bf16 | 16 | the optimization master; the reference |
| int4 / e2m1 | 4 | activations, and the storage of saved tensors |
| ternary (b1.58) | ~2 | the weights that ship |

*Bits are per weight.*

## Why the master stays full precision

A three-valued number cannot absorb a gradient. The optimizer holds one bf16 master per weight and
accumulates into it; the network always *computes* in ternary, through a straight-through
estimator, and the anneal pulls the master onto the grid over the first two thousand steps.

| step | what happens |
|---|---|
| forward | every weight is projected to `{−α, 0, +α}` — one scale per tensor |
| schedule | `alpha` ramps 0 → 1 over the anneal window; `alpha=0` is the master itself |
| backward | the straight-through estimator passes the gradient to the master |
| export | the master is projected one last time and packed |

This is what BitNet calls quantized-aware training. The difference from post-hoc quantization is
measurable: a model that never saw the format during training has to absorb the whole quantization
error at the end, and at 95M that cost is read directly off two runs at the same budget —
**1.2220 BPB in ternary against 1.1871 in bf16**, +2.94% for eight times fewer bytes.

## The export

The packer walks the model, stores every weight as 2-bit codes plus one fp16 scale per tensor, and
writes a container that reloads into the same module. The round trip is checked, not trusted: the
recovered model differs from the trained one by 0.15% of the quantizer's own error.

Which is the sentence that matters commercially: the file *is* the network. A 95M model is about
**24 MB** of file — that figure is arithmetic, 2 bits per weight plus one scale per tensor, not a
download you can inspect today.

## Bytes on the way in, tokens on the way out

Today the input is raw bytes: 256 symbols, no tokenizer, and no character that can be mangled into
a replacement glyph. The next run adds a joint Russian/English byte-pair unit of 32k tokens in
front of the same model, because it moves **3.42× more bytes per second at equal quality** — the
step predicts 4.4 bytes per token instead of one. The byte alphabet stays underneath it: the
tokenizer is a way to read more data per step, not a way to replace the alphabet.

## What is not shipped

- **No per-token quantizer.** One scale per tensor; anything finer costs memory and buys rounding
  noise.
- **No lossy codec in front of the file.** A compressed container would save megabytes and destroy
  the property that the bytes you hold are the weights you run.
- **No kernel-specific format.** The packed layout is the portable one; a faster in-kernel layout
  is derived at load time, never stored.

---

## References

Formats are where implementation details get published as theory, so the sources matter:

- **BitNet b1.58** — ternary weights trained from the start,
  [arXiv:2402.17764](https://arxiv.org/abs/2402.17764)
- **Straight-through gradient estimation** — Bengio et al.,
  [arXiv:1308.3432](https://arxiv.org/abs/1308.3432)
- **Spectral compression (SCT)** — [arXiv:2604.00733](https://arxiv.org/abs/2604.00733)
- **Byte-level input and its bits-per-byte loss** — MegaByte, [arXiv:2305.07185](https://arxiv.org/abs/2305.07185); BLT, [arXiv:2412.09871](https://arxiv.org/abs/2412.09871)
- **Byte-pair encoding** — Sennrich et al., [arXiv:1508.07909](https://arxiv.org/abs/1508.07909)
