# Testo di annuncio per la community

Bozza in inglese, pronta da adattare. Sostituisci `https://ergologica.github.io/ergo-bounty-radar/` con l'indirizzo del sito una volta online.

---

## Versione lunga — forum / Reddit / Discord #general

**Title:** I built a Radar for the Ergo bounty board — ranked opportunities, board history, and payment transparency

Hi everyone,

The [Ergo Bounties board](https://github.com/ErgoDevs/Ergo-Bounties) does a great job of indexing every bounty-tagged issue across the ecosystem, but it ships as markdown tables — hard to scan, impossible to filter, and with no memory of what changed. So I built a small front-end for it:

**https://ergologica.github.io/ergo-bounty-radar/**

It's a single static page, no backend, no tracking, no accounts. Everything comes from the board's own public data.

**What it does**

- **Ranks bounties by a transparent score** — reward value, whether maintainers have touched the issue recently, how many people are already commenting, and how accessible the stack is. Set your languages and it re-ranks for you.
- **Shows what changed** — new, closed/paid, and re-priced bounties over the last 7 or 30 days.
- **Charts the board over time** — I reconstructed ~94 snapshots from the board's git history, back to March 2025.
- **Shows who's working on what** — bounties already claimed are marked, so nobody duplicates work.
- **Surfaces the payment trail** — what's been paid, with on-chain transaction links, and how long submissions have been waiting for review.

**A few things the data says**

I went in looking for opportunities and came out with a picture of the board itself, which I think is worth sharing:

- 106 open bounties, ~Σ117,500 — but that's about **$28k**, down from ~$40k in March 2025, because the ERG price moved while the SigUSD-denominated bounties stayed put.
- The count has been **flat for 17 months** (~100–115), with roughly 4 new and 4 closed per month, in waves.
- **Median age is 2.7 years.** Most issues haven't been touched in over six months.
- **71% is Scala**, most of it deep node and sigmastate internals — a high bar for a newcomer. Only 7 bounties are flagged starter-friendly.
- Through the submissions system, **one payment has completed** (750 SigUSD, paid in 15 days — nice), while two submissions have been awaiting review for over 500 days.

I want to be careful here: none of this is a criticism of the people running the board, who are volunteers, and the review bottleneck looks like one person's limited time rather than anything structural. But the numbers were sitting in public and nobody had lined them up. If we want new contributors to stick, the entry path (starter-sized, non-Scala, quick review) is the thing that looks thinnest.

**It's open source** — MIT, one HTML file, a GitHub Action that refreshes it daily: https://github.com/Ergologica/ergo-bounty-radar

Feedback and PRs very welcome, especially on the scoring heuristic. If maintainers want any of this folded back into the official board, take whatever's useful.

---

## Versione corta — Discord / Telegram

📡 **Ergo Bounty Radar** — https://ergologica.github.io/ergo-bounty-radar/

A filterable front-end for the [bounty board](https://github.com/ErgoDevs/Ergo-Bounties): every open bounty ranked by reward, maintainer activity, and competition; what changed in the last 7/30 days; board trends since March 2025; and who's already working on what, so nobody duplicates effort.

Static page, no backend, MIT licensed, refreshes itself daily.

Some things the history shows: 106 open bounties worth ~$28k (down from ~$40k in March 2025 on the ERG move), flat count for 17 months, median age 2.7 years, 71% Scala, and only 7 starter-friendly issues. Feedback welcome 🧡

---

## Versione X / Twitter

📡 Built a Radar for the @ergo_platform bounty board.

Every open bounty, ranked by reward + maintainer activity + competition. What changed this week. Board trends since 2025. Who's already working on what.

Static page, open source, refreshes daily.

https://ergologica.github.io/ergo-bounty-radar/

---

## Note per te

- Se ti chiedono "perché non contribuisci direttamente al board ufficiale?": la risposta onesta è che il Radar è un layer di lettura e non sostituisce nulla — e che sei disponibile a portare le parti utili upstream. Detto sinceramente ti guadagna credito.
- I numeri sopra sono verificati sul board dell'11 agosto 2026 (106 bounty, Σ117.537, ~$27.9k al cambio 1 SigUSD ≈ 4,22 ERG). Se annunci fra qualche giorno, riaprili sul sito e aggiornali.
- Evita di presentarlo come una critica ai maintainer. Il paragrafo sui 500 giorni è il più delicato: nella versione lunga è già inquadrato con rispetto, tienilo così.
