# Leonida Trophy Atlas

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Alim-14-code/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Alim-14-code/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all **55 PlayStation 5 trophies of Grand Theft Auto VI** — 1 platinum, 2 gold, 6 silver and 46 bronze.

## What it is

- **Tracker:** a checklist of all 55 trophies with official names, descriptions and grades. Progress is saved in the browser (localStorage) and can be exported to a file and imported back.
- **Filters:** story, missable, collectibles, activities, online (the list has no online trophies — all 55 are single-player), plus earned / not-yet-earned and a search box.
- **Spoiler setting:** on by default, it hides the names and descriptions of story trophies until you earn them.
- **Roadmap to the platinum:** five stages built from the official descriptions — story, side strands, collectibles, activities, cleanup.
- **Missable flags:** 28 trophies flagged, with the moment each one can be missed.
- **Count trackers:** the 20 trophies that carry an official count (250 stunts, 42 Shooting Range challenges, 100 WAiNK It locations, and more), each with its own +/− counter.
- **Disputed panels:** 12 trophies in 6 panels where the guides disagree — each panel says plainly what is argued over and what is not yet pinned down. Ten guides are marked unconfirmed rather than inventing details.
- **Cited guides:** every trophy has a guide written in the author's own words (about 165 steps across the 55 guides), each naming its sources — PlayStation's official list, Exophase, PSNProfiles, GTA Wiki, GTA BOOM, Rockstar's Newswire, IGN, PowerPyx, GTA Series Videos, r/GTA6 and GameSpot. A source is cited, never copied.

The guide is plain static files under `app/` with no build step, works with the network off, and shows no Rockstar logo or official artwork.

## Run it locally

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. Any static file server with `app/` at its root works the same way.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That copies `app/` and `screenshots/` into the output directory and writes `dossier.json` there with the kit's vendor library. (The vendor library is placed by a separate step; `main.ts` cannot run its dossier step until then.)

## Files

- `app/index.html`, `app/style.css`, `app/app.js` — the guide app
- `app/data/trophies.json` — the 55 trophies, their official data, guides, sources, roadmap and disputed panels
- `screenshots/` — four renders of the app (see `shots.json`)
- `serve.ts` — local preview server
- `main.ts` — submission entrypoint

## License

MIT — see `LICENSE`.
