[![gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Alim-14-code/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Alim-14-code/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

# Leonida Trophy Atlas

A complete, offline GTA VI trophy guide for PlayStation 5 — all 55 trophies
with rarity and a plain how-to for each, a platinum roadmap, the one missable
trophy, and a progress tracker that saves in your browser.

Bounty: https://make.fun/bounty/gta6-trophy-guide-01

## What's inside

- **Checklist** — all 55 trophies (1 platinum, 2 gold, 6 silver, 46 bronze;
  28 hidden) with a checkbox tracker, search, grade/status/kind filters and a
  spoiler setting that hides hidden trophies until earned.
- **Roadmap to Platinum** — three stages (story ~60–80 h, 100% completion
  ~100 h, Strangers & Freaks cleanup ~10 h) with the full 100% checklist
  table: what counts, how much, and whether it must be all of it.
- **Missables** — exactly one trophy can be missed (Positive Mental
  Attitude, the Chapter 1 meditation), plus the five trophies whose unlock
  trigger no published guide had confirmed yet as of 19 Nov 2026 — stated
  plainly instead of guessed.
- **Sources & Notes** — every guide cites its source (Exophase, PowerPyx,
  GTABase, GTA Zone, PSNProfiles). Data checked 19 November 2026, launch day.

## Run it

Node 22, standard library only — no build step, no network at run time:

```sh
node serve.ts
# open http://localhost:8080
```

Hand it in with `node main.ts` (writes `/output` with `app/`,
`screenshots/` and `dossier.json`).

## Notes

- There are **no online trophies** — all 55 are offline single-player, so the
  Platinum can never expire with a server.
- Progress is stored only in your browser (localStorage). Export it from the
  footer to back it up or move it to another device.
- Cheats disable trophies and saving — keep them off for the whole run.
- An independent fan guide. Not affiliated with Rockstar Games, Sony or
  PlayStation.

## License

MIT — see [LICENSE](LICENSE).
