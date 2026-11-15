---
title: Roadmap
description: Where the next factor of speed comes from, what it costs, and what is honestly out of reach.
---

## Where the model is going

Three directions, in the order they pay:

1. **Bigger stored, same active.** Spectral factors plus ternary storage, so capacity grows while
   the cost of a step does not. The target is 1B stored with roughly 35–100M active parameters.
2. **Bytes per token.** The decode is bandwidth-bound, so fewer bits per weight is fewer bytes per
   token — the only lever that makes a bigger model faster rather than slower.
3. **A specialist.** Execution-verified code traces, measured on our own test suite rather than on
   a benchmark that everyone has already tuned against.

None of it needs a cluster. All of it needs data, which is the real constraint.

## The next run, in numbers

| property | value |
|---|---|
| parameters | 275M dense, or 110M stored with `r=256` factors |
| training data | 13 GB, two epochs |
| throughput | 20.4 kB/s on one 16 GB card |
| file in ternary | about 28 MB |
| decode on the card | 1,500–3,000 tokens/s |
| cost of the machine time | about $3.5 |

The tokenizer is part of this run rather than a separate project: a joint Russian/English 32k
byte-pair unit moves **3.42× more bytes per second at equal quality**, which is worth more than
any kernel work left on the table at this size.

## What is out of reach, said first

- **General intelligence at the level of a frontier chatbot.** A 275M model on 13 GB is not a 30B
  model on 15T tokens. The data gap is three orders of magnitude and no architecture closes it.
- **A multi-turn agent.** That needs an RL stepper and tool-calling, neither of which exists here
  yet.
- **128k context.** Long windows need long documents, and the corpus does not have them.

## What "done" looks like

- One command trains, evaluates and exports, with no shell scripts in the happy path.
- Any past run reproduces from its `run.jsonl` — config, seed, versions — and a test says so.
- Every mechanism has a number: it pays, or it is recorded as a refusal with the reason.
- The model is a file under 250 MB that answers offline, in Russian and English, on a laptop.

## The plan

The staged version — what happens in which week, and what is deliberately thrown away — lives in
[`dormouse-ai/plan`](https://github.com/dormouse-ai/plan). This page is the shape of the work; that
repository is the schedule.

---

## References

The three directions lean on three different bodies of work:

- **Mixture of experts**, the reason "stored" and "active" can differ at all — Shazeer et al.,
  [arXiv:1701.06538](https://arxiv.org/abs/1701.06538)
- **Grouped-query attention**, the memory-side lever for long contexts —
  Ainslie et al., [arXiv:2305.13245](https://arxiv.org/abs/2305.13245)
- **Byte-pair encoding**, the 3.42× this roadmap spends —
  Sennrich et al., [arXiv:1508.07909](https://arxiv.org/abs/1508.07909)
- **Spectral compression**, the factor budget behind "bigger stored" — SCT,
  [arXiv:2604.00733](https://arxiv.org/abs/2604.00733)
- **The data budget** the 275M choice is checked against — Chinchilla,
  [arXiv:2203.15556](https://arxiv.org/abs/2203.15556)
