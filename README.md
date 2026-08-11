# 📡 Ergo Bounty Radar

**Find the bounties worth your time on the [Ergo ecosystem bounty board](https://github.com/ErgoDevs/Ergo-Bounties).**

The official board is a set of markdown tables regenerated daily — great as a source of truth, hard to explore. Bounty Radar turns it into a fast, filterable, single-page app with an opinionated ranking, a change log, and zero backend.

![Bounty Radar](docs/screenshot.png)

## Features

- **Radar score (0–100)** — a transparent heuristic that ranks every bounty by reward value (log-scaled), recent maintainer attention, competition, and stack accessibility, minus a penalty for contested issues. Tap any score ring and the card shows its own arithmetic — every component, its reason, and the board median — so the number is arguable rather than authoritative. Set **🎯 Your profile** (languages + experience) and the score re-weights for you.
- **Honest about its own freshness** — the ↻ button re-fetches the bounty list and the exchange rate, but the contention sweep, the payment pipeline and the trends only move when the daily job runs. Each layer carries its own date, and the stamp turns amber when they diverge rather than backdating everything to one reassuring timestamp. The same rule governs the sweep: a missing warning means "not checked yet", never "clear", so the **✓ Nobody on it** filter requires positive confirmation and switches itself off when there's no sweep data to stand on.
- **Money in money** — figures lead in dollars, with the denominated amount (`1,000 SigUSD · Σ4,215`) underneath. Dollar-pegged bounties take their pegged amount directly instead of round-tripping through the board's rounded ERG column, which was pushing 500 SigUSD bounties to $499.86 and out of a `$500+` filter.
- **What changed** — new, closed/paid, and re-priced bounties over the last 7 or 30 days, computed against archived snapshots. The official board has no history view; this fills that gap.
- **Trends** — open-bounty count, total board value (Σ or $, converted at each day's own rate), and monthly new-vs-closed flow since March 2025, rendered as dependency-free SVG from ~94 snapshots sampled out of the board's git history (weekly, then daily going forward).
- **📋 Digest** — one click generates a markdown summary (totals, changes, top opportunities) ready to paste into Discord, Telegram, or the forum.
- **Repo throughput** — the strongest predictor of getting paid isn't on the issue, it's whether the repository merges outside work at all. A daily pass records merged PRs over the last 12 months per repo, how many distinct authors, how concentrated the merges are, and the median wait. A repo that merged nothing in a year scores zero for it, however attractive the issue looks; the Trends tab lists every repo so "busy but closed in practice" is visible at a glance.
- **Your stack filters, it doesn't nudge** — selecting languages narrows the board to what you can actually take on, with an honest count ("10 of 106"). Weighting languages inside the score was measured and found to be theatre: a TypeScript developer's top ten stayed ten Scala issues, unchanged.
- **Contention detection** — some bounties look ideal (high value, "good first issue", an hour of work) and are traps: contributor after contributor opens a pull request, none is ever merged, and the bounty stays listed because nothing ever closes the issue. A daily sweep reads the PRs linked to every bounty issue, flags the ones with work stacked up and nothing merged, shows the whole queue of attempts, and penalises them hard in the score. It also flags issues carrying two contradictory bounty labels, where nobody knows what the work is worth.
- **Pipeline & payments** — who is working on what right now (submissions + open PRs from the board's triage dashboard, with 🔒 badges on reserved bounties), what has been paid (with on-chain transaction links), and how long submissions have been waiting for review.
- **★ Watchlist** — star bounties and filter to them; saved locally in your browser.
- **Shareable views** — active filters live in the URL hash, so any view is a link.
- **Reserve →** — opens the official pre-filled claim file on ErgoDevs/Ergo-Bounties, following the board's own [submission process](https://github.com/ErgoDevs/Ergo-Bounties/blob/main/docs/bounty-submission-guide.md).
- **↻ Refresh** — re-fetches and re-parses today's board client-side; the page never goes stale even between deployments.
- **Built to Ergo's brand** — official logo and orange (`#FF5537`), Montserrat + Roboto, in a three-tab app shell with light/dark themes, keyboard shortcuts (`/` to search), and chart colours validated for colour-vision deficiency and contrast in both modes. Mobile-first, no build step, no dependencies, one HTML file.

![Trends](docs/trends.png)

## How it works

```
index.html                     the whole app (data embedded between markers)
scripts/parser.js              parses the board's data/all.md into JSON
scripts/archive.js             daily job: fetch board → history/YYYY-MM-DD.json
                               → recompute 7/30-day baselines → refresh index.html
history/                       one JSON snapshot per day + index.json manifest
history/trends.json            the aggregate time series behind the Trends charts
history/contention.json        linked-PR and label data per bounty (daily sweep)
history/repos.json             merge throughput per repository (daily sweep)
scripts/backfill.js            one-off used to seed trends.json from upstream git history
.github/workflows/…            GitHub Action running archive.js every day at 01:30 UTC
```

The GitHub Action keeps the deployed page's embedded data fresh daily and accumulates history from day one — trend charts over the archived snapshots are the natural next feature.

## Deploy your own

1. Fork or push this repo.
2. **Settings → Actions → General → Workflow permissions** → *Read and write permissions*.
3. **Settings → Pages** → Deploy from a branch → `main` / root.
4. Optionally run the **Daily snapshot** workflow once by hand (Actions tab → Run workflow).

Done — the site lives at `https://<user>.github.io/<repo>/` and updates itself.

## Data & credits

All bounty data comes from [ErgoDevs/Ergo-Bounties](https://github.com/ErgoDevs/Ergo-Bounties), which indexes bounty-tagged issues across the Ergo ecosystem and regenerates daily at midnight UTC. Currency conversion uses the board's own oracle/DEX rates. The Radar score is a heuristic to aid discovery, not advice — always read the issue before reserving.

Unofficial community tool — not affiliated with the Ergo Foundation or ErgoDevs.

## License

[MIT](LICENSE)
