# Web RTS Command Grid

An original browser-based real-time strategy prototype about building a small
field command outpost, harvesting map resources, producing units, and surviving
an enemy force in a quick skirmish.

The prototype is inspired by the broad base-building RTS genre, but every name,
visual, icon, map, audio cue, unit, faction, and story detail must be original.
Do not use Red Alert, Command & Conquer, or any other protected game names,
assets, UI art, unit identities, factions, logos, music, sounds, or story
content.

## Current State

The current browser build is a Vite/TypeScript scaffold for the RTS prototype.
It renders an original command-grid layout with a player HQ, resource node,
starter unit, enemy base marker, status panel, and placeholder build/train
buttons.

The playable core loop is the active implementation target: resource gathering,
building placement, production, unit selection, movement, attacks, health, and
simple enemy AI should be documented here as shipped behavior once they land in
`src`.

## Prototype Scope

- Resource harvesting with a visible economy and spendable command credits.
- Base construction with at least one economy building and one production
  building.
- Unit production from an original structure and original unit roster.
- Unit selection, box selection, movement orders, attack orders, and visible HP.
- A fog-free skirmish map that can be tested quickly in a browser.
- Simple enemy AI that gathers, builds, produces units, and attacks the player.
- Responsive web UI with clear controls and readable status panels.
- Original visuals and either original sound effects or no audio.

## Controls

These are the intended controls for the playable prototype. Keep this section in
sync with the implementation as input handling evolves.

| Action | Control |
| --- | --- |
| Select one unit or building | Left click |
| Box select multiple units | Left drag on the map |
| Move selected units | Right click empty terrain |
| Attack with selected units | Right click an enemy unit or structure |
| Place a building | Click the build button, then click a valid map tile |
| Train a unit | Select the production building, then click the train button |
| Cancel pending placement or clear selection | Escape |

The current scaffold displays build and train buttons, but full command handling
is part of the playable-loop implementation work.

## Development

Install dependencies, run the browser app, and verify the build/test pipeline:

```bash
pnpm install
pnpm dev
pnpm build
pnpm test
```

Available package scripts:

- `pnpm dev`: start the Vite dev server on `127.0.0.1`.
- `pnpm build`: run TypeScript checking and create a production build.
- `pnpm test`: run the Vitest suite once.
- `pnpm preview`: serve the production build locally.

## Roadmap

1. Replace the static scaffold with a playable RTS core loop in `src`.
2. Add deterministic game-state tests for economy, production, movement, combat,
   health, and enemy AI decisions.
3. Tune UI feedback for selection rings, placement validity, command targets,
   health bars, and resource deltas.
4. Improve responsive layout for desktop and mobile browser testing.
5. Add original audio only if it can be created or sourced without protected
   material; otherwise keep the prototype silent.
