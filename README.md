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

The current browser build is a playable Vite/TypeScript skirmish prototype. It
renders a 16x10 command grid with player and enemy HQs, ore nodes, starter
Ranger units, credits, unit counts, selected-unit state, build mode, production
choices, and win/loss status.

The implemented loop includes visible autonomous harvesters, ore depletion,
delivery feedback, refinery and barracks placement, Ranger and Lancer
production, single selection, box selection, right-click movement, right-click
attack orders, HP damage, destroyed-unit cleanup, HQ-based victory checks, and a
simple enemy planner that builds, produces, targets, and advances toward the
player.

See [CHANGELOG.md](CHANGELOG.md) for the concise prototype state history.

## Prototype Scope

- Resource harvesting with a visible economy and spendable command credits.
- Base construction with at least one economy building and one production
  building.
- Unit production from an original structure and original unit roster.
- Unit selection, box selection, movement orders, attack orders, and visible HP.
- A fog-free skirmish map that can be tested quickly in a browser.
- Simple enemy AI that gathers, builds, produces units, and attacks the player.
- Responsive web UI with clear controls and readable status panels.
- Original visuals and either no audio or only original/permissively sourced
  audio that avoids protected franchise names, motifs, music, and effects.

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

## Development

Install dependencies, run the browser app, and verify the build/test pipeline:

```bash
pnpm install
pnpm dev
pnpm build
pnpm test
pnpm test:browser
```

Available package scripts:

- `pnpm dev`: start the Vite dev server on `127.0.0.1`.
- `pnpm build`: run TypeScript checking and create a production build.
- `pnpm test`: run the Vitest suite once, including pure game-state tests and
  jsdom browser smoke tests for rendering, selection, movement feedback,
  drag-selection, and building placement.
- `pnpm test:browser`: run Playwright checks against the production build for
  responsive layout, command/economy interactions, production choices, and
  win/loss flows. Run `pnpm build` first when `dist/` is missing or stale.
- `pnpm preview`: serve the production build locally.

## Known Prototype Limits

- Harvesters are autonomous economy units, not directly selectable combat units.
- Harvester routes are simple tile steps toward the nearest ore/drop-off, not
  a player-managed worker command system.
- Movement is tile-stepped with simple collision avoidance, not full pathfinding.
- Enemy planning is intentionally simple and deterministic for testability.
- The prototype may remain silent. Any future audio must be original or
  permissively sourced, and must avoid protected franchise names, motifs, music,
  and effects.

## Roadmap

1. Expand responsive browser coverage as the UI grows.
2. Add explicit touch/mobile command controls if mobile gameplay becomes a goal.
3. Add audio only if it is original or permissively sourced with no protected
   franchise names, motifs, music, or effects; otherwise keep the prototype
   silent.
