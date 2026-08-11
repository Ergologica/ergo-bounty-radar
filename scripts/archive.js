#!/usr/bin/env node
// Daily archiver for Ergo Bounty Radar.
// - Fetches the current board from ErgoDevs/Ergo-Bounties
// - Saves a dated snapshot into history/ and updates history/index.json
// - Recomputes the 7/30-day baselines
// - Rewrites the data blobs embedded in index.html (between *_START/*_END markers)
//
// Runs in GitHub Actions (see .github/workflows/daily-snapshot.yml).
// Local test: LOCAL_DIR=/path/to/Ergo-Bounties/data node scripts/archive.js

const fs = require('fs');
const path = require('path');
const { parseAllMd } = require('./parser.js');

const RAW = 'https://raw.githubusercontent.com/ErgoDevs/Ergo-Bounties/main/';
const ROOT = path.join(__dirname, '..');
const HIST = path.join(ROOT, 'history');

// Paths are relative to the upstream repo root. LOCAL_DIR (a local clone) overrides for tests.
async function get(file) {
  if (process.env.LOCAL_DIR) return fs.readFileSync(path.join(process.env.LOCAL_DIR, file), 'utf8');
  const res = await fetch(RAW + file);
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  return res.text();
}

// ---------------------------------------------------------------------------
// Contention sweep.
//
// A bounty can look ideal — high value, "good first issue", small task — and
// still be a trap: several contributors open competing PRs, none is ever
// merged, and the bounty stays listed forever. Comment count does not catch
// this; linked pull requests do. For each bounty issue we read the timeline,
// collect the PRs that reference it, and record how many are open vs merged.
// We also read the labels, because some issues carry two contradictory bounty
// amounts and nobody knows what the work is actually worth.
//
// Needs a token (Actions provides one). Without it the sweep is skipped and
// the previous contention.json is kept, so the site degrades quietly.
// ---------------------------------------------------------------------------
const API = 'https://api.github.com';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function gh(p) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'ergo-bounty-radar' };
  const tok = process.env.GITHUB_TOKEN;
  if (tok) headers.Authorization = `Bearer ${tok}`;
  const res = await fetch(API + p, { headers });
  if (res.status === 403 || res.status === 429) {
    const err = new Error('rate limited'); err.rateLimited = true; throw err;
  }
  if (!res.ok) throw new Error(`${p}: HTTP ${res.status}`);
  return res.json();
}

function labelAmounts(labels) {
  const set = new Set();
  for (const l of labels) {
    const m = /bount\w*\s*[-–—:]?\s*([\d]+(?:[.,][\d]+)?)\s*(SigUSD|ERG|USD|GORT|RSN)?/i.exec(l);
    if (m) set.add(m[1].replace(/[.,]/g, '') + (m[2] || '').toUpperCase());
  }
  return set;
}

async function buildContention(bounties, date) {
  if (!process.env.GITHUB_TOKEN) { console.log('contention: no GITHUB_TOKEN, sweep skipped'); return null; }
  const items = {};
  let done = 0, failed = 0, stopped = false;
  for (const b of bounties) {
    const m = /github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/.exec(b.url || '');
    if (!m) continue;
    const [, owner, repo, num] = m;
    try {
      const [issue, timeline] = await Promise.all([
        gh(`/repos/${owner}/${repo}/issues/${num}`),
        gh(`/repos/${owner}/${repo}/issues/${num}/timeline?per_page=100`)
      ]);
      const byNum = new Map();
      for (const ev of Array.isArray(timeline) ? timeline : []) {
        if (ev.event !== 'cross-referenced') continue;
        const src = ev.source && ev.source.issue;
        if (!src || !src.pull_request) continue;
        byNum.set(src.number, {
          n: src.number,
          s: src.state === 'open' ? 'open' : (src.pull_request.merged_at ? 'merged' : 'closed'),
          u: (src.user && src.user.login) || null,
          d: (src.created_at || '').slice(0, 10)
        });
      }
      const prs = [...byNum.values()].sort((x, y) => x.n - y.n);
      const labels = (issue.labels || []).map(l => (typeof l === 'string' ? l : l.name)).filter(Boolean);
      const rec = {
        open: prs.filter(p => p.s === 'open').length,
        merged: prs.filter(p => p.s === 'merged').length,
        closed: prs.filter(p => p.s === 'closed').length,
        prs: prs.slice(-10),
        valueConflict: labelAmounts(labels).size > 1,
        labels: labels.slice(0, 12)
      };
      if (rec.prs.length || rec.valueConflict) items[b.url] = rec;
      done++;
      await sleep(120); // stay clear of the secondary rate limit
    } catch (e) {
      failed++;
      if (e.rateLimited) { console.error('contention: rate limited, stopping sweep early'); stopped = true; break; }
      // circuit breaker: if nothing at all is getting through, stop hammering
      if (done === 0 && failed >= 8) { console.error(`contention: ${failed} consecutive failures (${e.message}), aborting sweep`); stopped = true; break; }
    }
  }
  console.log(`contention: swept ${done} issues, ${Object.keys(items).length} with linked PRs or label conflicts, ${failed} failed${stopped ? ' (stopped early)' : ''}`);
  return { fetched: date, items, swept: done, partial: stopped };
}

// Claim-to-payment pipeline: merged submissions + open PRs from the triage dashboard.
async function buildPipeline(date) {
  let paidMd = '', statusMd = '', triageMd = '';
  try { paidMd = await get('submissions/paid.md'); } catch (e) {}
  try { statusMd = await get('submissions/payment_status.md'); } catch (e) {}
  try { triageMd = await get('submissions/triage.md'); } catch (e) {}
  const files = new Set();
  for (const m of (paidMd + statusMd).matchAll(/\(([A-Za-z0-9._-]+\.json)\)/g)) files.add(m[1]);
  const reviewers = {};
  for (const line of (paidMd + statusMd).split('\n')) {
    const m = /^\|\s*[^|]+\|\s*\[[^\]]*\]\(([^)]+\.json)\)\s*\|[^|]*\|[^|]*\|\s*([^|]+?)\s*\|/.exec(line);
    if (m) reviewers[m[1]] = m[2];
  }
  const submissions = [];
  for (const f of files) {
    try {
      const d = JSON.parse(await get('submissions/' + f));
      if (!d.contributor || /^example/i.test(d.contributor) || /^example/i.test(f)) continue;
      submissions.push({
        file: f, contributor: d.contributor, url: d.original_issue_link || null,
        title: d.work_title || d.bounty_id || f, value: d.bounty_value ?? null,
        currency: d.payment_currency || null, status: d.status || 'unknown',
        submitted: d.submission_date || null, paid_date: d.payment_date || null,
        tx: d.payment_tx_id || null, work: d.work_link || null, reviewer: reviewers[f] || null
      });
    } catch (e) {}
  }
  const prs = [];
  let sec = null;
  for (const line of triageMd.split('\n')) {
    const h = /^##\s+(.+)$/.exec(line);
    if (h) { sec = h[1].trim(); continue; }
    const m = /^-\s*\[#(\d+)\]\((\S+)\)\s+(.+)$/.exec(line);
    if (!m || !sec || sec === 'Invalid') continue;
    let url = null;
    const r = /Reserve\s+([\w.-]+)\/([\w.-]+)#(\d+)/.exec(m[3]);
    if (r) url = `https://github.com/${r[1]}/${r[2]}/issues/${r[3]}`;
    prs.push({
      num: +m[1], pr: m[2], section: sec, url,
      title: m[3].replace(/\s*\((ready-review|upstream-unmerged|stale-reservation|payment-ready)\)\s*$/, '')
    });
  }
  return { fetched: date, submissions, prs };
}

(async () => {
  const all = await get('data/all.md');
  const starterMd = await get('data/starter-bounties.md').catch(() => '');
  const pricesMd = await get('data/currency_prices.md').catch(() => '');

  const starter = new Set([...starterMd.matchAll(/https:\/\/github\.com\/[^/)]+\/[^/)]+\/(?:issues|discussions)\/\d+/g)].map(m => m[0]));
  const rateM = /SigUSD[^|]*\|\s*([\d.]+)/.exec(pricesMd);
  const rate = rateM ? parseFloat(rateM[1]) : 4.235171;
  const genM = /Generated on: ([\d-]+)/.exec(all);
  const date = genM ? genM[1] : new Date().toISOString().slice(0, 10);

  const bounties = parseAllMd(all);
  if (bounties.length < 5) throw new Error(`parse looks wrong: only ${bounties.length} rows`);
  for (const b of bounties) b.starter = starter.has(b.url);

  // 1) archive
  fs.mkdirSync(HIST, { recursive: true });
  fs.writeFileSync(path.join(HIST, `${date}.json`), JSON.stringify({ date, rate, bounties }));
  const idx = fs.readdirSync(HIST).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).map(f => f.slice(0, 10)).sort();
  fs.writeFileSync(path.join(HIST, 'index.json'), JSON.stringify(idx));

  // 2) baselines (closest archived day at least ~N days back; falls back to oldest)
  function baselineFor(days) {
    const target = new Date(new Date(date + 'T00:00:00Z').getTime() - days * 864e5).toISOString().slice(0, 10);
    const cand = idx.filter(d => d <= target);
    const pick = cand.length ? cand[cand.length - 1] : idx[0];
    const snap = JSON.parse(fs.readFileSync(path.join(HIST, `${pick}.json`), 'utf8'));
    const map = {};
    for (const b of snap.bounties) if (b.url) map[b.url] = [b.amount, b.currency, b.erg, (b.title || '').slice(0, 90)];
    return { date: pick, map };
  }
  const baselines = { d7: baselineFor(7), d30: baselineFor(30) };

  // 3) trends series (append/replace today's sample)
  const trendsPath = path.join(HIST, 'trends.json');
  const trends = fs.existsSync(trendsPath) ? JSON.parse(fs.readFileSync(trendsPath, 'utf8')) : { samples: [] };
  const urls = new Set(bounties.map(b => b.url).filter(Boolean));
  const totErg = Math.round(bounties.reduce((a, b) => a + (b.erg || 0), 0));
  const prevDate = idx.filter(d => d < date).pop();
  let added = null, removed = null;
  if (prevDate) {
    const prev = JSON.parse(fs.readFileSync(path.join(HIST, `${prevDate}.json`), 'utf8'));
    const prevUrls = new Set(prev.bounties.map(b => b.url).filter(Boolean));
    added = [...urls].filter(u => !prevUrls.has(u)).length;
    removed = [...prevUrls].filter(u => !urls.has(u)).length;
  }
  trends.samples = trends.samples.filter(s => s.date !== date)
    .concat([{ date, open: bounties.length, erg: totErg, rate, usd: rate ? Math.round(totErg / rate) : null, added, removed }])
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  fs.writeFileSync(trendsPath, JSON.stringify(trends));

  // 4) pipeline & payments
  const pipeline = await buildPipeline(date);

  // 4b) contention sweep — keep the previous file if the sweep is skipped or fails
  const contPath = path.join(HIST, 'contention.json');
  let contention = fs.existsSync(contPath) ? JSON.parse(fs.readFileSync(contPath, 'utf8')) : { fetched: null, items: {} };
  try {
    const fresh = await buildContention(bounties, date);
    if (fresh && Object.keys(fresh.items).length) {
      contention = fresh;
      fs.writeFileSync(contPath, JSON.stringify(contention));
    }
  } catch (e) { console.error('contention sweep failed, keeping previous data:', e.message); }

  // 5) rewrite index.html data blobs
  const idxFile = path.join(ROOT, 'index.html');
  let html = fs.readFileSync(idxFile, 'utf8');
  const put = (name, val) => {
    const re = new RegExp(`/\\*${name}_START\\*/[\\s\\S]*?/\\*${name}_END\\*/`);
    if (!re.test(html)) throw new Error(`marker ${name} not found in index.html`);
    html = html.replace(re, `/*${name}_START*/${val}/*${name}_END*/`);
  };
  put('SNAPSHOT', JSON.stringify(bounties));
  put('META', JSON.stringify({ generated: date, sigusd_per_erg_inv: rate }));
  put('BASELINES', JSON.stringify(baselines));
  put('TRENDS', JSON.stringify(trends));
  put('PIPELINE', JSON.stringify(pipeline));
  put('CONTENTION', JSON.stringify(contention));
  fs.writeFileSync(idxFile, html);

  const contested = Object.values(contention.items || {}).filter(c => c.open >= 2 && c.merged === 0).length;
  console.log(`archived ${date}: ${bounties.length} bounties · rate ${rate} · baselines ${baselines.d7.date} / ${baselines.d30.date} · pipeline ${pipeline.submissions.length} submissions + ${pipeline.prs.length} open PRs · contention ${Object.keys(contention.items || {}).length} tracked (${contested} contested)`);
})().catch(e => { console.error(e); process.exit(1); });
