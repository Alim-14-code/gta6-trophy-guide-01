# Leonida Trophy Ledger

An offline guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI.

- **Tracker first, no hero banner:** the first screen is the working tool — a compact header (earned count, PSN points, grade split), an audit strip, then a dense three-pane ledger: trophy tracker, mini-dossier detail pane, and a rail with the Next Up roadmap and per-trophy sources.
- **Every trophy** with its official name, description and grade as PlayStation publishes them, a guide in the ledger's own words, and a citation beside every step.
- **Precise missable flags:** exactly one possibly missable trophy (Positive Mental Attitude — the Chapter 1 balcony meditation spot), 5 at risk, 6 unconfirmed, 12 disputed with a Sources Differ panel and an Our Call verdict.
- **Tracker:** progress saved in localStorage, export to a file and import back, filters (story, missable, collectibles, activities, online), search, and a spoiler shield that hides story trophies until earned.
- **Counts:** 20 trophies carry an official PSN count; each has a Your Count tracker with plus/minus controls.
- **Offline:** static files under `app/`, no build step, no network request at run time. Serve `app/` with any static server and open `index.html`.

## Run it

```sh
python3 -m http.server 8080 --directory app
# open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's dossier library (`vendor/makefun-frontend.ts`).

## Screenshots

`shots.json` lists the four screenshots in `screenshots/` and the view each one shows.
