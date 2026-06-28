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
Ranger units, credits, unit counts, selected-unit state, build mode, and win/loss
status.

The implemented loop includes abstract resource income, refinery and barracks
placement, Ranger production, single selection, box selection, right-click
movement, right-click attack orders, HP damage, destroyed-unit cleanup, HQ-based
victory checks, and a simple enemy planner that builds, produces, targets, and
advances toward the player.

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
- `pnpm test`: run the Vitest suite once, including pure game-state tests and
  jsdom browser smoke tests for rendering, selection, movement feedback,
  drag-selection, and building placement.
- `pnpm preview`: serve the production build locally.

## Known Prototype Limits

- Resource harvesting is abstract income, not worker pathing.
- Movement is tile-stepped with simple collision avoidance, not full pathfinding.
- Enemy planning is intentionally simple and deterministic for testability.
- The prototype is silent unless original audio is added later.

## Roadmap

1. Add broader obstacle-aware pathfinding beyond one-step collision avoidance.
2. Expand browser interaction coverage into combat resolution and win/loss flows.
3. Tune UI feedback for placement validity, command target previews, and resource deltas.
4. Improve responsive layout for desktop and mobile browser testing.
5. Add original audio only if it can be created or sourced without protected
   material; otherwise keep the prototype silent.
