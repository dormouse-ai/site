---
title: Architecture
description: The block, the optimizer, the spectral cut, and the two invariants the code enforces at runtime.
---

## One block, twelve times

A byte goes in; twelve identical blocks later, a prediction comes out. Each block is attention
followed by a feed-forward network, with pre-LN and residual connections — the shape that powers
most language models, cut down to fit one card.

The FFN is **gated** (SwiGLU) at two-thirds of the width of the GELU block it replaces. It is the
one architectural change that won: it holds the parameter count exactly constant —
`3·832·2048 = 2·832·3072` — and moved held-out loss by −0.0145 BPB over three paired seeds.

| piece | choice | why it is this |
|---|---|---|
| block | dense pre-LN transformer, 12 layers, `d_model=832` | beat the loop and KDA arms at equal bytes |
| FFN | gated SwiGLU, `d_ffn=2048` | −0.0145 BPB at **0.00%** extra parameters |
| attention | full, RoPE, flash | 24% of the block, correct and fast |
| optimizer | Muon for matrices, AdamW for vectors | 1.92× the step at equal quality |
| precision | bf16 masters, bf16 NS, fp32 accumulate | the smallest format that still learns |
| batch | 24 × 1024 bytes, `torch.compile(dynamic=False)` | 1.43× versus the naive loop |
| weights | ternary, QAT from step 0, annealed | the format it ships in |

## The optimizer thinks in matrices

AdamW treats every number on its own. **Muon** treats a weight matrix as a matrix: before each
step it orthogonalizes the update, so every direction gets the same strength and the step stays
well-conditioned. That buys a faster learning rate on wide matrices without the usual instability.

The orthogonalization is five Newton–Schulz iterations on the *small* side of the Gram matrix,
batched across every matrix of the same shape. Three iterations is 1.08× faster and costs 10% of
the loss, so it is five. Moving the chain from fp32 to bf16 made every step 1.92× faster for 0.01
BPB — inside the noise floor.

## Spectral compression

Wide feed-forward matrices are where the parameters live. TSCT rewrites the matrix rather than
routing around it: a singular-value decomposition, the tail of the spectrum dropped, and the two
surviving factors stored as thin matrices.

Nothing is chosen per token and there is no gate — the same factors run for every byte. What
changes is how many numbers it takes to describe the mapping. The cost is the rank and it is
measured: at `r/f ≈ 9%` the loss penalty is around 5% while the arithmetic drops about 2.7×.

## Two invariants, enforced at runtime

Both exist because both were violated here.

1. **An arm that is off is bit-identical to its absence.** The projector is not called at all when
   its flag is off; a test spies on the function and requires zero calls. What it prevents: a
   `use_kda=false` that silently meant "no attention at all".
2. **A mechanism that cannot pay refuses loudly.** A config naming a removed mode, or a
   combination that loses money, fails at load with the survivors listed. What it prevents: an arm
   that burns three hours and then turns out to have measured nothing.

A corollary from the same failures: **a flag that is on must report a counter.** A mechanism that
cannot say it ran is treated as one that did not run, and the test fails.

## The tree

```
port/src/dormouse/
  config.py          every flag, every refusal
  model/
    model.py         embed → blocks → head
    transformer.py   the live block (attention + gated FFN)
    tsct.py          low-rank factors: U·diag(s)·Vᵀ, the spectral cut
    ternary.py       b1.58 codec: ternarize, STE, annealing
    act_quant.py     activation quantization (int4 / e2m1 / Hadamard)
    packed_acts.py   saved activations stored packed (−80% VRAM)
    export.py        the shipped file: pack → container → reload
  train/
    loop.py          the training step, eval, checkpointing, resume
    optim.py         Muon (Newton–Schulz, batched per shape) + AdamW
  post/              SFT and the verifier-first RL stack
```

---

## References

Each choice above has a paper behind it, and a paper behind the paper is a reason to distrust it:

- **The block** — Vaswani et al., [arXiv:1706.03762](https://arxiv.org/abs/1706.03762)
- **SwiGLU** — Shazeer, [arXiv:2002.05202](https://arxiv.org/abs/2002.05202); GLU variants are
  the family this sits in
- **RoPE** — Su et al., [arXiv:2104.09864](https://arxiv.org/abs/2104.09864)
- **FlashAttention** — Dao et al., [arXiv:2205.14135](https://arxiv.org/abs/2205.14135)
- **Muon** — [arXiv:2502.16982](https://arxiv.org/abs/2502.16982); quintic iteration, Polar
  Express, [arXiv:2505.16932](https://arxiv.org/abs/2505.16932)
- **AdamW** — Loshchilov & Hutter, [arXiv:1711.05101](https://arxiv.org/abs/1711.05101)
- **Spectral compression of a transformer's weights** — SCT, [arXiv:2604.00733](https://arxiv.org/abs/2604.00733)
- **The data budget the projections use** — Hoffmann et al., Chinchilla, [arXiv:2203.15556](https://arxiv.org/abs/2203.15556)
