# Ember Pact — a duel of cards

An original roguelike card battler for the make.fun **best-card-game** bounty.
You are the last ember-mage. Duel three keepers of the flame — the Cinder
Whelp, the Ashen Warden, and the Ember Queen — in turn-based card combat,
draft a new card after each victory, and keep the last flame alive.

## How to play

- Click a card to play it. Each card costs Mana, refilled every turn (and
  growing by one each round, up to 10).
- Damage breaks Block first. Burn ticks at the start of a turn. Thorns reflect
  damage back at the attacker. Frostbind shatters the enemy's Block.
- Four elements, told apart by colour **and** shape: Ember ◆ (red, damage),
  Tide ● (blue, healing and draw), Stone ■ (green, Block), Gale ▲ (gold,
  Mana and draw).
- The keepers' embers burn hot: their attacks deal +3 damage.
- The foe's intent line tells you what it plans to do — read it and counter it.
- Beat all three foes to win. After each win you heal 10 and draft 1 of 3 new
  cards into your deck.- Keys: **1–5** play a card, **Space** ends the turn.

## Run it

```sh
node serve.ts   # serves game/ at http://localhost:8080
```

Open `game/index.html` in desktop Chrome. No build step, no network request:
every script, style and sound is a file under `game/` (sounds are synthesized
live with WebAudio).

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and writes
`dossier.json` with the vendored `vendor/makefun-game.ts`.

## Layout

- `game/src/cards.js` — the card catalogue (18 original cards, 3 foes)
- `game/src/deck.js` — seeded RNG, shuffle, draw, draft options
- `game/src/engine.js` — the rules: turns, damage, Block, Burn, draft, campaign
- `game/src/ai.js` — the opponent's brain (lethal-first heuristic) and the hint
- `game/src/audio.js` — all sound synthesized with WebAudio, no audio files
- `game/src/render.js` — the table as DOM: cards you can click, hover and read
- `game/src/shots.js` — deterministic screenshot scenes, played by the real rules
- `game/src/main.js` — bootstrap, input, and the headless self-test (`?selftest=1`)

## Screenshots

`?shot=title|battle|win|loss&seed=…` stages each scene deterministically.

## License

MIT — see `LICENSE` (SPDX-License-Identifier: MIT).
