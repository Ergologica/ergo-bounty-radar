# 🚀 Pubblicare il Bounty Radar

Il sito è pronto. Serve solo che il repository lo crei tu: il mio accesso a GitHub in questa sessione è limitato ai repo già autorizzati, quindi non posso crearne di nuovi a tuo nome.

Ci sono due strade. La prima è la più veloce e funziona anche da telefono.

---

## Strada A — sito online in 3 minuti (solo browser)

Ottieni un sito completo e funzionante. L'unica cosa che manca è l'aggiornamento notturno automatico, ma **il pulsante ↻ Refresh scarica comunque i dati aggiornati dal vivo**, quindi il sito non invecchia per chi lo usa.

1. **Crea il repository** — vai su [github.com/new](https://github.com/new)
   - Repository name: `ergo-bounty-radar`
   - Visibilità: **Public** (necessaria per GitHub Pages gratuito)
   - Spunta **Add a README file**
   - → *Create repository*

2. **Carica la pagina** — nel repo appena creato: *Add file → Upload files*
   - Trascina il file HTML che ti ho mandato
   - **Importante:** deve chiamarsi esattamente `index.html`. Se il tuo file ha un altro nome (es. `ergo-bounty-radar-v05.html`), rinominalo prima di caricarlo, oppure caricalo e poi usa il menu *⋯ → Rename* su GitHub.
   - → *Commit changes*

3. **Accendi il sito** — *Settings → Pages*
   - Source: **Deploy from a branch**
   - Branch: `main`, cartella `/ (root)` → *Save*

Dopo 1–2 minuti il sito è online:

```
https://Ergologica.github.io/ergo-bounty-radar/
```

---

## Strada B — versione completa con aggiornamento automatico

Aggiunge l'Action giornaliera (archivia gli snapshot, ricalcola le tendenze, riscrive i dati nella pagina) e lo storico. Serve un computer con `git`.

1. Crea il repository come al punto 1 della Strada A, **ma senza** spuntare "Add a README file".
2. Estrai lo zip, apri il terminale nella cartella `ergo-bounty-radar` e incolla:

```bash
git init -b main
git add -A
git commit -m "Ergo Bounty Radar v0.5"
git remote add origin https://github.com/Ergologica/ergo-bounty-radar.git
git push -u origin main
```

3. **Settings → Actions → General → Workflow permissions** → **Read and write permissions** → *Save*
   (senza questo, l'aggiornamento notturno non può salvare gli snapshot)
4. **Settings → Pages** → Deploy from a branch → `main` / `/ (root)` → *Save*
5. Facoltativo: tab **Actions** → *Daily snapshot* → *Run workflow*, per verificare subito che funzioni.

Se hai già pubblicato con la Strada A, puoi passare alla B in qualsiasi momento: gli stessi comandi funzionano aggiungendo `git pull --rebase origin main` prima del push.

---

## Se qualcosa non va

| Sintomo | Causa e rimedio |
|---|---|
| Pagina bianca | Il file non si chiama `index.html` o non è nella radice del repo |
| Pages non compare nelle impostazioni | Il repository non è Public |
| L'Action fallisce con errore 403 | Manca il passo *Read and write permissions* |
| I font sembrano diversi | Sono Montserrat e Roboto da Google Fonts: si caricano solo online, il che è il caso del sito pubblicato |
| Manca `.github/workflows/` dopo un upload dal browser | GitHub salta le cartelle nascoste: crea il file a mano con *Add file → Create new file* e come nome esatto `.github/workflows/daily-snapshot.yml` |

---

## Quando è online

Mandami l'indirizzo: controllo che tutto risponda correttamente e ti passo il testo di annuncio per la community (te ne ho già preparato una bozza in `ANNUNCIO.md`).
